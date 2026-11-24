import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {copyFile,link,mkdir,open,readFile,stat,rename,unlink} from 'node:fs/promises';
import {join,extname,resolve} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {sniffWallpaper} from './local-imports.mjs';
import {serveMedia} from './media-server.mjs';
const exec=promisify(execFile);
const shutdown=new AbortController();
const activeJobs=new Set();
const video=new Set(['.mp4','.webm','.mov','.m4v','.mkv']);
const pending=new Map();
const backgrounds=new Map();
const settledBackgrounds=new WeakSet();

async function runMediaTool(command,args,timeout) {
  shutdown.signal.throwIfAborted();
  const result=exec(command,args,{timeout,windowsHide:true,signal:shutdown.signal});
  const closed=new Promise(resolve=>result.child.once('close',resolve));
  try{return await result;}
  finally{await closed;}
}

function track(job) {
  activeJobs.add(job);
  void job.then(()=>activeJobs.delete(job),()=>activeJobs.delete(job));
  return job;
}

// Call once at runner shutdown and await child exit and temporary-file cleanup.
export async function stopMediaJobs() {
  shutdown.abort();
  await Promise.allSettled(activeJobs);
}

async function publish(temp,output) {
  try{await rename(temp,output);}
  catch(error){
    if(error.code!=='EXDEV')throw error;
    const staged=output+'.'+randomUUID()+'.partial';
    try{
      await copyFile(temp,staged);
      // The copy is complete before the cache path becomes visible.
      try{await link(staged,output);}
      catch(linkError){
        if(linkError.code!=='EEXIST')throw linkError;
        const existing=await stat(output);
        if(!existing.isFile()||!existing.size)throw linkError;
      }
    }finally{await unlink(staged).catch(()=>{});}
  }
}

async function prepareBackground(file,info,cache,ext) {
  const handle=await open(file,'r');
  const header=Buffer.alloc(4096);
  let detected;
  try{
    const {bytesRead}=await handle.read(header);
    detected=sniffWallpaper(header.subarray(0,bytesRead),ext);
  }finally{await handle.close();}
  if(!detected)return;
  if(detected.kind==='image')return {file,type:detected.mime};

  const {stdout}=await runMediaTool(process.env.GUARDER_FFPROBE||'ffprobe.exe',[
    '-v','error','-protocol_whitelist','file','-show_entries',
    'stream=index,codec_type,codec_name,pix_fmt:stream_disposition=attached_pic','-of','json',file,
  ],15000);
  const {streams}=JSON.parse(stdout);
  const picture=streams.find(stream=>stream.codec_type==='video'&&!stream.disposition?.attached_pic);
  if(!picture)return;
  const audio=streams.find(stream=>stream.codec_type==='audio');
  const webmVideo=['vp8','vp9','av1'].includes(picture.codec_name);
  const webmAudio=!audio||['opus','vorbis'].includes(audio.codec_name);
  const mp4Video=picture.codec_name==='av1'||picture.codec_name==='h264'&&['yuv420p','yuvj420p'].includes(picture.pix_fmt);
  const mp4Audio=!audio||audio.codec_name==='aac';
  if(ext==='.webm'&&webmVideo&&webmAudio)return {file,type:'video/webm'};
  if(['.mp4','.m4v'].includes(ext)&&mp4Video&&mp4Audio)return {file,type:'video/mp4'};

  // Remux compatible video without re-encoding. Keep the first audio track for the volume control.
  const useWebm=webmVideo&&(ext==='.webm'||ext==='.mkv'||!mp4Video);
  const suffix=useWebm?'.webm':'.mp4';
  const type=useWebm?'video/webm':'video/mp4';
  const id=createHash('sha256').update(JSON.stringify(['background-v1',file,info.size,info.mtimeMs])).digest('hex');
  const output=join(cache,id+suffix);
  const existing=await stat(output).catch(error=>{if(error.code!=='ENOENT')throw error;});
  if(existing?.isFile()&&existing.size)return {file:output,type};

  await mkdir(cache,{recursive:true});
  const temp=join(cache,id+'-'+randomUUID()+suffix);
  try{
    await runMediaTool(process.env.GUARDER_FFMPEG||'ffmpeg.exe',[
      '-nostdin','-hide_banner','-loglevel','error','-protocol_whitelist','file','-i',file,
      '-map','0:'+picture.index,...(audio?['-map','0:'+audio.index]:[]),
      ...(useWebm||mp4Video?['-c:v','copy']:['-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-fps_mode','passthrough']),
      ...(useWebm?(webmAudio?['-c:a','copy']:['-c:a','libopus','-b:a','160k']):
        [...(mp4Audio?['-c:a','copy']:['-c:a','aac','-b:a','192k']),'-movflags','+faststart']),
      temp,
    ],30*60*1000);
    shutdown.signal.throwIfAborted();
    await publish(temp,output);
    return {file:output,type};
  }finally{await unlink(temp).catch(()=>{});}
}

// The background gets a stable, seekable URL. preview() remains the short hover path.
export async function backgroundMedia(item,cache) {
  if(!item||shutdown.signal.aborted)return;
  cache=resolve(cache);
  const candidates=[item.filePath,item.playablePath];
  const isVideo=item.type==='video'||item.kind==='video'||candidates.some(
    file=>typeof file==='string'&&video.has(extname(file).toLowerCase()),
  );
  if(!isVideo)candidates.push(item.previewPath);
  for(const candidate of new Set(candidates)){
    if(typeof candidate!=='string'||!candidate)continue;
    const file=resolve(candidate);
    const info=await stat(file).catch(()=>null);
    if(shutdown.signal.aborted)return;
    if(!info?.isFile()||!info.size)continue;
    const ext=extname(file).toLowerCase();
    // A video thumbnail is not a full playback source.
    if(isVideo&&!video.has(ext))continue;
    const key=JSON.stringify([cache,file,info.size,info.mtimeMs]);
    let job=backgrounds.get(key);
    if(!job){
      job=track(prepareBackground(file,info,cache,ext).catch(()=>undefined));
      backgrounds.set(key,job);
      void job.then(asset=>{
        if(!asset)backgrounds.delete(key);
        else if(backgrounds.size>64){
          for(const [cachedKey,cachedJob] of backgrounds){
            if(cachedJob===job)continue;
            // Evict only settled jobs so a busy catalog cannot duplicate transcodes.
            if(!settledBackgrounds.has(cachedJob))continue;
            backgrounds.delete(cachedKey);
            if(backgrounds.size<=64)break;
          }
        }
        settledBackgrounds.add(job);
      });
    }
    const asset=await job;
    if(shutdown.signal.aborted)return;
    if(!asset)continue;
    const outputInfo=asset.file===file?info:await stat(asset.file).catch(()=>null);
    if(!outputInfo?.isFile()||!outputInfo.size){
      if(backgrounds.get(key)===job)backgrounds.delete(key);
      continue;
    }
    try{return await serveMedia(asset.file,asset.type,outputInfo);}
    catch{continue;}
  }
}

export async function preview(item,cache,convert=false) {
  if(!item||shutdown.signal.aborted)return undefined;
  for(const file of new Set([item.playablePath,item.filePath,item.previewPath])){
    if(typeof file!=='string')continue;
    const info=await stat(file).catch(()=>null);
    if(shutdown.signal.aborted)return;
    if(!info?.isFile())continue;
    const ext=extname(file).toLowerCase();
    if(video.has(ext)){
      const id=createHash('sha256').update(JSON.stringify([file,info.size,info.mtimeMs])).digest('hex');
      const output=join(cache,id+'.webm');
      try{
        const cached=await stat(output).catch(()=>null);
        if(cached?.isFile()&&cached.size)return serveMedia(output,'video/webm',cached);
        if(!convert&&['.mp4','.m4v','.webm'].includes(ext)&&info.size){
          const type=ext==='.webm'?'video/webm':'video/mp4';
          return {...await serveMedia(file,type,info),canConvert:true};
        }
        if(!pending.has(id)){
          const job=track((async()=>{
            await mkdir(cache,{recursive:true});
            const temp=join(cache,id+'-'+randomUUID()+'.webm');
            try{
              await runMediaTool(process.env.GUARDER_FFMPEG||'ffmpeg.exe',['-nostdin','-hide_banner','-loglevel','error','-y','-i',file,'-t','8','-vf','scale=640:-2:force_original_aspect_ratio=decrease,fps=20','-c:v','libvpx-vp9','-crf','36','-b:v','0','-deadline','realtime','-cpu-used','6','-threads','2','-c:a','libopus','-b:a','64k',temp],18000);

              shutdown.signal.throwIfAborted();
              await publish(temp,output);

            }finally{await unlink(temp).catch(()=>{});}
          })().finally(()=>pending.delete(id)));
          pending.set(id,job);
        }
        await pending.get(id);
        return await serveMedia(output,'video/webm',await stat(output));
      }catch{continue;}
    }
    if(info.size>8*1024*1024)continue;
    const bytes=await readFile(file);
    const detected=sniffWallpaper(bytes.subarray(0,4096),ext);
    if(detected?.kind==='image')return {type:detected.mime,url:'data:'+detected.mime+';base64,'+bytes.toString('base64')};
  }
}


export async function poster(item,cache) {
  if(!item||shutdown.signal.aborted)return;
  const paths=[item.previewPath,item.filePath,item.playablePath].filter(Boolean);
  for(const file of new Set(paths)){
    try{
      if(video.has(extname(file).toLowerCase()))continue;
      const asset=await prepareBackground(file,await stat(file),cache,extname(file).toLowerCase());
      if(asset?.type.startsWith('image/'))return await serveMedia(asset.file,asset.type,await stat(asset.file));
    }catch{}
  }
  for(const file of new Set(paths)){
    if(!video.has(extname(file).toLowerCase()))continue;
    try{
      const info=await stat(file);
      if(!info.isFile()||!info.size)continue;
      const id=createHash('sha256').update(JSON.stringify([file,info.size,info.mtimeMs])).digest('hex');
      const output=join(cache,id+'.jpg');
      if(!(await stat(output).catch(()=>null))?.size){
        await mkdir(cache,{recursive:true});
        const temp=join(cache,id+'-'+randomUUID()+'.jpg');
        try{
          await runMediaTool(process.env.GUARDER_FFMPEG||'ffmpeg.exe',[
            '-nostdin','-hide_banner','-loglevel','error','-protocol_whitelist','file','-i',file,
            '-frames:v','1','-vf','scale=320:-2','-q:v','4',temp
          ],10000);
          await publish(temp,output);
        }finally{await unlink(temp).catch(()=>{});}
      }
      return await serveMedia(output,'image/jpeg',await stat(output));
    }catch{}
  }
}

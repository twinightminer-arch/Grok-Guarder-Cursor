import {createServer} from 'node:http';
import {open} from 'node:fs/promises';
import {createHmac,randomBytes} from 'node:crypto';
import {pipeline} from 'node:stream/promises';

const host='127.0.0.1';
const secret=randomBytes(32);
const assets=new Map();
const allowedOrigins=new Set();

export function allowMediaOrigin(origin) {
  if(origin==='https://guarder-panel.invalid')allowedOrigins.add(origin);
}
let listener;

function byteRange(header,size) {
  const match=/^bytes=(\d*)-(\d*)$/.exec(header);
  if(!match||(!match[1]&&!match[2])||size===0)return;
  const start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
  const end=match[1]&&match[2]?Math.min(size-1,Number(match[2])):size-1;
  if(start<size&&start<=end)return {start,end};
}

async function serve(request,response) {
  const {method,url,headers}=request;
  const asset=assets.get(url);
  if(headers.host!==`${host}:${request.socket.localPort}`||!asset){
    response.writeHead(404).end();
    return;
  }
  if(method!=='GET'&&method!=='HEAD'){
    response.writeHead(405,{Allow:'GET, HEAD'}).end();
    return;
  }
  let file;
  try{
    file=await open(asset.file,'r');
    const info=await file.stat();
    if(!info.isFile()||info.size!==asset.size||info.mtimeMs!==asset.mtimeMs){
      response.writeHead(404).end();
      return;
    }
    const range=headers.range&&byteRange(headers.range,info.size);
    if(allowedOrigins.has(headers.origin))response.setHeader('Access-Control-Allow-Origin',headers.origin);
    response.setHeader('Vary','Origin');
    response.setHeader('Accept-Ranges','bytes');
    if(headers.range&&!range){
      response.writeHead(416,{'Content-Range':`bytes */${info.size}`}).end();
      return;
    }
    response.setHeader('Content-Type',asset.type);
    response.setHeader('X-Content-Type-Options','nosniff');
    response.setHeader('Cross-Origin-Resource-Policy','cross-origin');
    response.setHeader('Cache-Control','no-store');
    response.setHeader('Content-Length',range?range.end-range.start+1:info.size);
    if(range)response.setHeader('Content-Range',`bytes ${range.start}-${range.end}/${info.size}`);
    response.writeHead(range?206:200);
    if(method==='HEAD'||info.size===0||response.destroyed)response.end();
    else await pipeline(file.createReadStream({...range,autoClose:false}),response);
  }catch{
    if(!response.headersSent&&!response.destroyed)response.writeHead(404).end();
    else response.destroy();
  }finally{
    await file?.close().catch(()=>{});
  }
}

function listen() {
  if(!listener){
    const server=createServer(serve);
    listener=new Promise((resolve,reject)=>{
      server.once('error',reject);
      server.listen(0,host,()=>{
        server.removeListener('error',reject);
        server.unref();
        resolve(server.address().port);
      });
    }).catch(error=>{listener=undefined;throw error;});
  }
  return listener;
}

export async function serveMedia(file,type,{size,mtimeMs}) {
  const port=await listen();
  const token=createHmac('sha256',secret).update(JSON.stringify([file,type,size,mtimeMs])).digest('hex');
  const route='/media/'+token;
  assets.set(route,{file,type,size,mtimeMs});
  return {type,url:`http://${host}:${port}${route}`,localFile:file};
}

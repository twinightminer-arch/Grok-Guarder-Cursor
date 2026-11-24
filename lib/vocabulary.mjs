import { mkdirSync, readdirSync, readFileSync, writeFileSync, renameSync, openSync, fsyncSync, closeSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';

export class VocabularyStore {
  constructor(root = join(homedir(), 'Documents', 'GPT Salad Vocabulary')) {
    this.root = root;
    this.entries = join(root, 'entries');
  }
  save(text) {
    if (typeof text !== 'string' || !text.trim() || text.length > 1500) throw new Error('Select 1–1500 characters');
    mkdirSync(this.entries, {recursive:true});
    const item = {id:randomUUID(), entry_type:/\s/.test(text.trim()) ? 'phrase':'word', source_text:text.trim(), source_language:'auto', target_language:'zh', meanings:[], notes:'', tags:[], favorite:true, archived:false, revision:1, created_at:new Date().toISOString(), updated_at:new Date().toISOString()};
    const path = join(this.entries, item.id + '.json');
    const temp = join(this.entries, '.' + item.id + '.pending');
    const handle = openSync(temp, 'wx');
    try {
      writeFileSync(handle, JSON.stringify(item,null,2)+'\n', 'utf8');
      fsyncSync(handle);
    } finally { closeSync(handle); }
    try { renameSync(temp,path); } catch(e) { try {unlinkSync(temp)} catch {} throw e; }
    return {id:item.id,path,source_text:item.source_text};
  }
  list() {
    mkdirSync(this.entries,{recursive:true});
    return readdirSync(this.entries).filter(x=>/^[0-9a-f-]{36}\.json$/.test(x)).map(x=>{
      const item=JSON.parse(readFileSync(join(this.entries,x),'utf8'));
      return {id:item.id,source_text:item.source_text,entry_type:item.entry_type,favorite:item.favorite,notes:item.notes,tags:item.tags,archived:item.archived,revision:item.revision,created_at:item.created_at};
    }).sort((a,b)=>b.created_at.localeCompare(a.created_at));
  }
  update(id,revision,changes) {
    if(!/^[0-9a-f-]{36}$/.test(id))throw new Error('Invalid entry ID');
    const path=join(this.entries,id+'.json');
    const item=JSON.parse(readFileSync(path,'utf8'));
    if(item.revision!==revision)throw new Error('词条已被其他操作修改，请刷新');
    if('favorite' in changes)item.favorite=Boolean(changes.favorite);
    if('archived' in changes)item.archived=Boolean(changes.archived);
    if('notes' in changes){if(typeof changes.notes!=='string'||changes.notes.length>5000)throw new Error('笔记过长');item.notes=changes.notes}
    if('tags' in changes){if(!Array.isArray(changes.tags)||changes.tags.length>30||changes.tags.some(x=>typeof x!=='string'||x.length>50))throw new Error('标签无效');item.tags=changes.tags}
    item.revision+=1;item.updated_at=new Date().toISOString();
    const temp=join(this.entries,'.'+randomUUID()+'.pending');
    const handle=openSync(temp,'wx');
    try {writeFileSync(handle,JSON.stringify(item,null,2)+'\n','utf8');fsyncSync(handle)}finally{closeSync(handle)}
    try{renameSync(temp,path)}catch(e){try{unlinkSync(temp)}catch{}throw e}
    return {id,revision:item.revision};
  }
}

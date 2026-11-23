import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as pause} from 'node:timers/promises';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const PORT=19649,base=`http://127.0.0.1:${PORT}`;
test('server serves all public, staff and invitation routes; old routes removed',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'fib-srv-test-'));
 const cp=spawn(process.execPath,['server.mjs'],{cwd:new URL('../',import.meta.url).pathname,env:{...process.env,PORT:String(PORT),FIB_DATA_DIR:dir,FIB_APPLICATIONS_OPEN:'false'},stdio:'ignore'});
 t.after(async()=>{cp.kill();await rm(dir,{recursive:true,force:true});});
 let ready=false;
 for(let i=0;i<60;i++){
  if(cp.exitCode!==null)break;
  try{const r=await fetch(base+'/');if(r.ok){ready=true;break}}catch{}
  await pause(70);
 }
 assert.equal(ready,true);
 for(const path of ['/','/bureau/','/units/','/units/csoa/','/units/dkb/','/units/gsu/','/units/gur/','/news/','/documents/','/academy/','/contacts/','/join/','/staff/','/invitation/','/styles.css','/assets/hero-csoa.webp']){
  const res=await fetch(base+path);assert.equal(res.status,200,path);
 }
 for(const path of ['/activity/','/nonexistent/','/runtime-data/applications.json']){
  const res=await fetch(base+path);assert.equal(res.status,404,path);
 }
 const c=await (await fetch(base+'/api/config')).json();
 assert.equal(c.applicationsOpen,false);
});

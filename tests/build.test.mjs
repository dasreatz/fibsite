import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
const dist=new URL('../dist/',import.meta.url);
test('42 localized HTML pages with shared CSS, JS and required assets',async()=>{
 const names=await readdir(dist);
 for(const name of ['index.html','styles.css','app.js','assets','bureau','units','news','documents','academy','contacts','join','staff','invitation','en','de'])assert.ok(names.includes(name),name);
 assert.ok(!names.includes('activity'));
 for(const lang of ['uk','en','de'])assert.ok((await stat(new URL('assets/flags/'+lang+'.svg',dist))).size>100);
 for(const img of ['hero-csoa.webp','fib-olymp-emblem-v52.webp'])assert.ok((await stat(new URL('assets/'+img,dist))).size>2000);
 for(const lang of ['','en/','de/']){
  const html=await readFile(new URL(lang+'index.html',dist),'utf8');
  assert.match(html,/Origin-5\.5\.0/);
  assert.match(html,/<link rel="stylesheet" href="\/styles\.css\?v=5\.7\.0">/);
  assert.match(html,/<script src="\/app\.js\?v=5\.7\.0" defer><\/script>/);
  assert.doesNotMatch(html,/data:image\/webp;base64,/);
 }
});
test('private files never published',async()=>{
 const names=await readdir(dist);
 for(const disallowed of ['runtime-data','.env','.env.example','lib','README.md','server.mjs','staff-data.json'])assert.ok(!names.includes(disallowed));
 const html=await readFile(new URL('documents/index.html',dist),'utf8');
 assert.match(html,/class="news-empty-state document-state"/);
});

test('source layout has no obsolete parallel app or duplicate published pages',async()=>{
 const names=await readdir(new URL('../',import.meta.url));
 for(const name of ['src','public','scripts','activity','index.html','en','de','bureau','units','news','documents','academy','contacts','join','staff','invitation'])
  assert.ok(!names.includes(name),`obsolete source or generated duplicate: ${name}`);
 for(const name of ['app','assets','lib','tests','dist','build.mjs','server.mjs','styles.css','app.js','.github'])
  assert.ok(names.includes(name),`missing canonical source: ${name}`);
});

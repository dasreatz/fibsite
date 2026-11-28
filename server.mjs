import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createPortal} from './lib/portal.mjs';
import {pages,units} from './app/content.mjs';
const root=resolve(fileURLToPath(new URL('./dist/',import.meta.url)));
const port=Number(process.env.PORT||3000);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.avif':'image/avif','.webp':'image/webp','.pdf':'application/pdf','.svg':'image/svg+xml'};
const routes=['',...Object.keys(pages),...units.map(u=>`units/${u.id}`)];
const htmlNames=new Set([...routes,...['en','de'].flatMap(lang=>routes.map(slug=>[lang,slug].filter(Boolean).join('/')))]);
const recruitment=await createPortal(process.env);
const server=http.createServer(async(req,res)=>{
 let url;
 try{url=new URL(req.url,'http://localhost');decodeURIComponent(url.pathname);}catch{res.writeHead(400);res.end('Bad Request');return;}
 if(/^\/(?:en\/|de\/)?staff\/?$/.test(url.pathname)){res.writeHead(302,{Location:'/cabinet/','Cache-Control':'no-store'});res.end();return;}
 if(url.pathname.startsWith('/api/')){await recruitment.handle(req,res,url);return;}
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 const pathname=decodeURIComponent(url.pathname);
 const target=resolve(root,'.'+pathname);
 if(target!==root&&!target.startsWith(root+sep)){res.writeHead(403);res.end('Forbidden');return;}
 const pageName=pathname.replace(/^\/+|\/+$/g,'');
 const file=htmlNames.has(pageName)?resolve(root,pageName,'index.html'):target;
 try{
  const fileName=(await stat(file)).isDirectory()?resolve(file,'index.html'):file;
  const body=await readFile(fileName);const ext=extname(fileName);
  res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream','Cache-Control':ext==='.html'?'no-store, max-age=0, must-revalidate':'public, max-age=3600','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer'});
  res.end(req.method==='HEAD'?undefined:body);
 }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Сторінку не знайдено');}
});
server.listen(port,'0.0.0.0',()=>console.log(`FIB Olymp ${recruitment.config.accepting?'recruitment enabled':'recruitment disabled'} at http://localhost:${port}`));

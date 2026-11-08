import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
mkdirSync('work',{recursive:true});
execFileSync(process.platform==='win32'?'python':'python3',['-c',`import zipfile
files=['src/index.html','src/catalog.mjs','src/sync-core.js','src/account.js','pc/server.mjs','pc/start-windows.bat','pc/start-mac.command','pc/README.txt','assets/Manrope-OFL.txt']
with zipfile.ZipFile('work/quiet-shelf-pc.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in files:z.write(name,'quiet-shelf/'+name)
with zipfile.ZipFile('work/quiet-shelf-update.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in files:
  if name not in ['pc/start-mac.command','pc/README.txt']:z.write(name,name)
`]);
const html=readFileSync('src/index.html','utf8'),api=readFileSync('src/catalog.mjs','utf8');
const assets=Object.fromEntries(['sync-core.js','account.js'].map(name=>['/'+name,readFileSync('src/'+name,'utf8')]));
const downloads={'/download/quiet-shelf-update.zip':readFileSync('work/quiet-shelf-update.zip').toString('base64'),'/download/quiet-shelf-pc.zip':readFileSync('work/quiet-shelf-pc.zip').toString('base64')};
const worker=`
export default {async fetch(request){
 const u=new URL(request.url);
 if(u.pathname==='/api/account/status'&&request.method==='GET')return Response.json({mode:'local',configured:false,account:null,network:{metered:null,source:'browser'}},{headers:{'Cache-Control':'no-store'}});
 if(Object.hasOwn(assets,u.pathname)&&request.method==='GET')return new Response(assets[u.pathname],{headers:{'Content-Type':'application/javascript; charset=utf-8','X-Content-Type-Options':'nosniff'}});
 if(u.pathname==='/api/books'||u.pathname==='/api/book')return catalog(request);
 if(Object.hasOwn(downloads,u.pathname))return new Response(Uint8Array.from(atob(downloads[u.pathname]),c=>c.charCodeAt(0)),{headers:{'Content-Type':'application/zip','Content-Disposition':'attachment; filename='+u.pathname.split('/').pop(),'Cache-Control':'no-store'}});
 if(u.pathname!=='/'||request.method!=='GET')return new Response('Not found',{status:404});
 return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
}};
`;
mkdirSync('dist/server',{recursive:true});
writeFileSync('dist/server/index.js',api+'\nconst html='+JSON.stringify(html)+';\nconst assets='+JSON.stringify(assets)+';\nconst downloads='+JSON.stringify(downloads)+';\n'+worker);

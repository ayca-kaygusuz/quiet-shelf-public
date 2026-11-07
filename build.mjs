import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
mkdirSync('work',{recursive:true});
execFileSync(process.platform==='win32'?'python':'python3',['-c',`import zipfile
files=['src/index.html','src/catalog.mjs','pc/server.mjs','pc/start-windows.bat','pc/start-mac.command','pc/README.txt','assets/Manrope-OFL.txt']
with zipfile.ZipFile('work/quiet-shelf-pc.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in files:z.write(name,'quiet-shelf/'+name)
with zipfile.ZipFile('work/quiet-shelf-update.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in files:
  if name not in ['pc/start-mac.command','pc/README.txt']:z.write(name,name)
`]);
const html=readFileSync('src/index.html','utf8'),api=readFileSync('src/catalog.mjs','utf8');
const downloads={'/download/quiet-shelf-update.zip':readFileSync('work/quiet-shelf-update.zip').toString('base64'),'/download/quiet-shelf-pc.zip':readFileSync('work/quiet-shelf-pc.zip').toString('base64')};
mkdirSync('dist/server',{recursive:true});writeFileSync('dist/server/index.js',api+'\nconst html='+JSON.stringify(html)+';\nconst downloads='+JSON.stringify(downloads)+';\nexport default {async fetch(request){let u=new URL(request.url);if(u.pathname==="/api/books"||u.pathname==="/api/book")return catalog(request);if(downloads[u.pathname])return new Response(Uint8Array.from(atob(downloads[u.pathname]),c=>c.charCodeAt(0)),{headers:{"Content-Type":"application/zip","Content-Disposition":"attachment; filename="+u.pathname.split("/").pop(),"Cache-Control":"no-store"}});if(u.pathname!=="/")return new Response("Not found",{status:404});return new Response(html,{headers:{"Content-Type":"text/html; charset=utf-8","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"}})}};');

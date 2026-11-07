import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
execFileSync('python3',['-c',`import zipfile, pathlib
with zipfile.ZipFile('/workspace/work/quiet-shelf-pc.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in ['src/index.html','src/catalog.mjs','pc/server.mjs','pc/start-windows.bat','pc/start-mac.command','pc/README.txt']:
  z.write(name,'quiet-shelf/'+name)
with zipfile.ZipFile('/workspace/work/quiet-shelf-update.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in ['src/index.html','src/catalog.mjs','pc/start-windows.bat']:
  z.write(name,name)
`]);
const html=readFileSync('src/index.html','utf8');const api=readFileSync('src/catalog.mjs','utf8');const update=readFileSync('/workspace/work/quiet-shelf-update.zip').toString('base64');const zip=readFileSync('/workspace/work/quiet-shelf-pc.zip').toString('base64');mkdirSync('dist/server',{recursive:true});writeFileSync('dist/server/index.js',api+'\nconst html='+JSON.stringify(html)+';\nconst zip='+JSON.stringify(zip)+';\nconst update='+JSON.stringify(update)+';\nexport default {async fetch(request){let u=new URL(request.url);if(u.pathname==="/api/books"||u.pathname==="/api/book")return catalog(request);if(u.pathname==="/download/quiet-shelf-update.zip")return new Response(Uint8Array.from(atob(update),c=>c.charCodeAt(0)),{headers:{"Content-Type":"application/zip","Content-Disposition":"attachment; filename=quiet-shelf-update.zip","Cache-Control":"no-store"}});if(u.pathname==="/download/quiet-shelf-pc.zip")return new Response(Uint8Array.from(atob(zip),c=>c.charCodeAt(0)),{headers:{"Content-Type":"application/zip","Content-Disposition":"attachment; filename=quiet-shelf-pc.zip"}});if(u.pathname!=="/")return new Response("Not found",{status:404});return new Response(html,{headers:{"Content-Type":"text/html; charset=utf-8","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"}})}};');

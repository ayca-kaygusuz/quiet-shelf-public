import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const hosts=['http://127.0.0.1:8765/*','https://books.google.com/*','https://anilist.co/*','https://www.dr.com.tr/*','https://www.idefix.com/*','https://www.amazon.com.tr/*','https://www.amazon.com/*','https://www.amazon.co.uk/*','https://www.amazon.de/*','https://www.amazon.co.jp/*'];
const manifest={manifest_version:3,name:'Quiet Shelf Bookstore Connector',version:'0.6.1',description:'Returns bookstore search results to your local Quiet Shelf.',permissions:['scripting'],host_permissions:hosts,content_scripts:[{matches:['http://127.0.0.1:8765/*'],js:['content.js'],run_at:'document_idle'}]};
for(const browser of ['chrome','firefox']){const m={...manifest,background:browser==='chrome'?{service_worker:'background.js'}:{scripts:['background.js']},...(browser==='firefox'?{browser_specific_settings:{gecko:{id:'quiet-shelf-local@example.invalid',strict_min_version:'140.0',data_collection_permissions:{required:['none']}}}}:{})};writeFileSync('connector/manifest-'+browser+'.json',JSON.stringify(m,null,2))}
execFileSync('python3',['-c',`import zipfile
for browser in ['chrome','firefox']:
 with zipfile.ZipFile('connector/browser-connector-'+browser+'.zip','w',zipfile.ZIP_DEFLATED) as z:
  z.write('connector/manifest-'+browser+'.json','manifest.json')
  for f in ['background.js','content.js','README.txt']: z.write('connector/'+f,f)
files=['src/index.html','src/catalog.mjs','pc/server.mjs','pc/start-windows.bat','pc/start-mac.command','pc/README.txt','connector/browser-connector-chrome.zip','connector/browser-connector-firefox.zip']
with zipfile.ZipFile('/workspace/work/quiet-shelf-pc.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in files:z.write(name,'quiet-shelf/'+name)
with zipfile.ZipFile('/workspace/work/quiet-shelf-update.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in files:
  if name not in ['pc/start-mac.command','pc/README.txt']:z.write(name,name)
`]);
const html=readFileSync('src/index.html','utf8'),api=readFileSync('src/catalog.mjs','utf8');
const downloads={'/download/quiet-shelf-update.zip':readFileSync('/workspace/work/quiet-shelf-update.zip').toString('base64'),'/download/quiet-shelf-pc.zip':readFileSync('/workspace/work/quiet-shelf-pc.zip').toString('base64')};
for(const browser of ['chrome','firefox'])downloads['/download/browser-connector-'+browser+'.zip']=readFileSync('connector/browser-connector-'+browser+'.zip').toString('base64');
mkdirSync('dist/server',{recursive:true});writeFileSync('dist/server/index.js',api+'\nconst html='+JSON.stringify(html)+';\nconst downloads='+JSON.stringify(downloads)+';\nexport default {async fetch(request){let u=new URL(request.url);if(u.pathname==="/api/books"||u.pathname==="/api/book")return catalog(request);if(downloads[u.pathname])return new Response(Uint8Array.from(atob(downloads[u.pathname]),c=>c.charCodeAt(0)),{headers:{"Content-Type":"application/zip","Content-Disposition":"attachment; filename="+u.pathname.split("/").pop(),"Cache-Control":"no-store"}});if(u.pathname!=="/")return new Response("Not found",{status:404});return new Response(html,{headers:{"Content-Type":"text/html; charset=utf-8","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"}})}};');

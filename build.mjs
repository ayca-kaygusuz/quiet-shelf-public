import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {googleDesktopConfiguration} from './src/google-oauth.mjs';
import {APP_VERSION} from './src/releases.mjs';
if(JSON.parse(readFileSync('package.json','utf8')).version!==APP_VERSION)throw Error('The shared release version must match package.json.');
mkdirSync('work',{recursive:true});
let desktopConfiguration;try{const generated=JSON.parse(readFileSync('desktop/google-client.generated.json','utf8'));desktopConfiguration=googleDesktopConfiguration({clientId:generated.clientId,credentialValue:generated.clientSecret})}catch(error){if(error.code!=='ENOENT'&&process.env.CI)throw Error('The browser package requires valid installed-app configuration.')}
if(desktopConfiguration)writeFileSync('pc/google-client.generated.json',JSON.stringify(desktopConfiguration));
const files=['src/index.html','src/catalog.mjs','src/sync-core.js','src/account.js','src/drive.mjs','src/google-oauth.mjs','src/web-account.mjs','src/releases.mjs','pc/server.mjs','pc/start-windows.bat','pc/start-mac.command','pc/README.txt','assets/Manrope-OFL.txt',...(desktopConfiguration?['pc/google-client.generated.json']:[])];
execFileSync(process.platform==='win32'?'python':'python3',['-c',`import zipfile,json
files=json.loads(${JSON.stringify(JSON.stringify(files))})
with zipfile.ZipFile('work/quiet-shelf-pc.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in files:z.write(name,'quiet-shelf/'+name)
with zipfile.ZipFile('work/quiet-shelf-update.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in files:
  if name not in ['pc/start-mac.command','pc/README.txt']:z.write(name,name)
`]);
const html=readFileSync('src/index.html','utf8'),api=readFileSync('src/catalog.mjs','utf8');
const assets=Object.fromEntries(['sync-core.js','account.js'].map(name=>['/'+name,readFileSync('src/'+name,'utf8')]));
const downloads={'/download/quiet-shelf-update.zip':readFileSync('work/quiet-shelf-update.zip').toString('base64'),'/download/quiet-shelf-pc.zip':readFileSync('work/quiet-shelf-pc.zip').toString('base64')};
const sharedServer=['src/sync-core.js','src/google-oauth.mjs','src/drive.mjs','src/web-account.mjs','src/releases.mjs'].map(name=>readFileSync(name,'utf8').replace(/^import .*;\r?\n/gm,'')).join('\n');
const worker=`
const browserReleaseCheck=createBrowserReleaseHandler();
export default {async fetch(request,env={}){
 const u=new URL(request.url);
 if(u.pathname.startsWith('/api/account/'))return createWebAccount(env).handle(request);
 if(u.pathname==='/api/update-check')return browserReleaseCheck(request);
 if(Object.hasOwn(assets,u.pathname)&&request.method==='GET')return new Response(assets[u.pathname],{headers:{'Content-Type':'application/javascript; charset=utf-8','X-Content-Type-Options':'nosniff'}});
 if(u.pathname==='/api/books'||u.pathname==='/api/book')return catalog(request);
 if(Object.hasOwn(downloads,u.pathname))return new Response(Uint8Array.from(atob(downloads[u.pathname]),c=>c.charCodeAt(0)),{headers:{'Content-Type':'application/zip','Content-Disposition':'attachment; filename='+u.pathname.split('/').pop(),'Cache-Control':'no-store'}});
 if(u.pathname!=='/'||request.method!=='GET')return new Response('Not found',{status:404});
 return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
}};
`;
mkdirSync('dist/server',{recursive:true});
writeFileSync('dist/server/index.js',api+'\n'+sharedServer+'\nconst html='+JSON.stringify(html)+';\nconst assets='+JSON.stringify(assets)+';\nconst downloads='+JSON.stringify(downloads)+';\n'+worker);

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import {EventEmitter} from 'node:events';
import vm from 'node:vm';
import {join,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {desktopLegalScript} from '../desktop/legal.mjs';
import {APP_ORIGIN,createAppHandler,isAppURL,isExternalBookURL,isBackupURL} from '../desktop/app-protocol.mjs';

const html=readFileSync('src/index.html','utf8'),script=html.match(/<script>([\s\S]*)<\/script>/)[1].replace(/\r\n?/g,'\n');
let calls=[];
const handler=createAppHandler({html,catalog:async request=>{calls.push(request);return Response.json({results:[{title:'A catalog result'}]})}});
let r=await handler(new Request(APP_ORIGIN+'/'));assert.equal(r.status,200);assert.equal(await r.text(),html);assert.equal(r.headers.get('Referrer-Policy'),'no-referrer');
const policy=r.headers.get('Content-Security-Policy');assert(policy.includes("connect-src 'self'"));assert(policy.includes("object-src 'none'"));assert(policy.includes("'sha256-"+createHash('sha256').update(script).digest('base64')+"'"));assert(!policy.includes('unsafe-eval'));
const windowsHTML=html.replace(/\r\n?/g,'\n').replace(/\n/g,'\r\n');r=await createAppHandler({html:windowsHTML,catalog:()=>{}})(new Request(APP_ORIGIN+'/'));assert.equal(r.headers.get('Content-Security-Policy'),policy,'Windows line endings must not break the inline-script hash');
r=await handler(new Request(APP_ORIGIN+'/api/books?source=google&lang=en&q=Test',{headers:{'X-Google-Api-Key':'test-only-key','Cookie':'not-forwarded','Authorization':'not-forwarded'}}));assert.equal((await r.json()).results[0].title,'A catalog result');assert.equal(calls[0].url,'http://localhost/api/books?source=google&lang=en&q=Test');assert.equal(calls[0].headers.get('X-Google-Api-Key'),'test-only-key');assert.equal(calls[0].headers.get('Cookie'),null);assert.equal(calls[0].headers.get('Authorization'),null);
await handler(new Request(APP_ORIGIN+'/api/book?source=kitapyurdu&url='+encodeURIComponent('https://www.kitapyurdu.com/kitap/test/123.html'),{headers:{'X-Google-Api-Key':'test-only-key'}}));assert.equal(calls.at(-1).headers.get('X-Google-Api-Key'),null);
for(let url of ['quiet-shelf://other/','https://example.com/','quiet-shelf://user@app/'])assert.equal((await handler({url,method:'GET'})).status,403);
for(let path of ['/etc/passwd','/private/library.json','/download/quiet-shelf-pc.zip'])assert.equal((await handler(new Request(APP_ORIGIN+path))).status,404);
assert.equal((await handler(new Request(APP_ORIGIN+'/api/books',{method:'POST'}))).status,405);
assert(isAppURL(APP_ORIGIN+'/'));assert(isAppURL(APP_ORIGIN+'/#overview'));assert(!isAppURL(APP_ORIGIN+'/private'));assert(!isAppURL('file:///app/index.html'));
assert(isExternalBookURL('https://www.kitapyurdu.com/kitap/test/123.html'));assert(isExternalBookURL('https://books.google.com/books?id=test'));assert(isExternalBookURL('https://www.nadirkitap.com/a-kitap123.html'));for(let value of ['javascript:alert(1)','file:///private','https://evil.com','https://www.kitapyurdu.com.evil.com','https://user@www.kitapyurdu.com/','https://www.kitapyurdu.com:4443/'])assert(!isExternalBookURL(value));
assert(isBackupURL('blob:'+APP_ORIGIN+'/test'));assert(!isBackupURL('blob:https://evil.com/test'));assert(!isBackupURL('https://example.com/private.json'));

// Exercise the actual desktop entry point with a fake Electron host, not a real browser profile.
async function boot(primary=true,platform='win32',executable='/own-app-data'){
 let trace=[],windows=[],opened=[],app=new EventEmitter(),session=new EventEmitter(),registered={},menus;
 Object.assign(app,{setName:name=>trace.push(['name',name]),isPackaged:true,getPath:name=>name==='exe'?executable:'/own-app-data',setPath:(name,value)=>{assert(trace.some(t=>t[0]==='mkdir'&&t[1]===value));trace.push(['path',name,value])},setAppUserModelId:id=>trace.push(['app-id',id]),requestSingleInstanceLock:()=>primary,whenReady:()=>Promise.resolve(),quit:()=>trace.push(['quit'])});
 class Window extends EventEmitter{
  static getAllWindows(){return windows}
  constructor(options){super();this.options=options;this.webContents=new EventEmitter();Object.assign(this.webContents,{session,setWindowOpenHandler:fn=>this.openHandler=fn});windows.push(this)}
  loadURL(url){this.url=url;return Promise.resolve()}show(){this.shown=true}isMinimized(){return true}restore(){this.restored=true}focus(){this.focused=true}
 }
 session.setPermissionRequestHandler=fn=>session.permission=fn;session.setPermissionCheckHandler=fn=>session.permissionCheck=fn;
 const main=readFileSync('desktop/main.mjs','utf8').replace(/\r\n?/g,'\n').replace(/^import .*;\n/gm,'').replaceAll('import.meta.url',JSON.stringify(pathToFileURL(join(process.cwd(),'desktop/main.mjs')).href));
 let context={desktopLegalScript:options=>{assert.equal(options.packaged,true);assert.equal(options.root,dirname(executable));return desktopLegalScript({root:process.cwd()})},setInterval:()=>({unref(){}}),clearInterval:()=>{},setTimeout:fn=>{trace.push(['update-timer',fn]);return {unref(){}}},clearTimeout:()=>{},createUpdateController:options=>(trace.push(['update-options',{enabled:options.enabled,kind:options.kind}]),{check:async options=>trace.push(['update-check',options]),dispose:()=>trace.push(['update-dispose'])}),safeStorage:{},createGoogleAccount:options=>{assert.equal(options.defaultClientId,'');assert.equal(options.defaultClientSecret,'');assert.equal(options.developerControls,false);return {handle:async()=>Response.json({account:null}),dispose:()=>trace.push(['account-dispose'])}},dialog:{},app,BrowserWindow:Window,Menu:{buildFromTemplate:items=>items,setApplicationMenu:items=>menus=items},protocol:{registerSchemesAsPrivileged:schemes=>registered.schemes=schemes,handle:(scheme,fn)=>registered.handler=fn},shell:{openExternal:async url=>opened.push(url)},mkdirSync:(path,options)=>{assert.equal(options.recursive,true);trace.push(['mkdir',path])},readFileSync:(path,encoding)=>{assert.equal(encoding,'utf8');return readFileSync(path,encoding)},join,dirname,fileURLToPath,catalog:async()=>Response.json({results:[]}),APP_ORIGIN,createAppHandler,isAppURL,isExternalBookURL,isBackupURL,process:{platform},console};
 vm.createContext(context);vm.runInContext(main,context);await new Promise(resolve=>setImmediate(resolve));return {trace,windows,app,session,registered,opened,menus};
}
let desktop=await boot();assert.equal(desktop.windows.length,1);let win=desktop.windows[0];assert.equal(win.url,APP_ORIGIN+'/');assert.equal(win.options.webPreferences.nodeIntegration,false);assert.equal(win.options.webPreferences.contextIsolation,true);assert.equal(win.options.webPreferences.sandbox,true);assert.equal(win.options.webPreferences.webSecurity,true);assert.equal(win.options.webPreferences.webviewTag,false);assert(desktop.registered.schemes[0].privileges.standard&&desktop.registered.schemes[0].privileges.secure&&desktop.registered.schemes[0].privileges.supportFetchAPI);
let allowed=true;desktop.session.permission(null,'camera',value=>allowed=value);assert.equal(allowed,false);assert.equal(desktop.session.permissionCheck(),false);
win.emit('ready-to-show');assert(win.shown);desktop.app.emit('second-instance');assert(win.restored&&win.focused);
assert.equal(win.openHandler({url:'https://books.google.com/books?id=test'}).action,'deny');assert.equal(desktop.opened.length,1);win.openHandler({url:'file:///private'});assert.equal(desktop.opened.length,1);
let blocked=false;win.webContents.emit('will-navigate',{preventDefault:()=>blocked=true},'file:///private');assert(blocked);
let options;desktop.session.emit('will-download',{preventDefault(){throw Error('A user backup was blocked')}},{getURL:()=>`blob:${APP_ORIGIN}/123`,getFilename:()=>'quiet-shelf-backup.json',setSaveDialogOptions:o=>options=o},win.webContents);assert.equal(options.filters[0].extensions[0],'json');
blocked=false;desktop.session.emit('will-download',{preventDefault:()=>blocked=true},{getURL:()=>`blob:${APP_ORIGIN}/123`},{});assert(blocked);
desktop.app.emit('window-all-closed');assert(desktop.trace.some(t=>t[0]==='quit'));
const updateMenu=desktop.menus.find(menu=>menu.label==='Help').submenu[0];assert.equal(updateMenu.enabled,true);updateMenu.click();assert(desktop.trace.some(t=>t[0]==='update-check'&&t[1]?.manual));desktop.app.emit('before-quit');assert(desktop.trace.some(t=>t[0]==='update-dispose'));
let secondary=await boot(false);assert.equal(secondary.windows.length,0);assert(secondary.trace.some(t=>t[0]==='quit'));

for(const [executable,kind]of [['/opt/Quiet Shelf/quiet-shelf','linux-deb'],['/tmp/quiet-shelf/quiet-shelf','linux']]){const linux=await boot(true,'linux',executable);assert.equal(linux.windows.length,1);assert(linux.windows[0].options.icon.endsWith('icon.png'));assert.equal(linux.trace.find(t=>t[0]==='update-options')[1].kind,kind);assert.equal(linux.trace.find(t=>t[0]==='update-options')[1].enabled,true);assert.equal(linux.windows[0].options.webPreferences.sandbox,true);linux.app.emit('before-quit')}

function renderer(protocol,storage){let elements={};const element=s=>elements[s]??={value:'',innerHTML:'',textContent:'',hidden:false,setAttribute(){},addEventListener(){},querySelector:()=>({disabled:false})};const ctx={console,URL,AbortController,crypto:webcrypto,setTimeout,clearTimeout,location:{protocol,hostname:protocol==='quiet-shelf:'?'app':'localhost'},localStorage:{getItem:k=>storage[k],setItem:(k,v)=>storage[k]=v},document:{querySelector:element,querySelectorAll:()=>[],addEventListener(){}}};vm.createContext(ctx);vm.runInContext(script,ctx);return {element,run:s=>vm.runInContext(s,ctx)}}
const record={id:'one',title:'A separate library',author:'',status:'Unread',history:[]};let browserStore={'quiet-shelf-v1':JSON.stringify([record])},nativeStore={'quiet-shelf-v1':JSON.stringify([record])};let browser=renderer('http:',browserStore),native=renderer('quiet-shelf:',nativeStore);native.run("setStatus('In progress')");assert.equal(native.run('current().status'),'In progress');assert.equal(browser.run('current().status'),'Unread');assert.equal(native.element('#storageLabel').textContent,'Saved on this computer');assert.equal(native.element('#pcDownload').hidden,true);assert.equal(renderer('quiet-shelf:',nativeStore).run('current().status'),'In progress');
console.log('PASS: native app protocol/CSP, catalog routing/key isolation, navigation/download permissions, startup/profile/window controls, separate persistent renderer stores and browser coexistence');

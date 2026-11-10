import {desktopLegalScript} from './legal.mjs';
import {app,BrowserWindow,Menu,protocol,shell,dialog,safeStorage,net} from 'electron';
import {readFileSync,mkdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {catalog} from '../src/catalog.mjs';
import {APP_ORIGIN,createAppHandler,isAppURL,isExternalBookURL,isBackupURL} from './app-protocol.mjs';
import {createUpdateController} from './updates.mjs';
import {createGoogleAccount} from './google-account.mjs';

const here=dirname(fileURLToPath(import.meta.url));
app.setName('Quiet Shelf');
const profile=join(app.getPath('appData'),'Quiet Shelf');
mkdirSync(profile,{recursive:true});
app.setPath('userData',profile);
protocol.registerSchemesAsPrivileged([{scheme:'quiet-shelf',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true,stream:true,codeCache:true}}]);
let window,updates,googleAccount,updateTimer,updateInterval;
function openExternalBook(url){if(isExternalBookURL(url))void shell.openExternal(url).catch(()=>{})}
function createWindow(){
  window=new BrowserWindow({title:'Quiet Shelf',width:1440,height:960,minWidth:760,minHeight:560,show:false,backgroundColor:'#17181d',icon:join(here,'assets',process.platform==='linux'?'icon.png':'icon.ico'),autoHideMenuBar:true,webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,webviewTag:false,spellcheck:false}});
  window.on('page-title-updated',event=>event.preventDefault());
  window.webContents.setWindowOpenHandler(({url})=>{openExternalBook(url);return {action:'deny'}});
  window.webContents.on('will-navigate',(event,url)=>{if(!isAppURL(url)){event.preventDefault();openExternalBook(url)}});
  window.webContents.on('will-attach-webview',event=>event.preventDefault());
  window.once('ready-to-show',()=>window?.show());
  window.on('closed',()=>{window=null});
  void window.loadURL(APP_ORIGIN+'/');
}
if(!app.requestSingleInstanceLock())app.quit();
else{
  app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.show();window.focus()}});
  app.whenReady().then(()=>{
    // A stable profile keeps this app's records separate from every browser profile.
    app.setAppUserModelId('com.quietshelf.desktop');
    const html=readFileSync(join(here,'..','src','index.html'),'utf8');
    const assets=Object.fromEntries(['read-next.js','sync-core.js','account.js'].map(name=>['/'+name,readFileSync(join(here,'..','src',name),'utf8')]));
    googleAccount=createGoogleAccount({profile,safeStorage,developerControls:!app.isPackaged,...(app.isPackaged?{defaultClientId:'',defaultClientSecret:''}:{}),openExternal:url=>shell.openExternal(url)});
    const updateKind=process.platform==='linux'?(app.getPath('exe')==='/opt/Quiet Shelf/quiet-shelf'?'linux-deb':'linux'):'windows';
    updates=createUpdateController({app,dialog,getWindow:()=>window,enabled:['win32','linux'].includes(process.platform)&&app.isPackaged,kind:updateKind,showPackage:path=>shell.showItemInFolder(path),network:async()=>({...await googleAccount.network(),online:net.isOnline()})});
    assets['/legal.js']=desktopLegalScript({root:app.isPackaged?dirname(app.getPath('exe')):join(here,'..'),packaged:app.isPackaged});
    protocol.handle('quiet-shelf',createAppHandler({html,catalog,updates,assets,account:googleAccount}));
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      {label:'File',submenu:[{role:'quit'}]},
      {label:'Edit',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},
      {label:'View',submenu:[{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'},{type:'separator'},{role:'togglefullscreen'}]},
      {label:'Help',submenu:[{label:'Check for updates…',enabled:['win32','linux'].includes(process.platform)&&app.isPackaged,click:()=>void updates.check({manual:true}).catch(()=>{})}]}
    ]));
    createWindow();
    if(['win32','linux'].includes(process.platform)&&app.isPackaged){updateTimer=setTimeout(()=>void updates.check().catch(()=>{}),15000);updateTimer.unref?.();updateInterval=setInterval(()=>void updates.check().catch(()=>{}),60000);updateInterval.unref?.()}
    app.on('before-quit',()=>{clearTimeout(updateTimer);clearInterval(updateInterval);updates.dispose();googleAccount.dispose()});
    const session=window.webContents.session;
    session.setPermissionRequestHandler((_contents,_permission,callback)=>callback(false));
    session.setPermissionCheckHandler(()=>false);
    session.on('will-download',(event,item,contents)=>{
      if(contents!==window?.webContents||!isBackupURL(item.getURL())){event.preventDefault();return}
      item.setSaveDialogOptions({title:'Back up Quiet Shelf',defaultPath:item.getFilename(),filters:[{name:'Quiet Shelf backup',extensions:['json']}]});
    });
    app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()});
  }).catch(error=>{console.error('Quiet Shelf could not start:',error.message);app.quit()});
  app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
}

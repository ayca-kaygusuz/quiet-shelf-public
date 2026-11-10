import {checkLibraryViewUI} from './check-library-view-ui.mjs';
import {checkReadNextUI} from './check-read-next-ui.mjs';
// Runs against an isolated native CI app launched with a loopback DevTools port.
import assert from 'node:assert/strict';
import {checkThemeUI} from './check-theme-ui.mjs';
import {checkUpdatePolicyUI} from './check-update-policy-ui.mjs';
import {checkFirstSyncUI} from './check-first-sync-ui.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
const output=process.env.QUIET_SHELF_UI_OUTPUT||'work/windows';await mkdir(output,{recursive:true});

const pages=await (await fetch((process.env.QUIET_SHELF_DEVTOOLS_URL||'http://127.0.0.1:9222')+'/json/list',{signal:AbortSignal.timeout(10000)})).json();
const page=pages.find(p=>p.type==='page'&&p.url.startsWith('quiet-shelf://app/'));
assert(page?.webSocketDebuggerUrl,'The native app page is missing');
const socket=new WebSocket(page.webSocketDebuggerUrl),pending=new Map();let nextId=0;
await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
socket.addEventListener('message',event=>{const message=JSON.parse(event.data),entry=pending.get(message.id);if(entry){pending.delete(message.id);clearTimeout(entry.timer);if(message.error)entry.reject(Error(message.error.message));else entry.resolve(message.result)}});
function command(method,params={}){return new Promise((resolve,reject)=>{const id=++nextId,timer=setTimeout(()=>{pending.delete(id);reject(Error('Native UI check timed out: '+method))},20000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}))})}
async function evaluate(expression){const result=await command('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});assert(!result.exceptionDetails,JSON.stringify(result.exceptionDetails));return result.result.value}
try{
 const bridge=await evaluate(`(async()=>{const status=await fetch('/api/update-status');const state=await status.json();const action=await fetch('/api/update-action?action=check',{method:'POST',headers:{'X-Quiet-Shelf-Update':'1'}});const accountResponse=await fetch('/api/account/status');const account=await accountResponse.json();document.querySelector('#accountButton').click();return {status:status.status,action:action.status,enabled:state.enabled,visible:!document.querySelector('#checkUpdates').hidden&&!document.querySelector('#accountPage').hidden,accountStatus:accountResponse.status,accountMode:account.mode,configured:account.configured,accountLoaded:!!globalThis.QuietShelfAccount}})()`);
 assert.equal(bridge.status,200);assert.equal(bridge.action,202);assert.equal(bridge.enabled,true);assert.equal(bridge.visible,true);
 assert.equal(bridge.accountStatus,200);assert.equal(bridge.accountMode,'desktop');assert.equal(bridge.accountLoaded,true);
 if(process.env.QUIET_SHELF_GOOGLE_DESKTOP_CLIENT_ID&&process.env.QUIET_SHELF_GOOGLE_DESKTOP_CLIENT_SECRET)assert.equal(bridge.configured,true);
 await evaluate(`(async()=>{while(updatePolling)await new Promise(resolve=>setTimeout(resolve,25));clearTimeout(updatePollTimer);updatePolling=true;return true})()`);
 for(const theme of ['ink','sage']){
  await evaluate(`document.querySelector('#theme').value=${JSON.stringify(theme)};document.querySelector('#theme').dispatchEvent(new Event('change',{bubbles:true}));if(document.querySelector('#accountPage').hidden)document.querySelector('#accountButton').click();document.querySelector('#updateCard').hidden=true;window.scrollTo(0,0);true`);
  const accountScreenshot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:1440,height:1200,scale:1}});
  await writeFile(`${output}/account-preview-${theme}.png`,Buffer.from(accountScreenshot.data,'base64'));
  await evaluate(`document.querySelector('#backToLibrary').click();true`);
  const view=await evaluate(`(async()=>{clearTimeout(updatePollTimer);document.querySelector('#theme').value=${JSON.stringify(theme)};document.querySelector('#theme').dispatchEvent(new Event('change',{bubbles:true}));renderUpdateStatus({phase:'downloading',version:'0.12.0',progress:.42,downloaded:44040192,total:104857600,visible:true},true);const card=document.querySelector('#updateCard'),before=card.getBoundingClientRect();const spacer=document.createElement('div');spacer.style.height='1400px';document.body.append(spacer);window.scrollTo(0,document.body.scrollHeight);const stable=Math.abs(card.getBoundingClientRect().y-before.y)<1;window.scrollTo(0,0);spacer.remove();await new Promise(resolve=>setTimeout(resolve,250));const r=card.getBoundingClientRect();return {stable,hidden:document.querySelector('#updateCard').hidden,text:document.querySelector('#updatePercent').textContent,clip:{x:Math.max(0,r.x-8),y:Math.max(0,r.y-8),width:r.width+16,height:r.height+16,scale:1}}})()`);
  assert.equal(view.stable,true);assert.equal(view.hidden,false);assert.equal(view.text,'42%');
  const screenshot=await command('Page.captureScreenshot',{format:'png',clip:view.clip});
  await writeFile(`${output}/update-preview-${theme}.png`,Buffer.from(screenshot.data,'base64'));
 }
 const legal=await evaluate(`(async()=>{for(let i=0;i<50&&!document.querySelector('#projectLicense').textContent;i++)await new Promise(resolve=>setTimeout(resolve,50));return {license:document.querySelector('#projectLicense').textContent,notice:document.querySelector('#projectNotice').textContent,font:document.querySelector('#fontLicense').textContent,third:document.querySelector('#thirdPartyNotice').textContent,credit:document.querySelector('#aboutQuietShelf').textContent}})()`);
 assert(legal.license.includes('TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION'));assert(legal.notice.includes('Copyright 2026 Alex (Ayca Kaygusuz)'));assert(legal.font.includes('SIL OPEN FONT LICENSE'));assert(legal.third.includes('Google Play services'));assert(legal.credit.includes('Originally created by Alex (Ayca Kaygusuz).'));
 await checkUpdatePolicyUI({evaluate,prefix:'native-update-policy',capture:async name=>{const size=await evaluate(`({width:innerWidth,height:Math.min(document.documentElement.scrollHeight,2000)})`),shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,...size,scale:1}});await writeFile(output+'/'+name+'.png',Buffer.from(shot.data,'base64'))}});
 await checkThemeUI({evaluate,prefix:'native-theme',capture:async name=>{const size=await evaluate(`({width:innerWidth,height:Math.min(document.documentElement.scrollHeight,2000)})`),shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,...size,scale:1}});await writeFile(output+'/'+name+'.png',Buffer.from(shot.data,'base64'))}});
 await checkLibraryViewUI({evaluate});
 await checkReadNextUI({evaluate,prefix:'native-read-next',capture:async name=>{const size=await evaluate(`({width:innerWidth,height:Math.min(document.documentElement.scrollHeight,2000)})`),shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,...size,scale:1}});await writeFile(output+'/'+name+'.png',Buffer.from(shot.data,'base64'))}});
 await checkFirstSyncUI({evaluate,prefix:'native-first-sync',capture:async name=>{const size=await evaluate(`({width:innerWidth,height:Math.min(document.documentElement.scrollHeight,2000)})`),shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,...size,scale:1}});await writeFile(output+'/'+name+'.png',Buffer.from(shot.data,'base64'))}});
 console.log('PASS: actual native account/assets/update bridges, configured Desktop client, Account navigation, visible download card and both themes');
}finally{socket.close();for(const entry of pending.values())clearTimeout(entry.timer)}

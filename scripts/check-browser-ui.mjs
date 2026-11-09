import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {checkThemeUI} from './check-theme-ui.mjs';
import {checkUpdatePolicyUI} from './check-update-policy-ui.mjs';
import {checkFirstSyncUI} from './check-first-sync-ui.mjs';
const pages=await(await fetch('http://127.0.0.1:9223/json/list')).json(),page=pages.find(p=>p.type==='page'&&p.url.startsWith('http://127.0.0.1:8765/'));assert(page?.webSocketDebuggerUrl);
const socket=new WebSocket(page.webSocketDebuggerUrl),pending=new Map();let next=0;
await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
socket.addEventListener('message',event=>{const message=JSON.parse(event.data),entry=pending.get(message.id);if(entry){pending.delete(message.id);clearTimeout(entry.timer);message.error?entry.reject(Error(message.error.message)):entry.resolve(message.result)}});
function command(method,params={}){return new Promise((resolve,reject)=>{const id=++next,timer=setTimeout(()=>{pending.delete(id);reject(Error('Browser UI check timed out'))},20000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}))})}
async function evaluate(expression){const result=await command('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});assert(!result.exceptionDetails,JSON.stringify(result.exceptionDetails));return result.result.value}
try{
 const state=await evaluate(`(async()=>{await QuietShelfAccount.refresh();const response=await fetch('/api/account/status'),value=await response.json();return {mode:value.mode,configured:value.configured,core:!!QuietShelfSync,account:!!QuietShelfAccount,privateFile:(await fetch('/pc/google-client.generated.json')).status}})()`);
 assert.equal(state.mode,'web');assert.equal(state.configured,true);assert.equal(state.core,true);assert.equal(state.account,true);assert.equal(state.privateFile,404);
 await checkUpdatePolicyUI({evaluate,prefix:'browser-update-policy',capture:async name=>{const size=await evaluate(`({width:innerWidth,height:Math.min(document.documentElement.scrollHeight,2000)})`),shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,...size,scale:1}});await writeFile('work/windows/'+name+'.png',Buffer.from(shot.data,'base64'))}});
 await checkThemeUI({evaluate,prefix:'browser-theme',capture:async name=>{const size=await evaluate(`({width:innerWidth,height:Math.min(document.documentElement.scrollHeight,2000)})`),shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,...size,scale:1}});await writeFile('work/windows/'+name+'.png',Buffer.from(shot.data,'base64'))}});
 await checkFirstSyncUI({evaluate,prefix:'browser-first-sync',capture:async name=>{const size=await evaluate(`({width:innerWidth,height:Math.min(document.documentElement.scrollHeight,2000)})`),shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,...size,scale:1}});await writeFile('work/windows/'+name+'.png',Buffer.from(shot.data,'base64'))}});
 await command('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
 const narrow=await evaluate(`(async()=>{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));document.querySelector('#syncIndicator').click();const chip=document.querySelector('#syncIndicator').getBoundingClientRect(),popup=document.querySelector('#syncPopover').getBoundingClientRect();return {overflow:document.documentElement.scrollWidth>innerWidth,chip:chip.left>=0&&chip.right<=innerWidth,popup:popup.left>=0&&popup.right<=innerWidth&&popup.top>=0&&popup.bottom<=innerHeight}})()`);
 assert.equal(narrow.overflow,false);assert.equal(narrow.chip,true);assert.equal(narrow.popup,true);
 const narrowShot=await command('Page.captureScreenshot',{format:'png'});await writeFile('work/windows/browser-sync-status-narrow.png',Buffer.from(narrowShot.data,'base64'));
 console.log('PASS: configured browser ZIP, real HTTP account route, private configuration isolation, browser/Windows feature parity and narrow-screen sync status');
}finally{socket.close();for(const entry of pending.values())clearTimeout(entry.timer)}

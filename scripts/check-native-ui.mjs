// Runs only against the Windows CI app launched with a loopback DevTools port.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';

const pages=await (await fetch('http://127.0.0.1:9222/json/list',{signal:AbortSignal.timeout(10000)})).json();
const page=pages.find(p=>p.type==='page'&&p.url.startsWith('quiet-shelf://app/'));
assert(page?.webSocketDebuggerUrl,'The native app page is missing');
const socket=new WebSocket(page.webSocketDebuggerUrl),pending=new Map();let nextId=0;
await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
socket.addEventListener('message',event=>{const message=JSON.parse(event.data),entry=pending.get(message.id);if(entry){pending.delete(message.id);clearTimeout(entry.timer);if(message.error)entry.reject(Error(message.error.message));else entry.resolve(message.result)}});
function command(method,params={}){return new Promise((resolve,reject)=>{const id=++nextId,timer=setTimeout(()=>{pending.delete(id);reject(Error('Native UI check timed out: '+method))},20000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}))})}
async function evaluate(expression){const result=await command('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});assert(!result.exceptionDetails,JSON.stringify(result.exceptionDetails));return result.result.value}
try{
 const bridge=await evaluate(`(async()=>{const status=await fetch('/api/update-status');const state=await status.json();const action=await fetch('/api/update-action?action=check',{method:'POST',headers:{'X-Quiet-Shelf-Update':'1'}});return {status:status.status,action:action.status,enabled:state.enabled,visible:!document.querySelector('#desktopUpdates').hidden}})()`);
 assert.equal(bridge.status,200);assert.equal(bridge.action,202);assert.equal(bridge.enabled,true);assert.equal(bridge.visible,true);
 await evaluate(`(async()=>{while(updatePolling)await new Promise(resolve=>setTimeout(resolve,25));clearTimeout(updatePollTimer);updatePolling=true;return true})()`);
 for(const theme of ['ink','sage']){
  const view=await evaluate(`(async()=>{clearTimeout(updatePollTimer);document.querySelector('#theme').value=${JSON.stringify(theme)};document.querySelector('#theme').dispatchEvent(new Event('change',{bubbles:true}));renderUpdateStatus({phase:'downloading',version:'0.12.0',progress:.42,downloaded:44040192,total:104857600,visible:true},true);const card=document.querySelector('#updateCard'),before=card.getBoundingClientRect();const spacer=document.createElement('div');spacer.style.height='1400px';document.body.append(spacer);window.scrollTo(0,document.body.scrollHeight);const stable=Math.abs(card.getBoundingClientRect().y-before.y)<1;window.scrollTo(0,0);spacer.remove();await new Promise(resolve=>setTimeout(resolve,250));const r=card.getBoundingClientRect();return {stable,hidden:document.querySelector('#updateCard').hidden,text:document.querySelector('#updatePercent').textContent,clip:{x:Math.max(0,r.x-8),y:Math.max(0,r.y-8),width:r.width+16,height:r.height+16,scale:1}}})()`);
  assert.equal(view.stable,true);assert.equal(view.hidden,false);assert.equal(view.text,'42%');
  const screenshot=await command('Page.captureScreenshot',{format:'png',clip:view.clip});
  await writeFile(`work/windows/update-preview-${theme}.png`,Buffer.from(screenshot.data,'base64'));
 }
 console.log('PASS: actual native update status/action bridge, visible download card and Dark Ink/Paper Grove screenshots');
}finally{socket.close();for(const entry of pending.values())clearTimeout(entry.timer)}

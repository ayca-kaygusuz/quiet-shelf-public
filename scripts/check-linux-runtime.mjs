// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdirSync,mkdtempSync,writeFileSync,openSync,closeSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {once} from 'node:events';
const output=resolve('work/linux'),qa=process.env.QUIET_SHELF_LINUX_QA?resolve(process.env.QUIET_SHELF_LINUX_QA):mkdtempSync(resolve('work/linux/qa-')),port=9231;
for(const name of ['config','cache','data','runtime'])mkdirSync(join(qa,name),{recursive:true,mode:0o700});
const env={...process.env,XDG_CONFIG_HOME:join(qa,'config'),XDG_CACHE_HOME:join(qa,'cache'),XDG_DATA_HOME:join(qa,'data'),XDG_RUNTIME_DIR:join(qa,'runtime'),XDG_CURRENT_DESKTOP:'GNOME',QUIET_SHELF_DEVTOOLS_URL:'http://127.0.0.1:'+port,QUIET_SHELF_UI_OUTPUT:join(output,'previews')};
const localHeadless=process.env.QUIET_SHELF_LINUX_HEADLESS_QA==='1',flags=['--disable-gpu','--remote-debugging-port='+port,...(localHeadless?['--headless','--ozone-platform=headless','--no-sandbox']:[])];
const binary=process.env.QUIET_SHELF_LINUX_BINARY||'/opt/Quiet Shelf/quiet-shelf';
if(!localHeadless){
 const result=execFileSync('gnome-keyring-daemon',['--unlock','--components=secrets'],{env,input:randomBytes(32).toString('hex'),encoding:'utf8',timeout:15000});
 for(const line of result.split('\n'))if(line.startsWith('GNOME_KEYRING_CONTROL='))env.GNOME_KEYRING_CONTROL=line.slice('GNOME_KEYRING_CONTROL='.length);
 const runtime=join(resolve(process.env.QUIET_SHELF_ELECTRON_DIST),'electron');env.QUIET_SHELF_KEYRING_PROBE=join(qa,'keyring-probe.bin');
 for(const mode of ['write','read'])execFileSync(runtime,['--disable-gpu','--password-store=gnome-libsecret',resolve('scripts/check-linux-keyring.cjs')],{env:{...env,QUIET_SHELF_KEYRING_MODE:mode},stdio:'inherit',timeout:20000});
}
let child,ws,pending=new Map(),id=0;
async function command(method,params={}){return new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>{pending.delete(n);reject(Error('Linux runtime command timed out.'))},20000);pending.set(n,{resolve,reject,timer});ws.send(JSON.stringify({id:n,method,params}))})}
async function evaluate(expression){const r=await command('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});assert(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value}
async function start(){
 const log=openSync(join(output,'linux-runtime.log'),'a');child=spawn(binary,flags,{env,stdio:['ignore',log,log]});closeSync(log);
 let pages;for(let i=0;i<150;i++){if(child.exitCode!==null)throw Error('The Linux app exited at startup. See linux-runtime.log.');try{pages=await(await fetch(env.QUIET_SHELF_DEVTOOLS_URL+'/json/list',{signal:AbortSignal.timeout(1000)})).json();if(pages.some(p=>p.url==='quiet-shelf://app/'))break}catch{}await new Promise(r=>setTimeout(r,100))}
 const page=pages?.find(p=>p.url==='quiet-shelf://app/');assert(page?.webSocketDebuggerUrl,'The Linux native window did not load.');ws=new WebSocket(page.webSocketDebuggerUrl);await once(ws,'open');ws.addEventListener('message',e=>{const m=JSON.parse(e.data),p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error.message)):p.resolve(m.result)}});
 for(let i=0;i<150;i++){try{if(await evaluate('!!globalThis.QuietShelfApp&&!!globalThis.QuietShelfAccount'))return}catch(error){if(!/context was destroyed|Cannot find context/i.test(error.message))throw error}await new Promise(r=>setTimeout(r,100))}throw Error('The Linux interface did not finish loading.');
}
async function stop(){if(ws){try{await evaluate('setTimeout(()=>window.close(),10);true')}catch{}ws.close();ws=null}if(child&&child.exitCode===null){await Promise.race([once(child,'exit'),new Promise(r=>setTimeout(r,5000))]);if(child.exitCode===null)child.kill('SIGTERM')}}
try{
 await start();
 const state=await evaluate(`(async()=>({account:await(await fetch('/api/account/status')).json(),updates:await(await fetch('/api/update-status')).json(),node:typeof require,overflow:document.documentElement.scrollWidth>innerWidth}))()`);
 assert.equal(state.account.platform,'linux');assert.equal(state.updates.platform,'linux');assert.equal(state.updates.installMode,'manual');assert.equal(state.updates.enabled,true);assert.equal(state.node,'undefined');assert.equal(state.overflow,false);
 if(!localHeadless)assert.equal(state.account.rememberSupported,true);
 execFileSync(process.execPath,['scripts/check-native-ui.mjs'],{env,stdio:'inherit',timeout:240000});
 // Shared first-sync tests use a simulated account. Reconnect the UI to the
 // actual signed-out adapter before checking this profile's guest persistence.
 await evaluate('(async()=>{await QuietShelfAccount.refresh();return true})()');
 const persisted=await evaluate(`(()=>{QuietShelfApp.apply({library:[],preferences:{theme:'sage',autoUpdateChecks:false}});document.querySelector('#add').click();document.querySelector('#title').value='Linux runtime title';document.querySelector('#author').value='Runtime fixture';document.querySelector('#addForm').requestSubmit();setStatus('In progress');setStatus('Done');setStatus('In progress');setStatus('Done');document.querySelector('#plainList').click();const copy=QuietShelfApp.backup();QuietShelfApp.apply(QuietShelfApp.readBackup(copy));renderUpdateStatus({phase:'ready',version:'0.99.0',installMode:'manual',platform:'linux',enabled:true,visible:true});return {snapshot:QuietShelfApp.snapshot(),manual:document.querySelector('#updateAction').textContent==='Show downloaded package'&&!document.querySelector('#updateDetail').textContent.includes('Restart')}})()`);
 assert.equal(persisted.manual,true);assert.equal(persisted.snapshot.library[0].history.length,2);assert(persisted.snapshot.library[0].history.every(h=>h.startDate&&h.date));
 await stop();await start();const restored=await evaluate('QuietShelfApp.snapshot()');assert.deepEqual(restored,persisted.snapshot,'Linux restart must preserve library, dates and preferences.');
 await evaluate(`(()=>{document.querySelector('#accountButton').click();document.querySelector('#aboutQuietShelf').scrollIntoView({block:'start'});return true})()`);const screenshot=await command('Page.captureScreenshot',{format:'png'});writeFileSync(join(output,'previews','linux-about.png'),Buffer.from(screenshot.data,'base64'));
 console.log('PASS: Linux packaged native startup, sandboxed renderer settings, account/update adapters, manual package UX, shared UI, add/history/rereads, backup round trip and restart persistence.');
}finally{await stop();for(const p of pending.values())clearTimeout(p.timer)}

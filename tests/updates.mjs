import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm,readdir} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {EventEmitter} from 'node:events';
import {latestUpdate,newerVersion,downloadUpdate,createUpdateController} from '../desktop/updates.mjs';
import {APP_ORIGIN,createAppHandler} from '../desktop/app-protocol.mjs';

await mkdir('work',{recursive:true});const root=await mkdtemp(join('work','update-test-'));
const bytes=Buffer.from('MZ synthetic installer for tests'),sha=createHash('sha256').update(bytes).digest('hex');
const url='https://github.com/ayca-kaygusuz/quiet-shelf-public/releases/download/v0.11.0/';
const filename='Quiet-Shelf-Setup-0.11.0-x64.exe';
const release={tag_name:'v0.11.0',draft:false,prerelease:false,assets:[{name:filename,size:bytes.length,digest:'sha256:'+sha,browser_download_url:url+filename},{name:'SHA256SUMS.txt',browser_download_url:url+'SHA256SUMS.txt'}]};
let calls=[],badBytes=false,badRedirect=false;
async function fetcher(value,options){
 calls.push({url:value,options});assert.equal(options.redirect,'manual');const headers=new Headers(options.headers);
 for(const name of ['Authorization','Cookie','X-Google-Api-Key','X-Goog-Api-Key'])assert.equal(headers.get(name),null);
 if(value.startsWith('https://api.github.com/'))return Response.json(release);
 if(value.endsWith('SHA256SUMS.txt'))return new Response(sha+'  '+filename+'\r\n');
 if(badRedirect)return new Response('',{status:302,headers:{Location:'https://evil.com/installer.exe'}});
 return new Response(badBytes?Buffer.from('MZ damaged installer'):bytes);
}
try{
 assert(newerVersion('v0.11.0','0.10.9'));assert(newerVersion('0.10.11','0.10.9'));
 for(const [a,b] of [['0.10.1','0.10.1'],['0.9.9','0.10.0'],['v0.12.0-beta.1','0.11.0'],['../0.11.0','0.10.0']])assert.equal(newerVersion(a,b),false);
 let update=await latestUpdate('0.10.1',{fetcher});assert.equal(update.sha256,sha);assert.equal(update.version,'0.11.0');
 assert.equal(await latestUpdate('0.11.0',{fetcher}),null);
 for(const mutation of [{prerelease:true},{draft:true},{tag_name:'v0.12.0-beta.1'}])assert.equal(await latestUpdate('0.10.1',{fetcher:async()=>Response.json({...release,...mutation})}),null);
 for(const assets of [[],release.assets.map(a=>({...a,browser_download_url:'https://evil.com/'+a.name})),release.assets.map(a=>({...a,digest:a.digest?'sha256:'+'0'.repeat(64):undefined}))])await assert.rejects(()=>latestUpdate('0.10.1',{fetcher:async(u,o)=>u.startsWith('https://api.github.com/')?Response.json({...release,assets}):fetcher(u,o)}));

 let progress=[],path=await downloadUpdate(update,join(root,'cache'),{fetcher,onProgress:n=>progress.push(n)});
 assert.deepEqual(await readFile(path),bytes);assert.equal(progress.at(-1),1);
 const count=calls.length;assert.equal(await downloadUpdate(update,join(root,'cache'),{fetcher}),path);assert.equal(calls.length,count,'verified cached installer is reused');
 await writeFile(path,'Tampered cached file');badBytes=true;
 await assert.rejects(()=>downloadUpdate(update,join(root,'cache'),{fetcher}));
 assert(!(await readdir(join(root,'cache','0.11.0'))).some(name=>name.endsWith('.partial')));
 badBytes=false;await downloadUpdate(update,join(root,'cache'),{fetcher});assert.deepEqual(await readFile(path),bytes);
 badRedirect=true;await assert.rejects(()=>downloadUpdate(update,join(root,'redirect'),{fetcher}),/Untrusted/);badRedirect=false;
 await assert.rejects(()=>downloadUpdate({...update,filename:'../library.json'},root,{fetcher}));
 await assert.rejects(()=>downloadUpdate({...update,version:'../private'},root,{fetcher}));
 await assert.rejects(()=>downloadUpdate({...update,size:301*1024*1024},root,{fetcher}));
 let controllerRoot=join(root,'profile');await mkdir(controllerRoot);const sentinel=join(controllerRoot,'library-and-key.txt');await writeFile(sentinel,'existing personal data');
 let prompts=[],spawned=[],quits=0,answers=[0,0],opened=[];
 const options={app:{getPath:name=>{assert.equal(name,'userData');return controllerRoot},getVersion:()=>'0.10.1',quit:()=>quits++},getWindow:()=>({setProgressBar(){}}),dialog:{showMessageBox:async(_window,options)=>{prompts.push(options);return {response:answers.shift()??1}}},shell:{openExternal:async u=>opened.push(u)},fetcher,clock:()=>2000000000000,spawnInstaller:(file,args,opts)=>{spawned.push({file,args,opts});const child=new EventEmitter();child.unref=()=>{};queueMicrotask(()=>child.emit('spawn'));return child}};
 let controller=createUpdateController(options);const first=controller.check({manual:true});assert.equal(controller.check({manual:true}),first,'overlapping requests share one update flow');await first;
 assert.equal(prompts.length,2);assert.equal(spawned.length,1);assert.equal(quits,1);assert(spawned[0].args.includes('/RESTARTAPP'));assert(spawned[0].args.some(a=>a.startsWith('/UPDATEPID=')));assert.equal(spawned[0].opts.detached,true);
 assert.equal(await readFile(sentinel,'utf8'),'existing personal data');
 const after=calls.length;await controller.check();assert.equal(calls.length,after,'automatic checks are limited to daily');
 answers=[1];await controller.check({manual:true});assert.equal(spawned.length,1,'Later never installs');
 controller.dispose();

 prompts=[];const offline=createUpdateController({...options,app:{...options.app,getPath:()=>join(root,'offline')},fetcher:async()=>{throw Error('Offline')}});
 await offline.check();assert.equal(prompts.length,0,'offline startup is quiet');await offline.check({manual:true});assert.equal(prompts.length,1);assert.equal(spawned.length,1);offline.dispose();
 prompts=[];answers=[0,1];badBytes=true;
 const damaged=createUpdateController({...options,app:{...options.app,getPath:()=>join(root,'damaged')}});await damaged.check({manual:true});assert.equal(spawned.length,1,'unverified installers never execute');assert.equal(quits,1);assert(prompts.some(p=>p.message==='The update could not be completed.'));damaged.dispose();
 // A paused stream lets the renderer read real download state before completion.
 badBytes=false;answers=[0,1];let stream,visible,downloadStarted,phases=[];
 const started=new Promise(resolve=>downloadStarted=resolve);
 visible=createUpdateController({...options,app:{...options.app,getPath:()=>join(root,'visible')},fetcher:async(u,o)=>u.endsWith('.exe')?new Response(new ReadableStream({start(controller){stream=controller;controller.enqueue(bytes.subarray(0,4))}})):fetcher(u,o),getWindow:()=>({setProgressBar(progress){phases.push(visible.getStatus().phase);if(progress>0&&progress<1)downloadStarted()}})});
 const flow=visible.check({manual:true});await started;
 const state=visible.getStatus();assert.equal(state.phase,'downloading');assert.equal(state.downloaded,4);assert.equal(state.total,bytes.length);assert.equal(state.progress,4/bytes.length);
 state.phase='tampered';assert.equal(visible.getStatus().phase,'downloading','state snapshots are read-only copies');
 const indicator=createAppHandler({html:readFileSync('src/index.html','utf8'),catalog:()=>{throw Error('Updates must not call a book source')},updates:visible});
 const statusURL=APP_ORIGIN+'/api/update-status',actionURL=APP_ORIGIN+'/api/update-action';
 let response=await indicator(new Request(statusURL));assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');
 const payload=await response.json();assert.equal(payload.downloaded,4);assert(!JSON.stringify(payload).includes(root));assert(!JSON.stringify(payload).includes('test-only-key'));
 const headers={'X-Quiet-Shelf-Update':'1',Origin:APP_ORIGIN};
 assert.equal((await indicator(new Request(actionURL+'?action=install',{method:'POST',headers}))).status,409);
 assert.equal((await indicator(new Request(actionURL+'?action=check',{method:'POST'}))).status,403);
 assert.equal((await indicator(new Request(actionURL+'?action=check',{method:'POST',headers:{...headers,Origin:'https://evil.com'}}))).status,403);
 assert.equal((await indicator(new Request(statusURL,{headers:{Origin:'https://evil.com'}}))).status,403);
 assert.equal((await indicator(new Request(actionURL+'?action=check'))).status,405);
 assert.equal((await indicator(new Request(actionURL,{method:'OPTIONS'}))).status,405);
 assert.equal((await indicator(new Request(actionURL+'?action=execute-file',{method:'POST',headers}))).status,400);
 stream.enqueue(bytes.subarray(4));stream.close();await flow;
 assert(phases.includes('verifying'));assert.equal(visible.getStatus().phase,'ready');assert.equal(spawned.length,1,'Later keeps the verified update ready without installation');
 const beforeRestart=calls.length;answers=[0];response=await indicator(new Request(actionURL+'?action=install',{method:'POST',headers}));assert.equal(response.status,202);await visible.install();
 assert.equal(spawned.length,2);assert.equal(calls.length,beforeRestart,'ready updates install without another download');assert.equal(visible.getStatus().phase,'installing');visible.dispose();
 console.log('PASS: stable GitHub versions/assets, trusted URLs/redirects, bounded verified downloads, tampered cache recovery, no unverified execution, restart consent, daily/overlapping checks, offline behavior and preserved local data');
}finally{await rm(root,{recursive:true,force:true})}

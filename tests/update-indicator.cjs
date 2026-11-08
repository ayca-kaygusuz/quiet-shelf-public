const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('src/index.html','utf8'),script=html.match(/<script>([\s\S]*)<\/script>/)[1];
function launch(protocol='quiet-shelf:'){
 const elements={},requests=[],timers=new Map(),storage={'quiet-shelf-google-key-v1':'test-only-google-key','quiet-shelf-v1':JSON.stringify([{id:'saved',title:'My book',author:'',status:'Unread',history:[]}])};
 let state={phase:'idle',visible:false},clock=100000,nextTimer=0,rejectAction=false;
 const element=s=>{if(!elements[s]){let text='';const node={value:'',innerHTML:'',textWrites:0,hidden:false,disabled:false,className:'',style:{},attrs:{},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},addEventListener(){},querySelector:()=>({disabled:false}),focus(){this.focused=true}};Object.defineProperty(node,'textContent',{get:()=>text,set:value=>{text=value;node.textWrites++}});elements[s]=node}return elements[s]};
 class AppDate extends Date{static now(){return clock}}
 const context={console,URL,Date:AppDate,AbortController,crypto:require('node:crypto').webcrypto,location:{protocol,hostname:protocol==='quiet-shelf:'?'app':'localhost'},
  setTimeout:fn=>{timers.set(++nextTimer,fn);return nextTimer},clearTimeout:id=>timers.delete(id),
  localStorage:{getItem:k=>storage[k],setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},
  document:{querySelector:element,querySelectorAll:()=>[],addEventListener(){}},
  fetch:async(url,options)=>{requests.push({url,options});if(url.startsWith('/api/update-action')){if(rejectAction)throw Error('Unavailable');if(url.endsWith('action=check'))state={phase:'checking',visible:true}}return {ok:true,json:async()=>({...state})}}
 };
 vm.createContext(context);vm.runInContext(script,context);
 return {element,requests,storage,run:s=>vm.runInContext(s,context),state(value){state=value},clock(value){clock=value},reject(value){rejectAction=value}};
}
(async()=>{
 const browser=launch('http:');assert.equal(browser.requests.length,0,'browser version never polls the native updater');
 assert.match(html,/<button id="desktopUpdates"[^>]*hidden/);assert.match(html,/<section id="updateCard"[^>]*hidden/);
 const app=launch();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(app.element('#desktopUpdates').hidden,false);assert.equal(app.element('#updateCard').hidden,true);
 const stored=JSON.stringify(app.storage);
 app.state({phase:'downloading',visible:true,version:'0.12.0',progress:0.426,downloaded:44669337,total:104857600});await app.run('pollUpdateStatus()');
 assert.equal(app.element('#updateHeading').textContent,'Downloading update');assert.equal(app.element('#updatePercent').textContent,'43%');
 assert.equal(app.element('#updateVersion').textContent,'Version 0.12.0');assert.match(app.element('#updateDetail').textContent,/42.6 MB of 100.0 MB/);
 assert.equal(app.element('#updateFill').style.width,'43%');assert.equal(app.element('#updateTrack').attrs['aria-valuenow'],'43');
 assert.equal(app.element('#updateCard').hidden,false);assert.match(app.element('#desktopUpdates').textContent,/43%/);
 const headingWrites=app.element('#updateHeading').textWrites;
 app.element('#hideUpdateCard').onclick();assert.equal(app.element('#updateCard').hidden,true);assert(app.element('#desktopUpdates').focused);
 app.state({phase:'downloading',visible:true,version:'0.12.0',progress:0.8,downloaded:83886080,total:104857600});await app.run('pollUpdateStatus()');
 assert.equal(app.element('#updateHeading').textWrites,headingWrites,'progress polling does not repeat live status announcements');
 assert.equal(app.element('#updateCard').hidden,true,'hiding the card keeps its chip active');assert.match(app.element('#desktopUpdates').textContent,/80%/);
 app.element('#desktopUpdates').onclick();await app.run('pollUpdateStatus()');assert.equal(app.element('#updateCard').hidden,false);
 app.state({phase:'verifying',visible:true,version:'0.12.0',progress:1});await app.run('pollUpdateStatus()');
 assert.match(app.element('#updateHeading').textContent,/Verifying/);assert.match(app.element('#updateTrack').className,/indeterminate/);assert.equal(app.element('#updateTrack').attrs['aria-valuenow'],undefined);
 app.state({phase:'ready',visible:true,version:'0.12.0',progress:1});await app.run('pollUpdateStatus()');
 assert.equal(app.element('#updateAction').textContent,'Restart and update');assert.equal(app.element('#desktopUpdates').textContent,'Update ready');
 await app.element('#updateAction').onclick();assert(app.requests.some(r=>r.url==='/api/update-action?action=install'&&r.options.method==='POST'&&r.options.headers['X-Quiet-Shelf-Update']==='1'));
 app.state({phase:'error',visible:true});await app.run('pollUpdateStatus()');assert.equal(app.element('#updateAction').textContent,'Try again');
 app.reject(true);await app.element('#updateAction').onclick();app.state({phase:'idle',visible:false});await app.run('pollUpdateStatus()');assert.equal(app.element('#updateCard').hidden,false,'a failed action stays visible until retry');
 app.reject(false);await app.element('#updateAction').onclick();assert.match(app.element('#updateHeading').textContent,/Checking/);
 app.state({phase:'up-to-date',visible:true});await app.run('pollUpdateStatus()');assert.equal(app.element('#updateCard').hidden,false);
 app.clock(106001);await app.run('pollUpdateStatus()');assert.equal(app.element('#updateCard').hidden,true,'a successful check clears its transient card');
 app.state({phase:'checking',visible:false});await app.run('pollUpdateStatus()');assert.equal(app.element('#updateCard').hidden,true);
 app.element('#desktopUpdates').onclick();await app.run('pollUpdateStatus()');assert.equal(app.element('#updateCard').hidden,false,'opening a silent check stays open across polls');
 assert.equal(JSON.stringify(app.storage),stored,'update display never changes book or key storage');
 assert(!JSON.stringify(app.requests).includes('test-only-google-key'));
 app.state({phase:'idle',visible:false,enabled:false});await app.run('pollUpdateStatus()');assert.equal(app.element('#desktopUpdates').hidden,true);const count=app.requests.length;await app.run('pollUpdateStatus()');assert.equal(app.requests.length,count);
 console.log('PASS: in-app percentage/bytes, verification and ready states, dismiss/reopen, update actions, transient success/error recovery, accessible progress values, native-only polling and unchanged library/key storage');
})().catch(error=>{console.error(error);process.exitCode=1});

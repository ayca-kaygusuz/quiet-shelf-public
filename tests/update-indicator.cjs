const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('src/index.html','utf8'),script=html.match(/<script>([\s\S]*)<\/script>/)[1];
function launch(protocol='quiet-shelf:',saved={},hosted=false){
 const elements={},requests=[],timers=new Map(),storage={'quiet-shelf-google-key-v1':'test-only-google-key','quiet-shelf-v1':JSON.stringify([{id:'saved',title:'My book',author:'',status:'Unread',history:[]}]),...saved};
 let state={phase:'idle',visible:false},clock=100000,nextTimer=0,rejectAction=false;
 const element=s=>{if(!elements[s]){let text='';const node={value:'',innerHTML:'',textWrites:0,hidden:false,disabled:false,className:'',style:{},attrs:{},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},addEventListener(){},querySelector:()=>({disabled:false}),focus(){this.focused=true}};Object.defineProperty(node,'textContent',{get:()=>text,set:value=>{text=value;node.textWrites++}});elements[s]=node}return elements[s]};
 class AppDate extends Date{static now(){return clock}}
 const context={console,URL,Date:AppDate,AbortController,crypto:require('node:crypto').webcrypto,location:{protocol,hostname:protocol==='quiet-shelf:'?'app':'localhost'},navigator:{onLine:true,connection:{saveData:false}},QuietShelfHostedBuild:hosted?{source:'a'.repeat(40),version:'0.21.0'}:undefined,
  setTimeout:fn=>{timers.set(++nextTimer,fn);return nextTimer},clearTimeout:id=>timers.delete(id),
  localStorage:{getItem:k=>storage[k],setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},
  document:{querySelector:element,querySelectorAll:()=>[],addEventListener(){}},
  fetch:async(url,options)=>{requests.push({url,options});if(url.split('?')[0]==='/api/update-check'){if(rejectAction)throw Error('Unavailable');return {ok:true,json:async()=>({phase:'available',version:'0.99.0',checkedAt:clock})}}if(url.startsWith('/api/update-action')){if(rejectAction)throw Error('Unavailable');if(url.endsWith('action=check'))state={phase:'checking',visible:true}}return {ok:true,json:async()=>({...state})}}
 };
 vm.createContext(context);vm.runInContext(script,context);
 return {element,requests,storage,run:s=>vm.runInContext(s,context),state(value){state=value},clock(value){clock=value},reject(value){rejectAction=value}};
}
(async()=>{
 const hosted=launch('https:',{},true);assert.match(hosted.element('#accountUpdateSummary').textContent,/Refreshing loads/);assert.equal(hosted.element('#accountWindowsDownload').hidden,true);assert.match(hosted.element('#updateInlineStatus').textContent,/latest deployed web version/);await hosted.element('#checkUpdates').onclick();assert(hosted.requests.some(r=>r.url==='/api/update-check?source='+'a'.repeat(40)));assert.match(hosted.element('#updateInlineStatus').textContent,/Refresh to load/);assert.equal(hosted.element('#browserUpdateDownload').textContent,'Refresh app');assert.equal(hosted.element('#browserUpdateDownload').href,'/');assert.equal(hosted.element('#updateCard').hidden,true);hosted.element('#autoUpdateChecks').checked=false;hosted.element('#autoUpdateChecks').onchange();assert.match(hosted.element('#updateCheckPolicy').textContent,/checks are off/);
 const browser=launch('http:');assert.equal(browser.requests.length,0,'browser version never polls the native updater');
 assert.match(html,/<button id="desktopUpdates"[^>]*hidden/);assert.match(html,/<section id="updateCard"[^>]*hidden/);
 browser.element('#autoUpdateChecks').checked=false;browser.element('#autoUpdateChecks').onchange();assert.equal(browser.run('QuietShelfApp.backup().preferences.autoUpdateChecks'),false);assert.match(browser.element('#updateCheckPolicy').textContent,/checks are off/);assert.equal(browser.requests.length,0);
 await browser.element('#checkUpdates').onclick();assert.equal(browser.element('#updateInlineStatus').textContent,'Quiet Shelf 0.99.0 is available.');assert.equal(browser.element('#browserUpdateDownload').hidden,false);assert.equal(browser.element('#updateCard').hidden,true);assert.equal(browser.run('QuietShelfApp.backup().preferences.autoUpdateChecks'),false,'manual checks do not turn automatic checks back on');
 const restored=launch('http:',browser.storage);assert.equal(restored.run('uiPreferences.autoUpdateChecks'),false);restored.run('QuietShelfApp.apply({library:books,preferences:{autoUpdateChecks:true}})');assert.equal(restored.element('#autoUpdateChecks').checked,true);restored.run('QuietShelfApp.apply({library:books,preferences:{}})');assert.equal(restored.run('uiPreferences.autoUpdateChecks'),true,'legacy backups default automatic checks on');
 browser.element('#autoUpdateChecks').checked=true;browser.element('#autoUpdateChecks').onchange();await new Promise(resolve=>setImmediate(resolve));browser.run('navigator.onLine=false;renderUpdateInline()');assert.match(browser.element('#updateCheckPolicy').textContent,/paused while offline/);const before=browser.requests.length;await browser.element('#checkUpdates').onclick();assert.equal(browser.requests.length,before);
 browser.run('navigator.onLine=true;navigator.connection.saveData=true;renderUpdateInline()');assert.match(browser.element('#updateCheckPolicy').textContent,/metered connection/);await browser.element('#checkUpdates').onclick();assert(browser.requests.length>before,'explicit checks work on metered connections');const successful=browser.run('desktopUpdateState.lastChecked');browser.reject(true);await browser.element('#checkUpdates').onclick();assert.equal(browser.run('desktopUpdateState.lastChecked'),successful);assert.match(browser.element('#updateInlineStatus').textContent,/could not be completed/);
 const app=launch();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(app.element('#checkUpdates').hidden,false);assert.equal(app.element('#desktopUpdates').hidden,true);assert.equal(app.element('#updateCard').hidden,true);
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
 assert.equal(app.element('#updateAction').textContent,'Restart and update');assert.equal(app.element('#desktopUpdates').textContent,'Restart and update');
 await app.element('#updateAction').onclick();assert(app.requests.some(r=>r.url==='/api/update-action?action=install'&&r.options.method==='POST'&&r.options.headers['X-Quiet-Shelf-Update']==='1'));
 app.state({phase:'error',visible:true});await app.run('pollUpdateStatus()');assert.equal(app.element('#updateAction').textContent,'Check for updates');
 app.reject(true);await app.element('#updateAction').onclick();app.state({phase:'idle',visible:false});await app.run('pollUpdateStatus()');assert.equal(app.element('#updateCard').hidden,true,'failed metadata checks stay inline');assert.match(app.element('#updateInlineStatus').textContent,/could not be completed/);
 app.reject(false);await app.element('#updateAction').onclick();assert.match(app.element('#updateHeading').textContent,/Checking/);
 app.state({phase:'up-to-date',visible:true});await app.run('pollUpdateStatus()');assert.equal(app.element('#updateCard').hidden,false);
 app.clock(106001);await app.run('pollUpdateStatus()');assert.equal(app.element('#updateCard').hidden,true,'a successful check clears its transient card');
 app.state({phase:'checking',visible:false});await app.run('pollUpdateStatus()');assert.equal(app.element('#updateCard').hidden,true);
 assert.equal(app.element('#updateCard').hidden,true,'background checks never open a card');assert.match(app.element('#updateInlineStatus').textContent,/Checking/);
 assert.equal(JSON.stringify(app.storage),stored,'update display never changes book or key storage');
 assert(!JSON.stringify(app.requests).includes('test-only-google-key'));
 app.state({phase:'idle',visible:false,enabled:false});await app.run('pollUpdateStatus()');assert.equal(app.element('#desktopUpdates').hidden,true);const count=app.requests.length;await app.run('pollUpdateStatus()');assert.equal(app.requests.length,count);
 console.log('PASS: quiet update availability/pause reasons, saved/imported preference, manual checks while disabled/metered, browser updates, last-success timestamps, in-app percentage/bytes, verification and ready states, dismiss/reopen, update actions, transient success/error recovery, accessible progress values, native-only polling and unchanged library/key storage');
})().catch(error=>{console.error(error);process.exitCode=1});

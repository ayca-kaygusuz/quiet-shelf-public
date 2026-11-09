const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('src/index.html','utf8'),inline=html.match(/<script>([\s\S]*)<\/script>/)[1],core=fs.readFileSync('src/sync-core.js','utf8'),accountSource=fs.readFileSync('src/account.js','utf8');
const book=(id,title)=>({id,title,author:'',status:'Unread',history:[]});
function launch(storage={},protocol='quiet-shelf:'){
 const elements={},timers=new Map(),intervals=new Map(),requests=[],events={};let nextTimer=0,user=null,metered=false,deferredSync=null,failSync=false,failStorage=false;
 const element=s=>elements[s]??={value:'',innerHTML:'',textContent:'',checked:false,hidden:s==='#accountPage',disabled:false,style:{},attrs:{},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},addEventListener(){},focus(){},querySelector:()=>({disabled:false}),setCustomValidity(){}};
 const ctx={console,URL,AbortController,Date,Blob,crypto:require('node:crypto').webcrypto,confirm:()=>true,location:{protocol,hostname:'app',href:protocol==='quiet-shelf:'?'quiet-shelf://app/':'http://localhost/',pathname:'/'},navigator:{onLine:true},history:{replaceState(){}},
  setTimeout:fn=>{timers.set(++nextTimer,fn);return nextTimer},clearTimeout:id=>timers.delete(id),setInterval:fn=>{intervals.set(++nextTimer,fn);return nextTimer},clearInterval:id=>intervals.delete(id),
  localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>{if(typeof failStorage==='function'?failStorage(k):failStorage)throw Error('Storage full');storage[k]=v},removeItem:k=>delete storage[k]},addEventListener:(name,fn)=>events[name]=fn,
  document:{hidden:false,activeElement:null,documentElement:{setAttribute(){}},querySelector:element,querySelectorAll:()=>[],addEventListener:(name,fn)=>events['document:'+name]=fn},
  fetch:async(url,options={})=>{requests.push({url,options});if(url==='/api/update-status')return Response.json({phase:'idle',enabled:false});
   if(url==='/api/account/status')return Response.json({mode:protocol==='quiet-shelf:'?'desktop':'local',configured:protocol==='quiet-shelf:',account:user,network:{metered,source:'Windows'}});
   if(url==='/api/account/signout'){user=null;return Response.json({configured:true,account:null,mode:'desktop'})}
   if(url==='/api/account/start')return Response.json({configured:true,pending:true,mode:'desktop'});
   if(url==='/api/account/sync'){if(failSync)throw Error('Drive unavailable');const body=JSON.parse(options.body),identity=user;assert.equal(body.accountId,identity.id);const S=ctx.QuietShelfSync;let state=S.merge(remote.get(identity.id)||S.empty(),body.readOnly?S.empty():body.state);if(!body.readOnly)remote.set(identity.id,state);else assert.equal(body.state.registers.length,0);if(deferredSync)await deferredSync.promise;return Response.json({account:identity,state,hasRemote:state.registers.length>0})}
   throw Error('Unexpected request: '+url)
  }
 };
 const remote=new Map();vm.createContext(ctx);vm.runInContext(core,ctx);vm.runInContext(inline,ctx);vm.runInContext(accountSource,ctx);
 return {ctx,element,storage,requests,remote,timers,events,failSync(value){failSync=value},failStorage(value){failStorage=value},run:code=>vm.runInContext(code,ctx),user(value){user=value},metered(value){metered=value},defer(){let release;const promise=new Promise(resolve=>release=resolve);deferredSync={promise,release};return ()=>{release();deferredSync=null}},dispose(){ctx.QuietShelfAccount.dispose()}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 const storage={'quiet-shelf-v1':JSON.stringify([book('local','Local title'),{...book('sample','Sample title'),sample:true}]),'quiet-shelf-google-key-v1':'PRIVATE-BOOKS-KEY'};
 const a=launch(storage);await settle();
 assert.equal(a.run('books.length'),2);assert.equal(a.element('#googleDesktopSetup').hidden,true);
 a.element('#accountButton').onclick();assert.equal(a.element('#accountPage').hidden,false);assert.equal(a.element('#libraryPage').hidden,true);
 assert.equal(a.run('QuietShelfApp.backup().format'),'quiet-shelf-backup');assert(!JSON.stringify(a.run('QuietShelfApp.backup()')).includes('PRIVATE'));
 assert.equal(a.run('QuietShelfApp.readBackup(books).library.length'),2);
 a.user({id:'101',email:'one@example.invalid',name:'One'});await a.ctx.QuietShelfAccount.refresh();assert.equal(a.run('books.length'),2,'sign-in keeps the current shelf visible');
 assert.equal(a.ctx.QuietShelfAccount.status().setupPending,true);
 await a.ctx.QuietShelfAccount.sync(true);assert.equal(a.remote.has('101'),false,'checking Drive creates no remote file and uploads no local data');
 assert.equal(a.element('#setupLocalCount').textContent,'1');assert.equal(a.element('#setupDriveCount').textContent,'0');assert.equal(a.run('books[0].title'),'Local title');
 a.run("books.push({id:'while-checking',title:'Added during setup',status:'Unread',history:[]});save()");
 await a.element('#startSyncLibrary').onclick();assert.equal(a.ctx.QuietShelfAccount.status().setupPending,false);assert.equal(a.run('books.length'),2,'sample excluded; committed edits during setup are kept');assert.equal(a.ctx.QuietShelfSync.project(a.remote.get('101')).library.length,2);
 assert.equal(a.element('#recoverySection').hidden,false);const recoveries=JSON.parse(storage['quiet-shelf-connection-recovery-v1']);assert.equal(recoveries[0].copies[0].document.library.length,3);assert(!JSON.stringify(recoveries).includes('PRIVATE'));
 let downloaded;a.ctx.QuietShelfApp.downloadBackup=value=>downloaded=value;a.element('#downloadRecovery').onclick();assert.equal(downloaded.library[0].title,'Local title');
 a.run("selected='local';setStatus('In progress');uiPreferences.theme='sage';rememberPreferences()");await a.ctx.QuietShelfAccount.sync(true);assert.equal(a.ctx.QuietShelfSync.project(a.remote.get('101')).preferences.theme,'sage');
 assert(!JSON.stringify(a.requests).includes('PRIVATE-BOOKS-KEY'));
 a.element('#addDialog').open=true;const draftCount=a.requests.length;await a.ctx.QuietShelfAccount.sync(true);assert.equal(a.requests.length,draftCount);a.element('#addDialog').open=false;
 a.metered(true);await a.ctx.QuietShelfAccount.refresh();const count=a.requests.filter(r=>r.url.endsWith('/sync')).length;await a.ctx.QuietShelfAccount.sync(false);assert.equal(a.requests.filter(r=>r.url.endsWith('/sync')).length,count);await a.ctx.QuietShelfAccount.sync(true);assert.equal(a.requests.filter(r=>r.url.endsWith('/sync')).length,count+1);
 a.metered(false);await a.ctx.QuietShelfAccount.refresh();const release=a.defer(),sync=a.ctx.QuietShelfAccount.sync(true);await settle();a.run("selected='local';setStatus('Done')");release();await sync;assert.equal(a.run('books.find(b=>b.id===\"local\").status'),'Done');assert.equal(a.ctx.QuietShelfAccount.status().dirty,true);await a.ctx.QuietShelfAccount.sync(true);
 // Another account is previewed without replacing the currently visible shelf.
 a.user({id:'202',email:'two@example.invalid',name:'Two'});a.remote.set('202',a.ctx.QuietShelfSync.update(a.ctx.QuietShelfSync.empty(),{library:[book('other','Other account')],preferences:{theme:'ink'}},'other'));
 await a.ctx.QuietShelfAccount.refresh();await a.ctx.QuietShelfAccount.sync(true);assert.equal(a.run('books.length'),2);assert.equal(a.element('#setupDriveCount').textContent,'1');
 await a.element('#useDriveLibrary').onclick();assert.equal(a.run('books[0].title'),'Other account');assert.equal(a.run('books.length'),1);
 await a.element('#googleSignOut').onclick();assert.equal(a.run('books[0].title'),'Local title');assert(!storage['quiet-shelf-active-account-v1']);
 // Previously approved accounts reopen quietly, with no repeated choice.
 a.user({id:'101',email:'one@example.invalid',name:'One'});await a.ctx.QuietShelfAccount.refresh();assert.equal(a.ctx.QuietShelfAccount.status().setupPending,false);assert.equal(a.run('books.find(b=>b.id===\"local\").status'),'Done');a.dispose();
 // Upgrade recovery: the old app's empty account must not hide the guest shelf.
 const legacy={'quiet-shelf-v1':'[]','quiet-shelf-guest-v1':JSON.stringify({library:[book('kept','Preserved local shelf')],preferences:{theme:'sage'}}),'quiet-shelf-active-account-v1':JSON.stringify({id:'303',email:'three@example.invalid'}),'quiet-shelf-account-303-v1':JSON.stringify({version:1,state:a.ctx.QuietShelfSync.empty(),firstPull:true})};
 const recovered=launch(legacy);assert.equal(recovered.run('books[0].title'),'Preserved local shelf');await settle();recovered.user({id:'303',email:'three@example.invalid'});await recovered.ctx.QuietShelfAccount.refresh();recovered.failSync(true);await recovered.ctx.QuietShelfAccount.sync(true);assert.equal(recovered.run('books[0].title'),'Preserved local shelf');assert.match(recovered.element('#syncStatus').textContent,/Waiting to connect/);recovered.failSync(false);await recovered.ctx.QuietShelfAccount.sync(true);
 recovered.failStorage(key=>key==='quiet-shelf-connection-recovery-v1');await recovered.element('#startSyncLibrary').onclick();assert.equal(recovered.ctx.QuietShelfAccount.status().setupPending,true);assert.equal(recovered.run('books[0].title'),'Preserved local shelf');recovered.failStorage(false);recovered.dispose();
 // A changed Drive preview requires reviewing the new counts before switching.
 const changing=launch({'quiet-shelf-v1':JSON.stringify([book('stay','Stay visible')])});await settle();changing.user({id:'404',email:'four@example.invalid'});await changing.ctx.QuietShelfAccount.refresh();await changing.ctx.QuietShelfAccount.sync(true);
 changing.remote.set('404',changing.ctx.QuietShelfSync.update(changing.ctx.QuietShelfSync.empty(),{library:[book('new-drive','A newly saved Drive title')],preferences:{}},'lateDrive'));
 await changing.element('#startSyncLibrary').onclick();assert.equal(changing.ctx.QuietShelfAccount.status().setupPending,true);assert.equal(changing.run('books.length'),1);assert.equal(changing.element('#setupDriveCount').textContent,'1');await changing.element('#startSyncLibrary').onclick();assert.equal(changing.run('books.length'),2);changing.dispose();
 const browser=launch({'quiet-shelf-v1':JSON.stringify([book('browser','Browser title')])},'http:');await settle();assert.equal(browser.run('books[0].title'),'Browser title');browser.dispose();
 console.log('PASS: visible local shelf during sign-in/check/failure, explicit empty/populated Drive choices, sample exclusion, recovery copies/downloads, migration from the old empty shelf, quota failure, returning accounts, preferences, metered behavior, drafts and edits during sync');
})().catch(error=>{console.error(error);process.exitCode=1});

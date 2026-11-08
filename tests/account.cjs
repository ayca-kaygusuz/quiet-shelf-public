const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('src/index.html','utf8'),inline=html.match(/<script>([\s\S]*)<\/script>/)[1],core=fs.readFileSync('src/sync-core.js','utf8'),accountSource=fs.readFileSync('src/account.js','utf8');
const book=(id,title)=>({id,title,author:'',status:'Unread',history:[]});
function launch(storage={},protocol='quiet-shelf:'){
 const elements={},timers=new Map(),intervals=new Map(),requests=[],events={};let nextTimer=0,user=null,metered=false,deferredSync=null;
 const element=s=>elements[s]??={value:'',innerHTML:'',textContent:'',checked:false,hidden:s==='#accountPage',disabled:false,style:{},attrs:{},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},addEventListener(){},focus(){},querySelector:()=>({disabled:false}),setCustomValidity(){}};
 const ctx={console,URL,AbortController,Date,Blob,crypto:require('node:crypto').webcrypto,confirm:()=>true,location:{protocol,hostname:'app',href:protocol==='quiet-shelf:'?'quiet-shelf://app/':'http://localhost/',pathname:'/'},navigator:{onLine:true},history:{replaceState(){}},
  setTimeout:fn=>{timers.set(++nextTimer,fn);return nextTimer},clearTimeout:id=>timers.delete(id),setInterval:fn=>{intervals.set(++nextTimer,fn);return nextTimer},clearInterval:id=>intervals.delete(id),
  localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},addEventListener:(name,fn)=>events[name]=fn,
  document:{hidden:false,activeElement:null,documentElement:{setAttribute(){}},querySelector:element,querySelectorAll:()=>[],addEventListener:(name,fn)=>events['document:'+name]=fn},
  fetch:async(url,options={})=>{requests.push({url,options});if(url==='/api/update-status')return Response.json({phase:'idle',enabled:false});
   if(url==='/api/account/status')return Response.json({mode:protocol==='quiet-shelf:'?'desktop':'local',configured:protocol==='quiet-shelf:',account:user,network:{metered,source:'Windows'}});
   if(url==='/api/account/signout'){user=null;return Response.json({configured:true,account:null,mode:'desktop'})}
   if(url==='/api/account/start')return Response.json({configured:true,pending:true,mode:'desktop'});
   if(url==='/api/account/sync'){const body=JSON.parse(options.body);assert.equal(body.accountId,user.id);const S=ctx.QuietShelfSync;let state=S.merge(remote.get(user.id)||S.empty(),body.state);remote.set(user.id,state);if(deferredSync)await deferredSync.promise;return Response.json({account:user,state,hasRemote:state.registers.length>0})}
   throw Error('Unexpected request: '+url)
  }
 };
 const remote=new Map();vm.createContext(ctx);vm.runInContext(core,ctx);vm.runInContext(inline,ctx);vm.runInContext(accountSource,ctx);
 return {ctx,element,storage,requests,remote,timers,run:code=>vm.runInContext(code,ctx),user(value){user=value},metered(value){metered=value},defer(){let release;const promise=new Promise(resolve=>release=resolve);deferredSync={promise,release};return ()=>{release();deferredSync=null}},dispose(){ctx.QuietShelfAccount.dispose()}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 const storage={'quiet-shelf-v1':JSON.stringify([book('local','Local title'),{...book('sample','Sample title'),sample:true}]),'quiet-shelf-google-key-v1':'PRIVATE-BOOKS-KEY'};
 const a=launch(storage);await settle();
 assert.equal(a.run('books.length'),2);assert.equal(a.element('#googleSignOut').hidden,true);assert.equal(a.element('#autoSync').checked,true);
 a.element('#accountButton').onclick();assert.equal(a.element('#accountPage').hidden,false);assert.equal(a.element('#libraryPage').hidden,true);
 assert(!html.match(/<header[^]*?<\/header>/)[0].includes('id="export"'),'maintenance actions live in Account');
 const backup=a.run('QuietShelfApp.backup()');assert.equal(backup.format,'quiet-shelf-backup');assert.equal(backup.library.length,2);assert.equal(backup.preferences.theme,'ink');assert(!JSON.stringify(backup).includes('PRIVATE'));
 assert.equal(a.run('QuietShelfApp.readBackup(books).library.length'),2,'legacy library-only backups still import');
 assert.throws(()=>a.run("QuietShelfApp.readBackup({format:'quiet-shelf-backup',version:999,library:books})"));
 a.user({id:'101',email:'one@example.invalid',name:'One'});await a.ctx.QuietShelfAccount.refresh();assert.equal(a.run('books.length'),0,'first sign-in opens its own workspace');
 assert.equal(JSON.parse(storage['quiet-shelf-guest-v1']).library[0].title,'Local title');
 await a.ctx.QuietShelfAccount.sync(true);assert.equal(a.remote.get('101').registers.length,0,'sign-in never silently uploads a guest or sample library');
 a.element('#copyLocalLibrary').onclick();assert.equal(a.run('books.length'),1);assert.equal(a.run('books[0].sample'),undefined);
 a.run("selected='local';setStatus('In progress');uiPreferences.theme='sage';rememberPreferences()");await a.ctx.QuietShelfAccount.sync(true);
 assert.equal(a.ctx.QuietShelfSync.project(a.remote.get('101')).preferences.theme,'sage');assert.equal(a.ctx.QuietShelfSync.project(a.remote.get('101')).library[0].status,'In progress');
 assert(!JSON.stringify(a.requests).includes('PRIVATE-BOOKS-KEY'));
 a.metered(true);await a.ctx.QuietShelfAccount.refresh();const count=a.requests.filter(r=>r.url.endsWith('/sync')).length;await a.ctx.QuietShelfAccount.sync(false);assert.equal(a.requests.filter(r=>r.url.endsWith('/sync')).length,count);assert.equal(a.ctx.QuietShelfAccount.status().metered,true);await a.ctx.QuietShelfAccount.sync(true);assert.equal(a.requests.filter(r=>r.url.endsWith('/sync')).length,count+1,'manual sync remains available on metered networks');
 // Local edits made while an upload is in flight survive the response.
 a.metered(false);await a.ctx.QuietShelfAccount.refresh();const release=a.defer(),sync=a.ctx.QuietShelfAccount.sync(true);await settle();a.run("selected='local';setStatus('Done')");release();await sync;assert.equal(a.run('books[0].status'),'Done');assert.equal(a.ctx.QuietShelfAccount.status().dirty,true);await a.ctx.QuietShelfAccount.sync(true);assert.equal(a.ctx.QuietShelfAccount.status().dirty,false);
 a.user({id:'202',email:'two@example.invalid',name:'Two'});a.remote.set('202',a.ctx.QuietShelfSync.update(a.ctx.QuietShelfSync.empty(),{library:[book('other','Other account')],preferences:{theme:'ink'}},'other'));
 await a.ctx.QuietShelfAccount.refresh();await a.ctx.QuietShelfAccount.sync(true);assert.equal(a.run('books[0].title'),'Other account');assert.equal(a.run('books.length'),1);
 await a.element('#googleSignOut').onclick();assert.equal(a.run('books[0].title'),'Local title');assert.equal(a.ctx.QuietShelfAccount.status().account,null);assert(!storage['quiet-shelf-active-account-v1']);
 a.dispose();
 // A remembered account whose backend session has ended must never appear as guest data.
 storage['quiet-shelf-active-account-v1']=JSON.stringify({id:'202',email:'two@example.invalid'});storage['quiet-shelf-v1']=JSON.stringify([book('other','Other account')]);
 const expired=launch(storage);expired.run("uiPreferences.theme='sage';rememberPreferences()");await settle();assert.equal(expired.run('books[0].title'),'Local title');assert.equal(expired.ctx.QuietShelfAccount.status().account,null);expired.dispose();
 const browser=launch({'quiet-shelf-v1':JSON.stringify([book('browser','Browser title')])},'http:');await settle();assert.equal(browser.run('books[0].title'),'Browser title');assert.equal(browser.element('#googleSignIn').hidden,true);assert.match(browser.element('#accountConnection').textContent,/Windows app/);browser.dispose();
 const future='2090-01-01';a.run(`validate([{id:'timezone',title:'Recorded in another time zone',status:'Done',history:[{id:'history',date:'${future}',startDate:'${future}'}]}])`);assert.equal(a.run(`validDate('${future}')`),false,'stored calendar dates stay portable, while new future date input remains rejected');
 console.log('PASS: Account navigation, signed-out mode, versioned preference backups/legacy import, separate guest/account workspaces, explicit migration without samples, theme/status sync, secret exclusion, metered/manual behavior, edits during sync, account switching and expired-session isolation');
})().catch(error=>{console.error(error);process.exitCode=1});

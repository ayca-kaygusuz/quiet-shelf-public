import assert from 'node:assert/strict';
export async function checkFirstSyncUI({evaluate,capture,prefix}){
 const prepared=await evaluate(`(async()=>{
  const S=QuietShelfSync,originalFetch=window.fetch;
  const local=[{id:'ui-local-one',title:'Local first title',status:'Unread',history:[]},{id:'ui-local-two',title:'Local second title',status:'Done',history:[{id:'ui-read',date:'2026-01-01',startDate:'2026-01-01'}]}];
  QuietShelfApp.apply({library:local,preferences:{theme:'ink'}});
  const fixture={user:{id:'900101',email:'reader@example.invalid',name:'A reader'},remote:S.update(S.empty(),{library:[{id:'ui-drive',title:'Drive title',status:'Unread',history:[]}],preferences:{theme:'sage'}},'uiDrive'),originalFetch};window.__quietShelfFirstSyncQA=fixture;
  window.fetch=async(url,options={})=>{
   if(String(url)==='/api/account/status')return Response.json({mode:location.protocol==='quiet-shelf:'?'desktop':'web',configured:true,account:fixture.user,network:{metered:false,source:'test'}});
   if(String(url)==='/api/account/sync'){const body=JSON.parse(options.body);if(body.readOnly&&body.state.registers.length)throw Error('Local data sent before approval');if(!body.readOnly)fixture.remote=S.merge(fixture.remote,body.state);return Response.json({account:fixture.user,state:fixture.remote,hasRemote:fixture.remote.registers.length>0})}
   return originalFetch(url,options);
  };
  await QuietShelfAccount.refresh();await QuietShelfAccount.sync(true);if(document.querySelector('#accountPage').hidden)document.querySelector('#accountButton').click();
  return {pending:QuietShelfAccount.status().setupPending,local:document.querySelector('#setupLocalCount').textContent,drive:document.querySelector('#setupDriveCount').textContent,visible:!document.querySelector('#syncSetup').hidden,kept:QuietShelfApp.snapshot().library.length,list:document.querySelector('#list').textContent};
 })()`);
 assert.equal(prepared.pending,true);assert.equal(prepared.local,'2');assert.equal(prepared.drive,'1');assert.equal(prepared.visible,true);assert.equal(prepared.kept,2);assert(prepared.list.includes('Local first title'));
 for(const theme of ['ink','sage']){
  await evaluate(`document.querySelector('#theme').value=${JSON.stringify(theme)};document.querySelector('#theme').dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#updateCard').hidden=true;window.scrollTo(0,0);true`);
  await capture(prefix+'-'+theme);
 }
 const combined=await evaluate(`(async()=>{await document.querySelector('#startSyncLibrary').onclick();return {pending:QuietShelfAccount.status().setupPending,count:QuietShelfApp.snapshot().library.length,recovery:!document.querySelector('#recoverySection').hidden,kept:QuietShelfApp.snapshot().library.some(b=>b.title==='Local first title')}})()`);
 assert.equal(combined.pending,false);assert.equal(combined.count,3);assert.equal(combined.recovery,true);assert.equal(combined.kept,true);
 const chosen=await evaluate(`(async()=>{window.__quietShelfFirstSyncQA.user={id:'900202',email:'other@example.invalid',name:'Another reader'};window.__quietShelfFirstSyncQA.remote=QuietShelfSync.update(QuietShelfSync.empty(),{library:[{id:'ui-other-drive',title:'Other Drive library',status:'Unread',history:[]}],preferences:{}},'otherDrive');await QuietShelfAccount.refresh();await QuietShelfAccount.sync(true);const before=QuietShelfApp.snapshot().library.length;await document.querySelector('#useDriveLibrary').onclick();return {before,after:QuietShelfApp.snapshot().library.length,pending:QuietShelfAccount.status().setupPending,recovery:!document.querySelector('#recoverySection').hidden}})()`);
 assert.equal(chosen.before,3);assert.equal(chosen.after,1);assert.equal(chosen.pending,false);assert.equal(chosen.recovery,true);
 await evaluate(`window.fetch=window.__quietShelfFirstSyncQA.originalFetch;delete window.__quietShelfFirstSyncQA;true`);
 console.log('PASS: '+prefix+' keeps the visible shelf through sign-in, previews both counts, combines only after approval and offers recovery in both themes');
}

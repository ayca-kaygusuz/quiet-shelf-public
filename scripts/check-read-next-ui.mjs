import assert from 'node:assert/strict';
export async function checkReadNextUI({evaluate,capture=async()=>{},prefix='read-next'}){
 await evaluate(`(()=>{window.__nextQA=QuietShelfApp.snapshot();window.__nextConfirm=window.confirm;window.__nextFetch=window.fetch;window.__nextLookups=0;window.fetch=(input,options)=>{if(String(input).startsWith('/api/books')){window.__nextLookups++;throw Error('Read next must not look up anything automatically')}return window.__nextFetch(input,options)};QuietShelfApp.apply({library:Array.from({length:22},(_,i)=>({id:'read-next-qa-'+i,title:'A story to discover '+(i+1)+' — standalone',author:'A library author',status:'Unread',history:[],createdAt:'2026-01-01T00:00:00.000Z'})),preferences:{theme:'ink',autoUpdateChecks:false}});document.querySelector('#backToLibrary').click();document.querySelector('#readNextPanel').open=true;return true})()`);
 try{
  let state=await evaluate(`(()=>{document.querySelector('#nextGenerate').click();window.__nextFirst=JSON.stringify(readNextState.list);const ids=readNextState.list.entries.map(e=>e.bookId);selected=ids[0];setStatus('In progress');selected=ids[1];setStatus('Done');selected=ids[2];setStatus('Done');return {count:document.querySelectorAll('.next-entry').length,done:document.querySelectorAll('.next-done').length,active:document.querySelectorAll('.next-active').length,unchanged:window.__nextFirst===JSON.stringify(readNextState.list),network:window.__nextLookups,backup:QuietShelfApp.backup().preferences.readNext.list.id===readNextState.list.id}})()`);
  assert.equal(state.count,12);assert.equal(state.done,2);assert.equal(state.active,1);assert.equal(state.unchanged,true);assert.equal(state.network,0);assert.equal(state.backup,true);
  state=await evaluate(`(()=>{window.__nextPrompts=0;window.confirm=()=>{window.__nextPrompts++;return false};document.querySelector('#nextGenerate').click();return {same:window.__nextFirst===JSON.stringify(readNextState.list),prompts:window.__nextPrompts}})()`);
  assert.equal(state.same,true);assert.equal(state.prompts,1);
  for(const theme of ['ink','sage']){
   state=await evaluate(`(async()=>{document.querySelector('#theme').value=${JSON.stringify(theme)};document.querySelector('#theme').dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#readNextPanel').scrollIntoView({block:'start'});await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));return {overflow:document.documentElement.scrollWidth>innerWidth,checked:document.querySelectorAll('.next-check[aria-checked="true"]').length}})()`);
   assert.equal(state.overflow,false);assert.equal(state.checked,2);await capture(prefix+'-'+theme);
  }
  state=await evaluate(`(()=>{window.confirm=()=>true;document.querySelector('#nextGenerate').click();return {different:window.__nextFirst!==JSON.stringify(readNextState.list),network:window.__nextLookups}})()`);
  assert.equal(state.different,true);assert.equal(state.network,0);
  console.log('PASS: '+prefix+' manual checklist generation, real status progress, confirmation cancellation, backup, both palettes and no network lookup');
 }finally{await evaluate(`(()=>{window.confirm=window.__nextConfirm;window.fetch=window.__nextFetch;QuietShelfApp.apply(window.__nextQA);document.querySelector('#readNextPanel').open=false;window.scrollTo(0,0);return true})()`)}
}

import assert from 'node:assert/strict';
export async function checkThemeUI({evaluate,capture,prefix}){
 await evaluate(`(()=>{
  window.__quietShelfThemeQA=QuietShelfApp.snapshot();
  const daysAgo=n=>new Date(Date.now()-n*86400000).toISOString().slice(0,10),names=['The Observatory 1','The Observatory 2','The Observatory 3','The Observatory 4','The Observatory 5','The Observatory 6','Atlas of Little Things','Notes from a Quiet Room','Night Archive','The Shape of Rain','Letters from Elsewhere','A Field Guide to Slow Days'];
  const library=names.map((title,i)=>({id:'theme-ui-'+i,title,author:i<6?'Mira Hayes':'Eden Lane',status:i<6?'Unread':i<8?'In progress':'Done',createdAt:new Date(Date.now()-(12-i)*86400000).toISOString(),addedOrder:i,...(i<6?{seriesMode:'manual',seriesName:'The Observatory',seriesVolume:i+1}:{}),...(i>=6&&i<8?{startedOn:daysAgo(3)}:{}),history:i>=8?[{id:'theme-reading-'+i,startDate:daysAgo((i-8)*20+7),date:daysAgo((i-8)*20)}]:[]}));
  QuietShelfApp.apply({library,preferences:{...window.__quietShelfThemeQA.preferences,theme:'ink',collectionView:'library',filter:'All',seriesState:{},sort:'addedAsc',includeArchive:false,includeWishlist:false}});
  if(!document.querySelector('#accountPage').hidden)document.querySelector('#backToLibrary').click();return true;
 })()`);
 for(const theme of ['tide','rosewood','porcelain','apricot']){
  const state=await evaluate(`(()=>{document.querySelector('#theme').value=${JSON.stringify(theme)};document.querySelector('#theme').dispatchEvent(new Event('change',{bubbles:true}));window.scrollTo(0,0);document.querySelector('#updateCard').hidden=true;const style=getComputedStyle(document.documentElement);return {theme:document.documentElement.dataset.theme,saved:JSON.parse(localStorage.getItem('quiet-shelf-preferences-v1')).theme,backup:QuietShelfApp.backup().preferences.theme,count:QuietShelfApp.snapshot().library.length,segments:document.querySelectorAll('.donut-segment').length,scheme:style.colorScheme,colors:['--unread','--progress','--done'].map(k=>style.getPropertyValue(k).trim()),overflow:document.documentElement.scrollWidth>innerWidth}})()`);
  assert.equal(state.theme,theme);assert.equal(state.saved,theme);assert.equal(state.backup,theme);assert.equal(state.count,12);assert.equal(state.segments,3);assert.equal(new Set(state.colors).size,3);assert.equal(state.scheme,['tide','rosewood'].includes(theme)?'dark':'light');assert.equal(state.overflow,false);
  await capture(prefix+'-'+theme);
  const account=await evaluate(`(()=>{document.querySelector('#accountButton').click();return {visible:!document.querySelector('#accountPage').hidden,theme:document.documentElement.dataset.theme,toggle:document.querySelector('#autoUpdateChecks').checked===QuietShelfApp.backup().preferences.autoUpdateChecks}})()`);
  assert.equal(account.visible,true);assert.equal(account.theme,theme);assert.equal(account.toggle,true);
  await capture(prefix+'-'+theme+'-account');
  await evaluate(`document.querySelector('#backToLibrary').click();true`);
 }
 await evaluate(`QuietShelfApp.apply(window.__quietShelfThemeQA);delete window.__quietShelfThemeQA;true`);
 console.log('PASS: '+prefix+' all new palettes, persisted/backed-up choices, three real chart segments, account/update controls and no horizontal overflow');
}

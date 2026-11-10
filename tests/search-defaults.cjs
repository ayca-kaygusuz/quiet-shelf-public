// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('src/index.html','utf8'),inline=html.match(/<script>([\s\S]*)<\/script>/)[1],core=fs.readFileSync('src/sync-core.js','utf8');
const providers=['kitapyurdu','bkm','nadir','openlibrary','google','blackwells','betterworld','dnb','k10plus','thalia','hugendubel','lovelybooks','anilist'];
assert.match(html,/<select id="lookupLanguage">\s*<option value="" selected>Any language<\/option>/);
function launch(preferences){
 const storage={'quiet-shelf-search-v1':JSON.stringify(preferences)},elements={};
 const ctx={URL,console,crypto:require('node:crypto').webcrypto,AbortController,window:{addEventListener(){},dispatchEvent(){}},CustomEvent:class{},location:{hostname:'localhost'},setTimeout:()=>0,clearTimeout(){},localStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},document:{querySelectorAll:()=>[],addEventListener(){},querySelector:s=>elements[s]??={value:'',textContent:'',innerHTML:'',hidden:false,setCustomValidity(){},setAttribute(){},addEventListener(){},querySelector:()=>({disabled:false})}}};
 vm.createContext(ctx);vm.runInContext(core,ctx);vm.runInContext(inline,ctx);return {ctx,storage,elements};
}
for(const provider of providers){
 const {ctx,storage,elements}=launch({source:provider,lang:'tr'}),run=code=>vm.runInContext(code,ctx);
 assert.equal(elements['#lookupSource'].value,provider);assert.equal(elements['#lookupLanguage'].value,'','legacy Turkish must not become the initial filter');
 assert.equal(JSON.parse(storage['quiet-shelf-search-v1']).lang,'','normalize the old on-device cache too');
 const initial=run('QuietShelfApp.snapshot()');assert.equal(initial.preferences.search.lang,'');
 elements['#lookupLanguage'].value='de';elements['#lookupLanguage'].onchange();assert.equal(elements['#lookupLanguage'].value,'de','manual filter remains usable within this dialog');assert.equal(JSON.parse(storage['quiet-shelf-search-v1']).lang,'');
 run('resetLookup()');assert.equal(elements['#lookupLanguage'].value,'','reopening Add title clears the previous filter');assert.equal(elements['#lookupSource'].value,provider);
 const next=structuredClone(initial);next.preferences.search={source:provider,lang:'tr'};ctx.restored=next;
 run('QuietShelfApp.apply(restored)');assert.equal(elements['#lookupLanguage'].value,'','backup/account/Drive apply must not restore a legacy filter');assert.equal(elements['#lookupSource'].value,provider);assert.equal(JSON.parse(storage['quiet-shelf-search-v1']).lang,'');
 assert.equal(JSON.stringify(run('QuietShelfApp.snapshot().library')),JSON.stringify(run('validate(restored.library)')),'preference normalization preserves validated books and reading history');
 const S=ctx.QuietShelfSync,state=S.update(S.empty(),{library:[],preferences:{search:{source:provider,lang:''}}},'defaults');assert.equal(S.project(state).preferences.search.source,provider,'all catalog source preferences must survive sync validation');
}
assert.equal(launch({source:'unknown',lang:'tr'}).elements['#lookupLanguage'].value,'');
console.log('PASS: every source opens Any language after legacy startup, dialog reuse, backup/account restore and Drive apply; explicit current filters work and all source preferences sync');

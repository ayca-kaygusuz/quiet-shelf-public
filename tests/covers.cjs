// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('src/index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const saved=[{id:'old',title:'Dreamers of the Full Moon Coffee Shop',author:'Mai Mochizuki',status:'Done',history:[{id:'h',date:'2026-01-02'}],cover:'https://covers.openlibrary.org/b/olid/OL61802124M-M.jpg?default=false',color:'#607451'}];
let elements={},listeners={},storage={'quiet-shelf-v1':JSON.stringify(saved)};
const element=s=>elements[s]??={value:'',innerHTML:'',setAttribute(){},querySelector(){return {disabled:false}},addEventListener(){}};
const document={querySelector:element,querySelectorAll:()=>[],addEventListener:(name,fn,capture)=>{if(name==='error')listeners.error={fn,capture}},createElement:()=>({style:{setProperty(name,value){this[name]=value}}})};
const context=vm.createContext({console,URL,AbortController,setTimeout,clearTimeout,location:{hostname:'localhost'},crypto:require('node:crypto').webcrypto,document,localStorage:{getItem:k=>storage[k],setItem:(k,v)=>storage[k]=v}});
const run=s=>vm.runInContext(s,context);run(source);
assert.match(element('#list').innerHTML,/class="cover bookcover"/);assert.equal(listeners.error.capture,true,'image errors need a capturing listener');
const before=run('JSON.stringify(books)');let replacement;
const img={tagName:'IMG',classList:{contains:c=>c==='bookcover'},getAttribute:()=>saved[0].cover,dataset:{coverLetter:'D',coverColor:'#607451'},replaceWith:node=>replacement=node};
listeners.error.fn({target:img});assert.equal(replacement.className,'cover');assert.equal(replacement.textContent,'D');assert.equal(replacement.style['--cover'],'#607451');
run('render()');assert.match(element('#list').innerHTML,/<span class="cover"[^>]*>D<\/span>/);assert(!element('#list').innerHTML.includes('<img'));assert(!element('#detail').innerHTML.includes('<img'));
run('showResults([books[0]])');assert.match(element('#lookupResults').innerHTML,/<span class="cover"[^>]*>D<\/span>/);
assert.equal(run('JSON.stringify(books)'),before);assert.equal(storage['quiet-shelf-v1'],JSON.stringify(saved),'fallback must not clear saved covers, titles or history');
assert.match(run('coverHTML({title:"No cover"})'),/>N<\/span>/);
assert.match(run('coverHTML({title:"<script>",cover:"javascript:bad",color:"red;display:none"})'),/>&lt;<\/span>/);assert(!run('coverHTML({title:"x",color:"red;display:none"})').includes('display:none'));
assert.match(run('coverHTML({title:"Working",cover:"https://covers.openlibrary.org/b/id/123-M.jpg"})'),/<img/);
replacement=null;listeners.error.fn({target:{...img,classList:{contains:()=>false}}});assert.equal(replacement,null,'unrelated failed images are ignored');
console.log('PASS: missing/failed/legacy saved covers fall back safely in list, details and search without modifying records; healthy images remain');

const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');const source=fs.readFileSync('src/index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1];let elements={},storage={},scheduled=[],fetches=[],requests=[];const ctx={URL,console,window:{addEventListener:()=>{},dispatchEvent:()=>{}},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail}},location:{hostname:'localhost'},crypto:require('node:crypto').webcrypto,AbortController,setTimeout:cb=>{scheduled.push(cb);return scheduled.length},clearTimeout:()=>{},localStorage:{getItem:k=>storage[k],setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},document:{querySelectorAll:()=>[],addEventListener:()=>{},querySelector:s=>elements[s]??={value:s==='#format'?'All formats':'',textContent:'',innerHTML:'',hidden:false,setCustomValidity:()=>{},setAttribute:()=>{},addEventListener:()=>{},querySelector:()=>({disabled:false})}},fetch:async (url,options)=>{fetches.push(url);requests.push({url,options});if(new URL(url,'http://localhost').searchParams.get('source')==='google'){
 const book={title:'A Google result',source:'Google Books',sourceUrl:'https://books.google.com/books?id=test-volume',language:'en'};
 return options.headers['X-Google-Api-Key']==='test-only-key'?{ok:true,json:async()=>String(url).startsWith('/api/book?')?book:{results:[book]}}:{ok:false,json:async()=>({error:'Google Books quota has been reached.'})};
}if(new URL(url,'http://localhost').searchParams.get('source')==='nadir'){
 const book={title:'Gachiakuta 1',author:'Kei Urana',publisher:'Athica Yayınları',publicationYear:'2025',binding:'Karton Kapaklı',language:'tr',source:'Nadir Kitap',sourceUrl:'https://www.nadirkitap.com/gachiakuta-1-kitap123.html',cover:'https://static.nadirkitap.com/fotograf/1/cover.jpg'};
 return {ok:true,json:async()=>String(url).startsWith('/api/book?')?book:{results:[book]}};
}return {ok:true,json:async()=>String(url).startsWith('/api/book?')?{title:'The Valley Of Fear',isbn:'9786054782369',language:'en',source:'Kitapyurdu',sourceUrl:'https://www.kitapyurdu.com/kitap/the-valley-of-fear/318719.html'}:{results:[],isbnNotice:'This catalog did not return that ISBN. Paste its link.'}}}};vm.createContext(ctx);vm.runInContext(source,ctx);
(async()=>{assert.equal(elements['#lookupSource'].value,'kitapyurdu');assert.equal(elements['#lookupLanguage'].value,'tr');elements['#lookup'].value='Gachiakuta';elements['#lookupSource'].value='openlibrary';elements['#lookupSource'].onchange();assert.equal(elements['#lookupLanguage'].value,'en');await scheduled.pop()();assert(fetches.at(-1).includes('source=openlibrary&lang=en'));elements['#lookupLanguage'].value='fr';elements['#lookupLanguage'].onchange();await scheduled.pop()();assert(fetches.at(-1).includes('lang=fr'));assert.equal(JSON.parse(storage['quiet-shelf-search-v1']).lang,'fr');elements['#lookupSource'].value='google';elements['#lookupSource'].onchange();await scheduled.pop()();assert(fetches.at(-1).includes('source=google&lang=en'));
// Pasting a key retries the failed query without editing the title; details and links retain it.
assert.match(elements['#lookupStatus'].textContent,/quota/);
const query=elements['#lookup'].value;
elements['#googleApiKey'].value='  test-only-key  ';
elements['#googleApiKey'].oninput();
assert.match(elements['#lookupStatus'].textContent,/Searching/);
await scheduled.pop()();
assert.equal(elements['#lookup'].value,query);
assert.equal(requests.at(-1).options.headers['X-Google-Api-Key'],'test-only-key');
assert(!requests.at(-1).url.includes('test-only-key'));
assert.match(elements['#lookupResults'].innerHTML,/A Google result/);
await elements['#lookupResults'].onclick({target:{closest:()=>({dataset:{result:'0'}})}});
assert.match(requests.at(-1).url,/^\/api\/book\?/);
assert.equal(requests.at(-1).options.headers['X-Google-Api-Key'],'test-only-key');
assert.equal(elements['#title'].value,'A Google result');
elements['#lookup'].value='https://books.google.com/books?id=test-volume';
elements['#lookup'].oninput();await scheduled.pop()();
assert.equal(requests.at(-1).options.headers['X-Google-Api-Key'],'test-only-key');
assert.match(elements['#lookupStatus'].textContent,/Exact edition/);
assert.equal(storage['quiet-shelf-google-key-v1'],'test-only-key');
for(const [key,value] of Object.entries(storage))if(key!=='quiet-shelf-google-key-v1')assert(!value.includes('test-only-key'));
elements['#lookup'].value=query;elements['#lookupSource'].value='bkm';elements['#lookupSource'].onchange();assert.equal(elements['#lookupLanguage'].value,'tr');assert.equal(elements['#lookupLanguage'].disabled,false);await scheduled.pop()();assert(fetches.at(-1).includes('source=bkm&lang=tr'));
assert.equal(requests.at(-1).options.headers['X-Google-Api-Key'],undefined);
const pending=scheduled.length;elements['#googleApiKey'].oninput();assert.equal(scheduled.length,pending);
// A pasted catalog URL chooses its matching source and stays inside the app.
elements['#lookupSource'].value='openlibrary';elements['#lookupSource'].onchange();elements['#lookup'].value='https://www.kitapyurdu.com/kitap/the-valley-of-fear/318719.html';elements['#lookup'].oninput();await scheduled.pop()();assert.equal(elements['#lookupSource'].value,'kitapyurdu');assert.match(fetches.at(-1),/^\/api\/book\?source=kitapyurdu&url=/);assert.match(elements['#lookupResults'].innerHTML,/The Valley Of Fear/);assert.match(elements['#lookupStatus'].textContent,/Exact edition/);
elements['#lookup'].value='9786054782369';elements['#lookup'].oninput();await scheduled.pop()();assert.match(elements['#lookupStatus'].textContent,/Paste its link/);
assert.equal(vm.runInContext("lookupLink('https://evil.com/kitap/title/318719.html')",ctx),null);assert.equal(vm.runInContext("lookupLink('http://www.kitapyurdu.com/kitap/title/318719.html')",ctx),null);
elements['#lookupSource'].value='nadir';elements['#lookupSource'].onchange();await scheduled.pop()();
assert.equal(elements['#lookupLanguage'].value,'tr');assert.equal(elements['#googleSettings'].hidden,true);
assert(fetches.at(-1).includes('source=nadir&lang=tr'));assert.equal(requests.at(-1).options.headers['X-Google-Api-Key'],undefined);
assert.equal(JSON.parse(storage['quiet-shelf-search-v1']).source,'nadir');
elements['#lookup'].value='https://nadirkitap.com/gachiakuta-1-kitap123.html?ref=search#cover';elements['#lookup'].oninput();await scheduled.pop()();
assert.match(fetches.at(-1),/^\/api\/book\?source=nadir&url=/);assert(!fetches.at(-1).includes('ref%3D'));
assert.match(elements['#lookupResults'].innerHTML,/2025/);assert.match(elements['#lookupResults'].innerHTML,/Karton Kapaklı/);assert.match(elements['#lookupResults'].innerHTML,/static.nadirkitap.com/);
await elements['#lookupResults'].onclick({target:{closest:()=>({dataset:{result:'0'}})}});
assert.equal(elements['#title'].value,'Gachiakuta 1');assert.match(elements['#editionPreview'].innerHTML,/View edition on Nadir Kitap/);
for(const url of ['https://user@www.nadirkitap.com/a-kitap123.html','https://www.nadirkitap.com:444/a-kitap123.html','https://evil.com/a-kitap123.html'])assert.equal(vm.runInContext('lookupLink('+JSON.stringify(url)+')',ctx),null);
vm.runInContext('resetLookup()',ctx);assert.equal(elements['#googleApiKey'].value,'test-only-key');
console.log('PASS: provider selection, default languages, remembered preference, selected-source requests, direct source selection, source changes restore controls')})().catch(e=>{console.error(e);process.exitCode=1});

import assert from 'node:assert/strict';import fs from 'node:fs';import {catalog,normalizeSearch,searchVariants,rankSearchResults} from '../src/catalog.mjs';
const query='Kayıp Hikayenin İzinde - Dörtlerin İmzası / Sherlock Holmes',full=JSON.parse(fs.readFileSync(new URL('./fixtures/kitapyurdu-long-search.json',import.meta.url))),exact=JSON.parse(fs.readFileSync(new URL('./fixtures/kitapyurdu-short-search.json',import.meta.url)));
assert.equal(normalizeSearch('KAYIP HİKAYENİN İZİNDE'),'kayip hikayenin izinde');assert.deepEqual(searchVariants(query),[query,'kayip hikayenin izinde dortlerin imzasi sherlock holmes','kayip hikayenin izinde']);assert.equal(rankSearchResults([...full,...exact],query)[0].sourceUrl,'https://www.kitapyurdu.com/kitap/kayip-hikayenin-izinde-dortlerin-imzasi-sherlock-holmes/304106.html');assert.deepEqual(rankSearchResults(full,query),[]);
const title=t=>({title:t,source:'Test',sourceUrl:'https://example.com/'+encodeURIComponent(t)});assert.deepEqual(rankSearchResults([title('Chainsaw Man 10. Cilt'),title('Chainsaw Man 2. Cilt'),title('Chainsaw Man 1. Cilt / Testere Adam')],'Chainsaw Man 1. Cilt / Testere Adam').map(b=>b.title),['Chainsaw Man 1. Cilt / Testere Adam']);assert.equal(rankSearchResults([title('Other book'),{...title('Test Book'),isbn:'9786255610355'}],'978-625-5610355')[0].title,'Test Book');assert.equal(rankSearchResults([{...title('A book'),author:'J. R. R. Tolkien'}],'J R R Tolkien')[0].title,'A book');assert.equal(searchVariants('ReLIFE Cilt 10 / A translated subtitle').at(-1),'relife 10');assert.equal(searchVariants('東京物語 第一巻')[0],'東京物語 第一巻');assert.equal(rankSearchResults([title('Other book'),title('Gachiakuta 1')],'gachi')[0].title,'Gachiakuta 1');assert.equal(rankSearchResults([title('Harry Potter and the Chamber of Secrets')],'harry pot')[0].title,'Harry Potter and the Chamber of Secrets');
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const html=records=>records.map(b=>`<div class="ky-product"><a class="ky-product-title" href="${escape(b.sourceUrl)}">${escape(b.title)}</a><span class="ky-product-author">${escape(b.author)}</span><span class="ky-product-publisher">${escape(b.publisher)}</span></div>`).join('');let calls=[];globalThis.fetch=async url=>{let u=new URL(url);calls.push(u);return new Response(html(u.searchParams.get('filter_name')==='kayip hikayenin izinde'?exact:full))};
let response=await catalog(new Request('https://test/api/books?source=kitapyurdu&lang=tr&q='+encodeURIComponent(query)));assert.equal(response.status,200);let data=await response.json();assert.equal(data.results[0].sourceUrl,exact[0].sourceUrl);assert.equal(calls.length,3);assert(calls.every(u=>u.origin==='https://www.kitapyurdu.com'&&u.searchParams.get('filter_language')==='TÜRKÇE'));assert.equal(calls[2].searchParams.get('filter_name'),'kayip hikayenin izinde');await catalog(new Request('https://test/api/books?source=kitapyurdu&lang=tr&q='+encodeURIComponent(query)));assert.equal(calls.length,3,'fallback candidates use existing source cache');globalThis.fetch=async()=>{throw Error('Should reject an overlong query without fetching')};response=await catalog(new Request('https://test/api/books?q='+('x'.repeat(301))));assert.equal(response.status,400);
console.log('PASS: reported Sherlock Holmes title, Turkish normalization, exact-title ranking, same-source/language fallback, wrong-volume exclusion, ISBN/author search, cache reuse and full-title length validation');

// Reported Kitapyurdu queries: preserving apostrophes prevents an extra AND-search term.
const dehbQuery="DEHB'li Kadınların ve Kız Çocuklarının Dünyası & Neden Bu Kadar Özeller, Onları Güçlü";
const dehbFull=JSON.parse(fs.readFileSync(new URL('./fixtures/kitapyurdu-apostrophe-full.json',import.meta.url)));
const dehbShort=JSON.parse(fs.readFileSync(new URL('./fixtures/kitapyurdu-apostrophe-short.json',import.meta.url)));
const dehbUrl=dehbFull[0].sourceUrl;
for(let q of ["DEHB'li",'DEHB’li','DEHBʼli','DEHB＇li'])assert.equal(normalizeSearch(q),'dehbli');
assert.equal(normalizeSearch("O’Connor's"),'oconnors');assert.equal(normalizeSearch('DEHB li'),'dehb li');
assert.equal(searchVariants(dehbQuery)[0],dehbQuery);
assert(searchVariants(dehbQuery).includes('dehbli kadinlarin ve kiz cocuklarinin dunyasi'));
assert(!searchVariants(dehbQuery).some(q=>q.includes('dehb li')));
assert.equal(rankSearchResults([...dehbShort,...dehbFull],dehbQuery)[0].sourceUrl,dehbUrl);
assert.equal(rankSearchResults(dehbShort,"dehb'li").some(b=>b.sourceUrl===dehbUrl),true);
assert.equal(rankSearchResults(dehbShort,'dehb’li').some(b=>b.sourceUrl===dehbUrl),true);
assert(!rankSearchResults(dehbShort,"dehb'li").some(b=>b.title==='Allah Cümlemizi Korusun'));
calls=[];globalThis.fetch=async url=>{let u=new URL(url);calls.push(u);let q=u.searchParams.get('filter_name');return new Response(html(q===dehbQuery?dehbFull:q==="dehb'li"?dehbShort:[] )+'<div id="searchFilters"></div>')};
for(let q of [dehbQuery,"dehb'li",'dehb’li']){let r=await catalog(new Request('https://test/api/books?source=kitapyurdu&lang=tr&q='+encodeURIComponent(q)));assert.equal(r.status,200);assert((await r.json()).results.some(b=>b.sourceUrl===dehbUrl))}
assert.equal(calls.length,2,'curly/straight apostrophe variants share the canonical catalog query cache');
assert.equal(calls[0].searchParams.get('filter_name'),dehbQuery);assert.equal(calls[1].searchParams.get('filter_name'),"dehb'li");
assert(calls.every(u=>u.origin==='https://www.kitapyurdu.com'&&u.searchParams.get('filter_language')==='TÜRKÇE'));
// A catalog that requires compact spelling can use the normalized fallback.
let compactCatalog=(await import('../src/catalog.mjs?compact-apostrophe-test')).catalog;calls=[];
globalThis.fetch=async url=>{let u=new URL(url);calls.push(u);return new Response(html(u.searchParams.get('filter_name')==='dehbli'?dehbShort:[])+'<div id="searchFilters"></div>')};
response=await compactCatalog(new Request('https://test/api/books?source=kitapyurdu&lang=tr&q='+encodeURIComponent("dehb'li")));assert((await response.json()).results.some(b=>b.sourceUrl===dehbUrl));assert.deepEqual(calls.map(u=>u.searchParams.get('filter_name')),["dehb'li",'dehbli']);
console.log('PASS: reported full DEHB title and short query, apostrophe variants/compact fallback, relevant results, selected source/language and cache reuse');

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseISBN,parseBook} from '../src/catalog.mjs';
const isbn='9786054782369',product='https://www.kitapyurdu.com/kitap/the-valley-of-fear/318719.html';
const fixture=readFileSync('tests/fixtures/kitapyurdu-isbn-book.html','utf8');
assert.equal(parseISBN('ISBN-13: 978-605-478-236-9'),isbn);
assert.equal(parseISBN('0-306-40615-2'),'0306406152');
assert.equal(parseISBN('0-8044-2957-X'),'080442957X');
for(let value of ['9786054782368','0306406153','1234567890128','9786054782369 unrelated'])assert.equal(parseISBN(value),null);
assert.equal(parseBook(fixture,product).language,'en');
let generation=0;const fresh=async()=>(await import('../src/catalog.mjs?isbn-test='+generation++)).catalog;
let calls=[];
globalThis.fetch=async(url,options)=>{calls.push({url:String(url),options});return new Response('<div id="searchFilters">Aradım Bulamadım</div>')};
let catalog=await fresh();let r=await catalog(new Request('http://test/api/books?source=kitapyurdu&lang=en&q='+isbn));let data=await r.json();assert.deepEqual(data.results,[]);assert.match(data.isbnNotice,/paste its link/);assert.equal(calls.length,1);assert(!calls[0].url.includes('filter_language'));assert.match(calls[0].url,/filter_name=9786054782369/);
// A direct link loads an edition missing from the catalog's search index, including its HTML-only language.
globalThis.fetch=async url=>{calls.push({url:String(url)});return new Response(fixture)};
r=await catalog(new Request('http://test/api/book?source=kitapyurdu&url='+encodeURIComponent(product)));data=await r.json();assert.equal(data.title,'The Valley Of Fear');assert.equal(data.isbn,isbn);assert.equal(data.language,'en');assert.equal(data.author,'Sir Arthur Conan Doyle');
// Kitapyurdu suggestions omit ISBN; verify the details before showing the result.
const card='<div class="ky-product"><a class="ky-product-title" href="'+product+'">The Valley Of Fear</a></div>';
for(let matches of [true,false]){catalog=await fresh();calls=[];globalThis.fetch=async url=>{calls.push(String(url));return new Response(String(url).includes('filter_name=')?card:matches?fixture:fixture.replace(isbn,'9780306406157'))};r=await catalog(new Request('http://test/api/books?source=kitapyurdu&lang=tr&q='+isbn));data=await r.json();assert.equal(data.results.length,matches?1:0);assert.equal(calls.length,2);if(matches)assert.equal(data.results[0].language,'en')}
// Known ISBN matches beyond the first four candidates must survive; no language restriction on an exact identifier.
catalog=await fresh();calls=[];globalThis.fetch=async(url,options)=>{calls.push({url:String(url),options});return Response.json({items:[...Array.from({length:4},(_,i)=>({id:'wrong-'+i,volumeInfo:{title:'Wrong edition',language:'tr',industryIdentifiers:[{type:'ISBN_13',identifier:'9780306406157'}]}})),{id:'right',volumeInfo:{title:'The Valley Of Fear',language:'en',industryIdentifiers:[{type:'ISBN_13',identifier:isbn}]}}]})};
r=await catalog(new Request('http://test/api/books?source=google&lang=tr&q='+encodeURIComponent('ISBN-13: 978-605-478-236-9'),{headers:{'X-Google-Api-Key':'fixture-key'}}));data=await r.json();assert.equal(data.results.length,1);assert.equal(data.results[0].isbn,isbn);assert.equal(new URL(calls[0].url).searchParams.get('q'),'isbn:'+isbn);assert(!calls[0].url.includes('langRestrict'));assert.equal(calls[0].options.headers['X-Goog-Api-Key'],'fixture-key');
// An equivalent ISBN-10 is the same edition; retain the matching ISBN from Open Library's identifier array.
catalog=await fresh();calls=[];globalThis.fetch=async url=>{calls.push(String(url));return Response.json({docs:[{title:'Physics',author_name:['An author'],editions:{docs:[{key:'/books/OL123M',language:['eng'],isbn:['9786054782369','0306406152']}]}}]})};r=await catalog(new Request('http://test/api/books?source=openlibrary&lang=tr&q=9780306406157'));data=await r.json();assert.equal(data.results.length,1);assert.equal(data.results[0].isbn,'0306406152');assert.equal(new URL(calls[0]).searchParams.get('q'),'isbn:9780306406157');
catalog=await fresh();globalThis.fetch=async()=>Response.json({error:{code:429}},{status:429});r=await catalog(new Request('http://test/api/books?source=google&q='+isbn));assert.equal(r.status,502);assert.equal((await r.json()).code,'GOOGLE_QUOTA');
globalThis.fetch=()=>{throw Error('AniList must not receive edition ISBN queries')};r=await catalog(new Request('http://test/api/books?source=anilist&q='+isbn));assert.match((await r.json()).isbnNotice,/series records/);
console.log('PASS: ISBN checksums/normalization, exact query operators, language-independent edition lookup, identifier verification, missing-index guidance, reported Kitapyurdu link/language and preserved quota errors');

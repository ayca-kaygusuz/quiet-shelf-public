import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {nadirURL,parseNadirSearch,parseNadirBook,dedupeNadir} from '../src/catalog.mjs';

const searchFixture=readFileSync('tests/fixtures/nadir-search.html','utf8');
const bookFixture=readFileSync('tests/fixtures/nadir-book.html','utf8');
const realURL='https://www.nadirkitap.com/gachiakuta-12-kei-urana-kitap50053400.html';
assert.equal(nadirURL(realURL+'?ref=search#cover'),realURL);
assert.equal(nadirURL(realURL.replace('www.','')),realURL);
for(const url of ['http://www.nadirkitap.com/a-kitap123.html','https://user@www.nadirkitap.com/a-kitap123.html','https://www.nadirkitap.com:444/a-kitap123.html','https://www.nadirkitap.com.evil.com/a-kitap123.html','https://www.nadirkitap.com/kitapara.php','https://www.nadirkitap.com/a-dergi123.html'])assert.equal(nadirURL(url),'');
const parsed=parseNadirSearch(searchFixture);assert.equal(parsed.length,1);
assert.equal(parsed[0].title,'Gachiakuta 1. Cilt - Manga ( Yeni )');
assert.equal(parsed[0].publisher,'Athica Yayınları');assert.equal(parsed[0].publicationYear,'2025');
assert.equal(parsed[0].author,'Kei Urana');assert(parsed[0].cover.startsWith('https://static.nadirkitap.com/fotograf/'));
// Both orders of the site's duplicated list/grid layouts must work.
assert.equal(parseNadirSearch(searchFixture.replace(/<div id="gridView">[\s\S]*?<\/div>/,'')+'<div id="gridView">'+searchFixture+'</div>').length,1);
const real=parseNadirBook(bookFixture,realURL);
assert.equal(real.isbn,'9786258858334');assert.equal(real.language,'tr');
assert.equal(real.binding,'Karton Kapaklı');assert.equal(real.translator,'');assert.equal(real.publicationYear,'');
assert.equal(real.recordKind,'edition');
assert.equal(parseNadirBook(bookFixture.replace('"inLanguage": "tr"','"inLanguage": ""'),realURL).language,'tr');
assert.equal(parseNadirBook(bookFixture.replace('https://static.nadirkitap.com/fotograf/','https://evil.com/fotograf/'),realURL).cover,'');
assert.throws(()=>parseNadirBook('<html>Challenge page</html>',realURL));
assert.equal(dedupeNadir([real,{...real,sourceUrl:realURL.replace('50053400','50053401')}]).length,1);
assert.equal(dedupeNadir([{...real,isbn:''},{...real,isbn:'',sourceUrl:realURL.replace('50053400','50053401')}]).length,2);

let generation=0;const fresh=async()=>(await import('../src/catalog.mjs?nadir-test='+generation++)).catalog;
const product=id=>`https://www.nadirkitap.com/gachiakuta-kitap${id}.html`;
const base={title:'Gachiakuta 1',author:'Kei Urana',publisher:'Athica Yayınları',isbn:'9786255610355',language:'tr',publicationYear:'2025',binding:'Karton Kapaklı'};
const books={101:{...base,title:'Gachiakuta 1. Cilt - Manga ( Yeni )'},102:{...base},103:{...base,isbn:'9780306406157'},104:{...base,language:'en'},105:{...base,title:'Gachiakuta 2'},106:{...base,isbn:''},107:{...base,isbn:''},108:{...base,publicationYear:'2024'},109:{...base,binding:'Ciltli'}};
function card(id,book){return `<div class="productsListHover"><img src="https://static.nadirkitap.com/fotograf/1/cover.jpg"><ul class="nkListInfo"><a class="nadirBook" href="${product(id)}">${book.title}</a><li class="nkLineAuthor"><span class="nadirBook">${book.author}</span><span class="nkSep"> - </span><span class="nadirBook">${book.publisher}, ${book.publicationYear}</span></li></ul></div>`}
function detail(book,id){return '<script type="application/ld+json">'+JSON.stringify({'@type':['Book','Product'],name:book.title,author:{name:book.author},publisher:{name:book.publisher},isbn:book.isbn,inLanguage:book.language,datePublished:book.publicationYear,url:product(id),image:'https://static.nadirkitap.com/fotograf/1/cover.jpg'})+'</script><i>Cilt Durumu</i><b class="spec-desc">'+book.binding+'</b>'}
const list='<div id="listView">'+Object.entries(books).map(([id,b])=>card(id,b)).join('')+'</div><div id="gridView">'+card('101',books[101])+'</div>';
let calls=[],active=0,peak=0;
globalThis.fetch=async(url,options)=>{
 const u=new URL(url);calls.push({url:u,options});assert.equal(u.origin,'https://www.nadirkitap.com');
 const headers=new Headers(options.headers);for(const key of ['X-Google-Api-Key','X-Goog-Api-Key','Cookie','Authorization'])assert.equal(headers.get(key),null);
 assert.equal(options.redirect,'manual');if(u.pathname.includes('kitapara'))return new Response(list);
 const id=u.pathname.match(/kitap(\d+)\.html$/)?.[1];assert(books[id]);active++;peak=Math.max(peak,active);
 await new Promise(resolve=>setImmediate(resolve));active--;return new Response(detail(books[id],id));
};
let catalog=await fresh(),r=await catalog(new Request('http://test/api/books?source=nadir&lang=tr&q=Gachiakuta%201',{headers:{'X-Google-Api-Key':'test-only-key'}}));
assert.equal(r.status,200);let data=await r.json();assert.equal(data.results.length,6);
assert(data.results.every(b=>b.language==='tr'&&b.source==='Nadir Kitap'));assert(!data.results.some(b=>b.sourceUrl===product('105')));
assert.equal(data.results.filter(b=>b.isbn==='').length,2);assert.equal(peak,3);assert(!calls.some(c=>c.url.href===product('105')));
assert.equal(calls[0].url.searchParams.get('dil'),'1');assert.equal(calls[0].url.searchParams.get('kelime'),'Gachiakuta 1');
const count=calls.length;await catalog(new Request('http://test/api/books?source=nadir&lang=tr&q=Gachiakuta%201'));assert.equal(calls.length,count);
r=await catalog(new Request('http://test/api/book?source=nadir&url='+encodeURIComponent(product('101'))));assert.equal((await r.json()).isbn,base.isbn);assert.equal(calls.length,count,'detail cache is shared with search');
r=await catalog(new Request('http://test/api/books?source=nadir&lang=en&q=Gachiakuta%201'));assert.equal((await r.json()).results.length,1);assert.equal(calls.at(-1).url.searchParams.get('dil'),'7');
r=await catalog(new Request('http://test/api/books?source=nadir&q=Gachiakuta%201'));assert.equal((await r.json()).results.length,7);

catalog=await fresh();calls=[];
r=await catalog(new Request('http://test/api/books?source=nadir&lang=en&q=9786255610355'));data=await r.json();
assert(data.results.length);assert(data.results.every(b=>b.isbn===base.isbn));assert(data.results.some(b=>b.language==='tr'),'ISBN lookup bypasses edition language');
assert.equal(calls[0].url.pathname,'/kitapara.php');assert.equal(calls[0].url.searchParams.get('isbn'),base.isbn);assert(!calls[0].url.searchParams.has('dil'));
const before=calls.length;r=await catalog(new Request('http://test/api/book?source=nadir&url=https://evil.com/gachiakuta-kitap1.html'));assert.equal(r.status,400);assert.equal(calls.length,before);

// Blocking, challenge HTML, and cross-origin redirects are errors, not empty catalogs.
for(const upstream of [()=>new Response('Blocked',{status:403}),()=>new Response('<html>Verify you are human</html>'),()=>new Response('',{status:302,headers:{Location:'https://evil.com/'}})]){
 catalog=await fresh();globalThis.fetch=async()=>upstream();r=await catalog(new Request('http://test/api/books?source=nadir&q=Gachiakuta'));assert.equal(r.status,502);assert.match((await r.json()).error,/Nadir Kitap/);
}
catalog=await fresh();globalThis.fetch=async()=>new Response('<div id="listView"></div>');r=await catalog(new Request('http://test/api/books?source=nadir&q=Nothing'));assert.deepEqual((await r.json()).results,[]);
catalog=await fresh();globalThis.fetch=async url=>String(url).includes('kitapara')?new Response(list):String(url)===product('103')?new Response('Unavailable',{status:503}):new Response(detail(books[String(url).match(/kitap(\d+)\.html/)[1]],'101'));
r=await catalog(new Request('http://test/api/books?source=nadir&lang=tr&q=Gachiakuta%201'));data=await r.json();assert(data.results.length);assert.match(data.searchNotice,/Some listing details/);
console.log('PASS: Nadir live-layout parsing, edition metadata, conservative seller deduplication, selected language, verified ISBNs, detail caching, bounded concurrency, key isolation, safe URLs/redirects and access/partial failures');

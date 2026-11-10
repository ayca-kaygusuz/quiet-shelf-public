// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {catalog,lovelyURL,parseLovelySearch,parseLovelyBook,rankSearchResults} from '../src/catalog.mjs';
import {isExternalBookURL} from '../desktop/app-protocol.mjs';
const files={};for(const name of ['isbn','title','edition','work'])files[name]=JSON.parse(await readFile('tests/fixtures/lovelybooks/'+name+'.json','utf8'));
const isbn='9783522202602',edition=parseLovelyBook(files.edition),featured=parseLovelyBook(files.work.book),workURL='https://www.lovelybooks.de/autor/Michael-Ende/Die-unendliche-Geschichte-1523237141-w/';
assert.equal(rankSearchResults(parseLovelySearch(files.isbn),files.isbn.content[0].title+' '+files.isbn.content[0].subtitle).length,1,'full-title queries retain the separate catalog subtitle');
assert(edition.title.includes(files.edition.subtitle));
assert.equal(edition.isbn,isbn);assert.equal(edition.language,'de');assert.equal(edition.readingInfo.pages,480);assert.equal(featured.isbn,'9783522202503');assert.notEqual(edition.sourceUrl,featured.sourceUrl,'edition links must distinguish ISBNs sharing a work ID');
assert.equal(parseLovelySearch(files.isbn)[0].readingInfo.pages,null,'missing search pagination is not guessed');assert(parseLovelySearch(files.title).every(b=>!b.sourceUrl.includes('1874939848')),'audio is not imported as a book');
assert.equal(parseLovelySearch(files.title,'en').length,0);assert.equal(parseLovelySearch(files.isbn,'de').length,1);assert.equal(parseLovelyBook({...files.edition,isbn:'B000TEST01'}).isbn,'','ASIN is not an ISBN');
assert.equal(parseLovelyBook({...files.edition,genre:'lehrbuch'}).readingInfo.format,'reference');assert.equal(parseLovelyBook({...files.edition,title:'Sprachlehrbuch',genre:'roman'}).readingInfo.format,'unknown','title alone cannot identify a study book');
for(const url of [edition.sourceUrl,workURL]){assert.equal(lovelyURL(url+'?tracking=removed#fragment'),url);assert(isExternalBookURL(url));for(const unsafe of [url.replace('https:','http:'),url.replace('https://','https://user@'),url.replace('.de/','.de:8443/'),url.replace('www.lovelybooks.de','evil.example'),url.replace(/-\d+-[tw]\//,'-NaN-t/')])assert.equal(lovelyURL(unsafe),'')}
assert.equal(lovelyURL('https://www.lovelybooks.de/profil/private/'),'');assert.throws(()=>parseLovelyBook(files.edition,edition.sourceUrl,'9780140328721'),/identity changed/);assert.throws(()=>parseLovelyBook({...files.edition,titleId:999999},edition.sourceUrl),/identity changed/);
for(const data of [{},{content:[]},{content:[{}],totalElements:1}])assert.throws(()=>parseLovelySearch(data));assert.deepEqual(parseLovelySearch({content:[],totalElements:0}),[]);
const original=globalThis.fetch,calls=[];let mode='ok',active=0,peak=0;
globalThis.fetch=async(input,options={})=>{
 const u=new URL(input);assert.equal(u.origin,'https://www.lovelybooks.de');assert.equal(options.method||'GET','GET');assert(!JSON.stringify(options).includes('private-books-key'));assert.equal(new Headers(options.headers).get('Authorization'),null);assert.equal(new Headers(options.headers).get('Cookie'),null);calls.push(u);
 if(mode==='blocked')return new Response('Blocked',{status:403});if(mode==='challenge')return new Response('<html>Verify you are human</html>');if(mode==='redirect')return new Response('',{status:302,headers:{Location:'https://evil.example/private'}});
 if(u.pathname==='/mapi/search/detail/books'){assert.equal(u.searchParams.get('size'),'40');assert.equal(u.searchParams.get('page'),'0');return Response.json(mode==='empty'?{content:[],totalElements:0}:u.searchParams.get('q').replaceAll('-','')===isbn||u.searchParams.get('q')==='3522202600'?files.isbn:files.title)}
 assert.match(u.pathname,/^\/mapi\/books\/(byTitle\/\d+|\d+\/details)$/);active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,4));active--;
 if(u.pathname.endsWith('/details'))return Response.json(files.work);
 return Response.json(u.pathname.endsWith('2000475177')?files.work.book:u.pathname.match(/byTitle\/90000/)?{...files.edition,titleId:Number(u.pathname.split('/').at(-1))}:files.edition);
};
const request=(path)=>catalog(new Request('http://localhost'+path,{headers:{'X-Google-Api-Key':'private-books-key'}})),search=(q,lang='')=>request('/api/books?source=lovelybooks&lang='+lang+'&q='+encodeURIComponent(q)),detail=(url,expected='')=>request('/api/book?source=lovelybooks&url='+encodeURIComponent(url)+(expected?'&isbn='+expected:''));
try{
 let r=await search(isbn,'tr');assert.equal(r.status,200);assert.equal((await r.json()).results[0].isbn,isbn,'ISBN lookup bypasses language filters');
 r=await search('3522202600');assert.equal((await r.json()).results[0].isbn,isbn,'ISBN-10 aliases remain exact');
 r=await search('Die unendliche Geschichte');assert.equal(r.status,200);assert((await r.json()).results.length>0);let count=calls.length;await search('Die unendliche Geschichte');assert.equal(calls.length,count);
 r=await detail(edition.sourceUrl,isbn);assert.equal((await r.json()).readingInfo.pages,480);assert(calls.at(-1).pathname.endsWith('/byTitle/1759914184'),'selected edition uses its title ID, never the featured work endpoint');
 count=calls.length;r=await detail(edition.sourceUrl,'3522202600');assert.equal((await r.json()).isbn,isbn);assert.equal(calls.length,count,'ISBN verification also applies to cached editions');
 r=await detail(edition.sourceUrl,'9780140328721');assert.equal(r.status,502);assert.equal((await r.json()).code,'EDITION_MISMATCH');
 r=await detail(workURL);assert.equal(r.status,200);const featuredData=await r.json();assert.equal(featuredData.isbn,featured.isbn);assert.equal(featuredData.sourceUrl,featured.sourceUrl,'work import resolves to a stable featured edition link');
 count=calls.length;for(const url of ['https://evil.example/book','https://www.lovelybooks.de/mapi/auth/login']){r=await detail(url);assert.equal(r.status,400)}assert.equal(calls.length,count);
 r=await detail(edition.sourceUrl,'not-an-isbn');assert.equal(r.status,400);
 peak=0;const group=await Promise.all(Array.from({length:7},(_,i)=>detail(edition.sourceUrl.replace('1759914184',String(9000001+i)),isbn)));assert(group.every(r=>r.status===200));assert.equal(peak,3,'edition requests share a global three-request limit');
 count=calls.length;await Promise.all(Array.from({length:5},()=>detail(edition.sourceUrl.replace('1759914184','9000020'),isbn)));assert.equal(calls.length,count+1,'concurrent requests for the same title ID coalesce');
 mode='empty';r=await search('a truly absent title');assert.equal(r.status,200);assert.deepEqual((await r.json()).results,[]);
 for(const m of ['blocked','challenge','redirect']){mode=m;r=await search('unseen '+m);assert.equal(r.status,502);assert.equal((await r.json()).code,m==='blocked'?'SOURCE_BLOCKED':'CATALOG_UNAVAILABLE')}
 console.log('PASS: LovelyBooks live-layout JSON, title versus work identities, exact ISBN/ISBN-10 and language handling, edition metadata, safe URLs, honest errors/empty states, caching and key isolation');
}finally{globalThis.fetch=original}

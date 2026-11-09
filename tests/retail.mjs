import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {catalog,parseRetailSearch,parseRetailBook,retailURL} from '../src/catalog.mjs';
const fixtures={},roots={blackwells:'https://blackwells.co.uk',betterworld:'https://www.betterworldbooks.com'};
for(const source of Object.keys(roots)){
 const search=await readFile('tests/fixtures/retail/'+source+'-search.html','utf8'),book=await readFile('tests/fixtures/retail/'+source+'-book.html','utf8');fixtures[source]={search,book};
 const records=parseRetailSearch(search,source);assert.equal(records.length,1);const result=records[0];assert.equal(result.language,'');assert.equal(parseRetailSearch(search+search,source).length,1);
 const detail=parseRetailBook(book,source,result.sourceUrl);assert.equal(detail.isbn,result.isbn);assert.equal(detail.language,'en');assert(detail.publisher);assert(detail.title.includes('Harry Potter'));assert(detail.readingInfo.sources.includes(detail.source));assert.equal(detail.cover.startsWith(source==='blackwells'?roots[source]+'/jacket/':'https://product-images.bwbcontent.com/'),true);
 if(source==='blackwells')assert.equal(detail.readingInfo.pages,432);else{assert.equal(detail.readingInfo.pages,null);assert(detail.title.includes("Sorcerer's"))}
 assert.equal(retailURL(source,'https://evil.example/book/'+result.isbn),'');assert.equal(retailURL(source,result.sourceUrl.replace('https://','http://')),'');assert.equal(retailURL(source,result.sourceUrl.replace('https://','https://user:password@')),'');
 assert.throws(()=>parseRetailBook(book.replaceAll(detail.isbn,'9780140328721'),source,result.sourceUrl));
 fixtures[source].url=result.sourceUrl;fixtures[source].isbn=result.isbn;
}
const originalFetch=globalThis.fetch,calls=[];let blocked=false;
globalThis.fetch=async(input,options={})=>{
 const u=new URL(input);calls.push({url:u.href,options});assert(!JSON.stringify(options).includes('private-books-key'));
 const source=u.hostname==='blackwells.co.uk'?'blackwells':u.hostname==='www.betterworldbooks.com'?'betterworld':null;assert(source,'Unexpected upstream host');
 if(blocked)return new Response('Blocked',{status:403});return new Response(u.href===fixtures[source].url?fixtures[source].book:fixtures[source].search);
};
try{
 for(const source of Object.keys(roots)){
  const base='http://localhost/api/books?source='+source+'&q=Harry%20Potter&lang=';
  let r=await catalog(new Request(base,{headers:{'X-Google-Api-Key':'private-books-key'}}));assert.equal(r.status,200);assert.equal((await r.json()).results.length,1);
  const count=calls.length;await catalog(new Request(base));assert.equal(calls.length,count,'retail searches should be cached');
  r=await catalog(new Request(base+'en'));assert.equal(r.status,200);assert.equal((await r.json()).results[0].language,'en');
  r=await catalog(new Request(base+'fr'));assert.equal((await r.json()).results.length,0,'filter by actual listing language, never country');
  r=await catalog(new Request('http://localhost/api/books?source='+source+'&lang=tr&q='+fixtures[source].isbn));assert.equal((await r.json()).results[0].isbn,fixtures[source].isbn,'ISBN searches ignore language filters and return exact editions');
  r=await catalog(new Request('http://localhost/api/book?source='+source+'&url='+encodeURIComponent(fixtures[source].url)));assert.equal((await r.json()).isbn,fixtures[source].isbn);
  r=await catalog(new Request('http://localhost/api/book?source='+source+'&url='+encodeURIComponent('https://example.invalid/book')));assert.equal(r.status,400);
 }
 blocked=true;let r=await catalog(new Request('http://localhost/api/books?source=blackwells&q=unseen%20query&lang='));assert.equal(r.status,502);assert.equal((await r.json()).code,'SOURCE_BLOCKED');
 console.log('PASS: UK/US retailer live-layout fixtures, full titles/edition metadata, normalized covers, language and ISBN verification, request/key isolation, safe URLs, bounded detail loading and cache');
}finally{globalThis.fetch=originalFetch}

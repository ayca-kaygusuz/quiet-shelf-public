// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {catalog,germanURL,parseGermanSRU,parseGermanShopSearch,parseGermanShopBook} from '../src/catalog.mjs';
import {isExternalBookURL} from '../desktop/app-protocol.mjs';
const fixtures={},isbn='9783522202602';
for(const source of ['dnb','k10plus']){
 const xml=await readFile('tests/fixtures/german/'+source+'.xml','utf8'),record=parseGermanSRU(xml,source)[0];fixtures[source]={xml,record};
 assert(record.title==='Die unendliche Geschichte'&&record.author.includes('Michael')&&record.publisher==='Thienemann');assert.equal(record.language,'de');assert.equal(record.isbn,isbn);assert.equal(record.readingInfo.pages,474);assert(record.readingInfo.subjects.includes('Jugendbuch'));assert.equal(record.publicationYear,'2019');
 assert.equal(parseGermanSRU(xml,source,'en').length,0);assert.equal(parseGermanSRU(xml,source,'de').length,1);
 assert.equal(parseGermanSRU(xml.replaceAll(isbn,'9780140328721').replaceAll('3522202600','0140328726'),source,'','0140328726')[0].isbn,xml.includes('3522202600')?'0140328726':'9780140328721','ISBN-10 requests match the same edition through ISBN-13 aliases');
 assert.throws(()=>parseGermanSRU('<html>Captcha</html>',source));assert.throws(()=>parseGermanSRU('<!DOCTYPE x [<!ENTITY y SYSTEM "file:///private">]>'+xml,source));
 assert.throws(()=>parseGermanSRU(xml.replace(/numberOfRecords/g,'diagnostic'),source));
 const study=xml.replaceAll('Jugendbuch','Sprachlehrbuch');assert.equal(parseGermanSRU(study,source)[0].readingInfo.format,'reference','controlled study subject excludes textbooks');
 assert.equal(parseGermanSRU(xml.replace(/<(?:\w+:)?datafield\b[^>]*tag="245"[^>]*>[\s\S]*?<\/(?:\w+:)?datafield>/,field=>field.replace(/(<(?:\w+:)?subfield\b[^>]*code="a"[^>]*>)[^<]*/, '$1Sprachlehrbuch')),source)[0].readingInfo.format,'unknown','title alone is not study evidence');
}
for(const source of ['thalia','hugendubel']){
 const search=await readFile('tests/fixtures/german/'+source+'-search.html','utf8'),html=await readFile('tests/fixtures/german/'+source+'-book.html','utf8'),basic=parseGermanShopSearch(search,source);assert.equal(basic.length,1);assert.equal(parseGermanShopSearch(search+search,source).length,1);assert.equal(basic[0].language,'');
 const record=parseGermanShopBook(html,source,basic[0].sourceUrl);fixtures[source]={search,html,record};assert.equal(record.isbn,isbn);assert.equal(record.language,'de');assert(record.publisher.includes('Thienemann'));assert.equal(record.author,'Michael Ende');assert.equal(record.readingInfo.pages,480);assert.equal(record.publicationYear,'2019');assert(record.cover.startsWith(source==='thalia'?'https://images.thalia.media/':'https://media2.hugendubel.de/'));
 assert.throws(()=>parseGermanShopBook(html,source,record.sourceUrl.replace(source==='thalia'?'A1052513935':'34535436',source==='thalia'?'A9999999':'9999999')),'a redirected edition must not silently change identity');
 assert.throws(()=>parseGermanShopBook('<html>Verify you are human</html>',source,record.sourceUrl));
}
for(const [source,{record}]of Object.entries(fixtures)){
 assert.equal(germanURL(source,record.sourceUrl),record.sourceUrl);assert(isExternalBookURL(record.sourceUrl));
 for(const url of [record.sourceUrl.replace('https:','http:'),record.sourceUrl.replace('https://','https://user@'),record.sourceUrl.replace('.de/','.de:8443/'),record.sourceUrl.replace('https://','https://evil.example/?path=')])if(url!==record.sourceUrl)assert.equal(germanURL(source,url),'');
}
assert.equal(germanURL('dnb','https://portal.dnb.de/opac.htm?method=simpleSearch&query=idn%3D1168641489'),'https://d-nb.info/1168641489');
assert.equal(germanURL('k10plus','https://opac.k10plus.de/DB=2.299//PPNSET?PPN=1035237822&COOKIE=ignored'),'https://opac.k10plus.de/DB=2.299/PPNSET?PPN=1035237822');
const original=globalThis.fetch,calls=[];let mode='ok',active=0,peak=0;
globalThis.fetch=async(input,options={})=>{
 const u=new URL(input);assert(!JSON.stringify(options).includes('private-books-key'));calls.push(u);
 if(mode==='blocked')return new Response('Access denied',{status:403});
 if(mode==='challenge')return new Response('<html>Verify you are human</html>');
 if(mode==='redirect')return new Response('',{status:302,headers:{location:'https://evil.example/steal'}});
 const source=u.hostname==='services.dnb.de'?'dnb':u.hostname==='sru.k10plus.de'?'k10plus':u.hostname==='www.thalia.de'?'thalia':u.hostname==='www.hugendubel.de'?'hugendubel':null;assert(source,'No arbitrary upstream hosts');
 if(fixtures[source].xml){assert.equal(u.searchParams.get('operation'),'searchRetrieve');assert(!u.searchParams.get('query').includes('cql.anywhere'));return new Response(fixtures[source].xml)}
 if(mode==='empty')return new Response(source==='thalia'?'<suche-button-mehr-laden data-anzahl-treffer="0"></suche-button-mehr-laden>':'<h1 class="search-title coveo-results-title-clamp">Suche nach x: <!-- -->0<!-- --> Treffer</h1>');
 const detail=u.pathname.includes('artikeldetails')||u.pathname.endsWith('-produkt-details.html');if(!detail)return new Response(fixtures[source].search);
 active++;peak=Math.max(peak,active);await new Promise(resolve=>setTimeout(resolve,5));active--;return new Response(fixtures[source].html);
};
const request=(source,q,lang='')=>catalog(new Request('http://localhost/api/books?source='+source+'&q='+encodeURIComponent(q)+'&lang='+lang,{headers:{'X-Google-Api-Key':'private-books-key'}}));
try{
 for(const [source,f]of Object.entries(fixtures)){
  let response=await request(source,'Die unendliche Geschichte');assert.equal(response.status,200);assert.equal((await response.json()).results.length,1);
  let count=calls.length;await request(source,'Die unendliche Geschichte');assert.equal(calls.length,count,'cached searches avoid repeated upstream work');
  response=await request(source,'Die unendliche Geschichte','de');assert.equal((await response.json()).results[0].language,'de');
  response=await request(source,isbn,'tr');assert.equal((await response.json()).results[0].isbn,isbn,'exact ISBN lookup ignores language filter');
  response=await catalog(new Request('http://localhost/api/book?source='+source+'&url='+encodeURIComponent(f.record.sourceUrl)));assert.equal(response.status,200);assert.equal((await response.json()).isbn,isbn);
  count=calls.length;response=await catalog(new Request('http://localhost/api/book?source='+source+'&url=https://evil.example/book'));assert.equal(response.status,400);assert.equal(calls.length,count);
 }
 for(const source of ['dnb','k10plus']){await request(source,'Ende Michael');const q=calls.filter(u=>u.hostname===(source==='dnb'?'services.dnb.de':'sru.k10plus.de')).at(-1).searchParams.get('query');assert(q.includes('="Ende" and ')&&q.includes('="Michael"'),'author words do not assume surname-first phrase order')}
 assert(peak<=3,'edition loading must stay bounded');
 for(const source of ['thalia','hugendubel']){mode='empty';let r=await request(source,'a truly absent book');assert.equal(r.status,200);assert.deepEqual((await r.json()).results,[])}
 for(const test of ['blocked','challenge','redirect']){mode=test;for(const source of Object.keys(fixtures)){const response=await request(source,'unseen '+test);assert.equal(response.status,502);assert.equal((await response.json()).code,test==='blocked'?'SOURCE_BLOCKED':'CATALOG_UNAVAILABLE')}}
 console.log('PASS: four German catalogs, live-layout MARC/retailer fixtures, ISBN/language/edition identity, structured study metadata, safe links, honest empty/error states and key isolation');
}finally{globalThis.fetch=original}

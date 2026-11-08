import assert from 'node:assert/strict';import {catalog,parseGoogle,parseAniList} from '../src/catalog.mjs';
const google={items:[{id:'volume-1',volumeInfo:{title:'A Book',authors:['An Author'],publisher:'A Publisher',language:'en',industryIdentifiers:[{type:'ISBN_13',identifier:'9781234567897'}],imageLinks:{thumbnail:'http://books.google.com/a.jpg'}}}]};
assert.equal(parseGoogle(google,'en')[0].isbn,'9781234567897');assert.equal(parseGoogle(google,'tr').length,0);assert.equal(parseGoogle(google)[0].cover,'https://books.google.com/a.jpg');
const anime={data:{Page:{media:[{id:1,type:'MANGA',format:'MANGA',title:{romaji:'Test Manga'},staff:{edges:[{role:'Story & Art',node:{name:{full:'An Author'}}}]},coverImage:{large:'https://s4.anilist.co/file/a.jpg'}}]}}};assert.equal(parseAniList(anime)[0].recordKind,'series');assert.equal(parseAniList(anime)[0].isbn,'');
let calls=[];globalThis.fetch=async(url,options)=>{calls.push({url:String(url),options});return new Response(JSON.stringify(String(url).includes('googleapis')?google:anime),{headers:{'Content-Type':'application/json'}})};
let r=await catalog(new Request('http://test/api/books?source=google&lang=en&q=A%20Book',{headers:{'X-Google-Api-Key':'test-only-key'}}));assert.equal(r.status,200);assert.equal((await r.json()).results[0].source,'Google Books');assert.match(calls[0].url,/langRestrict=en/);assert(!calls[0].url.includes('test-only-key'));assert.equal(calls[0].options.headers['X-Goog-Api-Key'],'test-only-key');r=await catalog(new Request('http://test/api/books?source=anilist&q=test'));assert.equal((await r.json()).results[0].recordKind,'series');assert.equal(calls.at(-1).options.method,'POST');assert.equal(calls.at(-1).options.headers['X-Goog-Api-Key'],undefined);assert.equal(JSON.parse(calls.at(-1).options.body).variables.search,'test');
for(let source of ['google','anilist']){r=await catalog(new Request('http://test/api/book?source='+source+'&url=https://evil.com'));assert.equal(r.status,400)}
for(const [status,error] of [
 [429,{code:429}],
 [403,{errors:[{reason:'dailyLimitExceeded'}]}],
 [403,{errors:[{reason:'rateLimitExceeded'}]}],
 [403,{status:'RESOURCE_EXHAUSTED'}]
]){
 globalThis.fetch=async()=>Response.json({error},{status});
 for(const key of ['', 'test-only-key']){
  r=await catalog(new Request('http://test/api/books?source=google&q=test',{headers:key?{'X-Google-Api-Key':key}:{}}));
  assert.equal(r.status,502);const data=await r.json();assert.equal(data.code,'GOOGLE_QUOTA');
  assert.match(data.error,key?/supplied API key/:/Add your own/);
  if(key)assert(!data.error.includes('Add your own'));
  assert(!data.error.includes('test-only-key'));
 }
}
globalThis.fetch=async()=>Response.json({error:{message:'test-only-key',errors:[{reason:'keyInvalid'}]}},{status:400});
r=await catalog(new Request('http://test/api/books?source=google&q=test',{headers:{'X-Google-Api-Key':'test-only-key'}}));
const rejected=await r.json();assert.equal(rejected.code,'GOOGLE_UNAVAILABLE');assert.match(rejected.error,/Books API is enabled/);assert(!rejected.error.includes('test-only-key'));
console.log('PASS: Google API search/language, optional key confined to Google headers, shared/project quota and rejected-key errors, AniList series mapping, invalid detail URLs');

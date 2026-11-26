// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {catalog,parseOpenLibrary} from '../src/catalog.mjs';
const edition={key:'/books/OL61802124M',title:'Dreamers of the Full Moon Coffee Shop',language:['eng']};
const search=(e=edition,work={})=>({docs:[{title:edition.title,...work,editions:{docs:[e]}}]});
const image=id=>`https://covers.openlibrary.org/b/id/${id}-M.jpg?default=false`;
assert.equal(parseOpenLibrary(search())[0].cover,'','edition without metadata must not guess an OLID image');
assert.equal(parseOpenLibrary(search({...edition,cover_i:123}))[0].cover,image(123));
assert.equal(parseOpenLibrary(search({...edition,covers:[-1,0,456]}))[0].cover,image(456));
for(const invalid of [-1,0,1.2,'123','https://evil.example/cover',Number.MAX_SAFE_INTEGER+1])assert.equal(parseOpenLibrary(search({...edition,cover_i:invalid}))[0].cover,'');
assert.equal(parseOpenLibrary(search(edition,{cover_i:789,cover_edition_key:'OL1M'}))[0].cover,'','do not borrow artwork from a different edition');
assert.equal(parseOpenLibrary(search(edition,{cover_i:789,cover_edition_key:'OL61802124M'}))[0].cover,image(789));
const originalFetch=globalThis.fetch;let calls=[];
try{
 globalThis.fetch=async url=>{calls.push(String(url));return new Response(JSON.stringify(String(url).includes('/search.json')?search({...edition,cover_i:123}):edition))};
 let result=await catalog(new Request('https://test/api/books?source=openlibrary&q=Dreamers%20of%20the%20Full%20Moon%20Coffee%20Shop'));
 assert.equal(result.status,200);assert.equal((await result.json()).results[0].cover,image(123));
 assert(new URL(calls[0]).searchParams.get('fields').split(',').includes('editions.cover_i'));
 result=await catalog(new Request('https://test/api/book?source=openlibrary&url=https://openlibrary.org/books/OL61802124M'));
 assert.equal(result.status,200);assert.equal((await result.json()).cover,'');
 globalThis.fetch=async()=>new Response(JSON.stringify({...edition,key:'/books/OL123M',covers:[-1,654]}));
 result=await catalog(new Request('https://test/api/book?source=openlibrary&url=https://openlibrary.org/books/OL123M'));
 assert.equal((await result.json()).cover,image(654));
}finally{globalThis.fetch=originalFetch}
console.log('PASS: Open Library edition cover metadata, missing/sentinel covers, edition isolation and search/detail routes');

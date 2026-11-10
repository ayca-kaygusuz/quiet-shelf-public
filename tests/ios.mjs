// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
execFileSync(process.execPath,['scripts/prepare-ios.mjs'],{stdio:'pipe'});
const lovelyFixtures={};for(const name of ['isbn','edition','work'])lovelyFixtures[name]=JSON.parse(await readFile('tests/fixtures/lovelybooks/'+name+'.json','utf8'));
const germanFixtures={};
for(const provider of ['dnb','k10plus','thalia','hugendubel'])germanFixtures[provider]=provider==='dnb'||provider==='k10plus'?{xml:await readFile('tests/fixtures/german/'+provider+'.xml','utf8')}:{search:await readFile('tests/fixtures/german/'+provider+'-search.html','utf8'),book:await readFile('tests/fixtures/german/'+provider+'-book.html','utf8')};
let online=true,metered=false;
let api,account={id:'101',email:'reader@example.invalid',name:'A reader'},creates=0,removes=0,clears=0;const files=new Map(),calls=[];
globalThis.QuietShelfIOS={rpc:async(method,args={})=>{
 calls.push({method,args});if(method==='account.status')return {mode:'ios',configured:true,account,network:{online,metered}};
 if(method==='app.info')return {version:'0.14.1'};
 if(method==='account.clearToken'){clears++;return true}
 if(method==='account.signout'){account=null;return {mode:'ios',configured:true,account:null}}
 assert.equal(method,'http');const u=new URL(args.url),headers=new Headers(args.headers);assert.equal(headers.get('Cookie'),null);
 if(u.hostname==='www.googleapis.com'&&u.pathname.startsWith('/books/v1/volumes')){assert.equal(headers.get('Authorization'),null);assert.equal(headers.get('X-Goog-Api-Key'),'test-only-books-key');return {status:200,headers:{},body:JSON.stringify({items:[{id:'volume-one',volumeInfo:{title:'An iPhone/iPad catalog result',language:'en'}}]})}}
 if(u.hostname==='www.lovelybooks.de'){assert.equal(args.method,'GET');assert.equal(headers.get('Authorization'),null);assert.equal(headers.get('X-Goog-Api-Key'),null);return {status:200,headers:{},body:JSON.stringify(u.pathname==='/mapi/search/detail/books'?lovelyFixtures.isbn:u.pathname.endsWith('/details')?lovelyFixtures.work:lovelyFixtures.edition)}}
 const provider={'services.dnb.de':'dnb','sru.k10plus.de':'k10plus','www.thalia.de':'thalia','www.hugendubel.de':'hugendubel'}[u.hostname];
 if(provider){assert.equal(headers.get('Authorization'),null);assert.equal(headers.get('X-Goog-Api-Key'),null);const f=germanFixtures[provider];return {status:200,headers:{},body:f.xml||(u.pathname.includes('artikeldetails')||u.pathname.endsWith('-produkt-details.html')?f.book:f.search)}}
 assert.equal(args.accountId,'101');assert.equal(headers.get('Authorization'),'Bearer native-account');assert(!JSON.stringify(args).includes('refresh_token'));assert.equal(headers.get('X-Goog-Api-Key'),null);
 if(u.pathname==='/drive/v3/files')return {status:200,headers:{},body:JSON.stringify({files:[...files].map(([id,state])=>({id,version:'1',size:JSON.stringify(state).length}))})};
 if(u.pathname==='/upload/drive/v3/files'){const state=JSON.parse(args.body.split('\r\n\r\n')[2].split('\r\n--')[0]);const id='copy-'+(++creates);files.set(id,state);return {status:200,headers:{},body:JSON.stringify({id,version:'1'})}}
 const id=u.pathname.split('/').at(-1);if(args.method==='DELETE'){files.delete(id);removes++;return {status:204,headers:{},body:''}}
 return {status:200,headers:{},body:JSON.stringify(files.get(id))};
}};
api=await import('../ios/QuietShelf/Web/ios-api.mjs');const originalFetch=globalThis.fetch;
globalThis.fetch=async(input,options={})=>api.external(new Request(input,options));
const origin='quiet-shelf-ios://app';
const call=(path,body,headers={})=>api.handle(new Request(origin+path,{method:body===undefined?'GET':'POST',headers:{...headers,...(body===undefined?{}:{'Content-Type':'application/json','X-Quiet-Shelf-Account':'1'})},...(body===undefined?{}:{body:JSON.stringify(body)})}));
try{
 assert.equal((await(await call('/api/account/status')).json()).mode,'ios');
 const R=globalThis.QuietShelfReadNext,library=[{id:'local',title:'Tablet title',status:'Unread',history:[]}],checklist=R.generate(library,{id:'ios-checklist'});
 const S=globalThis.QuietShelfSync,state=S.update(S.empty(),{library,preferences:{theme:'rosewood',autoUpdateChecks:false,readNext:{list:checklist,mode:'balanced',genre:'all'}}},'tablet');
 let response=await call('/api/account/sync',{accountId:'101',state,readOnly:true,manual:true});assert.equal((await response.json()).state.registers.length,0);assert.equal(creates,0,'first check sends no phone data to Drive');assert.equal(removes,0);
 response=await call('/api/account/sync',{accountId:'101',state,manual:true});const synced=S.project((await response.json()).state);assert.equal(synced.library[0].title,'Tablet title');assert.equal(synced.preferences.readNext.list.id,'ios-checklist');assert.equal(creates,1);
 assert.equal((await call('/api/account/sync',{accountId:'202',state,manual:true})).status,401,'another account cannot use this connection');
 metered=true;response=await call('/api/account/sync',{accountId:'101',state,manual:false});assert.equal((await response.json()).paused,true);assert.equal(creates,1,'metered automatic sync cannot upload');
 response=await call('/api/account/sync',{accountId:'101',state,manual:true});assert.equal(response.status,200,'manual sync remains available on metered connections');
 online=false;response=await call('/api/account/sync',{accountId:'101',state,manual:true});assert.equal(response.status,400);assert.match((await response.json()).error,/Offline/);online=true;metered=false;

 response=await call('/api/books?source=google&lang=en&q=iPhone/iPad',{},{'X-Google-Api-Key':'test-only-books-key'});assert.equal(response.status,405);
 response=await call('/api/books?source=google&lang=en&q=iPhone/iPad',undefined,{'X-Google-Api-Key':'test-only-books-key'});assert.equal(response.status,200);assert.equal((await response.json()).results[0].title,'An iPhone/iPad catalog result');
 for(const provider of Object.keys(germanFixtures)){
  const r=await call('/api/books?source='+provider+'&lang=&q=9783522202602',undefined,{'X-Google-Api-Key':'private-key-not-for-catalogs'});assert.equal(r.status,200);const books=(await r.json()).results;assert.equal(books.length,1);assert.equal(books[0].isbn,'9783522202602');
  const detail=await call('/api/book?source='+provider+'&url='+encodeURIComponent(books[0].sourceUrl));assert.equal(detail.status,200);assert.equal((await detail.json()).language,'de');
 }
 response=await call('/api/books?source=lovelybooks&lang=tr&q=9783522202602',undefined,{'X-Google-Api-Key':'private-key-not-for-catalogs'});assert.equal(response.status,200);const lovely=(await response.json()).results[0];assert.equal(lovely.isbn,'9783522202602');
 response=await call('/api/book?source=lovelybooks&isbn='+lovely.isbn+'&url='+encodeURIComponent(lovely.sourceUrl));assert.equal(response.status,200);assert.equal((await response.json()).readingInfo.pages,480);
 await call('/api/account/signout',{});assert.equal((await(await call('/api/account/status')).json()).account,null);assert.equal(files.size,1,'sign-out leaves Drive data intact');
 assert.equal(clears,0);assert(!JSON.stringify(calls).includes('private-refresh-token'));
 const html=await readFile('ios/QuietShelf/Web/index.html','utf8'),csp=await readFile('ios/QuietShelf/Web/csp.txt','utf8'),script=html.match(/<script>([\s\S]*)<\/script>/)[1];
 assert(html.includes('src="/ios-bootstrap.js"'));assert(csp.includes("connect-src 'self'"));assert(csp.includes("'sha256-"+createHash('sha256').update(script.replace(/\r\n?/g,'\n')).digest('base64')+"'"));
 assert(!html.includes('client_secret'));
 console.log('PASS: iPhone/iPad shared catalog and Drive model, native credential marker/account binding, read-only first sync, saved theme/update preference and packaged CSP');
}finally{globalThis.fetch=originalFetch;delete globalThis.QuietShelfIOS}

const setup=await mkdtemp(join(tmpdir(),'quiet-shelf-ios-config-'));
try{
 const python=process.platform==='win32'?'python':'python3';
 const output=join(setup,'public-env'),testId='123-ios-test.apps.googleusercontent.com';
 const plist='<?xml version="1.0"?><plist version="1.0"><dict><key>CLIENT_ID</key><string>'+testId+'</string><key>BUNDLE_ID</key><string>com.quietshelf.ios</string><key>API_KEY</key><string>ignored-test-api-key</string></dict></plist>';
 const env={...process.env,QUIET_SHELF_GOOGLE_IOS_CLIENT_ID:testId,QUIET_SHELF_GOOGLE_IOS_CONFIGURATION:plist,GITHUB_ENV:output};
 execFileSync(python,['scripts/ios-google-config.py'],{env,stdio:'pipe'});
 assert.equal((await readFile(output,'utf8')).replace(/\r\n/g,'\n'),'QUIET_SHELF_GOOGLE_IOS_CLIENT_ID='+testId+'\n');
 assert.throws(()=>execFileSync(python,['scripts/ios-google-config.py'],{env:{...env,QUIET_SHELF_GOOGLE_IOS_CLIENT_ID:'123-other.apps.googleusercontent.com'},stdio:'pipe'}));
 assert.throws(()=>execFileSync(python,['scripts/ios-google-config.py'],{env:{...env,QUIET_SHELF_GOOGLE_IOS_CONFIGURATION:plist.replace('com.quietshelf.ios','com.other.app')},stdio:'pipe'}));
 console.log('PASS: iOS plist extracts only the public client ID, discards unrelated API keys and rejects mismatched clients/bundles');
}finally{await rm(setup,{recursive:true,force:true})}

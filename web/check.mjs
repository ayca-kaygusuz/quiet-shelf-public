// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {pathToFileURL} from 'node:url';
import {buildHosted} from './build.mjs';
import {createHostedWorker} from './worker.mjs';
import {deployHosted} from './deploy.mjs';
import {createWebAccount} from '../src/web-account.mjs';

const originalFetch=globalThis.fetch,build=buildHosted(),bundle=readFileSync(build.output,'utf8');
assert(!bundle.includes('google-client.generated.json'));assert(!bundle.includes('atob(downloads'));
const shipped=(await import(pathToFileURL(build.output))).default;
const origin='https://quiet-shelf.example.workers.dev',clientId='123456-webclient.apps.googleusercontent.com';
const env={QUIET_SHELF_PUBLIC_ORIGIN:origin,QUIET_SHELF_GOOGLE_WEB_CLIENT_ID:clientId,QUIET_SHELF_GOOGLE_WEB_CLIENT_SECRET:'test-only-web-secret',QUIET_SHELF_SESSION_KEY:Buffer.alloc(32,42).toString('base64')};
assert.equal((await shipped.fetch(new Request(origin+'/'),env)).status,200);
assert.equal((await shipped.fetch(new Request(origin+'/'))).status,403);
let response=await shipped.fetch(new Request(origin+'/'),env);const html=await response.text();
assert(html.indexOf('/drive-client.js')<html.indexOf('/account.js'));
assert.equal(response.headers.get('Cache-Control'),'no-store');assert.match(response.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);
assert.equal((await shipped.fetch(new Request(origin+'/',{method:'HEAD'}),env)).body,null);
for(const path of ['/account.js','/drive-client.js','/sync-core.js','/read-next.js','/legal.js','/icon.png'])assert.equal((await shipped.fetch(new Request(origin+path),env)).status,200);
assert.equal((await shipped.fetch(new Request(origin+'/credentials.json'),env)).status,404);
assert.equal((await shipped.fetch(new Request(origin+'/private/browser-session.key'),env)).status,404);
assert.equal((await shipped.fetch(new Request(origin+'/privacy'),env)).headers.get('Location'),'https://ayca-kaygusuz.github.io/quiet-shelf-public/privacy.html');
assert(!JSON.stringify(await (await shipped.fetch(new Request(origin+'/_health'),env)).json()).includes('test-only-web-secret'));
let seen;
const routing=createHostedWorker({html:'',assets:{},icon:'',catalogHandler:async request=>{seen=request;return Response.json({results:[]})},accountFactory:()=>({handle:async request=>{seen=request;return Response.json({})}})});
await routing.fetch(new Request(origin+'/api/books?source=google&q=test',{headers:{Cookie:'private=1',Authorization:'private','X-Google-Api-Key':'test-only-key'}}),env);
assert.equal(seen.headers.get('Cookie'),null);assert.equal(seen.headers.get('Authorization'),null);assert.equal(seen.headers.get('X-Google-Api-Key'),'test-only-key');
await routing.fetch(new Request(origin+'/api/books?source=kitapyurdu&q=test',{headers:{'X-Google-Api-Key':'test-only-key'}}),env);assert.equal(seen.headers.get('X-Google-Api-Key'),null);
await routing.fetch(new Request(origin+'/api/account/status',{headers:{'oai-authenticated-user-id':'spoofed'}}),env);assert.equal(seen.headers.get('oai-authenticated-user-id'),null);
assert.equal((await routing.fetch(new Request(origin+'/api/books?q=test',{headers:{Origin:'https://other.example'}}),env)).status,403);
assert.equal((await routing.fetch(new Request(origin+'/api/account/start',{headers:{'Sec-Fetch-Site':'cross-site'}}),env)).status,403);

// Exercise real encrypted Web OAuth cookies and the browser merge transport
// against simulated Google endpoints. No real user or Google token is used.
const files=new Map(),calls=[],jar=new Map();let sequence=0,failUpload=false;
const S=globalThis.QuietShelfSync;
const provider=async(url,settings={})=>{
 const u=new URL(url);calls.push({url:String(url),method:settings.method||'GET'});
 assert.equal(new Headers(settings.headers).get('Cookie'),null);
 if(u.hostname==='oauth2.googleapis.com')return Response.json({access_token:'test-access',refresh_token:'test-refresh',scope:'openid email profile https://www.googleapis.com/auth/drive.appdata'});
 if(u.hostname==='openidconnect.googleapis.com')return Response.json({sub:'101',email:'reader@example.invalid',email_verified:true,name:'Test reader'});
 assert.equal(u.hostname,'www.googleapis.com');assert.equal(new Headers(settings.headers).get('Authorization'),'Bearer test-access');
 if(u.pathname==='/drive/v3/files')return Response.json({files:[...files].map(([id,state])=>({id,version:'1',size:JSON.stringify(state).length}))});
 if(u.pathname==='/upload/drive/v3/files'){
  if(failUpload)return Response.json({error:{}},{status:503});
  const body=typeof settings.body==='string'?settings.body:await new Response(settings.body).text();
  const metadata=JSON.parse(body.split('\r\n\r\n')[1].split('\r\n--')[0]);assert.deepEqual(metadata.parents,['appDataFolder']);assert.equal(metadata.appProperties.quietShelf,'sync-v1');
  const state=JSON.parse(body.split('\r\n\r\n')[2].split('\r\n--')[0]);S.validate(state);const id='file'+(++sequence);files.set(id,state);return Response.json({id,version:'1'});
 }
 const id=u.pathname.split('/').at(-1);
 if(settings.method==='DELETE'){files.delete(id);return new Response(null,{status:204})}
 assert(files.has(id));return Response.json(files.get(id));
};
const worker=createHostedWorker({html:'',assets:{},icon:'',accountFactory:(environment,options)=>createWebAccount(environment,{...options,fetcher:provider})});
function remember(r){for(const item of r.headers.getSetCookie()){const pair=item.split(';')[0],i=pair.indexOf('='),k=pair.slice(0,i),v=pair.slice(i+1);if(item.includes('Max-Age=0'))jar.delete(k);else jar.set(k,v)}}
async function call(path,settings={}){const headers=new Headers(settings.headers);headers.set('Cookie',[...jar].map(([k,v])=>k+'='+v).join('; '));const r=await worker.fetch(new Request(origin+path,{...settings,headers}),env);remember(r);return r}
response=await call('/api/account/start');const authorization=new URL(response.headers.get('Location'));assert.equal(authorization.hostname,'accounts.google.com');
assert.equal(authorization.searchParams.get('redirect_uri'),origin+'/api/account/callback');
assert.equal((await call('/api/account/callback?state=wrong&code=test')).status,403);
response=await call('/api/account/start');const second=new URL(response.headers.get('Location'));
await call('/api/account/callback?'+new URLSearchParams({state:second.searchParams.get('state'),code:'test-only-code'}),{headers:{'Sec-Fetch-Site':'cross-site'}});
const status=await (await call('/api/account/status')).json();assert.equal(status.account.id,'101');assert.equal(status.syncTransport,'browser-v1');assert(!JSON.stringify(status).includes('test-refresh'));
const driveHeaders={'Content-Type':'application/json','X-Quiet-Shelf-Account':'1','X-Quiet-Shelf-Account-Id':'202',Origin:origin};
const before=calls.length;assert.equal((await call('/api/account/drive/list',{method:'POST',headers:driveHeaders})).status,403);assert.equal(calls.length,before);
const clientSource=await (await shipped.fetch(new Request(origin+'/drive-client.js'),env)).text();
const client={QuietShelfSync:S,fetch:async(path,settings)=>call(path,{...settings,headers:{...settings.headers,Origin:origin}}),TextDecoder,TextEncoder,Response,Request,Headers,AbortSignal,crypto,console};
vm.createContext(client);vm.runInContext(clientSource,client);
const local=S.update(S.empty(),{library:[{id:'one',title:'Synthetic local title',author:'Test author',status:'Unread',history:[]}],preferences:{theme:'sage'}},'local');
let result=await client.QuietShelfHostedSync.sync({accountId:'101',state:local,readOnly:true});assert.equal(files.size,0);assert.equal(result.state.registers.length,0);
result=await client.QuietShelfHostedSync.sync({accountId:'101',state:local});assert.equal(S.project(result.state).library[0].title,'Synthetic local title');assert.equal(files.size,1);
const remote=S.update(S.empty(),{library:[{id:'two',title:'Synthetic native title',status:'Done',history:[]}],preferences:{}},'native');files.set('native1',remote);
const existing=[...files.keys()];failUpload=true;await assert.rejects(()=>client.QuietShelfHostedSync.sync({accountId:'101',state:local}));assert.deepEqual([...files.keys()],existing,'failed upload must retain all prior checkpoints');failUpload=false;
result=await client.QuietShelfHostedSync.sync({accountId:'101',state:local});assert.deepEqual(S.project(result.state).library.map(b=>b.title).sort(),['Synthetic local title','Synthetic native title']);assert.equal(files.size,1);
response=await call('/api/account/drive/create',{method:'POST',headers:{...driveHeaders,'X-Quiet-Shelf-Account-Id':'101','Content-Length':String(S.MAX_BYTES+1)},body:'{}'});assert.equal(response.status,413);
response=await call('/api/account/sync',{method:'POST',headers:{...driveHeaders,'X-Quiet-Shelf-Account-Id':'101'},body:JSON.stringify({accountId:'101',state:local})});assert.equal(response.status,409);
assert(!clientSource.includes('test-refresh'));assert(!clientSource.includes('test-only-web-secret'));

// Upload metadata must retain an existing session secret on every deployment.
for(const existingKey of [false,true]){
 let metadata,keyCalls=0;
 const cloud=async(url,settings={})=>{
  const u=new URL(url);assert.equal(u.hostname,'api.cloudflare.com');assert.equal(settings.headers.Authorization,'Bearer synthetic-cloudflare-token');
  if(u.pathname.endsWith('/workers/subdomain'))return Response.json({success:true,result:{subdomain:'example'}});
  if(u.pathname.endsWith('/secrets'))return existingKey?Response.json({success:true,result:[{name:'QUIET_SHELF_SESSION_KEY',type:'secret_text'}]}):Response.json({success:false},{status:404});
  if(settings.method==='PUT'){metadata=JSON.parse(await settings.body.get('metadata').text());assert(!await settings.body.get('index.mjs').text().then(s=>s.includes('test-only-web-secret')))}
  return Response.json({success:true,result:{enabled:true}});
 };
 const result=await deployHosted({accountId:'a'.repeat(32),token:'synthetic-cloudflare-token',clientId,credential:'test-only-web-secret',sourceSHA:'b'.repeat(40),workerSource:bundle,fetcher:cloud,checkGoogle:false,randomKey:()=>{keyCalls++;return Buffer.alloc(32,1).toString('base64')}});
 assert.equal(result.origin,origin);assert.equal(keyCalls,existingKey?0:1);assert.deepEqual(metadata.keep_bindings,['secret_text']);assert.equal(metadata.observability.enabled,false);assert.equal(metadata.logpush,false);
 assert.equal(metadata.bindings.some(b=>b.name==='QUIET_SHELF_SESSION_KEY'),!existingKey);
 assert.equal(metadata.bindings.find(b=>b.name==='QUIET_SHELF_GOOGLE_WEB_CLIENT_SECRET').text,'test-only-web-secret');
}
globalThis.fetch=originalFetch;
console.log('PASS: hosted routes/CSP, private header/key isolation, OAuth/PKCE, encrypted cookie continuity, streaming Drive proxy and browser merge, read-only preview, failed-upload recovery, legacy native protocol, deployment session-key preservation, and no bundled runtime credentials.');

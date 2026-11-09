import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {once} from 'node:events';
import {APP_VERSION,createBrowserReleaseHandler} from '../src/releases.mjs';
import {createLocalServer} from '../pc/server.mjs';
assert.equal(JSON.parse(await readFile('package.json','utf8')).version,APP_VERSION);
const assetRoot='https://github.com/ayca-kaygusuz/quiet-shelf-public/releases/download/v0.99.0/',digest='a'.repeat(64),calls=[];
const fetcher=async(url,options)=>{
 calls.push(String(url));const headers=new Headers(options.headers);
 for(const name of ['Cookie','Authorization','X-Google-Api-Key','X-Goog-Api-Key'])assert.equal(headers.get(name),null);
 if(String(url).startsWith('https://api.github.com/'))return Response.json({tag_name:'v0.99.0',assets:[{name:'quiet-shelf-pc.zip',size:123,digest:'sha256:'+digest,browser_download_url:assetRoot+'quiet-shelf-pc.zip'},{name:'SHA256SUMS.txt',browser_download_url:assetRoot+'SHA256SUMS.txt'}]});
 assert.equal(url,assetRoot+'SHA256SUMS.txt');return new Response(digest+'  quiet-shelf-pc.zip\n');
};
let clock=1000000;const handler=createBrowserReleaseHandler({fetcher,clock:()=>clock}),origin='https://shelf.example.invalid';
let response=await handler(new Request(origin+'/api/update-check'));
assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal((await response.json()).version,'0.99.0');assert.equal(calls.length,2);
await handler(new Request(origin+'/api/update-check'));assert.equal(calls.length,2,'shared browser metadata cache avoids duplicate upstream checks');
assert.equal((await handler(new Request(origin+'/api/update-check',{headers:{Origin:'https://evil.example'}}))).status,403);
assert.equal((await handler(new Request(origin+'/api/update-check',{method:'POST'}))).status,405);
clock+=300001;await handler(new Request(origin+'/api/update-check'));assert.equal(calls.length,4);
const server=createLocalServer({accountEnvironment:{},desktopConfiguration:null,fetcher});server.listen(0,'127.0.0.1');await once(server,'listening');
try{
 response=await fetch('http://127.0.0.1:'+server.address().port+'/api/update-check',{headers:{Cookie:'private-cookie',Authorization:'private-user-token','X-Google-Api-Key':'private-books-key'}});
 assert.equal(response.status,200);const payload=await response.text();assert(payload.includes('0.99.0'));assert(!payload.includes('private-'));
}finally{await new Promise(resolve=>server.close(resolve))}
console.log('PASS: browser release metadata, version parity, bounded trusted assets, shared caching, local HTTP adapter and no account/key forwarding');

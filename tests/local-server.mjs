import assert from 'node:assert/strict';
import {request} from 'node:http';
import {once} from 'node:events';
import {createLocalServer} from '../pc/server.mjs';

// Exercise the real HTTP boundary: testing catalog() alone misses dropped headers.
const server=createLocalServer(),originalFetch=globalThis.fetch,calls=[];
const volume={id:'test-volume',volumeInfo:{title:'Test catalog result',language:'en'}};
globalThis.fetch=async(url,options)=>{
  const headers=new Headers(options.headers);
  calls.push({url:String(url),headers});
  if(String(url).startsWith('https://graphql.anilist.co'))return Response.json({data:{Page:{media:[]}}});
  assert.equal(new URL(url).hostname,'www.googleapis.com');
  assert.equal(headers.get('Cookie'),null);
  assert.equal(headers.get('Authorization'),null);
  assert(!String(url).includes('test-only-key'));
  if(headers.get('X-Goog-Api-Key')!=='test-only-key')return Response.json({error:{code:429}},{status:429});
  return Response.json(new URL(url).pathname.endsWith('/test-volume')?volume:{items:[volume]});
};

try{
  server.listen(0,'127.0.0.1');
  await once(server,'listening');
  const port=server.address().port,origin=`http://127.0.0.1:${port}`;
  function get(path,headers={}){
    return new Promise((resolve,reject)=>{
      const req=request({hostname:'127.0.0.1',port,path,headers},res=>{
        let body='';res.setEncoding('utf8');res.on('data',chunk=>body+=chunk);
        res.on('end',()=>resolve({status:res.statusCode,body}));
      });
      req.on('error',reject);req.end();
    });
  }
  let response=await get('/api/books?source=google&lang=en&q=test');
  assert.equal(response.status,502);
  assert.equal(JSON.parse(response.body).code,'GOOGLE_QUOTA');
  assert.equal(calls.at(-1).headers.get('X-Goog-Api-Key'),null);

  const headers={'X-Google-Api-Key':'  test-only-key  ',Origin:origin,Cookie:'private-cookie',Authorization:'private-auth'};
  response=await get('/api/books?source=google&lang=en&q=test',headers);
  assert.equal(response.status,200);
  assert.equal(JSON.parse(response.body).results[0].title,'Test catalog result');
  assert.equal(calls.at(-1).headers.get('X-Goog-Api-Key'),'test-only-key');
  assert(!response.body.includes('test-only-key'));
  response=await get('/api/book?source=google&url='+encodeURIComponent('https://books.google.com/books?id=test-volume'),headers);
  assert.equal(response.status,200);
  assert.equal(JSON.parse(response.body).title,'Test catalog result');
  assert.equal(calls.at(-1).headers.get('X-Goog-Api-Key'),'test-only-key');

  await get('/api/books?source=anilist&q=test',headers);
  assert.equal(calls.at(-1).headers.get('X-Goog-Api-Key'),null);
  const before=calls.length;
  assert.equal((await get('/api/books?source=google&q=test',{...headers,Host:'evil.example'})).status,403);
  assert.equal((await get('/api/books?source=google&q=test',{...headers,Origin:'https://evil.example'})).status,403);
  assert.equal(calls.length,before);
  assert.equal((await get('/')).status,200);
  for(const asset of ['/account.js','/sync-core.js'])assert.equal((await get(asset)).status,200);
  assert.equal(JSON.parse((await get('/api/account/status')).body).mode,'local');
  assert.equal((await get('/private')).status,404);
  console.log('PASS: local HTTP search/details forward the Google key, trim it, isolate it from other providers, and preserve host/origin checks');
}finally{
  globalThis.fetch=originalFetch;
  await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
}

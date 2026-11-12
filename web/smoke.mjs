// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0

import {appendFileSync} from 'node:fs';
const origin=process.env.QUIET_SHELF_WEB_ORIGIN;
if(!/^https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev$/.test(origin||''))throw Error('Use the deployed HTTPS workers.dev origin.');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let health;const readyDeadline=Date.now()+5*60000;
for(let attempt=0;;attempt++){
 try{const r=await fetch(origin+'/_health',{signal:AbortSignal.timeout(10000)});if(r.ok){health=await r.json();break}console.log('Waiting for the new HTTPS endpoint: HTTP '+r.status)}catch(error){console.log('Waiting for HTTPS readiness: '+(error.cause?.code||error.name||'network error'))}
 if(Date.now()>=readyDeadline)throw Error('The deployed HTTPS endpoint is not reachable after five minutes. Check Cloudflare routing/TLS before retrying.');await pause(10000);
}
if(!health.googleConfigured||health.source!==process.env.GITHUB_SHA)throw Error('The deployed source or Google server configuration does not match this run.');
for(const path of ['/','/account.js','/read-next.js','/sync-core.js','/drive-client.js','/legal.js','/icon.png']){
 const r=await fetch(origin+path,{signal:AbortSignal.timeout(20000)});if(!r.ok||r.headers.get('Cache-Control')!=='no-store')throw Error('A required app route failed: '+path);
}
const status=await (await fetch(origin+'/api/account/status')).json();if(status.account||status.mode!=='web'||status.syncTransport!=='browser-v1')throw Error('A new browser must start signed out with the hosted sync transport.');
const start=await fetch(origin+'/api/account/start',{redirect:'manual',signal:AbortSignal.timeout(20000)}),authorization=new URL(start.headers.get('Location')||origin);
if(start.status!==303||authorization.hostname!=='accounts.google.com'||authorization.searchParams.get('redirect_uri')!==origin+'/api/account/callback'||authorization.searchParams.get('code_challenge_method')!=='S256')throw Error('The Google sign-in boundary failed.');
if(!start.headers.get('Set-Cookie')?.includes('HttpOnly')||!start.headers.get('Set-Cookie')?.includes('Secure'))throw Error('Google login cookies must be secure and HttpOnly.');
const findings=[];
for(const source of ['kitapyurdu','bkm','nadir','openlibrary','google','dnb','k10plus','thalia','hugendubel','lovelybooks','blackwells','betterworld','anilist']){
 try{
  const r=await fetch(origin+'/api/books?'+new URLSearchParams({source,q:'9780747532743',lang:''}),{signal:AbortSignal.timeout(30000)});
  let data;try{data=await r.json()}catch{}
  const finding={source,status:r.status,results:Array.isArray(data?.results)?data.results.length:null,code:typeof data?.code==='string'?data.code:''};findings.push(finding);console.log(JSON.stringify(finding));
 }catch{findings.push({source,status:'unreachable',results:null,code:''});console.log(source+': hosted request unavailable')}
}
if(process.env.GITHUB_STEP_SUMMARY)appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n## Live hosted catalog checks\n\n| Source | HTTP | Results | Code |\n| --- | --- | --- | --- |\n'+findings.map(x=>`| ${x.source} | ${x.status} | ${x.results??'—'} | ${x.code||'—'} |`).join('\n')+'\n\nCatalog blocks, quotas, and empty indexes are reported independently; these probes do not prove user Google consent or real-account sync.\n');
console.log('Hosted app and OAuth request checks passed. Review the catalog findings and complete real Google consent/Drive sync before general availability.');

// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0
import {catalog} from './catalog.mjs';
import {createDriveStore,reconcileDrive,limitedJSON} from './drive.mjs';
import {latestUpdate} from './releases.mjs';
const S=globalThis.QuietShelfSync,rpc=(...args)=>globalThis.QuietShelfIOS.rpc(...args);
let busy=false,cache=new Map(),syncAccountId=null;
export async function external(request){
 if(request.signal.aborted)throw new DOMException('Request aborted','AbortError');
 const body=['GET','HEAD'].includes(request.method)?null:await request.text();
 const raw=await rpc('http',{url:request.url,method:request.method,headers:Object.fromEntries(request.headers),body,accountId:syncAccountId},request.signal);
 if(request.signal.aborted)throw new DOMException('Request aborted','AbortError');
 if(raw.status>=300&&raw.status<400&&request.redirect==='error')throw Error('Unexpected redirect');
 if(raw.status>=300&&raw.status<400&&request.redirect!=='manual')throw Error('The source redirected unexpectedly. Try another source.');
 return new Response([204,205,304].includes(raw.status)?null:raw.body,{status:raw.status,headers:raw.headers});
}
const json=value=>Response.json(value,{headers:{'Cache-Control':'no-store'}});
export async function handle(request){
 const u=new URL(request.url),path=u.pathname;
 if(['/api/books','/api/book'].includes(path))return catalog(request);
 if(path==='/api/update-check'){
  if(request.method!=='GET')return json({error:'Method not allowed'});
  try{const version=(await rpc('app.info')).version,update=await latestUpdate(version,{kind:'ios',fetcher:fetch});return json({phase:update?'available':'up-to-date',version:update?.version||'',checkedAt:Date.now()})}catch{return Response.json({error:'Update service unavailable'},{status:503})}
 }
 if(!path.startsWith('/api/account/'))return new Response('Not found',{status:404});
 const action=path.slice('/api/account/'.length);
 try{
  if(action==='status'&&request.method==='GET'){const value=await rpc('account.status');return json({...value,busy})}
  if(request.method!=='POST'||request.headers.get('X-Quiet-Shelf-Account')!=='1')return new Response('Invalid account request',{status:403});
  if(['start','cancel','signout'].includes(action)){if(busy)return Response.json({error:'Wait for the current sync to finish.'},{status:409});if(action==='signout')cache.clear();return json(await rpc('account.'+action))}
  if(action!=='sync')return new Response('Not found',{status:404});
  if(busy)return Response.json({error:'Sync is already running.'},{status:409});
  const data=await limitedJSON(request,S.MAX_BYTES+2048),status=await rpc('account.status');
  if(!status.account||status.account.id!==data.accountId)return Response.json({error:'Sign in to this Google account again.',code:'SIGN_IN_REQUIRED'},{status:401});
  if(status.network?.online===false)throw Error('Offline. Your local library is kept on this device.');
  if(!data.manual&&data.meteredOverride!==false&&status.network?.metered===true)return json({paused:true,network:status.network});
  busy=true;syncAccountId=data.accountId;
  try{
   const store=createDriveStore({accessToken:async force=>{if(force)await rpc('account.clearToken');return 'native-account'},fetcher:fetch});
   const result=await reconcileDrive({state:data.readOnly===true?S.empty():data.state,readOnly:data.readOnly===true,cache,store});cache=result.cache;
   const after=await rpc('account.status');if(after.account?.id!==data.accountId)throw Error('The Google account changed during sync. Your local library is kept.');
   return json({state:result.state,hasRemote:result.hasRemote,account:after.account});
  }finally{busy=false;syncAccountId=null}
 }catch(error){return Response.json({error:error.message||'The connection could not be completed.',code:error.code||'IOS_ACCOUNT_ERROR'},{status:error.code==='SIGN_IN_REQUIRED'?401:400})}
}

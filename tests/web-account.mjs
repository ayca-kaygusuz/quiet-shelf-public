import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createWebAccount,googleWebConfiguration} from '../src/web-account.mjs';
import {createLocalServer} from '../pc/server.mjs';
const S=globalThis.QuietShelfSync,webId='123456-webclient.apps.googleusercontent.com',desktopId='123456-desktopclient.apps.googleusercontent.com',credential='test-only-application',sessionKey=Buffer.alloc(32,42).toString('base64');
const files=new Map(),calls=[];let counter=0;
const provider=async(url,options={})=>{
 const u=new URL(url);calls.push({url:String(url),options});assert.equal(new Headers(options.headers).get('Cookie'),null);
 if(u.hostname==='oauth2.googleapis.com'){
  assert.equal(options.body.get('client_secret'),credential);assert([webId,desktopId].includes(options.body.get('client_id')));
  if(options.body.get('grant_type')==='authorization_code'){assert.equal(options.body.get('code'),'test-only-code');assert(options.body.get('code_verifier').length>=43)}else assert.equal(options.body.get('refresh_token'),'private-refresh');
  return Response.json({access_token:'private-access',refresh_token:'private-refresh',scope:'openid email profile https://www.googleapis.com/auth/drive.appdata'});
 }
 assert.equal(new Headers(options.headers).get('Authorization'),'Bearer private-access');
 if(u.hostname==='openidconnect.googleapis.com')return Response.json({sub:'101',email:'reader@example.invalid',email_verified:true,name:'A reader'});
 assert.equal(u.hostname,'www.googleapis.com');
 if(u.pathname==='/drive/v3/files')return Response.json({files:[...files].map(([id,state])=>({id,version:'1',size:JSON.stringify(state).length}))});
 if(u.pathname==='/upload/drive/v3/files'){const state=JSON.parse(options.body.split('\r\n\r\n')[2].split('\r\n--')[0]),id='file'+(++counter);files.set(id,state);return Response.json({id,version:'1'})}
 const id=u.pathname.split('/').at(-1);if(options.method==='DELETE'){files.delete(id);return new Response(null,{status:204})}return Response.json(files.get(id));
};
const environment={QUIET_SHELF_GOOGLE_WEB_CLIENT_ID:webId,QUIET_SHELF_GOOGLE_WEB_CLIENT_SECRET:credential,QUIET_SHELF_SESSION_KEY:sessionKey,QUIET_SHELF_PUBLIC_ORIGIN:'https://shelf.example.invalid'};
const backend=createWebAccount(environment,{fetcher:provider}),origin=environment.QUIET_SHELF_PUBLIC_ORIGIN,jar=new Map();
function remember(response,target=jar){for(const cookie of response.headers.getSetCookie()){const [pair]=cookie.split(';'),index=pair.indexOf('='),name=pair.slice(0,index),value=pair.slice(index+1);if(cookie.includes('Max-Age=0;')||cookie.endsWith('Max-Age=0'))target.delete(name);else target.set(name,value)}}
const cookieHeader=()=>[...jar].map(([k,v])=>k+'='+v).join('; ');
async function call(path,body,extra={}){return backend.handle(new Request(origin+'/api/account/'+path,{method:body===undefined?'GET':'POST',headers:{Cookie:cookieHeader(),'oai-authenticated-user-id':'visitor-a',...(body===undefined?{}:{Origin:origin,'Content-Type':'application/json','X-Quiet-Shelf-Account':'1'}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})}))}
assert.equal((await (await call('status')).json()).configured,true);
assert.equal((await call('start',undefined,{'Sec-Fetch-Site':'cross-site'})).status,403);
let response=await call('start');assert.equal(response.status,303);const authorization=new URL(response.headers.get('Location'));assert.equal(authorization.hostname,'accounts.google.com');assert.equal(authorization.searchParams.get('code_challenge_method'),'S256');assert(response.headers.get('Set-Cookie').includes('HttpOnly'));assert(response.headers.get('Set-Cookie').includes('Secure'));remember(response);
assert.equal((await call('callback?state=wrong&code=test-only-code')).status,403);
response=await call('callback?'+new URLSearchParams({state:authorization.searchParams.get('state'),code:'test-only-code'}));assert.equal(response.status,303);remember(response);assert.equal(jar.has('__Host-quiet-shelf-login'),false);assert(!cookieHeader().includes('private-refresh'));
const status=await (await call('status')).json();assert.equal(status.account.id,'101');assert(!JSON.stringify(status).includes(credential));assert(!JSON.stringify(status).includes('private-'));
assert.equal((await (await call('status',undefined,{'oai-authenticated-user-id':'visitor-b'})).json()).account,null,'hosted site identities cannot reuse another visitor’s encrypted session');
assert.equal((await backend.handle(new Request('https://other.example.invalid/api/account/status'))).status,403);
assert.equal((await (await backend.handle(new Request(origin+'/api/account/status'))).json()).account,null,'another browser profile starts signed out');
const state=S.update(S.empty(),{library:[{id:'one',title:'A title',status:'Unread',history:[]}],preferences:{theme:'sage'}},'actor');
assert.equal((await call('sync',{accountId:'202',state})).status,403);assert.equal((await call('sync',{accountId:'101',state},{Origin:'https://evil.example'})).status,403);
response=await call('sync',{accountId:'101',state,readOnly:true});assert.equal((await response.json()).state.registers.length,0);assert.equal(files.size,0,'web first-sync checks upload no local data');
response=await call('sync',{accountId:'101',state});assert.equal(S.project((await response.json()).state).library[0].title,'A title');assert.equal(files.size,1);
const restarted=createWebAccount(environment,{fetcher:provider});assert.equal((await (await restarted.handle(new Request(origin+'/api/account/status',{headers:{Cookie:cookieHeader(),'oai-authenticated-user-id':'visitor-a'}}))).json()).account.id,'101','encrypted browser connection survives server restart');
remember(await call('signout',{}));assert.equal((await (await call('status')).json()).account,null);assert.equal(files.size,1);
assert.equal(googleWebConfiguration({credentialValue:JSON.stringify({web:{client_id:webId,client_secret:credential}})}).clientId,webId);assert.throws(()=>googleWebConfiguration({credentialValue:JSON.stringify({installed:{client_id:desktopId,client_secret:credential}})}));
// Exercise the packaged local-browser HTTP boundary and separate cookies.
const server=createLocalServer({accountEnvironment:{},desktopConfiguration:{clientId:desktopId,clientSecret:credential},sessionKey,fetcher:provider});server.listen(0,'127.0.0.1');await once(server,'listening');const localOrigin='http://127.0.0.1:'+server.address().port;
try{
 let r=await fetch(localOrigin+'/api/account/status');assert.equal((await r.json()).configured,true);
 r=await fetch(localOrigin+'/api/account/start',{redirect:'manual'});assert.equal(r.status,303);const localJar=new Map();remember(r,localJar);const google=new URL(r.headers.get('Location'));assert.equal(google.searchParams.get('client_id'),desktopId);assert.equal(google.searchParams.get('redirect_uri'),localOrigin+'/api/account/callback');
 const callback=new URL(google.searchParams.get('redirect_uri'));callback.search=new URLSearchParams({state:google.searchParams.get('state'),code:'test-only-code'});
 r=await fetch(callback,{redirect:'manual',headers:{Cookie:[...localJar].map(([k,v])=>k+'='+v).join('; ')}});assert.equal(r.status,303);remember(r,localJar);const browserCookie=[...localJar].map(([k,v])=>k+'='+v).join('; ');
 assert.equal((await (await fetch(localOrigin+'/api/account/status',{headers:{Cookie:browserCookie}})).json()).account.id,'101');assert.equal((await (await fetch(localOrigin+'/api/account/status')).json()).account,null);
 assert.equal((await fetch(localOrigin+'/api/account/signout',{method:'POST',headers:{Cookie:browserCookie,Origin:'https://evil.example','X-Quiet-Shelf-Account':'1'}})).status,403);
}finally{await new Promise(resolve=>server.close(resolve))}
console.log('PASS: hosted Web and local-browser OAuth, state/PKCE, encrypted HttpOnly remembered sessions, visitor/profile separation, sign-out, shared Drive state, read-only first-sync checks and real HTTP cookie/header forwarding');

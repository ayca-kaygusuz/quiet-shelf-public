import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {request as httpRequest} from 'node:http';
import {createGoogleAccount} from '../desktop/google-account.mjs';
import {createAppHandler,APP_ORIGIN} from '../desktop/app-protocol.mjs';
import {readFileSync} from 'node:fs';
import '../src/sync-core.js';

const profile=await mkdtemp(join(tmpdir(),'quiet-shelf-auth-')),clientId='123456-testclient.apps.googleusercontent.com',opened=[],calls=[];
const safeStorage={isEncryptionAvailable:()=>true,getSelectedStorageBackend:()=> 'test-keyring',encryptString:value=>Buffer.from('encrypted:'+Buffer.from(value).toString('base64')),decryptString:value=>Buffer.from(value.toString().slice(10),'base64').toString()};
let files=new Map(),nextFile=0;
const fetcher=async(url,options={})=>{
 calls.push({url:String(url),options});const u=new URL(url);
 if(u.hostname==='oauth2.googleapis.com'){
  const params=options.body;assert.equal(params.get('client_id'),clientId);assert.equal(params.get('client_secret'),null,'PKCE public desktop flow sends no client secret');
  if(params.get('grant_type')==='authorization_code'){assert(params.get('code_verifier')?.length>=43);assert.equal(params.get('code'),'code-for-test');assert(params.get('redirect_uri').startsWith('http://127.0.0.1:'))}
  else assert.equal(params.get('refresh_token'),'private-test-refresh');
  return Response.json({access_token:'private-test-access',refresh_token:'private-test-refresh',scope:'openid email profile https://www.googleapis.com/auth/drive.appdata'});
 }
 assert.equal(options.headers.Authorization,'Bearer private-test-access');
 if(u.hostname==='openidconnect.googleapis.com')return Response.json({sub:'101',email:'reader@example.invalid',name:'A reader',email_verified:true});
 assert.equal(u.hostname,'www.googleapis.com');
 if(u.pathname==='/drive/v3/files')return Response.json({files:[...files].map(([id,value])=>({id,version:'1',size:JSON.stringify(value).length}))});
 if(u.pathname==='/upload/drive/v3/files'){
  const pieces=options.body.split('\r\n\r\n');const state=JSON.parse(pieces[2].split('\r\n--')[0]);const id='file'+(++nextFile);files.set(id,state);return Response.json({id,version:'1'});
 }
 const id=u.pathname.split('/').at(-1);if(options.method==='DELETE'){files.delete(id);return new Response(null,{status:204})}return Response.json(files.get(id));
};
const options={profile,safeStorage,openExternal:async url=>opened.push(url),fetcher,platform:'linux',defaultClientId:clientId};
let account=createGoogleAccount(options);
const request=(path,body)=>account.handle(new Request(APP_ORIGIN+'/api/account/'+path,{method:body===undefined?'GET':'POST',...(body===undefined?{}:{body:JSON.stringify(body)})}));
function callback(url){return new Promise((resolve,reject)=>{httpRequest(url,res=>{let body='';res.on('data',chunk=>body+=chunk);res.on('end',()=>resolve({status:res.statusCode,body}))}).on('error',reject).end()})}
try{
 await account.ready;assert.equal(account.status().configured,true);assert.equal(account.status().account,null);assert.equal(account.status().error,'');
 assert.equal((await request('start',{})).status,200);assert.equal(account.status().pending,true);
 const auth=new URL(opened.at(-1));assert.equal(auth.hostname,'accounts.google.com');assert.equal(auth.searchParams.get('code_challenge_method'),'S256');assert(!auth.searchParams.get('scope').includes('drive.file'));
 const target=new URL(auth.searchParams.get('redirect_uri'));target.search=new URLSearchParams({state:'wrong',code:'code-for-test'});assert.equal((await callback(target)).status,403);assert.equal(calls.length,0);
 target.search=new URLSearchParams({state:auth.searchParams.get('state'),code:'code-for-test'});assert.equal((await callback(target)).status,200);assert.equal(account.status().pending,false);assert.equal(account.status().account.id,'101');assert.equal(account.status().busy,false);
 const encrypted=await readFile(join(profile,'drive-session.bin'),'utf8');assert(!encrypted.includes('private-test-refresh'));
 assert(!JSON.stringify(account.status()).includes('private-test'));assert(!JSON.stringify(await (await request('status')).json()).includes('private-test'));
 const S=globalThis.QuietShelfSync,state=S.update(S.empty(),{library:[{id:'a',title:'A title',status:'Unread',history:[]}],preferences:{theme:'sage'}},'actor');
 assert.equal((await request('sync',{accountId:'202',state,manual:true})).status,400);assert.equal(files.size,0);
 const synced=await (await request('sync',{accountId:'101',state,manual:true})).json();assert.equal(synced.account.id,'101');assert.equal(S.project(synced.state).library.length,1);assert.equal(files.size,1);assert(!JSON.stringify(synced).includes('private-test'));
 account.dispose();account=createGoogleAccount(options);await account.ready;assert.equal(account.status().account.id,'101','remembered identity and refresh token restore from encrypted storage');
 // Guard the actual native protocol, including cross-origin/preflight and body limits.
 const html=readFileSync('src/index.html','utf8'),handler=createAppHandler({html,catalog:()=>{},account,assets:{'/account.js':'/* account */'}});
 assert.equal((await handler(new Request(APP_ORIGIN+'/account.js'))).status,200);
 assert.equal((await handler(new Request(APP_ORIGIN+'/api/account/signout',{method:'POST',headers:{Origin:'https://evil.example','X-Quiet-Shelf-Account':'1'}}))).status,403);
 assert.equal((await handler(new Request(APP_ORIGIN+'/api/account/signout',{method:'POST'}))).status,403);
 assert.equal((await handler(new Request(APP_ORIGIN+'/api/account/signout',{method:'OPTIONS'}))).status,405);
 assert.equal((await handler(new Request(APP_ORIGIN+'/api/account/sync',{method:'POST',headers:{'X-Quiet-Shelf-Account':'1','Content-Length':'20000000'},body:'{}'}))).status,400);
 assert.equal((await request('signout',{})).status,200);account.dispose();account=createGoogleAccount(options);await account.ready;assert.equal(account.status().account,null);assert.equal(files.size,1,'signing out never deletes Drive data');
 console.log('PASS: real loopback callback, state/PKCE, system-browser URL, secret-free desktop exchange, verified identity, encrypted remembered token, account binding, Drive round trip, guarded protocol and sign-out persistence');
}finally{account.dispose();await rm(profile,{recursive:true,force:true})}

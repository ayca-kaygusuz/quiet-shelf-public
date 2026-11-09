import assert from 'node:assert/strict';
import {exchangeGoogleCode,refreshGoogleToken,googleDesktopCredential,googleDesktopConfiguration} from '../src/google-oauth.mjs';
import {checkGoogleReleaseClient} from '../scripts/check-google-release.mjs';

const clientId='123456-testclient.apps.googleusercontent.com',clientSecret='test-only-desktop';
const argumentsForCode={clientId,clientSecret,code:'test-only-code',redirectURI:'http://127.0.0.1:49152/oauth/callback',verifier:'q'.repeat(43)};
let calls=[];
const success=async(url,options)=>{calls.push({url,options});assert.equal(options.body.get('client_secret'),clientSecret);return Response.json({access_token:'test-only-access'})};
await exchangeGoogleCode(argumentsForCode,success);await refreshGoogleToken({clientId,clientSecret,refreshToken:'test-only-refresh'},success);
assert.equal(calls.length,2);assert(calls.every(c=>c.url==='https://oauth2.googleapis.com/token'));assert(calls.every(c=>!c.url.includes(clientSecret)));
for(const [error,description,expected] of [
 ['invalid_request','client_secret is missing.','GOOGLE_CLIENT_CONFIGURATION'],
 ['invalid_client','Unrecognized application.','GOOGLE_CLIENT_CONFIGURATION'],
 ['invalid_grant','Expired authorization code.','SIGN_IN_REQUIRED'],
 ['access_denied','Refused.','SIGN_IN_REQUIRED'],
 ['server_error','Temporary failure.','GOOGLE_AUTH_UNAVAILABLE']
]){
 await assert.rejects(exchangeGoogleCode(argumentsForCode,async()=>Response.json({error,error_description:description+' PRIVATE-TOKEN-DO-NOT-ECHO'},{status:400})),failure=>{
  assert.equal(failure.code,expected);assert.equal(failure.oauthError,error);assert(!failure.message.includes('PRIVATE-TOKEN'));return true;
 });
}
await assert.rejects(exchangeGoogleCode(argumentsForCode,async()=>Response.json({error:'PRIVATE-TOKEN-DO-NOT-ECHO',error_description:'private'},{status:401})),failure=>failure.oauthError==='unknown_error'&&!failure.message.includes('PRIVATE'));
assert(!googleDesktopCredential(''));assert(!googleDesktopCredential('has whitespace'));assert(googleDesktopCredential(clientSecret));
for(const input of [clientSecret,' \n'+clientSecret+'\n ',JSON.stringify(clientSecret),JSON.stringify({installed:{client_id:clientId,client_secret:clientSecret}})])assert.equal(googleDesktopConfiguration({clientId,credentialValue:input}).clientSecret,clientSecret);
assert.equal(googleDesktopConfiguration({credentialValue:JSON.stringify({installed:{client_id:clientId,client_secret:clientSecret}})}).clientId,clientId);
assert(googleDesktopCredential('test-only+/=credential'));
assert.throws(()=>googleDesktopConfiguration({clientId,credentialValue:JSON.stringify({web:{client_id:clientId,client_secret:clientSecret}})}));
assert.throws(()=>googleDesktopConfiguration({clientId:'123456-other.apps.googleusercontent.com',credentialValue:JSON.stringify({installed:{client_id:clientId,client_secret:clientSecret}})}));
assert.throws(()=>googleDesktopConfiguration({clientId,credentialValue:'****'}));
const refused=async()=>Response.json({error:'invalid_grant'},{status:400});
await checkGoogleReleaseClient({clientId,clientSecret,fetcher:async(url,options)=>{assert.equal(options.body.get('client_secret'),clientSecret);assert.equal(options.body.get('refresh_token'),'quiet-shelf-nonexistent-release-probe');return refused()}});
await assert.rejects(checkGoogleReleaseClient({clientId,clientSecret:'',fetcher:()=>{throw Error('Must not call Google with missing build configuration')}}));
await assert.rejects(checkGoogleReleaseClient({clientId,clientSecret,fetcher:async()=>Response.json({error:'invalid_request',error_description:'client_secret is missing.'},{status:400})}));
console.log('PASS: Desktop app credential on code/refresh exchanges, redacted actionable errors and release preflight rejection of incomplete Google configuration');

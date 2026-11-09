import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {googleClientID,googleDesktopCredential,refreshGoogleToken} from '../src/google-oauth.mjs';

export async function checkGoogleReleaseClient({clientId,clientSecret,fetcher=fetch}){
 if(!googleClientID(clientId)||!googleDesktopCredential(clientSecret))throw Error('The release needs its Desktop OAuth client ID and client credential in Actions settings.');
 try{
  // No user account or real token is used. A nonexistent refresh token should
  // yield invalid_grant after Google accepts the application's client pair.
  await refreshGoogleToken({clientId,clientSecret,refreshToken:'quiet-shelf-nonexistent-release-probe'},fetcher);
 }catch(error){
  if(error.oauthError==='invalid_grant')return;
  throw Error('Google did not accept the release client configuration. Check the Desktop client credential and retry.');
 }
 throw Error('Google returned an unexpected response to the release configuration check.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{await checkGoogleReleaseClient({clientId:process.env.QUIET_SHELF_GOOGLE_DESKTOP_CLIENT_ID,clientSecret:process.env.QUIET_SHELF_GOOGLE_DESKTOP_CLIENT_SECRET});console.log('PASS: Google accepted the Desktop application credentials; no real user token was used.')}
 catch(error){console.error(error.message);process.exitCode=1}
}

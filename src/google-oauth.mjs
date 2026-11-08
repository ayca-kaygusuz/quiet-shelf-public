export const DRIVE_SCOPE='https://www.googleapis.com/auth/drive.appdata';
export const googleClientID=value=>typeof value==='string'&&/^[0-9]+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(value);
const base64url=bytes=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
export async function googlePKCE(){const verifier=base64url(crypto.getRandomValues(new Uint8Array(32)));return {verifier,challenge:base64url(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier)))),state:base64url(crypto.getRandomValues(new Uint8Array(32)))}}
export function googleAuthorizationURL({clientId,redirectURI,challenge,state}){
 if(!googleClientID(clientId))throw Error('Google sign-in needs a valid OAuth client ID.');
 const u=new URL('https://accounts.google.com/o/oauth2/v2/auth');u.search=new URLSearchParams({client_id:clientId,redirect_uri:redirectURI,response_type:'code',scope:'openid email profile '+DRIVE_SCOPE,access_type:'offline',prompt:'select_account consent',code_challenge:challenge,code_challenge_method:'S256',state});return u.href;
}
async function googleToken(parameters,fetcher){
 const response=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(parameters),redirect:'error',signal:AbortSignal.timeout(20000)});
 if(!response.ok){const error=Error(response.status===400||response.status===401?'Google sign-in expired or was refused. Please sign in again.':'Google could not be reached. Try again when you are online.');error.code='SIGN_IN_REQUIRED';throw error}
 const data=await response.json();if(typeof data.access_token!=='string'||data.access_token.length>8000||data.scope&&!data.scope.split(' ').includes(DRIVE_SCOPE))throw Error('Google Drive app-data permission was not granted.');return data;
}
export const exchangeGoogleCode=({clientId,clientSecret,code,redirectURI,verifier},fetcher=fetch)=>googleToken({client_id:clientId,...(clientSecret?{client_secret:clientSecret}:{}),code,redirect_uri:redirectURI,code_verifier:verifier,grant_type:'authorization_code'},fetcher);
export const refreshGoogleToken=({clientId,clientSecret,refreshToken},fetcher=fetch)=>googleToken({client_id:clientId,...(clientSecret?{client_secret:clientSecret}:{}),refresh_token:refreshToken,grant_type:'refresh_token'},fetcher);
export async function googleIdentity(accessToken,fetcher=fetch){
 const response=await fetcher('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:'Bearer '+accessToken},redirect:'error',signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('Google account details could not be verified.');const user=await response.json();
 if(typeof user.sub!=='string'||!/^\d{1,100}$/.test(user.sub)||typeof user.email!=='string'||user.email.length>320||user.email_verified!==true)throw Error('Google did not provide a verified account.');return {id:user.sub,email:user.email,name:typeof user.name==='string'?user.name.slice(0,200):user.email};
}

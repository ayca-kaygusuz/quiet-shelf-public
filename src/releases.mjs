export const RELEASES_URL='https://github.com/ayca-kaygusuz/quiet-shelf-public/releases/latest';
const apiURL='https://api.github.com/repos/ayca-kaygusuz/quiet-shelf-public/releases/latest';
const downloadRoot='https://github.com/ayca-kaygusuz/quiet-shelf-public/releases/download/';
const maxInstaller=300*1024*1024;
export const APP_VERSION='0.15.0';
export function releaseVersionParts(value){let match=String(value).match(/^v?(\d+)\.(\d+)\.(\d+)$/);if(!match)return null;let parts=match.slice(1).map(Number);return parts.every(Number.isSafeInteger)?parts:null}
export function newerVersion(candidate,current){let a=releaseVersionParts(candidate),b=releaseVersionParts(current);if(!a||!b)return false;for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i]}return false}
export function releaseSafeDownload(value){try{let u=new URL(value);return u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&(u.origin==='https://github.com'&&u.pathname.startsWith('/ayca-kaygusuz/quiet-shelf-public/releases/download/')||['release-assets.githubusercontent.com','objects.githubusercontent.com'].includes(u.hostname))}catch{return false}}
export async function releaseGet(url,fetcher,signal,installer=false){
  for(let redirects=0;redirects<5;redirects++){
    if(url!==apiURL&&!releaseSafeDownload(url))throw Error('Untrusted update download');
    const response=await fetcher(url,{redirect:'manual',headers:{Accept:url===apiURL?'application/vnd.github+json':'application/octet-stream','User-Agent':'QuietShelf updater'},signal:signal?AbortSignal.any([signal,AbortSignal.timeout(installer?600000:20000)]):AbortSignal.timeout(installer?600000:20000)});
    if(response.status>=300&&response.status<400){url=new URL(response.headers.get('Location'),url).href;continue}
    if(!response.ok)throw Error('Update service unavailable');return response;
  }
  throw Error('Too many update redirects');
}
async function limitedText(response,limit){let length=0,chunks=[];for await(const chunk of response.body){length+=chunk.length;if(length>limit)throw Error('Update metadata too large');chunks.push(chunk)}const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}return new TextDecoder().decode(bytes)}
export async function latestUpdate(current,{fetcher=fetch,signal,kind='windows'}={}){
  let release=JSON.parse(await limitedText(await releaseGet(apiURL,fetcher,signal),256*1024));
  if(release.draft||release.prerelease||!newerVersion(release.tag_name,current))return null;
  let version=releaseVersionParts(release.tag_name).join('.'),filename=kind==='browser'?'quiet-shelf-pc.zip':kind==='android'?`Quiet-Shelf-Android-${version}.apk`:`Quiet-Shelf-Setup-${version}-x64.exe`;
  let asset=(release.assets||[]).find(a=>a.name===filename),checksum=(release.assets||[]).find(a=>a.name==='SHA256SUMS.txt');
  let expectedRoot=downloadRoot+encodeURIComponent(release.tag_name)+'/';
  if(!asset||!checksum||asset.browser_download_url!==expectedRoot+filename||checksum.browser_download_url!==expectedRoot+'SHA256SUMS.txt'||!Number.isSafeInteger(asset.size)||asset.size<2||asset.size>(kind==='browser'?32*1024*1024:maxInstaller))throw Error('The release has no valid update package');
  let manifest=await limitedText(await releaseGet(checksum.browser_download_url,fetcher,signal),20*1024);
  let entries=manifest.split(/\r?\n/).map(line=>line.match(/^([a-f0-9]{64})\s+\*?(.+)$/i)).filter(m=>m&&m[2]===filename);
  if(entries.length!==1)throw Error('The installer checksum is missing or ambiguous');
  let sha256=entries[0][1].toLowerCase();
  if(asset.digest&&asset.digest!=='sha256:'+sha256)throw Error('The release checksums disagree');
  return {version,filename,url:asset.browser_download_url,size:asset.size,sha256};
}

export function createBrowserReleaseHandler({fetcher=fetch,clock=Date.now}={}){
 let cached=null,running=null;
 return async function(request){
  if(request.method!=='GET')return new Response('Method not allowed',{status:405});
  const origin=request.headers.get('Origin');if(origin&&origin!==new URL(request.url).origin)return new Response('Invalid origin',{status:403});
  try{
   if(!cached||clock()-cached.checkedAt>=300000){if(!running)running=latestUpdate(APP_VERSION,{fetcher,kind:'browser'}).then(update=>{cached={phase:update?'available':'up-to-date',version:update?.version||'',checkedAt:clock(),downloadUrl:update?'https://github.com/ayca-kaygusuz/quiet-shelf-public/releases/tag/v'+update.version:''}}).finally(()=>{running=null});await running}
   return Response.json(cached,{headers:{'Cache-Control':'no-store'}});
  }catch{return Response.json({error:'The update service could not be reached.'},{status:503,headers:{'Cache-Control':'no-store'}})}
 };
}

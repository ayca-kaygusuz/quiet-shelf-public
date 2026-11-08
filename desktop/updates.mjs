import {createHash} from 'node:crypto';
import {createReadStream,createWriteStream} from 'node:fs';
import {mkdir,readFile,writeFile,rename,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {spawn} from 'node:child_process';

export const RELEASES_URL='https://github.com/ayca-kaygusuz/quiet-shelf-public/releases/latest';
const apiURL='https://api.github.com/repos/ayca-kaygusuz/quiet-shelf-public/releases/latest';
const downloadRoot='https://github.com/ayca-kaygusuz/quiet-shelf-public/releases/download/';
const maxInstaller=300*1024*1024;
function versionParts(value){let match=String(value).match(/^v?(\d+)\.(\d+)\.(\d+)$/);if(!match)return null;let parts=match.slice(1).map(Number);return parts.every(Number.isSafeInteger)?parts:null}
export function newerVersion(candidate,current){let a=versionParts(candidate),b=versionParts(current);if(!a||!b)return false;for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i]}return false}
function safeDownload(value){try{let u=new URL(value);return u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&(u.origin==='https://github.com'&&u.pathname.startsWith('/ayca-kaygusuz/quiet-shelf-public/releases/download/')||['release-assets.githubusercontent.com','objects.githubusercontent.com'].includes(u.hostname))}catch{return false}}
async function get(url,fetcher,signal,installer=false){
  for(let redirects=0;redirects<5;redirects++){
    if(url!==apiURL&&!safeDownload(url))throw Error('Untrusted update download');
    const response=await fetcher(url,{redirect:'manual',headers:{Accept:url===apiURL?'application/vnd.github+json':'application/octet-stream','User-Agent':'QuietShelf updater'},signal:signal?AbortSignal.any([signal,AbortSignal.timeout(installer?600000:20000)]):AbortSignal.timeout(installer?600000:20000)});
    if(response.status>=300&&response.status<400){url=new URL(response.headers.get('Location'),url).href;continue}
    if(!response.ok)throw Error('Update service unavailable');return response;
  }
  throw Error('Too many update redirects');
}
async function limitedText(response,limit){let length=0,chunks=[];for await(const chunk of response.body){length+=chunk.length;if(length>limit)throw Error('Update metadata too large');chunks.push(chunk)}return Buffer.concat(chunks).toString('utf8')}
export async function latestUpdate(current,{fetcher=fetch,signal}={}){
  let release=JSON.parse(await limitedText(await get(apiURL,fetcher,signal),256*1024));
  if(release.draft||release.prerelease||!newerVersion(release.tag_name,current))return null;
  let version=versionParts(release.tag_name).join('.'),filename=`Quiet-Shelf-Setup-${version}-x64.exe`;
  let asset=(release.assets||[]).find(a=>a.name===filename),checksum=(release.assets||[]).find(a=>a.name==='SHA256SUMS.txt');
  let expectedRoot=downloadRoot+encodeURIComponent(release.tag_name)+'/';
  if(!asset||!checksum||asset.browser_download_url!==expectedRoot+filename||checksum.browser_download_url!==expectedRoot+'SHA256SUMS.txt'||!Number.isSafeInteger(asset.size)||asset.size<2||asset.size>maxInstaller)throw Error('The release has no valid Windows installer');
  let manifest=await limitedText(await get(checksum.browser_download_url,fetcher,signal),20*1024);
  let entries=manifest.split(/\r?\n/).map(line=>line.match(/^([a-f0-9]{64})\s+\*?(.+)$/i)).filter(m=>m&&m[2]===filename);
  if(entries.length!==1)throw Error('The installer checksum is missing or ambiguous');
  let sha256=entries[0][1].toLowerCase();
  if(asset.digest&&asset.digest!=='sha256:'+sha256)throw Error('The release checksums disagree');
  return {version,filename,url:asset.browser_download_url,size:asset.size,sha256};
}
async function validFile(path,update){try{let hash=createHash('sha256'),size=0,header=Buffer.alloc(0);for await(let chunk of createReadStream(path)){size+=chunk.length;if(size>update.size)return false;if(header.length<2)header=Buffer.concat([header,chunk]).subarray(0,2);hash.update(chunk)}return size===update.size&&header.toString()==='MZ'&&hash.digest('hex')===update.sha256}catch{return false}}
export async function downloadUpdate(update,directory,{fetcher=fetch,signal,onProgress=()=>{}}={}){
  if(!versionParts(update.version)||update.filename!==`Quiet-Shelf-Setup-${update.version}-x64.exe`||!safeDownload(update.url)||!/^[a-f0-9]{64}$/.test(update.sha256)||!Number.isSafeInteger(update.size)||update.size<2||update.size>maxInstaller)throw Error('Invalid update');
  let folder=join(directory,update.version),destination=join(folder,update.filename),partial=destination+'.partial';
  await mkdir(folder,{recursive:true,mode:0o700});
  if(await validFile(destination,update))return destination;
  await rm(partial,{force:true});
  try{
    let response=await get(update.url,fetcher,signal,true),downloaded=0;
    await pipeline(Readable.fromWeb(response.body),async function*(source){for await(let chunk of source){downloaded+=chunk.length;if(downloaded>update.size)throw Error('Installer size mismatch');onProgress(downloaded/update.size);yield chunk}},createWriteStream(partial,{flags:'wx',mode:0o600}));
    if(!await validFile(partial,update))throw Error('Installer verification failed');
    await rm(destination,{force:true});await rename(partial,destination);return destination;
  }finally{await rm(partial,{force:true})}
}

export function createUpdateController({app,dialog,shell,getWindow,fetcher=fetch,spawnInstaller=spawn,clock=Date.now}){
  const folder=join(app.getPath('userData'),'updates'),stateFile=join(folder,'check.json');
  const abort=new AbortController();let running=null;
  async function message(options){const window=getWindow();if(!window)return {response:1};return dialog.showMessageBox(window,{title:'Quiet Shelf updates',...options})}
  async function run(manual){
    let interactive=manual;
    let last=0;try{last=JSON.parse(await readFile(stateFile,'utf8')).checkedAt}catch{}
    if(!manual&&last>0&&Number.isFinite(last)&&clock()>=last&&clock()-last<24*60*60*1000)return;
    try{
      let update=await latestUpdate(app.getVersion(),{fetcher,signal:abort.signal});
      await mkdir(folder,{recursive:true,mode:0o700});await writeFile(stateFile,JSON.stringify({checkedAt:clock()}),{mode:0o600});
      if(!update){if(manual)await message({message:'Quiet Shelf is up to date.',buttons:['OK']});return}
      const choice=await message({message:`Quiet Shelf ${update.version} is available.`,detail:'Download the update now? Your library and saved settings will stay on this computer.',buttons:['Download update','Later'],defaultId:0,cancelId:1});
      if(choice.response!==0)return;interactive=true;
      const installer=await downloadUpdate(update,folder,{fetcher,signal:abort.signal,onProgress:progress=>getWindow()?.setProgressBar(progress)});
      getWindow()?.setProgressBar(-1);
      const restart=await message({message:'Your update is ready.',detail:'Restart Quiet Shelf to install it. Finish any unsaved title entry first.',buttons:['Restart and update','Later'],defaultId:0,cancelId:1});
      if(restart.response!==0)return;
      if(!await validFile(installer,update))throw Error('Installer verification failed');
      const child=spawnInstaller(installer,['/S',`/UPDATEPID=${process.pid}`,'/RESTARTAPP'],{detached:true,stdio:'ignore',windowsHide:true});
      await new Promise((resolve,reject)=>{child.once('error',reject);child.once('spawn',resolve)});
      child.unref();app.quit();
    }catch(error){
      getWindow()?.setProgressBar(-1);
      if(abort.signal.aborted)return;
      // Startup checks remain quiet when offline. An explicitly requested update gets feedback.
      if(interactive){
        const answer=await message({message:'The update could not be completed.',detail:'Your current installation is unchanged. Try again later or download the installer from GitHub.',buttons:['Open downloads','Close'],defaultId:1,cancelId:1});
        if(answer.response===0)await shell.openExternal(RELEASES_URL);
      }
    }
  }
  return {check({manual=false}={}){if(!running)running=run(manual).finally(()=>{running=null});return running},dispose(){abort.abort()}};
}

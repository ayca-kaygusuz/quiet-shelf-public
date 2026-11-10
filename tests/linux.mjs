// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {linuxMetered} from '../desktop/linux-network.mjs';
import {latestUpdate,updateFilename} from '../src/releases.mjs';
import {downloadUpdate,createUpdateController} from '../desktop/updates.mjs';
assert.equal(linuxMetered('GENERAL.STATE:100 (connected)\nGENERAL.METERED:yes'),true);
assert.equal(linuxMetered('GENERAL.STATE:100 (connected)\nGENERAL.METERED:guess-yes'),true);
assert.equal(linuxMetered('GENERAL.STATE:100 (connected)\nGENERAL.METERED:no\nGENERAL.STATE:20 (unavailable)\nGENERAL.METERED:yes'),false);
assert.equal(linuxMetered('GENERAL.STATE:100 (connected)\nGENERAL.METERED:unknown'),null);assert.equal(linuxMetered(''),null);
assert.equal(linuxMetered('GENERAL.STATE:100 (connected)\nGENERAL.METERED:no\nGENERAL.STATE:100 (connected)\nGENERAL.METERED:unknown'),null);
await mkdir('work',{recursive:true});const root=await mkdtemp('work/linux-update-test-');
try{
 for(const kind of ['linux','linux-deb']){
  const directory=join(root,kind),version='0.99.0',filename=updateFilename(version,kind),bytes=kind==='linux'?Buffer.from([0x1f,0x8b,8,0,1,2,3,4]):Buffer.from('!<arch>\nsynthetic debian package'),sha=createHash('sha256').update(bytes).digest('hex'),base='https://github.com/ayca-kaygusuz/quiet-shelf-public/releases/download/v'+version+'/';
  const release={tag_name:'v'+version,draft:false,prerelease:false,assets:[{name:filename,size:bytes.length,digest:'sha256:'+sha,browser_download_url:base+filename},{name:'SHA256SUMS.txt',browser_download_url:base+'SHA256SUMS.txt'}]};
  let broken=false,calls=0,shown=[];
  const fetcher=async(url,options)=>{calls++;for(const key of ['Authorization','Cookie','X-Google-Api-Key'])assert.equal(new Headers(options.headers).get(key),null);return String(url).startsWith('https://api.github.com/')?Response.json(release):String(url).endsWith('SHA256SUMS.txt')?new Response(sha+'  '+filename+'\n'):new Response(broken?Buffer.from('damaged package'):bytes)};
  const update=await latestUpdate('0.18.0',{kind,fetcher});assert.equal(update.filename,filename);
  const file=await downloadUpdate(update,directory,{kind,fetcher});assert.deepEqual(await readFile(file),bytes);
  await writeFile(file,'corrupt cache');broken=true;await assert.rejects(downloadUpdate(update,directory,{kind,fetcher}));broken=false;
  const app={getPath:()=>directory,getVersion:()=> '0.18.0',quit:()=>{throw Error('Linux manual installation must not quit the app')}};
  const controller=createUpdateController({app,kind,fetcher,getWindow:()=>({setProgressBar(){}}),dialog:{showMessageBox(){throw Error('Never present a Windows installer prompt on Linux')}},spawnInstaller(){throw Error('Never execute an installer automatically on Linux')},showPackage:path=>shown.push(path)});
  await controller.configure({autoCheck:false,online:true,metered:true});const before=calls;await controller.check();assert.equal(calls,before,'disabled/metered automatic checks do not use the network');await controller.check({manual:true});assert.equal(controller.getStatus().phase,'available');assert.equal(controller.getStatus().installMode,'manual');
  await controller.download();assert.equal(controller.getStatus().phase,'ready');await controller.install();assert.equal(shown.length,1);assert.equal(controller.getStatus().platform,'linux');
  await writeFile(shown[0],'damaged after download');await controller.install();assert.equal(shown.length,1,'recheck the package before revealing it as installable');assert.equal(controller.getStatus().phase,'error');controller.dispose();
  const switched=createUpdateController({app,kind:kind==='linux'?'linux-deb':'linux',getWindow:()=>null,dialog:{}});await switched.ready;assert.equal(switched.getStatus().lastChecked,0,'changing Linux package type must recheck rather than claim up-to-date');switched.dispose();
 }
 console.log('PASS: Linux metered states, package selection, trusted checksum/download/cache validation, quiet manual checks and explicit manual installation without executing or quitting.');
}finally{await rm(root,{recursive:true,force:true})}

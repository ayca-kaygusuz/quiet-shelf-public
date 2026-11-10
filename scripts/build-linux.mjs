// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {googleDesktopConfiguration} from '../src/google-oauth.mjs';
import {desktopLegalScript} from '../desktop/legal.mjs';
process.env.ELECTRON_BUILDER_CACHE??=resolve('work/linux-tools/cache');
const require=createRequire(import.meta.url),{build,Platform,Arch}=require('electron-builder');
if(process.platform!=='linux')throw Error('Build Linux packages on Linux.');
const version=JSON.parse(readFileSync('package.json','utf8')).version,output=resolve('work/linux');
const credential=process.env.QUIET_SHELF_GOOGLE_DESKTOP_CLIENT_SECRET||'',clientId=process.env.QUIET_SHELF_GOOGLE_DESKTOP_CLIENT_ID||'';
const configuration=credential?googleDesktopConfiguration({clientId,credentialValue:credential}):{clientId,clientSecret:''};
writeFileSync('desktop/google-client.generated.json',JSON.stringify(configuration));
mkdirSync(output,{recursive:true});
await build({targets:Platform.LINUX.createTarget(['deb','tar.gz'],Arch.x64),publish:'never',config:{directories:{output},...(process.env.QUIET_SHELF_ELECTRON_DIST?{electronDist:resolve(process.env.QUIET_SHELF_ELECTRON_DIST)}:{})}});
if(desktopLegalScript({root:join(output,'linux-unpacked'),packaged:true})!==desktopLegalScript({root:process.cwd()}))throw Error('Installed Linux license files differ from the source notices.');
const packages=['deb','tar.gz'].map(extension=>{
 const filename=`Quiet-Shelf-${version}-linux-${extension==='deb'?'amd64':'x64'}.${extension}`,bytes=readFileSync(join(output,filename));
 if(extension==='deb'?bytes.subarray(0,8).toString()!=='!<arch>\n':bytes[0]!==0x1f||bytes[1]!==0x8b)throw Error('Invalid Linux package.');
 return {filename,size:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
});
writeFileSync(join(output,'SHA256SUMS-Linux.txt'),packages.map(p=>p.sha256+'  '+p.filename).join('\n')+'\n');
writeFileSync(join(output,'linux-build.json'),JSON.stringify({version,sourceSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),configured:!!credential,packages},null,2)+'\n');
console.log('Linux x64 Debian package and portable archive are ready.');

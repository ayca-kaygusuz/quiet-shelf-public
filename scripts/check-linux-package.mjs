// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,rmSync,statSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {desktopLegalScript} from '../desktop/legal.mjs';
import {updateFilename} from '../src/releases.mjs';
const root=resolve('work/linux'),version=JSON.parse(readFileSync('package.json')).version,meta=JSON.parse(readFileSync(join(root,'linux-build.json'))),destination=join(root,'package-check');
assert.equal(meta.version,version);assert.equal(meta.sourceSha,execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());
for(const p of meta.packages){const b=readFileSync(join(root,p.filename));assert.equal(b.length,p.size);assert.equal(createHash('sha256').update(b).digest('hex'),p.sha256)}
rmSync(destination,{recursive:true,force:true});mkdirSync(join(destination,'deb'),{recursive:true});mkdirSync(join(destination,'portable'));
const deb=join(root,updateFilename(version,'linux-deb')),portable=join(root,updateFilename(version,'linux'));
for(const [field,value]of [['Package','quiet-shelf'],['Architecture','amd64'],['Version',version]])assert.equal(execFileSync('dpkg-deb',['--field',deb,field],{encoding:'utf8'}).trim(),value);
execFileSync('dpkg-deb',['--extract',deb,join(destination,'deb')]);
const entries=execFileSync('tar',['-tzf',portable],{encoding:'utf8'}).trim().split('\n');assert(entries.every(n=>!n.startsWith('/')&&!n.split('/').includes('..')));
execFileSync('tar',['-xzf',portable,'-C',join(destination,'portable')]);
const base=entries.find(n=>n.endsWith('/quiet-shelf'));assert(base);const portableRoot=join(destination,'portable',base.slice(0,-'/quiet-shelf'.length)),debRoot=join(destination,'deb','opt','Quiet Shelf');
const asar=createRequire(import.meta.url)('@electron/asar');
for(const directory of [portableRoot,debRoot]){
 assert(statSync(join(directory,'quiet-shelf')).mode&0o111);assert.equal(desktopLegalScript({root:directory,packaged:true}),desktopLegalScript({root:process.cwd()}));
 for(const name of ['LICENSE.electron.txt','LICENSES.chromium.html'])assert(statSync(join(directory,name)).size>0);
 const archive=join(directory,'resources','app.asar'),files=asar.listPackage(archive);
 assert(!files.some(n=>/archive\/browser-connector|drive-session\.bin|\.jks$|private\//.test(n)));
 for(const name of ['read-next.js','sync-core.js','account.js'])assert.equal(asar.extractFile(archive,'src/'+name).toString().replace(/\r\n/g,'\n'),readFileSync('src/'+name,'utf8').replace(/\r\n/g,'\n'));
}
for(const name of ['quiet-shelf','resources/app.asar'])assert.equal(createHash('sha256').update(readFileSync(join(portableRoot,name))).digest('hex'),createHash('sha256').update(readFileSync(join(debRoot,name))).digest('hex'));
console.log('PASS: Linux Debian metadata, exact package checksums, executable modes, portable/installed binary and shared assets, offline licenses and no private runtime files.');

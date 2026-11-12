// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0

import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {legalScript} from '../src/legal.mjs';
import {APP_VERSION} from '../src/releases.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=name=>readFileSync(resolve(root,name),'utf8');
export function buildHosted(){
  if(JSON.parse(read('package.json')).version!==APP_VERSION)throw Error('The shared app version does not match package.json.');
  const assets=Object.fromEntries(['read-next.js','sync-core.js','account.js'].map(name=>['/'+name,read('src/'+name)]));
  assets['/drive-client.js']='(function(){\n'+read('src/drive.mjs').replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'')+'\n'+read('web/drive-client.js')+'\n})();';
  assets['/legal.js']=legalScript({license:read('LICENSE'),notice:read('NOTICE'),thirdParty:read('THIRD_PARTY_NOTICES.md'),font:read('assets/Manrope-OFL.txt'),desugar:['LICENSE','ASSEMBLY_EXCEPTION','ADDITIONAL_LICENSE_INFO'].map(name=>read('assets/licenses/desugar-jdk-'+name+'.txt')).join('\n\n')});
  // Keep source modules shared with the native/local browser apps. Only the
  // HTTP entry point is specific to hosting. Runtime secrets are never read.
  const files=['src/catalog.mjs','src/read-next.js','src/sync-core.js','src/google-oauth.mjs','src/drive.mjs','src/web-account.mjs','src/releases.mjs','web/worker.mjs'];
  const source=files.map(name=>read(name).replace(/^import .*;\r?\n/gm,'')).join('\n');
  const html=read('src/index.html').replace('</head>','<link rel="icon" href="/icon.png" type="image/png"></head>').replace('<script src="/account.js" defer>','<script src="/drive-client.js" defer></script><script src="/account.js" defer>');
  const icon=readFileSync(resolve(root,'desktop/assets/icon.png')).toString('base64');
  const worker=source+'\nexport default createHostedWorker('+JSON.stringify({html,assets,icon})+');\n';
  const directory=resolve(root,'work/hosted');mkdirSync(directory,{recursive:true});
  const output=resolve(directory,'index.mjs');writeFileSync(output,worker);
  return {output,bytes:Buffer.byteLength(worker),version:APP_VERSION};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const result=buildHosted();console.log(`Built hosted Quiet Shelf ${result.version} (${result.bytes} bytes); no desktop packages or runtime credentials embedded.`)}

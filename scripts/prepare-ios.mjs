// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0
import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {legalScript} from '../src/legal.mjs';
const root='ios/QuietShelf/Web';mkdirSync(root,{recursive:true});
let html=readFileSync('src/index.html','utf8').replace('</style>','</style><link rel="stylesheet" href="/ios.css">').replace('<script src="/sync-core.js" defer>','<script src="/ios-bootstrap.js"></script><script src="/sync-core.js" defer>');
writeFileSync(root+'/index.html',html);
for(const name of ['read-next.js','account.js','sync-core.js','catalog.mjs','drive.mjs','releases.mjs'])copyFileSync('src/'+name,root+'/'+name);
for(const name of ['ios-bootstrap.js','ios-api.mjs','ios.css'])copyFileSync('ios/web/'+name,root+'/'+name);
for(const name of ['LICENSE','NOTICE','THIRD_PARTY_NOTICES.md'])copyFileSync(name,root+'/'+name);
copyFileSync('assets/Manrope-OFL.txt',root+'/Manrope-OFL.txt');
copyFileSync('ios/licenses/swift-runtime-LICENSE.txt',root+'/Swift-runtime-LICENSE.txt');
const runtime=process.env.QUIET_SHELF_IOS_NOTICES?readFileSync(process.env.QUIET_SHELF_IOS_NOTICES,'utf8'):'';
writeFileSync(root+'/legal.js',legalScript({license:readFileSync('LICENSE','utf8'),notice:readFileSync('NOTICE','utf8'),thirdParty:readFileSync('THIRD_PARTY_NOTICES.md','utf8')+'\n\n'+runtime,font:readFileSync('assets/Manrope-OFL.txt','utf8'),desugar:['LICENSE','ASSEMBLY_EXCEPTION','ADDITIONAL_LICENSE_INFO'].map(name=>readFileSync('assets/licenses/desugar-jdk-'+name+'.txt','utf8')).join('\n\n')}));
const script=html.match(/<script>([\s\S]*)<\/script>/)[1],digest=createHash('sha256').update(script.replace(/\r\n?/g,'\n')).digest('base64');
writeFileSync(root+'/csp.txt',`default-src 'none'; script-src 'self' 'sha256-${digest}'; style-src 'self' 'unsafe-inline'; img-src https: data:; font-src data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-src 'none'; form-action 'none'`);
console.log('iPhone / iPad assets prepared from shared application source.');

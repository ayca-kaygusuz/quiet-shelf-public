// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {legalScript} from '../src/legal.mjs';

// electron-builder moves extraFiles out of app.asar. Read the installed copies
// from the executable directory; development still uses the source tree.
export function desktopLegalScript({root,packaged=false}){
 const read=name=>readFileSync(join(root,name),'utf8');
 return legalScript({
  license:read(packaged?'LICENSE-Quiet-Shelf.txt':'LICENSE'),
  notice:read(packaged?'NOTICE-Quiet-Shelf.txt':'NOTICE'),
  thirdParty:read('THIRD_PARTY_NOTICES.md'),
  font:read(packaged?'licenses/Manrope-OFL.txt':'assets/Manrope-OFL.txt'),
  desugar:['LICENSE','ASSEMBLY_EXCEPTION','ADDITIONAL_LICENSE_INFO'].map(name=>read((packaged?'licenses/android-compatibility/':'assets/licenses/')+'desugar-jdk-'+name+'.txt')).join('\n\n')
 });
}

# Copyright 2026 Alex (Ayca Kaygusuz)
# SPDX-License-Identifier: Apache-2.0
import pathlib,plistlib,zipfile,json,hashlib,subprocess
version=json.loads(pathlib.Path('package.json').read_text())['version']
path=pathlib.Path('work/ios')/f'Quiet-Shelf-iOS-{version}-unsigned.ipa'
with zipfile.ZipFile(path) as archive:
 root='Payload/QuietShelf.app/'
 info=plistlib.loads(archive.read(root+'Info.plist'))
 assert sorted(info['UIDeviceFamily'])==[1,2], 'Must be a universal iPhone/iPad app'
 assert info['CFBundleIdentifier']=='com.quietshelf.ios'
 assert info['CFBundleShortVersionString']==version
 assert info.get('UIRequiresFullScreen') is False, 'iPad multitasking must remain enabled'
 assert len(info['UISupportedInterfaceOrientations~ipad'])==4
 assert info.get('UILaunchScreen') is not None
 assert info['GIDClientID'].endswith('.apps.googleusercontent.com')
 assert 'client_secret' not in str(info).lower()
 assert not any(n.endswith(('.mobileprovision','.p12','.key','.pem')) for n in archive.namelist())
 assert root+'_CodeSignature/CodeResources' not in archive.namelist(), 'Distribute explicitly unsigned; AltStore supplies signing'
 for file in ['index.html','ios-bootstrap.js','ios-api.mjs','ios.css','read-next.js','legal.js','LICENSE','NOTICE','THIRD_PARTY_NOTICES.md','Manrope-OFL.txt']:
  assert len(archive.read(root+'Web/'+file))>0,file
 legal=archive.read(root+'Web/legal.js').decode()
 assert 'GoogleSignIn' in legal and 'AppAuth' in legal, 'Native licenses must be available offline'
 assert b'Google Desktop' not in archive.read(root+'Info.plist')
 sha=hashlib.sha256(path.read_bytes()).hexdigest()
source=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
metadata={'version':version,'source':source,'filename':path.name,'sha256':sha,'size':path.stat().st_size,'signed':False,'deviceFamilies':['iPhone','iPad'],'minimumOS':'17.4','installation':'AltStore Classic; requires personal signing and seven-day renewal on free Apple accounts'}
pathlib.Path('work/ios/ios-build.json').write_text(json.dumps(metadata,indent=2)+'\n')
print('Verified unsigned universal IPA, version, orientations, multitasking and offline notices.')

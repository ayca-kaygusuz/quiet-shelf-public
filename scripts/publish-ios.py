# Copyright 2026 Alex (Ayca Kaygusuz)
# SPDX-License-Identifier: Apache-2.0
"""Promote the exact tested unsigned IPA, preserving the shared checksum manifest."""
import pathlib,json,subprocess,hashlib,os,shutil,re

def gh(*args):return subprocess.check_output(['gh',*args],text=True)
root=pathlib.Path('release-ios');version=json.loads(pathlib.Path('package.json').read_text())['version'];tag='v'+version
repo=os.environ['GITHUB_REPOSITORY'];source=os.environ['GITHUB_SHA']
def unique(name):
 files=list(root.rglob(name))
 if len(files)!=1:raise SystemExit('Ambiguous or missing iOS artifact: '+name)
 return files[0]
metadata=json.loads(unique('ios-build.json').read_text());name=f'Quiet-Shelf-iOS-{version}-unsigned.ipa';ipa=unique(name)
if metadata.get('source')!=source or metadata.get('version')!=version or metadata.get('signed') is not False or metadata.get('filename')!=name or hashlib.sha256(ipa.read_bytes()).hexdigest()!=metadata.get('sha256'):raise SystemExit('Unsigned IPA source/version/checksum mismatch')
release=json.loads(gh('release','view',tag,'--repo',repo,'--json','isDraft,assets'))
if release['isDraft']:raise SystemExit('Publish the matching tested Windows/browser release first. The IPA remains in its build artifact.')
if json.loads(gh('api',f'repos/{repo}/git/ref/tags/{tag}'))['object']['sha']!=source:raise SystemExit('Release tag/source mismatch')
output=pathlib.Path('release-ios-publish');output.mkdir()
gh('release','download',tag,'--repo',repo,'--pattern','SHA256SUMS.txt','--dir',str(output))
if any(a['name']==name for a in release['assets']):
 existing=output/'existing';existing.mkdir();gh('release','download',tag,'--repo',repo,'--pattern',name,'--dir',str(existing))
 if (existing/name).read_bytes()!=ipa.read_bytes():raise SystemExit('Published IPA is immutable. Use a new version.')
manifest=output/'SHA256SUMS.txt';lines=[]
for line in manifest.read_text().splitlines():
 match=re.fullmatch(r'([A-Fa-f0-9]{64})\s+\*?(.+)',line)
 if not match:raise SystemExit('Invalid existing checksum manifest')
 if match[2]!=name:lines.append(line)
lines.append(metadata['sha256']+'  '+name);manifest.write_text('\n'.join(lines)+'\n')
for file in [ipa,unique('INSTALL-iPhone-iPad.md'),unique('native-notices.txt')]:shutil.copyfile(file,output/file.name)
gh('release','upload',tag,*[str(output/n) for n in [name,'INSTALL-iPhone-iPad.md','native-notices.txt','SHA256SUMS.txt']],'--repo',repo,'--clobber')
print('Attached explicitly unsigned universal IPA and instructions to',tag)

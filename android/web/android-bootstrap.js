(function(){
 'use strict';
 const pending=new Map();let next=0;
 if(!globalThis.QuietShelfNative){document.body.textContent='Quiet Shelf needs an updated Android System WebView. Update it in Google Play, then reopen the app.';return}
 QuietShelfNative.onmessage=event=>{let data;try{data=JSON.parse(event.data)}catch{return}const item=pending.get(data.id);if(!item)return;pending.delete(data.id);clearTimeout(item.timer);item.cleanup?.();if(data.error){const error=Error(data.error);error.code=data.code;item.reject(error)}else item.resolve(data.value)};
 function rpc(method,parameters={},signal){return new Promise((resolve,reject)=>{if(signal?.aborted){reject(new DOMException('Request aborted','AbortError'));return}const id=++next,abort=()=>{const item=pending.get(id);if(!item)return;pending.delete(id);clearTimeout(item.timer);item.cleanup();if(method==='http')QuietShelfNative.postMessage(JSON.stringify({id,method:'http.cancel',parameters:{requestId:id}}));reject(new DOMException('Request aborted','AbortError'))},timer=setTimeout(()=>{const item=pending.get(id);pending.delete(id);item?.cleanup();reject(Error('Android did not complete this request. Try again.'))},120000),cleanup=()=>signal?.removeEventListener('abort',abort);pending.set(id,{resolve,reject,timer,cleanup});signal?.addEventListener('abort',abort,{once:true});QuietShelfNative.postMessage(JSON.stringify({id,method,parameters}))})}

 globalThis.QuietShelfAndroid={rpc};
 const api=import('/android-api.mjs');
 globalThis.fetch=async(input,options={})=>{
  const request=new Request(new URL(typeof input==='string'||input instanceof URL?input:input.url,location.href),typeof input==='string'||input instanceof URL?options:input);
  if(request.signal.aborted)throw new DOMException('Request aborted','AbortError');
  const service=await api;
  return request.url.startsWith(location.origin+'/api/')?service.handle(request):service.external(request);
 };
 addEventListener('DOMContentLoaded',()=>{
  document.documentElement.dataset.platform='android';document.body.dataset.platform='android';
  const configure=async()=>{
   const App=globalThis.QuietShelfApp;if(!App){setTimeout(configure,25);return}
   const download=async(document,prefix='quiet-shelf')=>{const value=App.readBackup({format:'quiet-shelf-backup',version:2,...document});await rpc('backup.save',{document:{format:'quiet-shelf-backup',version:2,exportedAt:new Date().toISOString(),...value}})};
   App.downloadBackup=(document,prefix)=>void download(document,prefix).then(saved=>{if(saved)App.message('Backup saved.')}).catch(e=>App.message(e.message));
   document.querySelector('#export').onclick=()=>void download(App.backup()).then(saved=>{if(saved)App.message('Backup saved.')}).catch(e=>App.message(e.message));
   document.querySelector('#restore').onclick=async()=>{try{const value=await rpc('backup.open');if(value===null)return;const backup=App.readBackup(value);if(confirm('Replace this library with the selected backup? Back up your current library first if you want to keep it.')){App.apply(backup);App.changed?.();App.message('Backup restored.')}}catch(e){App.message(e.message||'That backup could not be imported. Your current library is unchanged.')}};
   let lastAppearance='';const appearance=()=>{const style=getComputedStyle(document.documentElement),color=style.getPropertyValue('--canvas').trim();if(color!==lastAppearance){lastAppearance=color;void rpc('app.appearance',{color,light:style.colorScheme==='light'}).catch(()=>{})}};appearance();new MutationObserver(appearance).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
   document.querySelector('#pcDownload').hidden=true;document.querySelector('#accountWindowsDownload').hidden=true;
   document.querySelector('#accountUpdateSummary').textContent='Android updates are available from GitHub. Installing an APK keeps your library when the app has the same signing identity.';
   document.querySelector('#browserUpdateDownload').textContent='Download Android update ↗';
   const detail=document.querySelector('#detail'),close=document.createElement('button');close.type='button';close.className='android-close-detail';close.textContent='Back to library';close.onclick=()=>{document.body.classList.remove('android-detail-open')};
   document.querySelector('#list').addEventListener('click',event=>{if(event.target.closest('.titlebutton')){if(!detail.contains(close))detail.prepend(close);document.body.classList.add('android-detail-open');detail.scrollTop=0}});
   new MutationObserver(()=>{if(document.body.classList.contains('android-detail-open')&&!detail.contains(close))detail.prepend(close)}).observe(detail,{childList:true});
   document.addEventListener('click',event=>{const link=event.target.closest('a[href]');if(link&&new URL(link.href).origin!==location.origin){event.preventDefault();void rpc('open.external',{url:link.href}).catch(e=>App.message(e.message))}});
   globalThis.QuietShelfAndroid.back=()=>{if(document.querySelector('#addDialog').open){document.querySelector('#addDialog').close();return true}if(!document.querySelector('#syncPopover').hidden){document.querySelector('#syncIndicator').click();return true}if(!document.querySelector('#accountPage').hidden){document.querySelector('#backToLibrary').click();return true}if(document.body.classList.contains('android-detail-open')){close.click();return true}return false};
  };void configure();
 });
})();

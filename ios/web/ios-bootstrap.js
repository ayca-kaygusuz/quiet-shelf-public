// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0
(function(){
 'use strict';
 const native=globalThis.webkit?.messageHandlers?.QuietShelfNative;
 if(!native)return;
 // WKWebView's app scheme has persistent storage but is not a Web secure context.
 // getRandomValues still provides native cryptographic randomness in that context.
 if(!crypto.randomUUID)crypto.randomUUID=()=>{const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`};
 let next=0;
 function rpc(method,parameters={},signal){return new Promise((resolve,reject)=>{
  if(signal?.aborted)return reject(new DOMException('Request aborted','AbortError'));
  const id=++next;let settled=false;
  const cleanup=()=>{settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort)},abort=()=>{if(settled)return;cleanup();if(method==='http')void native.postMessage({id:++next,method:'http.cancel',parameters:{requestId:id}}).catch(()=>{});reject(new DOMException('Request aborted','AbortError'))};
  const timer=setTimeout(()=>{abort()},120000);signal?.addEventListener('abort',abort,{once:true});
  native.postMessage({id,method,parameters}).then(value=>{if(settled)return;cleanup();resolve(value)},reason=>{if(settled)return;cleanup();const error=Error(String(reason));if(error.message.includes('SIGN_IN_REQUIRED')){error.code='SIGN_IN_REQUIRED';error.message='Please reconnect Google. Your local library is kept.'}reject(error)});
 })}
 globalThis.QuietShelfIOS={rpc};
 const api=import('/ios-api.mjs');
 globalThis.fetch=async(input,options={})=>{
  const request=new Request(new URL(typeof input==='string'||input instanceof URL?input:input.url,location.href),typeof input==='string'||input instanceof URL?options:input);
  if(request.signal.aborted)throw new DOMException('Request aborted','AbortError');
  const service=await api,url=new URL(request.url);
  return url.protocol==='quiet-shelf-ios:'&&url.hostname==='app'&&url.pathname.startsWith('/api/')?service.handle(request):service.external(request);
 };
 addEventListener('DOMContentLoaded',()=>{
  document.documentElement.dataset.platform='ios';document.body.dataset.platform='ios';
  const configure=()=>{
   const App=globalThis.QuietShelfApp;if(!App){setTimeout(configure,25);return}
   const download=async document=>{const value=App.readBackup({format:'quiet-shelf-backup',version:2,...document});return rpc('backup.save',{document:{format:'quiet-shelf-backup',version:2,exportedAt:new Date().toISOString(),...value}})};
   App.downloadBackup=document=>void download(document).then(saved=>{if(saved)App.message('Backup saved.')}).catch(e=>App.message(e.message));
   document.querySelector('#export').onclick=()=>App.downloadBackup(App.backup());
   document.querySelector('#restore').onclick=async()=>{try{const document=await rpc('backup.open');if(document===null)return;const value=App.readBackup(document);if(confirm('Replace this library with the selected backup? Back up your current library first if you want to keep it.')){App.apply(value);App.changed?.();App.message('Backup restored.')}}catch(e){App.message(e.message||'That backup could not be imported. Your current library is unchanged.')}};
   let lastAppearance='';const appearance=()=>{const style=getComputedStyle(document.documentElement),color=style.getPropertyValue('--canvas').trim();if(color!==lastAppearance){lastAppearance=color;void rpc('app.appearance',{color,light:style.colorScheme==='light'}).catch(()=>{})}};appearance();new MutationObserver(appearance).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
   for(const id of ['pcDownload','accountWindowsDownload'])document.getElementById(id).hidden=true;
   document.querySelector('#accountUpdateSummary').textContent='iPhone and iPad updates are available as an IPA from GitHub. Install with the same AltStore account to keep your library. Free signing needs refreshing every seven days.';
   document.querySelector('#browserUpdateDownload').textContent='View iPhone / iPad update ↗';
   const detail=document.querySelector('#detail'),close=document.createElement('button');close.type='button';close.className='ios-close-detail';close.textContent='← Library';close.setAttribute('aria-label','Back to library');
   close.onclick=()=>{document.body.classList.remove('ios-detail-open');detailState();document.querySelector('#list .selected .titlebutton')?.focus()};
   const compact=matchMedia('(max-width:719px)');
   function detailState(){
    const modal=compact.matches&&document.body.classList.contains('ios-detail-open');
    for(const element of document.querySelectorAll('.app-header,#collectionTabs,#readNextPanel,.insights,.library-panel,footer,#message,.notice'))element.inert=modal;
    if(modal){detail.setAttribute('role','dialog');detail.setAttribute('aria-modal','true')}
    else{detail.removeAttribute('role');detail.removeAttribute('aria-modal')}
   }
   for(const list of [document.querySelector('#list'),document.querySelector('#readNextEntries')])list.addEventListener('click',event=>{if(event.target.closest('.titlebutton')){if(!detail.contains(close))detail.prepend(close);document.body.classList.add('ios-detail-open');detailState();detail.scrollTop=0;if(compact.matches)close.focus()}});
   new MutationObserver(()=>{if(document.body.classList.contains('ios-detail-open')&&!detail.contains(close))detail.prepend(close)}).observe(detail,{childList:true});
   compact.addEventListener('change',detailState);
   document.addEventListener('click',event=>{const link=event.target.closest('a[href]');if(link&&new URL(link.href).protocol!=='quiet-shelf-ios:'){event.preventDefault();void rpc('open.external',{url:link.href}).catch(e=>App.message(e.message))}});
   globalThis.QuietShelfIOS.back=()=>{if(document.querySelector('#addDialog').open){document.querySelector('#addDialog').close();return true}if(!document.querySelector('#syncPopover').hidden){document.querySelector('#syncIndicator').click();return true}if(!document.querySelector('#accountPage').hidden){document.querySelector('#backToLibrary').click();return true}if(document.body.classList.contains('ios-detail-open')){close.click();return true}return false};
  };configure();
 });
})();

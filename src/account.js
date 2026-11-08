(function(root){
 'use strict';
 const App=root.QuietShelfApp,S=root.QuietShelfSync;if(!App||!S)return;
 const $=selector=>document.querySelector(selector),actor=crypto.randomUUID(),guestStorage='quiet-shelf-guest-v1',activeStorage='quiet-shelf-active-account-v1',settingsStorage='quiet-shelf-sync-settings-v1';
 const workspaceKey=id=>'quiet-shelf-account-'+id+'-v1';
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
 const store=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
 let settings={auto:true,meteredOverride:null,...read(settingsStorage,{})};if(typeof settings.auto!=='boolean')settings.auto=true;if(typeof settings.meteredOverride!=='boolean')settings.meteredOverride=null;
 let account=null,connection={configured:false,mode:location.protocol==='quiet-shelf:'?'desktop':'web',network:{}},state=S.empty(),dirty=false,lastSync=null,applying=false,syncing=false,queued=false,authRequired=false,firstPull=false,notice='',syncTimer,authTimer,periodicTimer,failed=false,workspaceReady=false;
 const previous=read(activeStorage,null);
 if(previous){$('#libraryPage').inert=true;$('#add').disabled=true}
 let guest=read(guestStorage,null);if(!guest&&!previous){guest=App.snapshot();try{store(guestStorage,guest)}catch{}}
 function accountPage(open=true){$('#accountPage').hidden=!open;$('#libraryPage').hidden=open;$('#accountButton').setAttribute('aria-expanded',String(open));if(open)$('#accountHeading').focus?.();else $('#accountButton').focus?.()}
 $('#accountButton').onclick=()=>accountPage($('#accountPage').hidden);$('#backToLibrary').onclick=()=>accountPage(false);
 function networkMetered(){const c=navigator.connection;if(settings.meteredOverride!==null)return settings.meteredOverride;return connection.network?.metered===true||c?.saveData===true||c?.type==='cellular'}
 const online=()=>navigator.onLine!==false;
 const canAuto=()=>settings.auto&&!networkMetered()&&online()&&!document.hidden&&!authRequired;
 function localDocument(){return S.project(state)}
 function persist(){if(account)store(workspaceKey(account.id),{version:1,state,dirty,lastSync,firstPull})}
 function apply(document){applying=true;try{App.apply(document)}finally{applying=false}}
 function publicAccount(value){return value&&typeof value.id==='string'&&/^\d{1,100}$/.test(value.id)&&typeof value.email==='string'?{id:value.id,email:value.email,name:typeof value.name==='string'?value.name:value.email}:null}
 function renderAccount(){
  const metered=networkMetered(),paused=!settings.auto||metered||!online();
  $('#accountName').textContent=account?account.name:'Keep it local, or take it with you';$('#accountIdentity').textContent=account?account.email:'Signing in is optional. Your local library works as usual.';
  $('#googleSignIn').hidden=!!account&&!authRequired;$('#googleSignIn').disabled=!connection.configured||!!connection.pending||syncing;$('#googleSignIn').textContent=authRequired?'Reconnect Google':'Sign in with Google';
  $('#googleSignOut').hidden=!account;$('#googleSignOut').disabled=syncing||!!connection.busy;$('#cancelGoogleSignIn').hidden=!connection.pending;
  $('#googleDesktopSetup').hidden=connection.mode!=='desktop';if(document.activeElement!==$('#googleClientId'))$('#googleClientId').value=connection.clientId||'';
  $('#saveGoogleClientId').disabled=!!account||!!connection.pending;
  $('#googleSignIn').hidden=connection.mode==='local'||!!account&&!authRequired;
  $('#accountConnection').textContent=connection.pending?'Finish signing in in your browser.':notice||(connection.mode==='local'?'Google Drive sync is available in the Windows app. This browser copy keeps its own local library and supports backup and restore.':!connection.configured?'Google Drive needs the one-time connection setup. You can keep using your local library.':account?connection.rememberSupported===false?'Connected for this app session. Secure credential storage is unavailable.':'Your Google connection is remembered on this device.':'Connect your own Google Drive to carry your library between devices.');
  $('#autoSync').checked=settings.auto;$('#meteredConnection').checked=metered;$('#resetMetered').hidden=settings.meteredOverride===null;
  $('#meteredStatus').textContent=settings.meteredOverride!==null?'Using your connection setting. Automatic sync is '+(metered?'paused.':'allowed when enabled.'):connection.network?.source==='Windows'&&connection.network?.metered!==null?'Windows reports an '+(metered?'metered':'unmetered')+' connection.':metered?'This browser reports data-saving or a cellular connection. Automatic sync is paused.':'This browser cannot reliably identify every metered connection. Use this switch when needed.';
  $('#syncBadge').textContent=!account?'Local only':syncing?'Syncing':authRequired?'Reconnect':failed?'Needs attention':paused?'Paused':dirty?'Changes waiting':'Connected';
  $('#syncNow').disabled=!account||syncing||!online()||!!connection.pending;$('#syncNow').textContent=syncing?'Syncing…':'Sync now';
  $('#syncStatus').textContent=!account?'Sign in to sync your library and view preferences.':syncing?'Saving and checking Google Drive…':authRequired?'Sign in again to resume. Your changes are still on this device.':failed?notice:!online()?'Offline. Changes stay on this device until you reconnect.':metered?'Automatic sync is paused on this metered connection. Sync now is still available.':!settings.auto?'Automatic sync is off. Use Sync now when you want to connect.':!firstPull?'Ready to load this account’s Drive library.':dirty?'Your changes are saved on this device and waiting to sync.':'Your library is saved on this device and connected to Google Drive.';
  $('#syncLastSaved').textContent=lastSync?'Last synced '+new Date(lastSync).toLocaleString():account?'This account has not completed a sync on this device yet.':'';
  const localBooks=guest?.library?.filter(b=>!b.sample)||[];$('#copyLocalSection').hidden=!account||!firstPull||!localBooks.length;$('#copyLocalLibrary').disabled=syncing;$('#copyLocalHint').textContent=localBooks.length+' titles are kept in your signed-out local library. You can add them to this account; your existing Drive titles will stay.';
  $('#storageLabel').textContent=account?'Saved on this device · '+(dirty?'sync pending':'Google Drive connected'):location.protocol==='quiet-shelf:'?'Saved on this computer':'Saved in this browser';
  $('#accountWindowsDownload').hidden=location.protocol==='quiet-shelf:';if(location.protocol==='quiet-shelf:')$('#accountUpdateSummary').textContent='Windows updates download from GitHub. You choose when to restart and install.';
  const conflicts=account?localDocument().conflicts:[];$('#syncConflictsSection').hidden=!conflicts.length;
  $('#syncConflicts').innerHTML=conflicts.map((conflict,i)=>{const p=conflict.parts,book=localDocument().library.find(b=>b.id===p[1]),label=p[0]==='p'?'View preference · '+p.slice(1).join(' / '):(book?.title||'Title '+p[1])+' · '+(p[2]==='field'?p[3]:p[2]);return '<div class="sync-conflict"><strong>'+App.esc(label)+'</strong><label class="sr-only" for="conflict-'+i+'">Value to keep</label><select id="conflict-'+i+'">'+conflict.choices.map((value,n)=>'<option value="'+n+'">'+App.esc(p[2]==='present'?value?'Keep this title':'Keep deleted':value===null?'Remove this value':typeof value==='string'?value:JSON.stringify(value))+'</option>').join('')+'</select><button data-resolve-conflict="'+i+'" type="button">Keep selected value</button></div>'}).join('');
 }
 function recordChange(){
  if(applying||!workspaceReady)return;
  try{
   if(!account){guest=App.snapshot();store(guestStorage,guest);return}
   const changed=S.update(state,App.snapshot(),actor),disk=read(workspaceKey(account.id),null),before=JSON.stringify(state);state=disk?.state?S.merge(changed,disk.state):changed;
   if(JSON.stringify(state)===before)return;
   if(JSON.stringify(state)!==JSON.stringify(changed))apply(localDocument());
   dirty=true;persist();failed=false;renderAccount();schedule();
  }catch{failed=true;notice='This device could not save the sync queue. Download a backup before closing Quiet Shelf.';renderAccount();App.message(notice)}
 }
 App.changed=recordChange;
 function schedule(delay=1500){clearTimeout(syncTimer);if(account&&canAuto())syncTimer=setTimeout(()=>void sync(false),delay)}
 async function request(action,body){const response=await fetch('/api/account/'+action,{method:body===undefined?'GET':'POST',cache:'no-store',headers:body===undefined?{}:{'Content-Type':'application/json','X-Quiet-Shelf-Account':'1'},...(body===undefined?{}:{body:JSON.stringify(body)})});let data;try{data=await response.json()}catch{throw Error('The account service is unavailable. Your local library is still available.')}if(!response.ok){const error=Error(data.error||'The Google connection could not be reached.');error.code=data.code;throw error}return data}
 function activate(next){
  if(workspaceReady&&account?.id===next?.id){account=next;return}
  const saved=next?read(workspaceKey(next.id),null):null,nextState=saved?.state?S.validate(saved.state):S.empty();
  if(next)App.readBackup({format:'quiet-shelf-backup',version:2,...S.project(nextState)});
  if(account)persist();else if(!previous){guest=App.snapshot();store(guestStorage,guest)}
  account=next;workspaceReady=true;authRequired=false;failed=false;notice='';clearTimeout(syncTimer);
  if(account){state=nextState;dirty=saved?.dirty===true;lastSync=saved?.lastSync||null;firstPull=saved?.firstPull===true;store(activeStorage,account);apply(localDocument())}
  else{localStorage.removeItem(activeStorage);state=S.empty();dirty=false;lastSync=null;firstPull=false;apply(guest||{library:[],preferences:{}})}
  $('#libraryPage').inert=false;$('#add').disabled=false;
 }
 async function sync(manual=false){
  if(App.hasDraft?.()){notice='Save your series changes or close the Add title form before syncing.';renderAccount();return}
  if(!account||syncing){if(syncing)queued=true;return}if(!online()||!manual&&!canAuto()){renderAccount();return}clearTimeout(syncTimer);syncing=true;failed=false;notice='';const identity=account.id,sent=state;renderAccount();
  try{
   const response=await request('sync',{accountId:identity,state:sent,manual,meteredOverride:settings.meteredOverride});if(response.paused){connection.network=response.network;notice='Automatic sync paused because Windows reports a metered connection.';return}if(account?.id!==identity||response.account?.id!==identity)throw Error('The sync response belongs to a different account.');
   const returned=S.validate(response.state),merged=S.merge(state,returned),document=S.project(merged);
   // Validate every book before replacing the live workspace or durable queue.
   App.readBackup({format:'quiet-shelf-backup',version:2,library:document.library,preferences:document.preferences});
   if(App.hasDraft?.()){notice='Drive was checked. Incoming changes will load after you finish editing.';return}
   state=merged;dirty=!S.covers(returned,merged);lastSync=new Date().toISOString();firstPull=true;persist();apply(document);authRequired=false;notice=document.conflicts.length?'Sync completed. Review the conflicting changes below.':'Sync completed.';
  }catch(e){failed=true;notice=e.message;if(e.code==='SIGN_IN_REQUIRED')authRequired=true;try{persist()}catch{notice+=' Download a backup before closing.'}}
  finally{syncing=false;renderAccount();if(queued||dirty&&!failed){queued=false;schedule(2000)}}
 }
 async function refreshConnection(){
  try{const data=await request('status');connection=data;const next=publicAccount(data.account);activate(next);if(data.error)notice=data.error;renderAccount();if(data.pending||data.busy){clearTimeout(authTimer);authTimer=setTimeout(()=>void refreshConnection(),1200)}else if(next&&!syncing&&(!firstPull||dirty))schedule(100)}
  catch(e){notice=e.message;failed=true;const remembered=read(activeStorage,null);if(!account&&remembered){const cached=publicAccount(remembered);if(cached){try{activate(cached);notice='Account connection is unavailable. Showing this account’s saved device copy.';authRequired=true}catch{}}}renderAccount()}
 }
 $('#googleSignIn').onclick=async()=>{if(connection.mode==='web'){location.assign('/api/account/start');return}try{connection=await request('start',{});notice='';renderAccount();clearTimeout(authTimer);authTimer=setTimeout(()=>void refreshConnection(),1000)}catch(e){notice=e.message;renderAccount()}};
 $('#cancelGoogleSignIn').onclick=async()=>{try{connection=await request('cancel',{});notice='Sign-in cancelled.';renderAccount()}catch(e){notice=e.message;renderAccount()}};
 $('#googleSignOut').onclick=async()=>{if(syncing)return;try{persist();if(dirty&&!confirm('Some changes have not synced yet. They will stay on this device for this Google account. Sign out?'))return;connection=await request('signout',{});activate(null);notice='Signed out. Your separate local library is open.';renderAccount()}catch(e){notice=e.message;renderAccount()}};
 $('#saveGoogleClientId').onclick=async()=>{try{connection=await request('configure',{clientId:$('#googleClientId').value.trim()});notice='Google connection settings saved.';renderAccount()}catch(e){notice=e.message;renderAccount()}};
 $('#syncNow').onclick=()=>sync(true);
 $('#autoSync').onchange=()=>{settings.auto=$('#autoSync').checked;try{store(settingsStorage,settings)}catch{}renderAccount();if(settings.auto)schedule(100);else clearTimeout(syncTimer)};
 $('#meteredConnection').onchange=()=>{settings.meteredOverride=$('#meteredConnection').checked;try{store(settingsStorage,settings)}catch{}renderAccount();if(networkMetered())clearTimeout(syncTimer);else schedule(100)};
 $('#resetMetered').onclick=()=>{settings.meteredOverride=null;try{store(settingsStorage,settings)}catch{}renderAccount();schedule(100)};
 $('#copyLocalLibrary').onclick=()=>{if(!account||syncing||!firstPull)return;const current=App.snapshot(),ids=new Set(current.library.map(b=>b.id)),incoming=(guest?.library||[]).filter(b=>!b.sample&&!ids.has(b.id));if(!incoming.length){notice='These local titles are already present in this account.';renderAccount();return}const preferences=current.library.length?current.preferences:guest.preferences;apply({library:[...current.library,...incoming],preferences});recordChange();notice=incoming.length+' local titles copied to this account. Your signed-out copy is kept separately.';renderAccount()};
 $('#syncConflicts').onclick=e=>{const button=e.target.closest('[data-resolve-conflict]');if(!button||!account)return;const i=Number(button.dataset.resolveConflict),conflict=localDocument().conflicts[i];if(!conflict)return;try{state=S.resolve(state,conflict.key,Number($('#conflict-'+i).value),actor);dirty=true;persist();apply(localDocument());renderAccount();schedule()}catch(e){notice=e.message;renderAccount()}};
 root.addEventListener('online',()=>{renderAccount();schedule(100)});root.addEventListener('offline',renderAccount);
 navigator.connection?.addEventListener('change',()=>{renderAccount();if(networkMetered())clearTimeout(syncTimer);else schedule(100)});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){void refreshConnection();schedule(100)}});
 root.addEventListener('storage',event=>{if(account&&event.key===workspaceKey(account.id)){try{const incoming=read(event.key,null);if(incoming?.state){state=S.merge(state,incoming.state);dirty=dirty||incoming.dirty;persist();apply(localDocument());renderAccount();schedule()}}catch{notice='Another window’s changes could not be loaded. Keep a backup before closing.';renderAccount()}}});
 periodicTimer=setInterval(()=>{if(account&&online()&&!document.hidden)void refreshConnection().then(()=>{if(canAuto())return sync(false)})},120000);
 if(new URL(location.href).searchParams.has('account')){accountPage();const result=new URL(location.href).searchParams.get('account');notice=result==='failed'?'Google sign-in could not be completed. Check the Web OAuth setup and try again.':result==='cancelled'?'Google sign-in cancelled.':'';history.replaceState(null,'',location.pathname)}
 // Exposed only to in-process regression checks; no tokens or filesystem APIs.
 root.QuietShelfAccount={refresh:refreshConnection,sync,status:()=>({account,dirty,lastSync,firstPull,syncing,metered:networkMetered(),auto:settings.auto}),dispose(){clearTimeout(syncTimer);clearTimeout(authTimer);clearInterval(periodicTimer)}};
 renderAccount();void refreshConnection();
})(globalThis);

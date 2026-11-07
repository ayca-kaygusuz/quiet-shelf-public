function ready(){window.dispatchEvent(new CustomEvent('quiet-shelf-ready'))}
window.addEventListener('quiet-shelf-hello',ready);
window.addEventListener('quiet-shelf-request',event=>{let data;try{data=JSON.parse(event.detail)}catch{return;}if(!data||typeof data.id!=='string')return;chrome.runtime.sendMessage({type:'search',source:data.source,q:data.q},response=>{let error=chrome.runtime.lastError;window.dispatchEvent(new CustomEvent('quiet-shelf-response',{detail:JSON.stringify({id:data.id,...(error?{error:error.message}:response||{error:'Browser connector did not respond.'})})}))})});
ready();

const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const script=fs.readFileSync('src/index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const keyName='quiet-shelf-google-key-v1';

function launch(storage={},protocol='http:'){
 const elements={},timers=new Map(),requests=[],backups=[];let nextTimer=0,failRead=false,failWrite=false;
 const element=selector=>elements[selector]??={value:'',innerHTML:'',textContent:'',hidden:false,events:{},setAttribute(){},setCustomValidity(){},querySelector:()=>({disabled:false}),addEventListener(name,fn){this.events[name]=fn}};
 class AppURL extends URL{static createObjectURL(blob){backups.push(blob);return 'blob:test'}static revokeObjectURL(){}}
 const context={console,URL:AppURL,Blob,AbortController,crypto:require('node:crypto').webcrypto,location:{protocol,hostname:protocol==='quiet-shelf:'?'app':'localhost'},
  setTimeout:fn=>{const id=++nextTimer;timers.set(id,fn);return id},clearTimeout:id=>timers.delete(id),
  localStorage:{getItem(name){if(failRead&&name===keyName)throw Error('Unavailable');return storage[name]??null},setItem(name,value){if(failWrite&&name===keyName)throw Error('Unavailable');storage[name]=value},removeItem(name){if(failWrite&&name===keyName)throw Error('Unavailable');delete storage[name]}},
  document:{querySelector:element,querySelectorAll:()=>[],addEventListener(){},createElement:()=>({click(){}})},
  fetch:async(url,options)=>{requests.push({url,options});return {ok:true,json:async()=>({results:[]})}}
 };
 vm.createContext(context);vm.runInContext(script,context);
 return {storage,element,requests,backups,setKey(key){element('#googleApiKey').value=key;element('#googleApiKey').oninput()},fail(read,write){failRead=read;failWrite=write},async flush(){const pending=[...timers.values()];timers.clear();for(const fn of pending)await fn()}};
}

(async()=>{
 const browserStore={},appStore={};let browser=launch(browserStore),app=launch(appStore,'quiet-shelf:');
 browser.setKey('  test-only-browser-key  ');
 assert.equal(browserStore[keyName],'test-only-browser-key');
 browser.element('#addDialog').events.close();
 assert.equal(browser.element('#googleApiKey').value,'test-only-browser-key');
 browser=launch(browserStore);
 assert.equal(browser.element('#googleApiKey').value,'test-only-browser-key');
 assert.match(browser.element('#googleKeyNote').textContent,/Remembered in this browser/);
 assert.equal(app.element('#googleApiKey').value,'');
 app.setKey('test-only-app-key');app=launch(appStore,'quiet-shelf:');
 assert.equal(app.element('#googleApiKey').value,'test-only-app-key');
 assert.match(app.element('#googleKeyNote').textContent,/Remembered in this app/);
 assert.equal(browserStore[keyName],'test-only-browser-key');

 browser.element('#lookupSource').value='google';browser.element('#lookupSource').onchange();
 browser.element('#lookup').value='A title';browser.element('#lookup').oninput();await browser.flush();
 assert.equal(browser.requests.at(-1).options.headers['X-Google-Api-Key'],'test-only-browser-key');
 assert(!browser.requests.at(-1).url.includes('test-only-browser-key'));
 browser.element('#lookupSource').value='bkm';browser.element('#lookupSource').onchange();await browser.flush();
 assert.equal(browser.requests.at(-1).options.headers['X-Google-Api-Key'],undefined);

 browser.element('#export').onclick();
 const backup=await browser.backups[0].text();
 assert.equal(JSON.parse(backup).format,'quiet-shelf-backup');assert(Array.isArray(JSON.parse(backup).library));assert(!backup.includes('test-only-browser-key'));
 for(const [name,value] of Object.entries(browserStore))if(name!==keyName)assert(!value.includes('test-only-browser-key'));
 browser.setKey('');assert.equal(browserStore[keyName],undefined);
 assert.equal(launch(browserStore).element('#googleApiKey').value,'');
 assert.equal(appStore[keyName],'test-only-app-key');

 const unavailable=launch();unavailable.fail(false,true);unavailable.setKey('test-only-session-key');
 assert.equal(unavailable.storage[keyName],undefined);
 assert.match(unavailable.element('#googleKeyNote').textContent,/Could not save/);
 assert.equal(unavailable.element('#googleApiKey').value,'test-only-session-key');
 unavailable.element('#lookupSource').value='google';unavailable.element('#lookup').value='A title';
 unavailable.element('#lookup').oninput();await unavailable.flush();
 assert.equal(unavailable.requests.at(-1).options.headers['X-Google-Api-Key'],'test-only-session-key');
 unavailable.fail(true,false);unavailable.element('#addDialog').events.close();
 assert.equal(unavailable.element('#googleApiKey').value,'');
 assert.match(unavailable.element('#googleKeyNote').textContent,/Could not load/);
 const forgetFailure=launch({[keyName]:'test-only-saved-key'});forgetFailure.fail(false,true);forgetFailure.setKey('');
 assert.equal(forgetFailure.storage[keyName],'test-only-saved-key');assert.match(forgetFailure.element('#googleKeyNote').textContent,/Could not remove/);
 forgetFailure.fail(false,false);forgetFailure.setKey('');assert.equal(forgetFailure.storage[keyName],undefined);
 console.log('PASS: Google key survives form close/reload, separate app/browser stores, Google-only headers, no key in backups/preferences, clearing forgets it, unavailable storage keeps only a form-session key');
})().catch(error=>{console.error(error);process.exitCode=1});

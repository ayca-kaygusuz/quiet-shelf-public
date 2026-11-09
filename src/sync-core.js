/* Shared by the browser, Windows app and Drive adapter. No credentials belong here. */
(function(root){
 'use strict';
 const Next=root.QuietShelfReadNext||(typeof require==='function'?require('./read-next.js'):null);
 const SCHEMA=1,MAX_BYTES=10*1024*1024;
 const fields=new Set(['title','author','description','color','collection','seriesMode','seriesName','seriesId','seriesVolume','createdAt','addedOrder','cover','publisher','publicationYear','binding','language','translator','isbn','source','sourceUrl','sourceId','recordKind','sample','readingInfo','readNextExcluded','readNextFormat']);
 const prefs=new Set(['theme','includeArchive','includeWishlist','autoUpdateChecks','sort','search','collectionView','filter','readNext']);
 const clone=v=>JSON.parse(JSON.stringify(v)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const key=parts=>JSON.stringify(parts),dotKey=h=>h.dot.join(':');
 function empty(){return {schema:SCHEMA,clock:{},registers:[]}}
 function plain(v){return v&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)!==null}
 function validClock(v){return plain(v)&&Object.keys(v).length<=10000&&Object.entries(v).every(([a,n])=>/^[a-zA-Z0-9_-]{1,100}$/.test(a)&&!['__proto__','constructor','prototype'].includes(a)&&Number.isSafeInteger(n)&&n>0)}
 function calendarDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T12:00:00Z');return Number.isFinite(d.valueOf())&&d.toISOString().slice(0,10)===value}
 function validValue(p,v){
  if(p[0]==='b'){
   if(p[2]==='present')return typeof v==='boolean';
   if(v===null)return true;
   if(p[2]==='field'&&p[3]==='readingInfo')return Next?.validInfo(v)===true;
   if(p[2]==='field'&&p[3]==='readNextExcluded')return typeof v==='boolean';
   if(p[2]==='field'&&p[3]==='readNextFormat')return Next?.formats.includes(v)===true;
   if(p[2]==='reading')return plain(v)&&['Unread','In progress','Done'].includes(v.status)&&(v.startedOn===null||calendarDate(v.startedOn));
   if(p[2]==='history')return plain(v)&&v.id===p[3]&&calendarDate(v.date)&&calendarDate(v.startDate)&&v.startDate<=v.date&&typeof v.startDateFromFinish==='boolean';
   return p[3]==='sample'?typeof v==='boolean':['seriesVolume','addedOrder'].includes(p[3])?Number.isFinite(v)&&v>=0:typeof v==='string'&&v.length<=10000&&(p[3]!=='title'||!!v.trim());
  }
  if(v===null)return true;if(p[1]==='readNext')return Next?.validState(v)===true;if(p[1]==='seriesState'||['includeArchive','includeWishlist','autoUpdateChecks'].includes(p[1]))return typeof v==='boolean';
  if(p[1]==='theme')return ['ink','sage','tide','rosewood','porcelain','apricot'].includes(v);
  if(p[1]==='sort')return ['addedAsc','addedDesc','titleAsc','titleDesc','authorAsc','status','finishedDesc'].includes(v);
  if(p[1]==='collectionView')return ['library','archive','wishlist'].includes(v);
  if(p[1]==='filter')return ['All','Unread','In progress','Done'].includes(v);
  return p[1]==='search'&&plain(v)&&['kitapyurdu','bkm','nadir','openlibrary','google','anilist','blackwells','betterworld'].includes(v.source)&&['','tr','en','de','fr','ja','es','it','ru','ar','ko','zh','pt'].includes(v.lang);
 }
 function validate(state){
  if(!state||state.schema!==SCHEMA||!validClock(state.clock)||!Array.isArray(state.registers)||state.registers.length>300000||JSON.stringify(state).length>MAX_BYTES)throw Error('The sync copy is invalid or too large.');
  const seen=new Set();
  for(const pair of state.registers){
   if(!Array.isArray(pair)||pair.length!==2||typeof pair[0]!=='string'||seen.has(pair[0])||!Array.isArray(pair[1])||!pair[1].length||pair[1].length>128)throw Error('Invalid sync register.');seen.add(pair[0]);
   let p;try{p=JSON.parse(pair[0])}catch{throw Error('Invalid sync key.')}
   if(!Array.isArray(p)||p.some(x=>typeof x!=='string'||x.length>1000)||!(p[0]==='b'&&p.length>=3&&p.length<=4&&p[1]&&(['present','reading'].includes(p[2])&&p.length===3||p[2]==='field'&&p.length===4&&fields.has(p[3])||p[2]==='history'&&p.length===4&&p[3])||p[0]==='p'&&(p.length===2&&prefs.has(p[1])||p.length===3&&p[1]==='seriesState')))throw Error('Unsupported sync key.');
   const dots=new Set();
   for(const h of pair[1]){if(!h||!Array.isArray(h.dot)||h.dot.length!==2||!validClock({[h.dot[0]]:h.dot[1]})||!validClock(h.context)||!Object.hasOwn(h,'value')||!validValue(p,h.value)||dots.has(dotKey(h))||(state.clock[h.dot[0]]||0)<h.dot[1]||(h.context[h.dot[0]]||0)>=h.dot[1]||Object.entries(h.context).some(([actor,n])=>(state.clock[actor]||0)<n))throw Error('Invalid sync change.');dots.add(dotKey(h))}
  }
  return clone(state);
 }
 const dominates=(a,b)=>(a.context[b.dot[0]]||0)>=b.dot[1];
 function merge(...states){
  const result=empty(),registers=new Map();
  for(const raw of states){const s=validate(raw);for(const [actor,n]of Object.entries(s.clock))result.clock[actor]=Math.max(result.clock[actor]||0,n);for(const [k,heads]of s.registers){let bucket=registers.get(k)||new Map();for(const h of heads){const existing=bucket.get(dotKey(h));if(existing&&!same(existing,h))throw Error('Conflicting sync change identifiers.');bucket.set(dotKey(h),h)}registers.set(k,bucket)}}
  for(const [k,bucket]of [...registers].sort(([a],[b])=>a.localeCompare(b))){const all=[...bucket.values()];result.registers.push([k,all.filter(h=>!all.some(other=>other!==h&&dominates(other,h))).sort((a,b)=>dotKey(a).localeCompare(dotKey(b)))])}
  return validate(result);
 }
 function flatten(document){
  if(!document||!Array.isArray(document.library)||document.library.length>10000||new Set(document.library.map(b=>b.id)).size!==document.library.length)throw Error('Invalid library.');
  const out=new Map();
  for(const [position,b] of document.library.entries()){if(!b||typeof b.id!=='string'||!b.id||typeof b.title!=='string'||!b.title.trim()||!['Unread','In progress','Done'].includes(b.status)||!Array.isArray(b.history))throw Error('Invalid book.');
   out.set(key(['b',b.id,'present']),true);
   for(const name of fields)if(b[name]!==undefined)out.set(key(['b',b.id,'field',name]),clone(b[name]));
   if(!Number.isFinite(b.addedOrder))out.set(key(['b',b.id,'field','addedOrder']),position);
   out.set(key(['b',b.id,'reading']),{status:b.status,startedOn:b.status==='In progress'?b.startedOn||null:null});
   for(const h of b.history){if(!h||typeof h.id!=='string'||!h.id)throw Error('Invalid reading history.');out.set(key(['b',b.id,'history',h.id]),{id:h.id,date:h.date,startDate:h.startDate||h.date,startDateFromFinish:h.startDateFromFinish===true})}
  }
  const p=document.preferences||{};for(const name of prefs)if(p[name]!==undefined)out.set(key(['p',name]),clone(p[name]));
  if(p.seriesState&&typeof p.seriesState==='object')for(const [id,open]of Object.entries(p.seriesState))if(typeof open==='boolean')out.set(key(['p','seriesState',id]),open);
  return out;
 }
 function chosen(heads,parts){return parts[0]==='b'&&parts[2]==='present'&&heads.some(h=>h.value===false)?heads.find(h=>h.value===false):heads.at(-1)}
 function project(state){
  const library=new Map(),preferences={seriesState:{}},conflicts=[];
  for(const [k,heads]of state.registers){const p=JSON.parse(k),value=chosen(heads,p).value;
   if(heads.length>1&&heads.some(h=>!same(h.value,heads[0].value)))conflicts.push({key:k,parts:p,choices:heads.map(h=>clone(h.value))});
   if(p[0]==='p'){if(p[1]==='seriesState'){if(value!==null)Object.defineProperty(preferences.seriesState,p[2],{value,enumerable:true,configurable:true,writable:true})}else if(value!==null)preferences[p[1]]=clone(value);continue}
   const b=library.get(p[1])||{id:p[1],history:[]};library.set(p[1],b);
   if(p[2]==='present')b._present=value===true;
   if(p[2]==='field'&&value!==null)b[p[3]]=clone(value);
   if(p[2]==='reading'&&value){b.status=value.status;if(value.startedOn)b.startedOn=value.startedOn}
   if(p[2]==='history'&&value)b.history.push(clone(value));
  }
  return {library:[...library.values()].filter(b=>b._present).map(b=>{delete b._present;return b}).sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||''))||(a.addedOrder||0)-(b.addedOrder||0)||a.id.localeCompare(b.id)),preferences,conflicts};
 }
 function writer(state,actor){if(!/^[a-zA-Z0-9_-]{1,100}$/.test(actor)||['__proto__','constructor','prototype'].includes(actor))throw Error('Invalid device identifier.');const registers=new Map(state.registers);return {put(k,value){const context={...state.clock},n=(state.clock[actor]||0)+1;state.clock[actor]=n;registers.set(k,[{dot:[actor,n],context,value:clone(value)}])},finish(){state.registers=[...registers].sort(([a],[b])=>a.localeCompare(b));return validate(state)}}}
 function update(raw,document,actor){
  const state=validate(raw),before=flatten(project(state)),after=flatten(document),write=writer(state,actor),changedBooks=new Set();
  for(const [k,value]of after)if(!before.has(k)||!same(value,before.get(k))){write.put(k,value);const p=JSON.parse(k);if(p[0]==='b')changedBooks.add(p[1])}
  for(const [k]of before)if(!after.has(k)){const p=JSON.parse(k);if(p[0]==='b'&&!after.has(key(['b',p[1],'present']))){if(p[2]==='present')write.put(k,false)}else write.put(k,null);if(p[0]==='b')changedBooks.add(p[1])}
  for(const id of changedBooks)if(after.has(key(['b',id,'present'])))write.put(key(['b',id,'present']),true);
  return write.finish();
 }
 function resolve(raw,k,choice,actor){const s=validate(raw),heads=new Map(s.registers).get(k);if(!heads||!Number.isInteger(choice)||choice<0||choice>=heads.length)throw Error('Invalid conflict choice.');const w=writer(s,actor);w.put(k,heads[choice].value);return w.finish()}
 function covers(newer,older){const all=new Map(newer.registers);return older.registers.every(([k,heads])=>heads.every(old=>(all.get(k)||[]).some(h=>dotKey(h)===dotKey(old)||dominates(h,old))))}
 function connectLibrary(remote,document,actor){
  const library=document.library.filter(b=>!b.sample),local=update(empty(),{library,preferences:{}},actor+'_import');let combined=merge(remote,local);
  // The user explicitly chose to keep the titles currently on this device.
  // Restore any of those titles whose old Drive copy had been deleted.
  for(const b of library){const k=key(['b',b.id,'present']),heads=new Map(combined.registers).get(k);if(heads?.some(h=>h.value===false))combined=resolve(combined,k,heads.findIndex(h=>h.value===true),actor)}
  const current=project(combined),preferences={...current.preferences,...document.preferences,seriesState:{...current.preferences.seriesState,...document.preferences?.seriesState}};
  return update(combined,{library:current.library,preferences},actor);
 }
 const api={SCHEMA,MAX_BYTES,empty,validate,merge,project,update,resolve,covers,connectLibrary};root.QuietShelfSync=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);

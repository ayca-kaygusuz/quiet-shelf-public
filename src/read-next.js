// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0

/* On-device recommendations. No network, timers, credentials or list history. */
(function(root){
 'use strict';
 const formats=['unknown','prose','manga','comic','reference'];
 const modes=['balanced','quick','series'];
 const genres={all:'Any genre',fantasy:'Fantasy',scifi:'Science fiction',mystery:'Mystery & crime',romance:'Romance',horror:'Horror',adventure:'Adventure',slice:'Slice of life',nonfiction:'Narrative nonfiction'};
 const patterns={fantasy:/fantasy|fantastik|fantastique/,scifi:/science fiction|sci fi|bilim kurgu|bilimkurgu/,mystery:/mystery|detective|crime|polisiye|dedektif|gizem/,romance:/romance|romantik|romantik komedi/,horror:/horror|korku/,adventure:/adventure|macera/,slice:/slice of life|gundelik yasam/,nonfiction:/biograph|memoir|anilar|biyografi|otobiyografi|travel writing|gezi yaz/};
 const normalized=v=>String(v||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/ı/g,'i').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 const plain=v=>v&&typeof v==='object'&&!Array.isArray(v);
 const only=(v,keys)=>plain(v)&&Object.keys(v).every(k=>keys.includes(k));
 const string=(v,n)=>typeof v==='string'&&v.length<=n;
 const stamp=v=>string(v,40)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
 function calendarDate(v){if(!string(v,10)||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+'T12:00:00Z');return Number.isFinite(d.valueOf())&&d.toISOString().slice(0,10)===v}
 function localDay(now){if(calendarDate(now))return now;const d=new Date(now);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
 function validSeriesExclusions(v){return Array.isArray(v)&&v.length<=10000&&new Set(v.map(r=>r?.key)).size===v.length&&v.every(r=>only(r,['key','name','until'])&&string(r.key,1000)&&!!r.key&&string(r.name,1000)&&!!r.name.trim()&&(r.until===null||calendarDate(r.until)))}
 const exclusionActive=(until,now=new Date())=>!until||until>=localDay(now);
 function excluded(book,{seriesInfo=()=>null,seriesExclusions=[],now=new Date()}={}){
  if(book.readNextExcluded&&exclusionActive(book.readNextExcludedUntil,now))return 'manual';
  const key=seriesInfo(book)?.key;
  return key&&seriesExclusions.some(r=>r.key===key&&exclusionActive(r.until,now))?'series':null;
 }
 function isbn(v){const n=String(v||'').replace(/[\s-]/g,'').toUpperCase();if(/^97[89]\d{10}$/.test(n)&&[...n].reduce((s,c,i)=>s+Number(c)*(i%2?3:1),0)%10===0)return n;if(/^\d{9}[\dX]$/.test(n)&&[...n].reduce((s,c,i)=>s+(c==='X'?10:Number(c))*(10-i),0)%11===0){const base='978'+n.slice(0,9);return base+(10-[...base].reduce((s,c,i)=>s+Number(c)*(i%2?3:1),0)%10)%10}return ''}
 function validInfo(v){return only(v,['version','isbn','pages','subjects','format','sources','checkedAt'])&&v.version===1&&string(v.isbn,20)&&(v.isbn===''||!!isbn(v.isbn))&&(v.pages===null||Number.isInteger(v.pages)&&v.pages>0&&v.pages<=50000)&&Array.isArray(v.subjects)&&v.subjects.length<=30&&v.subjects.every(s=>string(s,120))&&formats.includes(v.format)&&Array.isArray(v.sources)&&v.sources.length<=3&&v.sources.every(s=>string(s,100))&&stamp(v.checkedAt)}
 function validList(v){return v===null||only(v,['id','createdAt','mode','genre','entries'])&&string(v.id,100)&&!!v.id&&stamp(v.createdAt)&&modes.includes(v.mode)&&Object.hasOwn(genres,v.genre)&&Array.isArray(v.entries)&&v.entries.length>0&&v.entries.length<=15&&new Set(v.entries.map(e=>e.bookId)).size===v.entries.length&&v.entries.every(e=>only(e,['bookId','title','author','reason','effort'])&&string(e.bookId,1000)&&!!e.bookId&&string(e.title,10000)&&!!e.title.trim()&&string(e.author,10000)&&string(e.reason,300)&&string(e.effort,80))}
 function validState(v){return only(v,['list','mode','genre'])&&validList(v.list)&&modes.includes(v.mode)&&Object.hasOwn(genres,v.genre)}
 const empty=()=>({list:null,mode:'balanced',genre:'all'});
 function info(raw={},source='',editionISBN=''){
  const pages=Number(raw.pages),subjects=(Array.isArray(raw.subjects)?raw.subjects:[]).filter(s=>typeof s==='string').map(s=>s.replace(/<[^>]*>/g,' ').trim().slice(0,120)).filter(Boolean).slice(0,30);
  return {version:1,isbn:isbn(editionISBN),pages:Number.isInteger(pages)&&pages>0&&pages<=50000?pages:null,subjects,format:formats.includes(raw.format)?raw.format:'unknown',sources:source?[source.slice(0,100)]:[],checkedAt:new Date().toISOString()};
 }
 function mergeInfo(a,b,editionISBN){
  if(!validInfo(b)||isbn(b.isbn)!==isbn(editionISBN))throw Error('Reading information must match this ISBN.');
  if(!validInfo(a)||isbn(a.isbn)!==isbn(editionISBN))a=info({},'',editionISBN);
  return {version:1,isbn:isbn(editionISBN),pages:a.pages||b.pages,subjects:[...new Set([...a.subjects,...b.subjects])].slice(0,30),format:a.format!=='unknown'?a.format:b.format,sources:[...new Set([...a.sources,...b.sources])].slice(-3),checkedAt:new Date().toISOString()};
 }
 function studyMaterial(book,metadata){
  // Only catalog classifications or an explicit user choice establish study
  // material. Titles and the edition language cannot reliably do that.
  const subjects=normalized((metadata?.subjects||[]).join(' '));
  return metadata?.format==='reference'||/\b(foreign language study|language study|language teaching|language learning|language instruction|study aids|textbooks?|workbooks?|self instruction|phrasebooks?|conversation and phrase books|dil egitimi|yabanci dil|ders kitaplari|ders kitabi|calisma kitabi|dil bilgisi|dilbilgisi|sozlukler|sozluk|grammaire|sprachlehrbuch)\b/.test(subjects);
 }
 function inferred(book,seriesBooks=[]){
  const metadata=validInfo(book.readingInfo)?book.readingInfo:null;
  const subjects=metadata?.subjects.length?metadata.subjects:seriesBooks.find(b=>validInfo(b.readingInfo)&&b.readingInfo.subjects.length)?.readingInfo.subjects||[],words=normalized([book.title,...subjects].join(' '));
  const explicit=formats.includes(book.readNextFormat)&&book.readNextFormat!=='unknown';
  let format=explicit?book.readNextFormat:studyMaterial(book,metadata)?'reference':metadata?.format||'unknown';
  if(format==='unknown'){
   if(/\b(manga|manhwa|manhua)\b/.test(words)||book.source==='AniList')format='manga';
   else if(/\b(comic|comics|graphic novel|cizgi roman)\b/.test(words))format='comic';
   else if(/\b(novel|fiction|roman|oyku|hikaye)\b/.test(normalized(subjects.join(' '))))format='prose';
   else{const known=seriesBooks.find(b=>b!==book&&inferred(b).format!=='unknown');if(known)format=inferred(known).format}
  }
  const tags=Object.keys(patterns).filter(k=>patterns[k].test(words));
  const minutes=metadata?.pages?metadata.pages*({manga:.22,comic:.65,prose:1.6,unknown:1.6,reference:2}[format]):null;
  const effort=minutes===null?'Reading effort unknown':minutes<=180?'Shorter read · estimate':minutes<=480?'Medium read · estimate':'Longer read · estimate';
  return {format,tags,minutes,effort,typeConfirmed:!!(explicit||metadata&&(metadata.format!=='unknown'||studyMaterial(book,metadata)||/\b(fiction|novels?|roman|oyku|hikaye|manga|manhwa|manhua|comics?|graphic novels?|cizgi roman|biograph\p{L}*|memoirs?|biyografi|otobiyografi)\b/u.test(normalized(metadata.subjects.join(' '))))),uncertain:format==='unknown'||!metadata?.pages};
 }
 function candidates(books,{genre='all',seriesInfo=()=>null,seriesExclusions=[],now=new Date()}={}){
  const groups=new Map();for(const book of books){const s=seriesInfo(book);if(s){const g=groups.get(s.key)||[];g.push(book);groups.set(s.key,g)}}
  const result=[];
  for(const book of books){
   if(book.status!=='Unread'||book.collection&&book.collection!=='library'||excluded(book,{seriesInfo,seriesExclusions,now})||book.sample)continue;
   const s=seriesInfo(book),group=s?groups.get(s.key):[],reading=inferred(book,group);
   if(reading.format==='reference'||genre!=='all'&&!reading.tags.includes(genre))continue;
   let continuation=false,reason='An unread title to explore';
   if(s){
    const earlier=group.filter(b=>b!==book&&seriesInfo(b)?.volume!==null&&s.volume!==null&&seriesInfo(b).volume<s.volume);
    if(earlier.some(b=>b.status!=='Done'))continue;
    const unread=group.filter(b=>b.status==='Unread'&&(!b.collection||b.collection==='library')&&!excluded(b,{seriesInfo,seriesExclusions,now})).sort((a,b)=>(seriesInfo(a).volume??Infinity)-(seriesInfo(b).volume??Infinity)||a.id.localeCompare(b.id));
    if(unread[0]?.id!==book.id)continue;
    const last=Math.max(0,...earlier.filter(b=>b.status==='Done').map(b=>seriesInfo(b).volume));
    if(last&&s.volume>last+1)continue;
    continuation=earlier.length>0&&earlier.every(b=>b.status==='Done');
    reason=continuation?'Next in your series':'Earliest unread title you own in this series';
   }
   if(reading.tags.length)reason+=' · '+genres[reading.tags[0]];
   const known=group.filter(b=>b.collection!=='wishlist'),finished=known.filter(b=>b.status==='Done').length,remaining=known.filter(b=>b.status!=='Done'&&(!b.collection||b.collection==='library')).length;
   if(continuation)reason+=' · '+finished+' read, '+remaining+' unread owned';
   result.push({book,series:s?.key||'',continuation,finished,remaining,...reading,reason});
  }
  return result;
 }
 function generate(books,{mode='balanced',genre='all',previous=null,random=Math.random,seriesInfo=()=>null,seriesExclusions=[],id,now=new Date().toISOString()}={}){
  if(!modes.includes(mode)||!Object.hasOwn(genres,genre))throw Error('Choose a supported reading mode and genre.');
  const pool=candidates(books,{genre,seriesInfo,seriesExclusions,now}),count=Math.min(12,pool.length);
  if(!count)return null;
  const weighted=pool.map(c=>{
   let weight=1+(c.continuation?(mode==='series'?6:2):0);
   if(c.finished){weight+=c.finished/(c.finished+c.remaining||1);if(c.remaining<=2)weight+=.8}
   const age=(Date.parse(now)-Date.parse(c.book.createdAt||''))/86400000;
   if(Number.isFinite(age)&&age>0)weight*=1+Math.min(.5,age/1460);
   if(c.minutes!==null)weight*=mode==='quick'?Math.max(.15,250/(c.minutes+60)):Math.max(.6,Math.min(1.6,350/(c.minutes+120)));
   if(previous?.entries.some(e=>e.bookId===c.book.id))weight*=.55;
   return {...c,rank:-Math.log(Math.max(.000001,Math.min(.999999,random())))/weight};
  }).sort((a,b)=>a.rank-b.rank);
  let chosen=weighted.slice(0,count);
  // If alternatives exist, a replacement must change membership, not merely order.
  if(previous&&chosen.every(c=>previous.entries.some(e=>e.bookId===c.book.id))&&previous.entries.length===chosen.length){const alternative=weighted.slice(count).find(c=>!previous.entries.some(e=>e.bookId===c.book.id));if(alternative)chosen[chosen.length-1]=alternative}
  return {id:id||root.crypto.randomUUID(),createdAt:now,mode,genre,entries:chosen.map(c=>({bookId:c.book.id,title:c.book.title,author:c.book.author||'',reason:c.reason,effort:c.effort}))};
 }
 function progress(list,books,options={}){const byId=new Map(books.map(b=>[b.id,b]));return (list?.entries||[]).map(entry=>{const book=byId.get(entry.bookId);return {...entry,book,status:book?.status||'Unavailable',outside:!!book&&!!book.collection&&book.collection!=='library',exclusion:book&&(excluded(book,options)||(inferred(book).format==='reference'?'reference':null))}})}
 const api={formats,modes,genres,empty,isbn,calendarDate,validSeriesExclusions,exclusionActive,excluded,validInfo,validList,validState,info,mergeInfo,inferred,candidates,generate,progress};root.QuietShelfReadNext=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);

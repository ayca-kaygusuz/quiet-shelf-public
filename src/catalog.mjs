// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0

function readingInformation(pages,subjects,format,source,isbnValue){
 let f=String(format||'').toLowerCase(),tags=(Array.isArray(subjects)?subjects:[subjects]).filter(x=>typeof x==='string').map(x=>text(x).slice(0,120)).filter(Boolean).slice(0,30),words=tags.join(' ').toLowerCase();
 return {version:1,isbn:parseISBN(isbnValue)||'',pages:Number.isInteger(Number(pages))&&Number(pages)>0&&Number(pages)<=50000?Number(pages):null,subjects:tags,format:/manga|manhwa|manhua/.test(f+' '+words)?'manga':/comic|graphic novel|çizgi roman/.test(f+' '+words)?'comic':/textbook|workbook|dictionary|language instruction/.test(f+' '+words)?'reference':'unknown',sources:[source],checkedAt:new Date().toISOString()};
}
const root='https://www.kitapyurdu.com';
export function text(html=''){const entities={amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' ',auml:'ä',ouml:'ö',uuml:'ü',Auml:'Ä',Ouml:'Ö',Uuml:'Ü',szlig:'ß',eacute:'é',egrave:'è',aacute:'á',oacute:'ó',uacute:'ú',ndash:'–',mdash:'—',bdquo:'„',ldquo:'“',rdquo:'”'};return String(html).replace(/<[^>]*>/g,' ').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,v)=>{let n=v[0].toLowerCase()==='x'?parseInt(v.slice(1),16):Number(v);return n>0&&n<=0x10ffff?String.fromCodePoint(n):''}).replace(/&([a-z]+);/gi,(all,k)=>entities[k]??all).replace(/[\u0098\u009c]/g,'').replace(/\s+/g,' ').trim()}
export function bookURL(value){try{let u=new URL(value);if(u.origin!==root||!/^\/kitap\/[a-zA-Z0-9%-]+\/\d+\.html$/.test(u.pathname)||u.username||u.password)return '';return root+u.pathname}catch{return ''}}
function attr(tag,key){return text(tag.match(new RegExp('\\b'+key+'=["\']([^"\']*)["\']','i'))?.[1]||'')}
function cover(value){try{let u=new URL(value);return u.protocol==='https:'&&u.hostname==='img.kitapyurdu.com'?u.href:''}catch{return ''}}
export function parseSearch(html){let result=[],seen=new Set();for(let block of html.split(/<div\b[^>]*class="ky-product"[^>]*>/i).slice(1)){let match=block.match(/<a\b[^>]*class="ky-product-title"[^>]*>([\s\S]*?)<\/a>/i);if(!match)continue;let sourceUrl=bookURL(attr(match[0],'href'));if(!sourceUrl||seen.has(sourceUrl))continue;seen.add(sourceUrl);let field=k=>text(block.match(new RegExp('<span[^>]*class="ky-product-'+k+'"[^>]*>([\\s\\S]*?)<\\/span>','i'))?.[1]||'');let img=block.match(/class="ky-product-cover"[^>]*>[\s\S]*?<img\b[^>]*>/i)?.[0]||'';result.push({title:text(match[1]),author:field('author'),publisher:field('publisher'),cover:cover(attr(img,'src')),sourceUrl,source:'Kitapyurdu'});if(result.length===40)break}return result}
export function parseBook(html,url){let graphs=[];for(let m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{let j=JSON.parse(m[1]);graphs.push(...(j['@graph']||[j]))}catch{}}let b=graphs.find(x=>x['@type']==='Book'||Array.isArray(x['@type'])&&x['@type'].includes('Book'));if(!b?.name)throw Error('Book details unavailable');let names=v=>(Array.isArray(v)?v:[v]).filter(Boolean).map(x=>typeof x==='string'?x:x.name||'').join(', ');let translator='',listedLanguage='';for(let m of html.matchAll(/class="ky-pd-attributes__label"[^>]*>([\s\S]*?)<\/span>\s*<span[^>]*class="ky-pd-attributes__value"[^>]*>([\s\S]*?)<\/span>/gi)){if(text(m[1]).includes('Çevirmen'))translator=text(m[2]);if(text(m[1]).replace(':','').trim()==='Dil')listedLanguage=text(m[2])}return {title:text(b.name),author:text(names(b.author)),publisher:text(names(b.publisher)),isbn:text(b.isbn||''),readingInfo:readingInformation(b.numberOfPages,[...(Array.isArray(b.genre)?b.genre:[b.genre]),...Array.from(html.matchAll(/<a\b[^>]*class="ky-pd-attributes__category-link"[^>]*>([\s\S]*?)<\/a>/gi),m=>text(m[1]))],b.bookFormat,'Kitapyurdu',b.isbn),language:normalizeLanguage(b.inLanguage||listedLanguage||''),translator,cover:cover(Array.isArray(b.image)?b.image[0]:b.image),sourceUrl:bookURL(url),source:'Kitapyurdu'}}
async function upstream(url){let response;for(let i=0;i<4;i++){response=await fetch(url,{headers:{'Accept':'text/html','User-Agent':'QuietShelf/1.0 (personal book catalog)'},redirect:'manual',signal:AbortSignal.timeout(12000)});if(response.status>=300&&response.status<400){let next=new URL(response.headers.get('location'),url);if(next.origin!==root)throw Error('Unexpected redirect');url=next.href;continue}break}if(!response?.ok){let error=Error('Kitapyurdu HTTP '+response?.status);error.upstreamStatus=response?.status;throw error;}let html=await response.text();if(html.length>3000000)throw Error('Response too large');return html}

export const languages={tr:{ol:'tur',ky:'TÜRKÇE'},en:{ol:'eng',ky:'İNGİLİZCE'},de:{ol:'ger',ky:'ALMANCA'},fr:{ol:'fre',ky:'FRANSIZCA'},ja:{ol:'jpn',ky:'JAPONCA'},es:{ol:'spa',ky:'İSPANYOLCA'},it:{ol:'ita',ky:'İTALYANCA'},ru:{ol:'rus',ky:'RUSÇA'},ar:{ol:'ara',ky:'ARAPÇA'},ko:{ol:'kor',ky:'KORECE'},zh:{ol:'chi',ky:'ÇİNCE'},pt:{ol:'por',ky:'PORTEKİZCE'}};
export function normalizeLanguage(v){let value=String(v||'').toLocaleLowerCase('tr').trim();return ({turkish:'tr','türkçe':'tr',tur:'tr',english:'en',englisch:'en','ingilizce':'en','i̇ngilizce':'en',eng:'en',german:'de',deutsch:'de',ger:'de',deu:'de',french:'fr','französisch':'fr',fre:'fr',fra:'fr',japanese:'ja',japanisch:'ja',jpn:'ja',spanish:'es',spanisch:'es',spa:'es',italian:'it',italienisch:'it',ita:'it',russian:'ru',russisch:'ru',rus:'ru',arabic:'ar',arabisch:'ar',ara:'ar',korean:'ko',koreanisch:'ko',kor:'ko',chinese:'zh',chinesisch:'zh',chi:'zh',zho:'zh',portuguese:'pt',portugiesisch:'pt',por:'pt'})[value]||value}
function graphs(html){let result=[];for(let m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{let data=JSON.parse(m[1]);result.push(...(data['@graph']||(Array.isArray(data)?data:[data])))}catch{}}return result}
function names(v){return (Array.isArray(v)?v:[v]).filter(Boolean).map(x=>typeof x==='string'?x:x.name||'').join(', ')}
export function bkmURL(value){try{let u=new URL(value);return u.origin==='https://www.bkmkitap.com'&&/^\/[a-zA-Z0-9%-]+$/.test(u.pathname)&&!u.username&&!u.password?u.origin+u.pathname:''}catch{return ''}}
function safeBkmCover(v){try{let u=new URL(v);return u.protocol==='https:'&&(u.hostname==='cdn.bkmkitap.com'||/^bkmcdn\d+\.witcdn\.net$/.test(u.hostname))?u.href:''}catch{return ''}}
function bkmRecord(b){let sourceUrl=bkmURL(b.url||b.offers?.url);if(!sourceUrl||!b.name)return null;return {title:text(b.name),author:text(names(b.author)),publisher:text(names(b.publisher)),isbn:text(b.isbn||''),readingInfo:readingInformation(b.numberOfPages,b.genre,b.bookFormat,'BKM Kitap',b.isbn),language:normalizeLanguage(b.inLanguage),cover:safeBkmCover(Array.isArray(b.image)?b.image[0]:b.image),sourceUrl,source:'BKM Kitap'}}
export function parseBkm(html,lang=''){let items=graphs(html).flatMap(g=>g['@type']==='ItemList'?(g.itemListElement||[]).map(x=>x.item):[g]);let seen=new Set();return items.filter(b=>b&&[b['@type']].flat().includes('Book')).map(bkmRecord).filter(b=>b&&!seen.has(b.sourceUrl)&&seen.add(b.sourceUrl)&&(!lang||b.language===lang)).slice(0,40)}

const nadirRoot='https://www.nadirkitap.com';
const nadirLanguages={tr:1,en:7,de:3,fr:6,ja:27,es:8,it:9,ru:10,ar:4,ko:30,zh:16,pt:41};
export function nadirURL(value){try{let u=new URL(value);return u.protocol==='https:'&&['www.nadirkitap.com','nadirkitap.com'].includes(u.hostname)&&!u.port&&!u.username&&!u.password&&/^\/[a-zA-Z0-9%-]+-kitap\d+\.html$/.test(u.pathname)?nadirRoot+u.pathname:''}catch{return ''}}
function nadirCover(value){try{let u=new URL(value);return u.origin==='https://static.nadirkitap.com'&&!u.username&&!u.password&&u.pathname.startsWith('/fotograf/')?u.href:''}catch{return ''}}
function publisherYear(value){let full=text(value),match=full.match(/,\s*(\d{1,4})\s*$/);return {publisher:match?full.slice(0,match.index).trim():full,publicationYear:match&&/^\d{4}$/.test(match[1])&&Number(match[1])>=1000?match[1]:''}}
export function parseNadirSearch(html){
  let records=[],seen=new Set();
  // The page repeats every listing in a hidden grid. Read the list once.
  let list=(html.split(/<div\b[^>]*id=["']listView["'][^>]*>/i)[1]||html).split(/<div\b[^>]*id=["']gridView["'][^>]*>/i)[0];
  for(let block of list.split(/<div\b[^>]*class=["'][^"']*\bproductsListHover\b[^"']*["'][^>]*>/i).slice(1)){
    let title=[...block.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)].find(m=>/\bnadirBook\b/.test(attr(m[0].split('>')[0],'class')));
    if(!title)continue;let sourceUrl=nadirURL(attr(title[0].split('>')[0],'href'));
    if(!sourceUrl||seen.has(sourceUrl)||!text(title[1]))continue;seen.add(sourceUrl);
    let line=block.match(/<li\b[^>]*class=["'][^"']*\bnkLineAuthor\b[^"']*["'][^>]*>([\s\S]*?)<\/li>/i)?.[1]||'';
    let fields=[...line.matchAll(/<span\b[^>]*>([\s\S]*?)<\/span>/gi)].filter(m=>/\bnadirBook\b/.test(attr(m[0].split('>')[0],'class'))).map(m=>text(m[1]));
    let img=block.match(/<img\b[^>]*>/i)?.[0]||'';
    records.push({title:text(title[1]),author:fields[0]||'',...publisherYear(fields[1]||''),isbn:'',language:'',cover:nadirCover(attr(img,'src')),sourceUrl,source:'Nadir Kitap',recordKind:'edition'});
    if(records.length===40)break;
  }
  return records;
}
export function parseNadirBook(html,url){
  let b=graphs(html).find(g=>[g['@type']].flat().includes('Book')),sourceUrl=nadirURL(url);
  if(!b?.name||!sourceUrl)throw Error('Nadir Kitap edition details unavailable');
  let fields={};
  for(let m of html.matchAll(/<i\b[^>]*>([\s\S]*?)<\/i>\s*<b\b[^>]*class=["'][^"']*\bspec-desc\b[^"']*["'][^>]*>([\s\S]*?)<\/b>/gi)){
    let value=text(m[2]);if(value&&!/^[-–\s]+$/.test(value))fields[text(m[1])]=value;
  }
  let publication=publisherYear(fields['Yayınevi ve Yılı']||''),date=text(b.datePublished||'').match(/^([12]\d{3})(?:-|$)/);
  return {title:text(b.name),author:text(names(b.author)),publisher:text(names(b.publisher))||publication.publisher,publicationYear:date?.[1]||publication.publicationYear,isbn:text(b.isbn||fields.ISBN||''),language:normalizeLanguage(b.inLanguage||fields.Dili||''),readingInfo:readingInformation(b.numberOfPages||fields['Sayfa Sayısı'],b.genre,b.bookFormat,'Nadir Kitap',b.isbn||fields.ISBN),translator:fields['Çeviren']||'',binding:fields['Cilt Durumu']||'',cover:nadirCover(Array.isArray(b.image)?b.image[0]:b.image),sourceUrl,source:'Nadir Kitap',recordKind:'edition'};
}
export function dedupeNadir(results){
  let seen=new Set();return results.filter(book=>{
    let isbn=comparableISBN(book.isbn);
    // Missing/conflicting metadata is not proof that two seller listings are the same edition.
    let identity=isbn?JSON.stringify([isbn,searchVolume(book.title),normalizeSearch(book.author),normalizeSearch(book.publisher),book.language||'',book.publicationYear||'',normalizeSearch(book.binding),normalizeSearch(book.translator)]):book.sourceUrl;
    if(seen.has(identity))return false;seen.add(identity);return true;
  });
}
const nadirPending=new Map();let nadirActive=0;const nadirQueue=[];
async function nadirSlot(work){if(nadirActive>=3)await new Promise(resolve=>nadirQueue.push(resolve));else nadirActive++;try{return await work()}finally{let next=nadirQueue.shift();if(next)next();else nadirActive--}}
async function nadirBook(url){
  let key=JSON.stringify(['nadir','',url]),cached=memory.get(key);
  if(cached&&cached.until>Date.now())return cached.data;
  if(nadirPending.has(url))return nadirPending.get(url);
  let pending=nadirSlot(async()=>{let data=parseNadirBook(await publicFetch(url,nadirRoot),url);cacheCatalog(key,data);return data});
  nadirPending.set(url,pending);try{return await pending}finally{nadirPending.delete(url)}
}
async function nadirSearch(query,lang){
  let isbn=parseISBN(query),url=new URL(isbn?'/kitapara.php':'/kitapara_sonuc.php',nadirRoot);
  if(isbn){url.searchParams.set('ara','kitapdetay');url.searchParams.set('tip','kitap');url.searchParams.set('isbn',isbn)}
  else{url.searchParams.set('kelime',query);if(lang)url.searchParams.set('dil',String(nadirLanguages[lang]))}
  let html=await publicFetch(url.href,nadirRoot),basic=parseNadirSearch(html);
  if(!basic.length&&!/id=["']listView["']|sonuç bulunamadı|sonuc bulunamadi|bulunamadı/i.test(html))throw Error('Nadir Kitap search unavailable');
  let candidates=rankSearchResults(basic,query,24),records=[],failures=[];
  // Bound parallel requests and cache detail pages, including across query variants.
  for(let offset=0;offset<candidates.length;offset+=3){
    let batch=candidates.slice(offset,offset+3),details=await Promise.allSettled(batch.map(book=>nadirBook(book.sourceUrl)));
    details.forEach((detail,i)=>{if(detail.status==='fulfilled')records.push(detail.value);else{failures.push(detail.reason);if(!lang&&!isbn)records.push(batch[i])}});
    if(dedupeNadir(records.filter(book=>!lang||book.language===lang)).length>=12)break;
  }
  if(candidates.length&&failures.length===candidates.length)throw failures[0];
  let results=dedupeNadir(records.filter(book=>!lang||book.language===lang));
  return {results,...(failures.length?{searchNotice:'Some listing details could not be loaded. Retry to include them.'}:lang&&records.some(book=>!book.language)?{searchNotice:'Some listings lack language details. Choose Any language to include them.'}:{})};
}
export function parseOpenLibrary(data,lang='',requestedISBN=''){let seen=new Set();return (data.docs||[]).flatMap(w=>(w.editions?.docs||[]).map(e=>{if(!/^\/books\/OL\d+M$/.test(e.key))return null;let language=(e.language||[]).map(normalizeLanguage);if(lang&&!language.includes(lang))return null;return {title:text(e.title||w.title),author:text((w.author_name||[]).join(', ')),publisher:text((e.publisher||[]).join(', ')),isbn:(requestedISBN&&(e.isbn||[]).find(x=>comparableISBN(x)===comparableISBN(requestedISBN)))||(e.isbn||[]).find(x=>x.length===13)||(e.isbn||[])[0]||'',readingInfo:readingInformation(e.number_of_pages,w.subject,e.physical_format,'Open Library',(requestedISBN&&(e.isbn||[]).find(x=>comparableISBN(x)===comparableISBN(requestedISBN)))||(e.isbn||[]).find(x=>x.length===13)||(e.isbn||[])[0]),language:lang||language.join(', '),cover:'https://covers.openlibrary.org/b/olid/'+e.key.split('/').pop()+'-M.jpg?default=false',sourceUrl:'https://openlibrary.org'+e.key,source:'Open Library'}})).filter(b=>b&&!seen.has(b.sourceUrl)&&seen.add(b.sourceUrl)).slice(0,40)}
async function publicFetch(url,origin){let r;for(let i=0;i<4;i++){r=await fetch(url,{headers:{'Accept':'application/json, text/html','User-Agent':'QuietShelf/1.0 (personal reading catalog)'},redirect:'manual',signal:AbortSignal.timeout(15000)});if(r.status>=300&&r.status<400){let next=new URL(r.headers.get('location'),url);if(next.origin!==origin)throw Error('Unexpected redirect');url=next.href;continue}break}if(!r?.ok){let error=Error('Catalog HTTP '+r?.status);error.upstreamStatus=r?.status;throw error}let content=await r.text();if(content.length>4000000)throw Error('Response too large');return content}
export const apiSources={google:'Google Books',anilist:'AniList'};
function extraURL(source,value){try{let u=new URL(value);return source==='google'&&u.origin==='https://books.google.com'&&u.pathname==='/books'&&/^[\w-]+$/.test(u.searchParams.get('id')||'')?u.href:source==='anilist'&&u.origin==='https://anilist.co'&&/^\/manga\/\d+(\/[^?#]*)?$/.test(u.pathname)?u.origin+u.pathname:''}catch{return ''}}
function httpsImage(value,hosts){try{let u=new URL(value);u.protocol='https:';return hosts.includes(u.hostname)?u.href:''}catch{return ''}}
export function parseGoogle(data,lang=''){return (data.items||[]).map(item=>{let b=item.volumeInfo||{},language=normalizeLanguage(b.language);if(!item.id||lang&&language!==lang)return null;return {title:text(b.title)+(b.subtitle?' — '+text(b.subtitle):''),author:text((b.authors||[]).join(', ')),publisher:text(b.publisher||''),isbn:(b.industryIdentifiers||[]).find(x=>x.type==='ISBN_13')?.identifier||(b.industryIdentifiers||[]).find(x=>x.type==='ISBN_10')?.identifier||'',readingInfo:readingInformation(b.pageCount,b.categories,b.printType,'Google Books',(b.industryIdentifiers||[]).find(x=>x.type==='ISBN_13')?.identifier||(b.industryIdentifiers||[]).find(x=>x.type==='ISBN_10')?.identifier),language,cover:httpsImage(b.imageLinks?.thumbnail||b.imageLinks?.smallThumbnail||'',['books.google.com','books.googleusercontent.com']),sourceUrl:'https://books.google.com/books?id='+encodeURIComponent(item.id),source:'Google Books',recordKind:'edition'}}).filter(Boolean).slice(0,40)}
export function parseAniList(data){return (data.data?.Page?.media||(data.data?.Media?[data.data.Media]:[])).filter(m=>m.type==='MANGA'&&Number.isInteger(m.id)).map(m=>({title:text(m.title.english||m.title.romaji||m.title.native),author:(m.staff?.edges||[]).filter(e=>/story|art|original creator/i.test(e.role)).map(e=>e.node?.name?.full).filter(Boolean).join(', '),cover:httpsImage(m.coverImage?.large||m.coverImage?.medium||'',['s4.anilist.co']),sourceUrl:'https://anilist.co/manga/'+m.id,source:'AniList',language:'',recordKind:'series',isbn:'',publisher:''}))}
async function extraAPI(request,source,search,q,target,lang){if(!search&&!extraURL(source,target))return Response.json({error:'Choose a valid result from this source.'},{status:400});try{let data;if(source==='google'){let url=search?new URL('https://www.googleapis.com/books/v1/volumes'):new URL('https://www.googleapis.com/books/v1/volumes/'+encodeURIComponent(new URL(target).searchParams.get('id')));if(search){url.searchParams.set('q',parseISBN(q)?'isbn:'+parseISBN(q):q);url.searchParams.set('maxResults','40');if(lang)url.searchParams.set('langRestrict',lang)}let key=(request.headers.get('X-Google-Api-Key')||'').trim();let r=await fetch(url,{headers:{Accept:'application/json',...(key?{'X-Goog-Api-Key':key}:{})},signal:AbortSignal.timeout(15000)});let json=await r.json();if(!r.ok){let reasons=(json.error?.errors||[]).map(e=>e.reason),quota=r.status===429||json.error?.status==='RESOURCE_EXHAUSTED'||reasons.some(reason=>['quotaExceeded','dailyLimitExceeded','dailyLimitExceededUnreg','rateLimitExceeded','userRateLimitExceeded'].includes(reason));return Response.json({error:quota?(key?'Google Books quota for the supplied API key has been reached. Retry later or check your project’s Books API quota.':'Google Books quota has been reached. Add your own Google Books API key above to use your free quota, or retry later.'):(key?'Google Books rejected the supplied API key. Check that Books API is enabled and the key’s restrictions allow this request.':'Google Books rejected the request. Check its API key or retry later.'),code:quota?'GOOGLE_QUOTA':'GOOGLE_UNAVAILABLE'},{status:502})}data=search?{results:parseGoogle(json,lang)}:parseGoogle({items:[json]})[0]}
else{let fields='id type title { romaji english native } siteUrl coverImage { large medium } staff(perPage:8) { edges { role node { name { full } } } }';let query=search?'query($search:String!){ Page(page:1,perPage:40){ media(search:$search,type:MANGA){'+fields+'} } }':'query($id:Int!){ Media(id:$id,type:MANGA){'+fields+'} }';let r=await fetch('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({query,variables:search?{search:q}:{id:Number(new URL(target).pathname.split('/')[2])}}),signal:AbortSignal.timeout(15000)});let json=await r.json();if(!r.ok||json.errors)throw Error('AniList API unavailable');data=search?{results:parseAniList(json)}:parseAniList(json)[0]}
if(!data)throw Error('Record not found');return Response.json(data)}catch{return Response.json({error:apiSources[source]+' did not return usable data. Please retry later.',code:'SOURCE_UNAVAILABLE'},{status:502})}}

export function parseISBN(value){let compact=String(value||'').replace(/^\s*ISBN(?:-?(?:10|13))?\s*:?\s*/i,'').replace(/[\s-]/g,'').toUpperCase();if(/^97[89]\d{10}$/.test(compact)){let sum=[...compact].reduce((n,c,i)=>n+Number(c)*(i%2?3:1),0);return sum%10===0?compact:null}if(/^\d{9}[\dX]$/.test(compact)){let sum=[...compact].reduce((n,c,i)=>n+(c==='X'?10:Number(c))*(10-i),0);return sum%11===0?compact:null}return null}
function comparableISBN(value){let isbn=parseISBN(value);if(!isbn)return '';if(isbn.length===13)return isbn;let base='978'+isbn.slice(0,9);return base+((10-[...base].reduce((n,c,i)=>n+Number(c)*(i%2?3:1),0)%10)%10)}
async function isbnSearch(request,isbn){
  let u=new URL(request.url),source=u.searchParams.get('source')||'kitapyurdu';
  if(source==='anilist')return Response.json({results:[],isbnNotice:'AniList contains series records, not edition ISBNs. Choose a book catalog for ISBN lookup.'});
  u.searchParams.set('q',isbn);u.searchParams.set('lang','');
  let r=await catalogOnce(new Request(u,{headers:request.headers,signal:request.signal}));if(!r.ok)return r;
  let data=await r.json(),candidates=data.results||[];
  let verified=candidates.filter(book=>comparableISBN(book.isbn)===comparableISBN(isbn));
  let missing=candidates.filter(book=>!book.isbn).slice(0,4);
  let details=await Promise.allSettled(missing.map(async book=>{
    let detailsURL=new URL(u);detailsURL.pathname='/api/book';detailsURL.searchParams.delete('q');detailsURL.searchParams.set('url',book.sourceUrl);
    let detail=await catalogOnce(new Request(detailsURL,{headers:request.headers,signal:request.signal}));
    if(!detail.ok)return null;let candidate={...book,...await detail.json()};
    return comparableISBN(candidate.isbn)===comparableISBN(isbn)?candidate:null;
  }));
  for(let detail of details)if(detail.status==='fulfilled'&&detail.value)verified.push(detail.value);
  return Response.json({results:verified.slice(0,12),isbnNotice:verified.length?'Exact ISBN match. The listing language is shown as supplied by the catalog.':'This catalog did not return that ISBN. If its product page exists, paste its link here to import the exact edition.'});
}

const retailSources={blackwells:{name:"Blackwell’s",root:'https://blackwells.co.uk'},betterworld:{name:'Better World Books',root:'https://www.betterworldbooks.com'}};
export function retailURL(source,value){try{const u=new URL(value),root=retailSources[source]?.root;if(u.origin!==root||u.username||u.password||u.port)return '';const match=u.pathname.match(source==='blackwells'?/^\/bookshop\/product\/[^/]+\/(\d{13})$/:/^\/product\/detail\/[a-zA-Z0-9%-]+-(\d{13})$/);return match&&parseISBN(match[1])?root+u.pathname:''}catch{return ''}}
function retailCover(source,value){try{let u=new URL(value,retailSources[source].root);if(source==='betterworld'&&u.hostname==='images.bwbcovers.com'&&u.pathname.startsWith('/https://product-images.bwbcontent.com/'))u=new URL(u.pathname.slice(1));return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&(source==='blackwells'?u.hostname==='blackwells.co.uk'&&/^\/jacket\/[\w/.-]+$/.test(u.pathname):u.hostname==='product-images.bwbcontent.com')?u.href:''}catch{return ''}}
function shopText(value){return text(String(value||'').replace(/\\u([0-9a-f]{4})/gi,(_,code)=>String.fromCharCode(parseInt(code,16))))}
function itemProperty(html,name){const match=html.match(new RegExp('<([a-z0-9]+)\\b[^>]*\\bitemprop=["\']'+name+'["\'][^>]*>([\\s\\S]*?)<\\/\\1>','i'));return match?text(match[2]):''}
export function parseRetailSearch(html,source){
 const result=[],seen=new Set(),config=retailSources[source];if(!config)return result;
 const blocks=source==='blackwells'?html.split(/<li\b[^>]*class=["'][^"']*\bsearch-result__item\b[^"']*["'][^>]*>/i).slice(1):html.split(/<div\b[^>]*\bdata-isbn13=["']/i).slice(1).map(block=>'<div data-isbn13="'+block);
 for(const block of blocks){
  const path=block.match(source==='blackwells'?/href=["']([^"']*\/bookshop\/product\/[^"']+)["']/i:/href=["']([^"']*\/product\/detail\/[^"']+)["']/i)?.[1],sourceUrl=path&&retailURL(source,new URL(text(path),config.root).href);
  if(!sourceUrl||seen.has(sourceUrl))continue;
  const data=block.match(source==='blackwells'?/<button\b[^>]*data-product-name=["'][^>]*>/i:/<div\b[^>]*data-isbn13=["'][^>]*>/i)?.[0]||'';
  const title=attr(data,source==='blackwells'?'data-product-name':'data-book-title');if(!title)continue;
  const author=source==='blackwells'?text(block.match(/<p\b[^>]*class=["']product-author["'][^>]*>([\s\S]*?)<\/p>/i)?.[1]||''):itemProperty(block,'author');
  const image=block.match(/<img\b[^>]*>/i)?.[0]||'';
  result.push({title,author,publisher:source==='blackwells'?attr(data,'data-product-publisher'):'',isbn:sourceUrl.match(/(\d{13})$/)[1],binding:attr(data,source==='blackwells'?'data-product-format':'data-format'),language:'',cover:retailCover(source,attr(image,'src')),sourceUrl,source:config.name,recordKind:'edition'});seen.add(sourceUrl);if(result.length===40)break;
 }
 return result;
}
export function parseRetailBook(html,source,url){
 const config=retailSources[source],sourceUrl=retailURL(source,url);if(!config||!sourceUrl)throw Error('Invalid edition URL');
 let book;
 if(source==='blackwells'){
  const data=html.match(/<button\b[^>]*data-product-name=["'][^>]*>/i)?.[0]||'',author=html.match(/<p\b[^>]*class=["']product__author["'][^>]*>([\s\S]*?)(?:<\/p>|<p\b)/i)?.[1]||'';
  const img=html.match(/<img\b[^>]*\bsrc=["']([^"']*\/jacket\/[^"']*)["'][^>]*>/i)?.[0]||'';
  book={title:attr(data,'data-product-name')||itemProperty(html,'name'),author:text(author),publisher:itemProperty(html,'publisher'),isbn:itemProperty(html,'isbn'),language:normalizeLanguage(itemProperty(html,'inLanguage')),binding:itemProperty(html,'bookFormat'),publicationYear:itemProperty(html,'datePublished').match(/\b\d{4}\b/)?.[0]||'',cover:retailCover(source,attr(img,'src')),readingInfo:readingInformation(itemProperty(html,'numberOfPages'),attr(data,'data-categories').split(','),'',config.name,itemProperty(html,'isbn'))};
 }else{
  const b=graphs(html).find(g=>[g['@type']].flat().includes('Book')&&g.name&&g.isbn);if(!b)throw Error('Edition details unavailable');
  book={title:shopText(b.name),author:shopText(names(b.author)),publisher:shopText(names(b.publisher)),isbn:text(b.isbn),language:normalizeLanguage(b.inLanguage),binding:shopText(b.bookFormat),publicationYear:shopText(b.datePublished).match(/\b\d{4}\b/)?.[0]||'',cover:retailCover(source,Array.isArray(b.image)?b.image[0]:b.image),readingInfo:readingInformation(b.numberOfPages,b.genre||b.keywords,b.bookFormat,config.name,b.isbn)};
 }
 if(!book.title||comparableISBN(book.isbn)!==comparableISBN(sourceUrl.match(/(\d{13})$/)[1]))throw Error('Edition details do not match this ISBN');
 return {...book,sourceUrl,source:config.name,recordKind:'edition'};
}
const retailPending=new Map();let retailActive=0;const retailQueue=[];
async function retailBook(source,url){
 const key=JSON.stringify([source,'',url]),cached=memory.get(key);if(cached&&cached.until>Date.now())return cached.data;if(retailPending.has(key))return retailPending.get(key);
 const task=(async()=>{if(retailActive>=3)await new Promise(resolve=>retailQueue.push(resolve));else retailActive++;try{const data=parseRetailBook(await publicFetch(url,retailSources[source].root),source,url);cacheCatalog(key,data);return data}finally{const next=retailQueue.shift();if(next)next();else retailActive--}})();retailPending.set(key,task);try{return await task}finally{retailPending.delete(key)}
}
async function retailAPI(source,search,query,target,lang){
 const config=retailSources[source];
 try{
  if(!search){const url=retailURL(source,target);if(!url)return Response.json({error:'Choose a valid edition from this source.'},{status:400});return Response.json(await retailBook(source,url))}
  const key=JSON.stringify([source,lang,query]),cached=memory.get(key);if(cached&&cached.until>Date.now())return Response.json(cached.data);
  const url=new URL(source==='blackwells'?'/bookshop/search/':'/search/results',config.root);url.searchParams.set(source==='blackwells'?'keyword':'q',query);
  const html=await publicFetch(url.href,config.root),basic=parseRetailSearch(html,source);
  if(!basic.length&&!/no (?:results|books|matches)|couldn.t find|0 results|no titles|no search results/i.test(html))throw Error('Search layout unavailable');
  let results=basic,partial=false;
  if(lang){const matched=await Promise.allSettled(rankSearchResults(basic,query,12).map(b=>retailBook(source,b.sourceUrl)));partial=matched.some(r=>r.status==='rejected');results=matched.flatMap(r=>r.status==='fulfilled'&&r.value.language===lang?[r.value]:[]);if(basic.length&&matched.every(r=>r.status==='rejected'))throw Error('Language details unavailable')}
  const data={results,...(partial?{searchNotice:'Some edition details were unavailable. Retry, or choose Any language to include listings without language details.'}:{})};cacheCatalog(key,data);return Response.json(data);
 }catch(error){return Response.json({error:config.name+' could not return usable edition data. Try again or choose another source.',code:error.upstreamStatus===403?'SOURCE_BLOCKED':'CATALOG_UNAVAILABLE'},{status:502})}
}

// Public SRU catalogs and German booksellers. No accounts, storefront tokens or connector.
const germanSources={
 dnb:{name:'DNB',root:'https://services.dnb.de',endpoint:'/sru/dnb',schema:'MARC21-xml',index:'woe',idIndex:'idn',languageIndex:'spr'},
 k10plus:{name:'K10plus',root:'https://sru.k10plus.de',endpoint:'/opac-de-627',schema:'marcxml',index:'pica.all',idIndex:'pica.ppn',languageIndex:'pica.spr'},
 thalia:{name:'Thalia',root:'https://www.thalia.de'},
 hugendubel:{name:'Hugendubel',root:'https://www.hugendubel.de'}
};
export function germanURL(source,value){
 try{
  const u=new URL(value);if(u.protocol!=='https:'||u.port||u.username||u.password)return '';
  if(source==='dnb'&&u.hostname==='portal.dnb.de'&&u.pathname==='/opac.htm'){const id=u.searchParams.get('query')?.match(/^idn\s*=\s*"?(\d{7,11}[\dX])"?$/)?.[1];return id?'https://d-nb.info/'+id:''}
  if(source==='dnb')return u.hostname==='d-nb.info'&&/^\/\d{7,11}[\dX]$/.test(u.pathname)?u.origin+u.pathname:'';
  if(source==='k10plus')return u.hostname==='opac.k10plus.de'&&/^\/DB=2\.299\/{1,2}PPNSET$/.test(u.pathname)&&/^\d{7,11}[\dX]$/.test(u.searchParams.get('PPN')||'')?'https://opac.k10plus.de/DB=2.299/PPNSET?PPN='+u.searchParams.get('PPN'):'';
  if(u.origin!==germanSources[source]?.root)return '';
  const pattern=source==='thalia'?/^\/shop\/home\/artikeldetails\/A\d+$/:/^\/de\/(?:buch_gebunden|taschenbuch|buch_kartoniert|ebook_epub|ebook_pdf)\/[a-zA-Z0-9_%.-]+-\d+-produkt-details\.html$/;return ['thalia','hugendubel'].includes(source)&&pattern.test(u.pathname)?u.origin+u.pathname:'';
 }catch{return ''}
}
function germanCover(source,value){try{let u=new URL(value,germanSources[source].root);if(source==='hugendubel'&&u.pathname==='/_next/image')u=new URL(u.searchParams.get('url'));return u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&u.hostname===(source==='thalia'?'images.thalia.media':'media2.hugendubel.de')?u.href:''}catch{return ''}}
function germanSubjects(values){const tags=values.filter(Boolean).map(value=>text(value).normalize('NFC')).map(value=>/(?:^|[^\p{L}])(?:Sprachlehrbuch|Lehrbuch|Übungsbuch|Wörterbuch|Sprachunterricht|Sprachen lernen)(?:$|[^\p{L}])/iu.test(value)?value+' / textbook reference':value);return [...tags.filter(v=>v.endsWith(' / textbook reference')),...tags.filter(v=>!v.endsWith(' / textbook reference'))]}
// Read MARC fields only; never load DTDs, entities, stylesheets or catalog-supplied URLs.
export function parseGermanSRU(xml,source,lang='',requestedISBN=''){
 const config=germanSources[source];if(!config?.schema||/<!DOCTYPE|<!ENTITY|<(?:\w+:)?diagnostic\b/i.test(xml)||(!xml.includes('http://www.loc.gov/zing/srw/')||!xml.includes('http://www.loc.gov/MARC21/slim')&&/<(?:\w+:)?recordData\b/i.test(xml))||!/<(?:\w+:)?numberOfRecords\b[^>]*>\s*\d+\s*<\//i.test(xml))throw Error('Catalog did not return usable SRU records');
 const results=[],seen=new Set();
 for(const match of xml.matchAll(/<(?:\w+:)?recordData\b[^>]*>([\s\S]*?)<\/(?:\w+:)?recordData>/gi)){
  const record=match[1],fields=[];
  const leader=(record.match(/<(?:\w+:)?leader\b[^>]*>([\s\S]*?)<\/(?:\w+:)?leader>/i)?.[1]||'');
  // MARC type a/t: text; bibliographic level m: a monograph, not a journal/series record.
  if(!/[at]/.test(leader[6]||'')||leader[7]!=='m')continue;
  const rawControl=tag=>[...record.matchAll(/<(?:\w+:)?controlfield\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?controlfield>/gi)].find(m=>attr(m[1],'tag')===tag)?.[2]||'';
  const control=tag=>text(rawControl(tag));
  for(const m of record.matchAll(/<(?:\w+:)?datafield\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?datafield>/gi))fields.push({tag:attr(m[1],'tag'),values:[...m[2].matchAll(/<(?:\w+:)?subfield\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?subfield>/gi)].map(s=>({code:attr(s[1],'code'),value:text(s[2])}))});
  const all=(tag,codes)=>fields.filter(f=>f.tag===tag).flatMap(f=>f.values.filter(v=>codes.includes(v.code)).map(v=>v.value)),first=(tag,codes)=>all(tag,codes)[0]||'';
  const id=control('001'),sourceUrl=source==='dnb'?germanURL(source,'https://d-nb.info/'+id):germanURL(source,'https://opac.k10plus.de/DB=2.299/PPNSET?PPN='+id);
  const title=all('245',['a','b','n','p']).join(' — ').replace(/\s*[/:;=]\s*$/,'');if(!sourceUrl||!title||seen.has(sourceUrl))continue;
  const language=[...new Set((all('041',['a']).length?all('041',['a']):[rawControl('008').slice(35,38)]).map(normalizeLanguage).filter(v=>/^[a-z]{2,3}$/.test(v)))];if(lang&&!language.includes(lang))continue;
  const isbns=all('020',['a']).map(s=>parseISBN(s.match(/[\dXx][\dXx\s-]{8,20}/)?.[0]?.trim())).filter(Boolean),isbn=(requestedISBN&&(isbns.find(v=>v===requestedISBN)||isbns.find(v=>comparableISBN(v)===comparableISBN(requestedISBN))))||isbns.find(v=>v.length===13)||isbns[0]||'';
  const people=fields.filter(f=>['100','700'].includes(f.tag)),person=f=>f.values.filter(v=>['a','b','c'].includes(v.code)).map(v=>v.value).join(' '),author=people.filter(f=>f.tag==='100'||f.values.some(v=>v.code==='4'&&v.value==='aut')).map(person).join(', '),translator=people.filter(f=>f.values.some(v=>v.code==='4'&&v.value==='trl')).map(person).join(', ');
  const subjects=germanSubjects(['650','651','653','655'].flatMap(tag=>all(tag,['a','x','v']))),extent=first('300',['a']),pages=extent.match(/\b(\d+)\s*(?:Seiten\b|S\.|pages\b|p\.)/i)?.[1];
  results.push({title,author,translator,publisher:first('264',['b'])||first('260',['b']),publicationYear:(first('264',['c'])||first('260',['c'])).match(/\b[12]\d{3}\b/)?.[0]||'',binding:first('020',['q']),isbn,language:language.join(', '),cover:'',sourceUrl,source:config.name,recordKind:'edition',readingInfo:readingInformation(pages,subjects,'',config.name,isbn)});seen.add(sourceUrl);
 }
 return results.slice(0,40);
}
export function parseGermanShopSearch(html,source){
 const config=germanSources[source],results=[],seen=new Set();if(!config||config.schema)return results;
 const blocks=source==='thalia'?html.split(/<li\b[^>]*class=["'][^"']*\btm-produktliste__eintrag\b[^"']*["'][^>]*>/i).slice(1).map(b=>b.split('</li>')[0]):html.split(/<div\b[^>]*class=["']search-item article-item["'][^>]*>/i).slice(1);
 for(const block of blocks){
  const path=block.match(source==='thalia'?/href=["']([^"']*\/shop\/home\/artikeldetails\/A\d+)["']/i:/href=["']([^"']*-produkt-details\.html)["']/i)?.[1];if(!path)continue;
  const sourceUrl=germanURL(source,new URL(text(path),config.root).href);if(!sourceUrl||seen.has(sourceUrl))continue;
  const field=name=>text(block.match(new RegExp('<[^>]+class=["\'][^"\']*\\b'+name+'\\b[^"\']*["\'][^>]*>([\\s\\S]*?)<\\/','i'))?.[1]||'');
  const title=field(source==='thalia'?'tm-artikeldetails__titel':'title'),author=field(source==='thalia'?'tm-artikeldetails__autor__autoren':'author'),binding=field(source==='thalia'?'tm-flex-truncated__child':'item-type'),image=block.match(/<img\b[^>]*>/i)?.[0]||'';
  if(!title||/hörbuch|audio|tonie|kalender/i.test(binding))continue;
  results.push({title,author,publisher:'',isbn:'',language:'',binding,cover:germanCover(source,attr(image,'src')),sourceUrl,source:config.name,recordKind:'edition'});seen.add(sourceUrl);if(results.length===40)break;
 }
 return results;
}
export function parseGermanShopBook(html,source,url){
 const config=germanSources[source],sourceUrl=germanURL(source,url);if(!sourceUrl||config?.schema)throw Error('Invalid edition URL');
 const records=graphs(html),book=records.find(g=>[g['@type']].flat().includes(source==='thalia'?'Book':'Product')&&g.name&&(g.isbn||g.gtin13));if(!book)throw Error('Book edition details unavailable');
 const identity=germanURL(source,new URL(book.url||book.offers?.url||'',config.root).href),id=v=>v.match(source==='thalia'?/A\d+$/:/\d+-produkt-details\.html$/)?.[0];if(!identity||id(identity)!==id(sourceUrl))throw Error('Edition details identity changed');
 const fields={};
 if(source==='thalia')for(const m of html.matchAll(/<section\b[^>]*class=["'][^"']*\bartikeldetail\b[^"']*["'][^>]*>([\s\S]*?)<\/section>/gi)){const label=text(m[1].match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i)?.[1]||''),value=text(m[1].match(/<(?:p|a)\b[^>]*class=["'][^"']*\b(?:value|single-value)\b[^"']*["'][^>]*>([\s\S]*?)<\/(?:p|a)>/i)?.[1]||'');if(label&&value)fields[label]=value}
 else for(const m of html.matchAll(/<div\b[^>]*class=["']table-col table-head["'][^>]*>([\s\S]*?)<\/div>\s*<div\b[^>]*class=["']table-col["'][^>]*>([\s\S]*?)<\/div>/gi))fields[text(m[1])]=text(m[2]);
 const isbn=parseISBN(book.isbn||book.gtin13),binding=fields.Einband||fields.Produktart||text(book.bookFormat||'');if(!isbn||/hörbuch|audio|tonie|kalender/i.test(binding))throw Error('Not a book edition');
 const subjects=germanSubjects(records.filter(r=>r['@type']==='BreadcrumbList').flatMap(r=>(r.itemListElement||[]).map(e=>e.name)).concat([...(Array.isArray(book.genre)?book.genre:[book.genre]),fields.Warengruppe,fields.Schlagwörter]));
 return {title:text(book.name),author:text(names(book.author))||fields['Autor/Autorin']||'',publisher:text(names(book.publisher||book.brand))||fields.Verlag||fields['Verlag/Hersteller']||'',isbn,language:normalizeLanguage(book.inLanguage||fields.Sprache||''),binding,publicationYear:text(book.datePublished||fields.Erscheinungsdatum||'').match(/\b[12]\d{3}\b/)?.[0]||'',translator:fields['Übersetzt von']||fields['Übersetzung']||'',cover:germanCover(source,Array.isArray(book.image)?book.image[0]:book.image),sourceUrl,source:config.name,recordKind:'edition',readingInfo:readingInformation(book.numberOfPages||fields.Seitenzahl||fields.Seitenanzahl,subjects,binding,config.name,isbn)};
}
const germanPending=new Map();let germanActive=0;const germanQueue=[];
async function germanBook(source,url){
 const key=JSON.stringify([source,'',url]),cached=memory.get(key);if(cached&&cached.until>Date.now())return cached.data;if(germanPending.has(key))return germanPending.get(key);
 const task=(async()=>{if(germanActive>=3)await new Promise(resolve=>germanQueue.push(resolve));else germanActive++;try{const data=parseGermanShopBook(await publicFetch(url,germanSources[source].root),source,url);cacheCatalog(key,data);return data}finally{const next=germanQueue.shift();if(next)next();else germanActive--}})();germanPending.set(key,task);try{return await task}finally{germanPending.delete(key)}
}
async function germanAPI(source,search,query,target,lang){
 const config=germanSources[source],valid=search?'':germanURL(source,target);if(!search&&!valid)return Response.json({error:'Choose a valid book edition from this source.'},{status:400});
 const key=JSON.stringify([source,lang,search?query:valid]),cached=memory.get(key);if(cached&&cached.until>Date.now())return Response.json(cached.data);
 try{
  let data;
  if(config.schema){
   const url=new URL(config.endpoint,config.root),isbn=parseISBN(query),words=query.normalize('NFC').match(/[\p{L}\p{N}]+/gu)||[];
   let cql=!search?config.idIndex+'="'+(source==='dnb'?new URL(valid).pathname.slice(1):new URL(valid).searchParams.get('PPN'))+'"':isbn?(source==='dnb'?'isbn':'pica.isb')+'="'+isbn+'"':words.slice(0,24).map(w=>config.index+'="'+w+'"').join(' and ');
   if(!cql)throw Error('Use title, author or ISBN');if(search&&lang)cql+=' and '+config.languageIndex+'="'+languages[lang].ol+'"';
   for(const [k,v]of Object.entries({version:'1.1',operation:'searchRetrieve',query:cql,maximumRecords:search?'40':'1',recordSchema:config.schema}))url.searchParams.set(k,v);
   const records=parseGermanSRU(await publicFetch(url.href,config.root),source,search?lang:'',isbn||'');data=search?{results:records}:records.find(b=>b.sourceUrl===valid);if(!data)throw Error('Edition record unavailable');
  }else if(!search)data=await germanBook(source,valid);
  else{
   const url=new URL(source==='thalia'?'/suche':'/de/search',config.root);url.searchParams.set(source==='thalia'?'sq':'q',query);
   const html=await publicFetch(url.href,config.root),basic=parseGermanShopSearch(html,source);
   if(!basic.length&&!(/(?:keine|0)\s+(?:Treffer|Ergebnisse)|keine (?:passenden )?(?:Artikel|Produkte)|data-anzahl-treffer=["']0["']/i.test(html)||source==='hugendubel'&&/\b0\s+Treffer\b/i.test(text(html.match(/<h1\b[^>]*class=["'][^"']*search-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i)?.[1]||''))))throw Error('Search results unavailable');
   let results=basic,partial=false;
   // Any language shows public result cards immediately. Explicit filters use edition metadata.
   if(lang){const details=await Promise.allSettled(rankSearchResults(basic,query,12).map(b=>germanBook(source,b.sourceUrl)));partial=details.some(r=>r.status==='rejected');results=details.flatMap(r=>r.status==='fulfilled'&&r.value.language===lang?[r.value]:[]);if(basic.length&&details.length&&details.every(r=>r.status==='rejected'))throw Error('Language metadata unavailable')}
   data={results,...(partial?{searchNotice:'Some edition details could not be loaded. Retry or choose Any language.'}:{})};
  }
  cacheCatalog(key,data);return Response.json(data);
 }catch(error){return Response.json({error:config.name+' could not return usable book data. Try again or choose another source.',code:error.upstreamStatus===403?'SOURCE_BLOCKED':'CATALOG_UNAVAILABLE'},{status:502})}
}

// LovelyBooks' anonymous read-only catalog. Edition/title IDs are distinct from work IDs.
const lovelyRoot='https://www.lovelybooks.de';
export function lovelyURL(value){try{const u=new URL(value);if(u.protocol!=='https:'||u.port||u.username||u.password||!['www.lovelybooks.de','lovelybooks.de'].includes(u.hostname)||!/^\/autor\/[^/]+\/[^/]+-[1-9]\d{0,13}-[tw]\/?$/.test(u.pathname))return '';return lovelyRoot+u.pathname.replace(/\/?$/,'/')}catch{return ''}}
function lovelyIdentity(url){return lovelyURL(url).match(/-([1-9]\d{0,13})-([tw])\/$/)?.slice(1)||[]}
function lovelySlug(value,fallback){return encodeURIComponent(text(value).normalize('NFC').replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'').slice(0,100)||fallback)}
function lovelyCover(value){try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='images.lovelybooks.de'&&!u.port&&!u.username&&!u.password&&u.pathname.startsWith('/img/')?u.href:''}catch{return ''}}
export function parseLovelyBook(book,target='',expectedISBN=''){
 if(!book||!['BOOK','EBOOK'].includes(book.mediumType))return null;
 if(!text(book.title||'')||!String(book.id||'').match(/^[1-9]\d{0,13}$/)||!String(book.titleId||'').match(/^[1-9]\d{0,13}$/))throw Error('LovelyBooks book metadata unavailable');
 const isbn=parseISBN(book.isbn)||'',validTarget=lovelyURL(target),[id,kind]=lovelyIdentity(validTarget);
 if(target&&(!validTarget||String(kind==='t'?book.titleId:book.id)!==id)||expectedISBN&&comparableISBN(isbn)!==comparableISBN(expectedISBN)){const error=Error('LovelyBooks edition identity changed');error.code='EDITION_MISMATCH';throw error}
 // Preserve a verified title/edition link. A work link is resolved once to its featured edition.
 const sourceUrl=kind==='t'?validTarget:lovelyRoot+'/autor/'+lovelySlug(book.author?.name,'-')+'/'+lovelySlug(book.title,'Book')+'-'+book.titleId+'-t/';
 const subjects=germanSubjects(typeof book.genre==='string'?[book.genre]:[]);
 return {title:(text(book.title)+(text(book.subtitle||'')&&text(book.subtitle)!==text(book.title)?' — '+text(book.subtitle):'')).slice(0,300),author:text(book.author?.name||''),publisher:text(book.publisher||''),isbn,language:normalizeLanguage(book.language||''),binding:text(book.bookTypeDescription||''),publicationYear:String(book.currentEditionPublicationDate||'').match(/^([12]\d{3})(?:-|$)/)?.[1]||'',cover:lovelyCover(book.cover?.url),sourceUrl,source:'LovelyBooks',recordKind:'edition',readingInfo:readingInformation(book.numberOfPages,subjects,book.bookTypeDescription,'LovelyBooks',isbn)};
}
export function parseLovelySearch(data,lang=''){
 if(!data||!Array.isArray(data.content)||!Number.isSafeInteger(data.totalElements)||data.totalElements<0||data.totalElements<data.content.length||data.content.some(b=>!b||typeof b.mediumType!=='string'))throw Error('LovelyBooks search data unavailable');
 const seen=new Set();return data.content.slice(0,40).map(b=>parseLovelyBook(b)).filter(b=>b&&(!lang||b.language===lang)&&!seen.has(b.sourceUrl)&&seen.add(b.sourceUrl));
}
const lovelyPending=new Map();let lovelyActive=0;const lovelyQueue=[];
async function lovelyBook(url,expectedISBN){
 const [id,kind]=lovelyIdentity(url),key=JSON.stringify(['lovelybooks',kind,id]);let cached=memory.get(key),book;
 if(cached&&cached.until>Date.now())book=cached.data;
 else{
  if(!lovelyPending.has(key)){
   const pending=(async()=>{if(lovelyActive>=3)await new Promise(resolve=>lovelyQueue.push(resolve));else lovelyActive++;try{
    const path=kind==='t'?'/mapi/books/byTitle/'+id:'/mapi/books/'+id+'/details',data=JSON.parse(await publicFetch(lovelyRoot+path,lovelyRoot)),raw=kind==='t'?data:data?.book;
    if(!parseLovelyBook(raw,url))throw Error('Not a usable book edition');cacheCatalog(key,raw);return raw;
   }finally{const next=lovelyQueue.shift();if(next)next();else lovelyActive--}})();lovelyPending.set(key,pending);
  }
  const pending=lovelyPending.get(key);try{book=await pending}finally{if(lovelyPending.get(key)===pending)lovelyPending.delete(key)}
 }
 const record=parseLovelyBook(book,url,expectedISBN);if(!record)throw Error('Edition not found');return record;
}
async function lovelyAPI(request,search,query,target,lang){
 const valid=search?'':lovelyURL(target),rawExpected=new URL(request.url).searchParams.get('isbn')||'',expected=rawExpected?parseISBN(rawExpected):'';
 if(!search&&!valid||rawExpected&&!expected)return Response.json({error:'Choose a valid LovelyBooks edition or ISBN.'},{status:400});
 try{
  if(!search)return Response.json(await lovelyBook(valid,expected));
  const key=JSON.stringify(['lovelybooks',lang,query]),cached=memory.get(key);if(cached&&cached.until>Date.now())return Response.json(cached.data);
  const url=new URL('/mapi/search/detail/books',lovelyRoot);url.searchParams.set('q',query);url.searchParams.set('size','40');url.searchParams.set('page','0');
  const json=JSON.parse(await publicFetch(url.href,lovelyRoot)),results=parseLovelySearch(json,lang);
  const data={results,...(lang&&!results.length&&json.content.length?{searchNotice:'No featured editions in this result set have that recorded language. Try the title in that language, search its ISBN, or choose Any language.'}:{})};cacheCatalog(key,data);return Response.json(data);
 }catch(error){return Response.json({error:error.code==='EDITION_MISMATCH'?'LovelyBooks returned a different edition. Search its ISBN again to verify it.':'LovelyBooks could not return usable book data. Retry or choose another source.',code:error.code==='EDITION_MISMATCH'?error.code:error.upstreamStatus===403?'SOURCE_BLOCKED':'CATALOG_UNAVAILABLE'},{status:502})}
}

const memory=new Map();
function cacheCatalog(key,data){if(memory.size>=100)memory.delete(memory.keys().next().value);memory.set(key,{data,until:Date.now()+300000})}
async function catalogOnce(request){let u=new URL(request.url);if(request.method!=='GET')return Response.json({error:'Method not allowed'},{status:405});let source=u.searchParams.get('source')||'kitapyurdu';let lang=u.searchParams.get('lang')||'';if(!['kitapyurdu','bkm','nadir','openlibrary','google','anilist','blackwells','betterworld','dnb','k10plus','thalia','hugendubel','lovelybooks'].includes(source)||lang&&!languages[lang])return Response.json({error:'Choose a supported source and language.'},{status:400});let query=(u.searchParams.get('q')||'').trim(),target=u.searchParams.get('url')||'',search=u.pathname==='/api/books';if(search&&(query.length<2||query.length>300))return Response.json({error:'Use 2–300 characters.'},{status:400});if(source==='lovelybooks')return lovelyAPI(request,search,query,target,lang);if(germanSources[source])return germanAPI(source,search,query,target,lang);if(retailSources[source])return retailAPI(source,search,query,target,lang);if(apiSources[source])return extraAPI(request,source,search,query,target,source==='anilist'?'':lang);if(!search){let valid=source==='kitapyurdu'?bookURL(target):source==='bkm'?bkmURL(target):source==='nadir'?nadirURL(target):/^https:\/\/openlibrary\.org\/books\/OL\d+M$/.test(target)?target:'';if(!valid)return Response.json({error:'Choose a valid result from the selected source.'},{status:400});target=valid}let key=JSON.stringify([source,lang,search?query:target]);let cached=memory.get(key);if(cached&&cached.until>Date.now())return Response.json(cached.data);let name={kitapyurdu:'Kitapyurdu',bkm:'BKM Kitap',nadir:'Nadir Kitap',openlibrary:'Open Library'}[source];try{let data;
if(source==='kitapyurdu'){let url=search?root+'/index.php?route=product/list&filter_name='+encodeURIComponent(query)+(lang?'&filter_language='+encodeURIComponent(languages[lang].ky):''):target;let html=await upstream(url);data=search?{results:parseSearch(html)}:parseBook(html,target);if(search&&!data.results.length&&!/searchFilters|Aradım Bulamadım|Aramanız|sonuç bulunamadı/i.test(html))throw Error('Search unavailable')}
else if(source==='nadir'){data=search?await nadirSearch(query,lang):await nadirBook(target)}
else if(source==='bkm'){let html=await publicFetch(search?'https://www.bkmkitap.com/arama?q='+encodeURIComponent(query):target,'https://www.bkmkitap.com');let results=parseBkm(html,search?lang:'');if(search){if(!graphs(html).length)throw Error('Search unavailable');data={results}}else{data=results.find(x=>x.sourceUrl===target);if(!data)throw Error('Edition details unavailable')}}
else{if(search){let escaped=query.replace(/[+\-!(){}\[\]^"~*?:\\/]/g,' ');let url=new URL('https://openlibrary.org/search.json');url.searchParams.set('q',parseISBN(query)?'isbn:'+parseISBN(query):escaped+(lang?' language:'+languages[lang].ol:''));url.searchParams.set('limit','40');url.searchParams.set('fields','key,title,author_name,editions,editions.key,editions.title,editions.language,editions.publisher,editions.isbn,editions.number_of_pages,editions.physical_format,subject');data={results:parseOpenLibrary(JSON.parse(await publicFetch(url.href,'https://openlibrary.org')),lang,parseISBN(query)||'')}}else{let e=JSON.parse(await publicFetch(target+'.json','https://openlibrary.org'));data={title:text(e.title),readingInfo:readingInformation(e.number_of_pages,e.subjects,e.physical_format,'Open Library',e.isbn_13?.[0]||e.isbn_10?.[0]),publisher:text((e.publishers||[]).join(', ')),isbn:e.isbn_13?.[0]||e.isbn_10?.[0]||'',language:(e.languages||[]).map(x=>normalizeLanguage(x.key.split('/').pop())).join(', '),cover:'https://covers.openlibrary.org/b/olid/'+target.split('/').pop()+'-M.jpg?default=false',sourceUrl:target,source:'Open Library'}}}
cacheCatalog(key,data);return Response.json(data,{headers:{'Cache-Control':'private, max-age=60'}})
}catch(error){console.error('Catalog upstream failure',source,String(error?.message));let blocked=error.upstreamStatus===403;let local=['127.0.0.1','localhost'].includes(u.hostname);return Response.json({error:blocked?(local?name+' declined this connection. Open its website or choose another source.':name+' is blocking the hosted connection. Use the PC version or choose another source.'):name+' is unavailable right now. Try again, choose another source, or enter the title manually.',code:blocked?'SOURCE_BLOCKED':'CATALOG_UNAVAILABLE'},{status:502})}}

export function normalizeSearch(value){return String(value||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/ı/g,'i').replace(/([\p{L}\p{N}])['‘’ʼ＇`](?=[\p{L}\p{N}])/gu,'$1').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ')}
function searchVolume(value){let t=normalizeSearch(value);let m=t.match(/(?:^|\s)(?:cilt|vol|volume|tome)\s+(\d+)(?:\s|$)/)||t.match(/(?:^|\s)(\d+)\s+cilt(?:\s|$)/);if(m)return Number(m[1]);let trailing=t.match(/^.+?\s+(\d+)$/);return trailing&&Number(trailing[1])<1000?Number(trailing[1]):null}
function mainTitle(value){return String(value).replace(/\s*\((?:ciltli|ciltsiz|karton kapak|paperback|hardcover)\)\s*$/i,'').split(/\s+[\/–—-]\s+|\s*:\s*/)[0].trim()}
export function searchVariants(query){
  let original=String(query).trim().normalize('NFC').replace(/[‘’ʼ＇`]/g,"'");
  let normalized=normalizeSearch(original);
  if(/^\d{9}[\dx]$|^\d{13}$/i.test(normalized.replace(/\s/g,'')))return [normalized.replace(/\s/g,'')];
  let main=normalizeSearch(mainTitle(original));
  let simplified=main.replace(/\b(?:cilt|vol|volume|tome)\b/g,'').replace(/\s+/g,' ').trim();
  let variants=[original,normalized,main,simplified];
  if(normalized===main&&main===simplified&&normalized.split(' ').length>6){
    let words=normalized.split(' ').slice(0,6),volume=searchVolume(original);
    if(volume!==null&&!words.includes(String(volume)))words.push(String(volume));
    variants.push(words.join(' '));
  }
  return [...new Set(variants)].filter(v=>v.length>=2&&/\p{L}/u.test(v)).slice(0,4);
}
const unimportant=new Set(['cilt','vol','volume','tome','the','a','an','and','of','ve','book','kitap']);
function matchingSearchWords(words,value){
  let parts=value.split(' ').filter(Boolean),single=new Set(parts),joined=new Set(parts),matched=new Set();
  // Adjacent alphabetic words may be written joined or spaced. Do not join
  // across fields, intervening words, or numbers (which can identify volumes).
  for(let i=0;i<parts.length;i++)for(let n=2;n<=3&&i+n<=parts.length;n++){
    let span=parts.slice(i,i+n);if(span.every(word=>/^\p{L}+$/u.test(word)))joined.add(span.join(''));
  }
  for(let i=0;i<words.length;i++){
    if(joined.has(words[i])||words[i].length>=2&&[...single].some(candidate=>candidate.startsWith(words[i])))matched.add(words[i]);
    for(let n=2;n<=3&&i+n<=words.length;n++){
      let span=words.slice(i,i+n);
      if(span.every(word=>/^\p{L}+$/u.test(word))&&joined.has(span.join('')))for(let word of span)matched.add(word);
    }
  }
  return matched;
}
function searchScore(book,query){
  let q=normalizeSearch(query),title=normalizeSearch(book.title),author=normalizeSearch(book.author),core=normalizeSearch(mainTitle(query));
  let isbn=q.replace(/\s/g,'');if(/^\d{9}[\dx]$|^\d{13}$/i.test(isbn))return String(book.isbn||'').replace(/[^\dx]/gi,'')===isbn?2000:100;
  let volume=searchVolume(query),candidateVolume=searchVolume(book.title);if(volume!==null&&candidateVolume!==null&&volume!==candidateVolume)return -1;
  let words=[...new Set(q.split(' ').filter(w=>!unimportant.has(w)))],coreWords=[...new Set(core.split(' ').filter(w=>!unimportant.has(w)))];
  let titleMatches=matchingSearchWords(words,title),authorMatches=matchingSearchWords(words,author);
  let coverage=words.length?titleMatches.size/words.length:0,coreCoverage=coreWords.length?matchingSearchWords(coreWords,title).size/coreWords.length:0,authorCoverage=words.length?authorMatches.size/words.length:0;
  let combinedCoverage=words.length?new Set([...titleMatches,...authorMatches]).size/words.length:0;
  if(Math.max(coverage,coreCoverage,authorCoverage,combinedCoverage)<0.75&&title!==q&&!title.startsWith(q)&&author!==q)return -1;
  let score=coverage*200+coreCoverage*180+authorCoverage*120+combinedCoverage*180;
  if(title===q)score+=1000;else if(title.startsWith(q))score+=700;else if(q.startsWith(title+' '))score+=300;
  if(core&&title.includes(core))score+=250;if(author&&author===q)score+=900;
  if(volume!==null&&candidateVolume===volume)score+=200;else if(volume!==null)score-=100;return score;
}
export function rankSearchResults(results,query,limit=12){let unique=new Map();for(let result of results){let identity=result.sourceUrl||[result.source,result.isbn,result.title,result.author].join('|');if(!unique.has(identity))unique.set(identity,result)}let scored=[...unique.values()].map((book,index)=>({book,index,score:searchScore(book,query)})).filter(x=>x.score>=0).sort((a,b)=>b.score-a.score||a.index-b.index);let cutoff=scored.length?Math.max(0,scored[0].score-450):0;return scored.filter(x=>x.score>=cutoff).slice(0,limit).map(x=>x.book)}
function strongSearchMatch(results,query){if(!results.length)return false;let q=normalizeSearch(query),title=normalizeSearch(results[0].title),author=normalizeSearch(results[0].author);return title===q||title.startsWith(q)||author===q||searchScore(results[0],query)>=700}
export async function catalog(request){let u=new URL(request.url);if(request.method!=='GET'||u.pathname!=='/api/books')return catalogOnce(request);let query=(u.searchParams.get('q')||'').trim();if(query.length<2||query.length>300)return Response.json({error:'Use 2–300 characters.'},{status:400});let isbn=parseISBN(query);if(isbn)return isbnSearch(request,isbn);let variants=searchVariants(query);if(!variants.length)return catalogOnce(request);let candidates=[],lastData={results:[]},lastSuccess;for(let variant of variants){let url=new URL(u);url.searchParams.set('q',variant);let r=await catalogOnce(new Request(url,{headers:request.headers,signal:request.signal}));if(!r.ok){if(lastSuccess)break;return r}let data=await r.json();candidates.push(...(data.results||[]));lastData={...data,results:rankSearchResults(u.searchParams.get('source')==='nadir'?dedupeNadir(candidates):candidates,query)};lastSuccess=r;if(strongSearchMatch(lastData.results,query))break}return Response.json(lastData,{headers:{'Cache-Control':'private, max-age=60'}})}

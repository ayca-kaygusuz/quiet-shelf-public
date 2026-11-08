import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {catalog,rankSearchResults} from '../src/catalog.mjs';

const listings=JSON.parse(readFileSync('tests/fixtures/nadir-italian-search.json','utf8'));
const linked=JSON.parse(readFileSync('tests/fixtures/nadir-italian-book.json','utf8'));
const queries=['italyanca dil bilgisi ela','italyanca dilbilgisi ela','İTALYANCA  DİL BİLGİSİ  ELA'];
for(const query of queries)assert(rankSearchResults(listings,query).some(b=>b.sourceUrl===linked.sourceUrl),query);

const book=(title,author='')=>({title,author,sourceUrl:'https://example.com/'+encodeURIComponent(title+author)});
for(const title of ['İtalyanca Dilbilgisi','İtalyanca Dil Bilgisi']){
 for(const query of queries){
  const matches=rankSearchResults([book('İspanyolca Dilbilgisi','Ela Mısırlı'),book(title,'Ela Mısırlı')],query);
  assert.equal(matches[0].title,title,'combined title/author and joined/spaced spelling');
 }
}
assert.equal(rankSearchResults([book('The Hobbit','J. R. R. Tolkien'),book('Unrelated','Tolkien')],'thehobbit tolkien')[0].title,'The Hobbit');
assert.equal(rankSearchResults([book('Dil Başka Bilgisi')],'dilbilgisi').length,0,'joining cannot skip a word');
assert.equal(rankSearchResults([book('Dilbilgisi')],'bilgisi').length,0,'a suffix alone is not a word match');
assert.equal(rankSearchResults([book('ReLIFE 10','An Author'),book('ReLIFE 1','An Author')],'relife 1 author')[0].title,'ReLIFE 1');
assert.equal(rankSearchResults([book('Italian unrelated','Someone Else')],'italyanca dil bilgisi ela').length,0);

const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const searchHTML='<div id="listView">'+listings.map(b=>`<div class="productsListHover"><a class="nadirBook" href="${esc(b.sourceUrl)}">${esc(b.title)}</a><li class="nkLineAuthor"><span class="nadirBook">${esc(b.author)}</span><span class="nadirBook">${esc(b.publisher)}</span></li></div>`).join('')+'</div>';
let requests=[];
globalThis.fetch=async url=>{
 const u=new URL(url);requests.push(u);assert.equal(u.origin,'https://www.nadirkitap.com');
 if(u.pathname.includes('kitapara'))return new Response(searchHTML);
 const b=u.href===linked.sourceUrl?linked:listings.find(item=>item.sourceUrl===u.href);assert(b);
 return new Response('<script type="application/ld+json">'+JSON.stringify({'@type':['Book','Product'],name:b.title,author:{name:b.author},publisher:{name:b.publisher},isbn:b.isbn||'',inLanguage:'tr',url:b.sourceUrl})+'</script>');
};
for(const lang of ['tr',''])for(const query of queries.slice(0,2)){
 const r=await catalog(new Request('http://localhost/api/books?source=nadir&lang='+lang+'&q='+encodeURIComponent(query)));
 assert.equal(r.status,200);const data=await r.json();assert(data.results.some(b=>b.sourceUrl===linked.sourceUrl&&b.isbn===linked.isbn),lang+': '+query);
 assert(data.results.every(b=>b.language==='tr'));
}
assert(requests.some(u=>u.searchParams.get('kelime')==='italyanca dil bilgisi ela'));
assert(requests.some(u=>u.searchParams.get('kelime')==='italyanca dilbilgisi ela'));
assert.equal(requests.filter(u=>u.href===linked.sourceUrl).length,1,'detail cache is shared across queries and languages');
console.log('PASS: reported Nadir title+author query and linked edition, both compound spellings and language choices, Turkish normalization, adjacent-only spacing, unrelated results and wrong-volume rejection');

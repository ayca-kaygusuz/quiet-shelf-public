import {createHash} from 'node:crypto';

export const APP_ORIGIN='quiet-shelf://app';
const externalHosts=new Set(['www.kitapyurdu.com','www.bkmkitap.com','openlibrary.org','books.google.com','anilist.co','www.dr.com.tr','www.idefix.com','www.amazon.com.tr','www.amazon.com','www.amazon.co.uk','www.amazon.de','www.amazon.co.jp']);
export function isAppURL(value){try{let u=new URL(value);return u.protocol==='quiet-shelf:'&&u.hostname==='app'&&!u.port&&!u.username&&!u.password&&u.pathname==='/'}catch{return false}}
export function isExternalBookURL(value){try{let u=new URL(value);return u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&externalHosts.has(u.hostname)}catch{return false}}
export function isBackupURL(value){return typeof value==='string'&&value.startsWith('blob:'+APP_ORIGIN+'/')}

export function createAppHandler({html,catalog}){
  const script=html.match(/<script>([\s\S]*)<\/script>/)?.[1];
  if(!script)throw Error('The packaged interface is missing its application script.');
  const hash=createHash('sha256').update(script.replace(/\r\n?/g,'\n')).digest('base64');
  const policy=["default-src 'none'",`script-src 'self' 'sha256-${hash}'`,"style-src 'self' 'unsafe-inline'","img-src https: data:","font-src data:","connect-src 'self'","object-src 'none'","base-uri 'none'","frame-src 'none'","form-action 'none'"].join('; ');
  return async request=>{
    let u;try{u=new URL(request.url)}catch{return new Response('Invalid app address',{status:400})}
    if(u.protocol!=='quiet-shelf:'||u.hostname!=='app'||u.port||u.username||u.password)return new Response('Invalid app origin',{status:403});
    if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers:{Allow:'GET'}});
    if(u.pathname==='/')return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':policy,'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
    if(u.pathname==='/api/books'||u.pathname==='/api/book'){
      const headers=new Headers(),key=request.headers.get('X-Google-Api-Key');if(key&&u.searchParams.get('source')==='google')headers.set('X-Google-Api-Key',key);
      // This is an in-process adapter. No HTTP server or network listener is started.
      return catalog(new Request('http://localhost'+u.pathname+u.search,{headers,signal:request.signal}));
    }
    return new Response('Not found',{status:404});
  };
}

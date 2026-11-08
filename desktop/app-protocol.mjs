import {createHash} from 'node:crypto';

export const APP_ORIGIN='quiet-shelf://app';
const externalHosts=new Set(['www.kitapyurdu.com','www.bkmkitap.com','www.nadirkitap.com','nadirkitap.com','openlibrary.org','books.google.com','anilist.co','www.dr.com.tr','www.idefix.com','www.amazon.com.tr','www.amazon.com','www.amazon.co.uk','www.amazon.de','www.amazon.co.jp']);
export function isAppURL(value){try{let u=new URL(value);return u.protocol==='quiet-shelf:'&&u.hostname==='app'&&!u.port&&!u.username&&!u.password&&u.pathname==='/'}catch{return false}}
export function isExternalBookURL(value){try{let u=new URL(value);return u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&externalHosts.has(u.hostname)}catch{return false}}
export function isBackupURL(value){return typeof value==='string'&&value.startsWith('blob:'+APP_ORIGIN+'/')}

export function createAppHandler({html,catalog,updates,assets={},account}){
  const script=html.match(/<script>([\s\S]*)<\/script>/)?.[1];
  if(!script)throw Error('The packaged interface is missing its application script.');
  const hash=createHash('sha256').update(script.replace(/\r\n?/g,'\n')).digest('base64');
  const policy=["default-src 'none'",`script-src 'self' 'sha256-${hash}'`,"style-src 'self' 'unsafe-inline'","img-src https: data:","font-src data:","connect-src 'self'","object-src 'none'","base-uri 'none'","frame-src 'none'","form-action 'none'"].join('; ');
  return async request=>{
    let u;try{u=new URL(request.url)}catch{return new Response('Invalid app address',{status:400})}
    if(u.protocol!=='quiet-shelf:'||u.hostname!=='app'||u.port||u.username||u.password)return new Response('Invalid app origin',{status:403});
    if(account&&u.pathname.startsWith('/api/account/')){
      const origin=request.headers.get('Origin');
      if(origin&&origin!==APP_ORIGIN&&origin!=='null'||request.method==='POST'&&request.headers.get('X-Quiet-Shelf-Account')!=='1')return new Response('Invalid account request',{status:403});
      if(!['GET','POST'].includes(request.method))return new Response('Method not allowed',{status:405});
      const response=await account.handle(request);response.headers.set('Cache-Control','no-store');return response;
    }
    if(updates&&(u.pathname==='/api/update-status'||u.pathname==='/api/update-action')){
      const origin=request.headers.get('Origin');
      if(origin&&origin!==APP_ORIGIN&&origin!=='null')return new Response('Invalid origin',{status:403});
      if(u.pathname==='/api/update-status'&&request.method==='GET')return Response.json(updates.getStatus(),{headers:{'Cache-Control':'no-store'}});
      if(u.pathname==='/api/update-action'&&request.method==='POST'){
        if(updates.getStatus().enabled===false||request.headers.get('X-Quiet-Shelf-Update')!=='1')return new Response('Invalid update request',{status:403});
        const action=u.searchParams.get('action');
        if(!['check','install'].includes(action))return new Response('Invalid update action',{status:400});
        if(action==='install'&&updates.getStatus().phase!=='ready')return new Response('The update is not ready',{status:409});
        void (action==='install'?updates.install():updates.check({manual:true})).catch(()=>{});
        return Response.json(updates.getStatus(),{status:202,headers:{'Cache-Control':'no-store'}});
      }
      return new Response('Method not allowed',{status:405});
    }
    if(request.method!=='GET')return new Response('Method not allowed',{status:405,headers:{Allow:'GET'}});
    if(['/sync-core.js','/account.js'].includes(u.pathname)&&typeof assets[u.pathname]==='string')return new Response(assets[u.pathname],{headers:{'Content-Type':'application/javascript; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'}});
    if(u.pathname==='/')return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':policy,'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
    if(u.pathname==='/api/books'||u.pathname==='/api/book'){
      const headers=new Headers(),key=request.headers.get('X-Google-Api-Key');if(key&&u.searchParams.get('source')==='google')headers.set('X-Google-Api-Key',key);
      // This is an in-process adapter. No HTTP server or network listener is started.
      return catalog(new Request('http://localhost'+u.pathname+u.search,{headers,signal:request.signal}));
    }
    return new Response('Not found',{status:404});
  };
}

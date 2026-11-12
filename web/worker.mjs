// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0

import {catalog} from '../src/catalog.mjs';
import {createWebAccount} from '../src/web-account.mjs';
import {APP_VERSION,createBrowserReleaseHandler} from '../src/releases.mjs';

const project='https://ayca-kaygusuz.github.io/quiet-shelf-public/';
const release='https://github.com/ayca-kaygusuz/quiet-shelf-public/releases/latest';
const policy="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests";

export function createHostedWorker({html,assets,icon,catalogHandler=catalog,accountFactory=createWebAccount,releaseHandler=createBrowserReleaseHandler()}){
  function secure(response){
    const headers=new Headers(response.headers);
    headers.set('X-Content-Type-Options','nosniff');
    headers.set('Referrer-Policy','no-referrer');
    headers.set('X-Frame-Options','DENY');
    headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    headers.set('Content-Security-Policy',policy);
    headers.set('Cache-Control','no-store');
    return new Response(response.body,{status:response.status,headers});
  }
  return {async fetch(request,env={}){
    try{
      const u=new URL(request.url);
      if(!env.QUIET_SHELF_PUBLIC_ORIGIN||u.origin!==env.QUIET_SHELF_PUBLIC_ORIGIN)return secure(new Response('Invalid app origin',{status:403}));
      if(u.protocol!=='https:')return secure(new Response('HTTPS is required',{status:403}));
      const isGet=request.method==='GET',isHead=request.method==='HEAD';
      if(u.pathname==='/_health'&&isGet)return secure(Response.json({version:APP_VERSION,source:env.QUIET_SHELF_BUILD_SHA||'',service:'Quiet Shelf',googleConfigured:!!(env.QUIET_SHELF_GOOGLE_WEB_CLIENT_ID&&env.QUIET_SHELF_GOOGLE_WEB_CLIENT_SECRET&&env.QUIET_SHELF_SESSION_KEY)}));
      if(u.pathname.startsWith('/api/')){
        const origin=request.headers.get('Origin'),site=request.headers.get('Sec-Fetch-Site');
        // OAuth callbacks intentionally arrive from Google; account state/PKCE
        // and HttpOnly login cookies validate that single cross-site route.
        const callback=u.pathname==='/api/account/callback'&&isGet;
        if(!callback&&(origin&&origin!==u.origin||site&&!['same-origin','none'].includes(site)))return secure(Response.json({error:'Open this request from Quiet Shelf.'},{status:403}));
        // A public Cloudflare host must not trust client-supplied ChatGPT identity
        // headers. Account isolation here is bound to the encrypted cookie/origin.
        if(u.pathname.startsWith('/api/account/')){
          const headers=new Headers(request.headers);headers.delete('oai-authenticated-user-id');
          return secure(await accountFactory(env,{browserMerge:true}).handle(new Request(request,{headers})));
        }
        if(u.pathname==='/api/update-check')return secure(await releaseHandler(request));
        if(u.pathname==='/api/books'||u.pathname==='/api/book'){
          const headers=new Headers(),key=request.headers.get('X-Google-Api-Key');
          if(u.searchParams.get('source')==='google'&&key)headers.set('X-Google-Api-Key',key);
          return secure(await catalogHandler(new Request(request.url,{method:request.method,headers,signal:request.signal})));
        }
        return secure(new Response('Not found',{status:404}));
      }
      if(!isGet&&!isHead)return secure(new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}}));
      if(u.pathname==='/')return secure(new Response(isHead?null:html,{headers:{'Content-Type':'text/html; charset=utf-8'}}));
      if(Object.hasOwn(assets,u.pathname))return secure(new Response(isHead?null:assets[u.pathname],{headers:{'Content-Type':'application/javascript; charset=utf-8'}}));
      if(u.pathname==='/icon.png'||u.pathname==='/favicon.ico')return secure(new Response(isHead?null:Uint8Array.from(atob(icon),c=>c.charCodeAt(0)),{headers:{'Content-Type':'image/png'}}));
      if(u.pathname==='/privacy'||u.pathname==='/terms')return secure(Response.redirect(project+u.pathname.slice(1)+'.html',302));
      if(['/download/quiet-shelf-pc.zip','/download/quiet-shelf-update.zip'].includes(u.pathname))return secure(Response.redirect(release+'/download/'+u.pathname.split('/').at(-1),302));
      if(u.pathname==='/robots.txt')return secure(new Response(isHead?null:'User-agent: *\nDisallow: /api/\nDisallow: /_health\n',{headers:{'Content-Type':'text/plain; charset=utf-8'}}));
      return secure(new Response('Not found',{status:404}));
    }catch{
      // Never log OAuth codes, cookies, library payloads, or supplied API keys.
      return secure(Response.json({error:'This request could not finish. Your local library is kept.'},{status:503}));
    }
  }};
}

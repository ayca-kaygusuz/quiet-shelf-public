import http from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {catalog} from '../src/catalog.mjs';
import {googleDesktopConfiguration} from '../src/google-oauth.mjs';
import {createWebAccount} from '../src/web-account.mjs';
const html=readFileSync(new URL('../src/index.html',import.meta.url));
const assets=Object.fromEntries(['sync-core.js','account.js'].map(name=>['/'+name,readFileSync(new URL('../src/'+name,import.meta.url))]));
const host='127.0.0.1',port=8765;

export function createLocalServer({accountEnvironment=process.env,desktopConfiguration,sessionKey,fetcher=fetch}={}){
  if(desktopConfiguration===undefined)try{
    if(accountEnvironment.QUIET_SHELF_GOOGLE_DESKTOP_CLIENT_SECRET)desktopConfiguration=googleDesktopConfiguration({clientId:accountEnvironment.QUIET_SHELF_GOOGLE_DESKTOP_CLIENT_ID,credentialValue:accountEnvironment.QUIET_SHELF_GOOGLE_DESKTOP_CLIENT_SECRET});
    else for(const path of ['../pc/google-client.generated.json','../desktop/google-client.generated.json'])try{const config=JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));desktopConfiguration=googleDesktopConfiguration({clientId:config.clientId,credentialValue:config.clientSecret});break}catch{}
  }catch{}
  if(!sessionKey&&(desktopConfiguration||accountEnvironment.QUIET_SHELF_GOOGLE_WEB_CLIENT_SECRET)){
    const keyFile=new URL('../private/browser-session.key',import.meta.url);try{sessionKey=readFileSync(keyFile,'utf8').trim()}catch{
      mkdirSync(new URL('../private/',import.meta.url),{recursive:true});try{writeFileSync(keyFile,randomBytes(32).toString('base64'),{flag:'wx',mode:0o600})}catch{}sessionKey=readFileSync(keyFile,'utf8').trim();
    }
  }
  const account=createWebAccount(accountEnvironment,{desktopConfiguration,sessionKey,fetcher});
  const server=http.createServer(async(req,res)=>{try{
    const address=server.address(),origin=`http://${host}:${address.port}`,u=new URL(req.url,origin);
    if(req.headers.host!==`${host}:${address.port}`){res.writeHead(403);return res.end('Invalid host')}
    if(u.pathname.startsWith('/api/account/')){
      const limit=10*1024*1024+2048;if(Number(req.headers['content-length'])>limit){req.resume();res.writeHead(413);return res.end('Account request too large')}
      const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>limit)throw Error('Account request too large');chunks.push(chunk)}
      const response=await account.handle(new Request(u,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})}));
      const responseHeaders=Object.fromEntries(response.headers),cookies=response.headers.getSetCookie();if(cookies.length)responseHeaders['set-cookie']=cookies;
      res.writeHead(response.status,responseHeaders);return res.end(Buffer.from(await response.arrayBuffer()));
    }
    if(assets[u.pathname]&&req.method==='GET'){res.writeHead(200,{'Content-Type':'application/javascript; charset=utf-8','X-Content-Type-Options':'nosniff'});return res.end(assets[u.pathname])}
    if(u.pathname==='/api/books'||u.pathname==='/api/book'){
      if(req.headers.origin&&req.headers.origin!==origin){res.writeHead(403);return res.end('Invalid origin')}
      const headers=new Headers(),key=typeof req.headers['x-google-api-key']==='string'?req.headers['x-google-api-key'].trim():'';
      if(u.searchParams.get('source')==='google'&&key)headers.set('X-Google-Api-Key',key);
      const response=await catalog(new Request(u,{method:req.method,headers}));
      res.writeHead(response.status,Object.fromEntries(response.headers));return res.end(Buffer.from(await response.arrayBuffer()));
    }
    if(u.pathname==='/'&&req.method==='GET'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Referrer-Policy':'no-referrer'});return res.end(html)}
    res.writeHead(404);res.end('Not found');
  }catch(error){console.error(error.message);res.writeHead(500);res.end('Something went wrong. Restart Quiet Shelf and try again.')}});
  return server;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const server=createLocalServer(),origin=`http://${host}:${port}`;
  server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`Quiet Shelf may already be running. Open ${origin}`:e.message);process.exitCode=1});
  server.listen(port,host,()=>{
    console.log(`Quiet Shelf is running at ${origin}\nKeep this window open while you use it. Press Ctrl+C to stop.\nYour library is saved in your browser. Use Back up to keep a copy.`);
    if(process.env.QUIET_SHELF_NO_OPEN)return;
    const child=process.platform==='win32'?spawn('cmd',['/c','start','',origin],{stdio:'ignore'}):spawn(process.platform==='darwin'?'open':'xdg-open',[origin],{stdio:'ignore'});
    child.on('error',()=>console.log(`Open ${origin} in your browser.`));child.unref();
  });
}

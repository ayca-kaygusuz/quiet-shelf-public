import http from 'node:http';
import {readFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {catalog} from '../src/catalog.mjs';
const html=readFileSync(new URL('../src/index.html',import.meta.url));
const host='127.0.0.1',port=8765;

export function createLocalServer(){
  const server=http.createServer(async(req,res)=>{try{
    const address=server.address(),origin=`http://${host}:${address.port}`,u=new URL(req.url,origin);
    if(req.headers.host!==`${host}:${address.port}`){res.writeHead(403);return res.end('Invalid host')}
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

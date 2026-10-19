const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'dist');
http.createServer((req,res)=>{
 let file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403);return res.end();}
 if(file===root)file=path.join(root,'index.html');
 const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.geojson':'application/json','.jpg':'image/jpeg'};
 fs.readFile(file,(err,body)=>{res.writeHead(err?404:200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(err?'Not found':body);});
}).listen(Number(process.env.PORT)||4180,'0.0.0.0',()=>console.log('Atlas server ready'));


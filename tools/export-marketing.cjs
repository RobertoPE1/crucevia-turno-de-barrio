// Original cover PNGs and silent MP4 recordings of the actual game.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {spawn}=require('node:child_process');
const root=path.join(__dirname,'..'),output=path.join(root,'release','marketing');
fs.mkdirSync(output,{recursive:true});
if(process.argv.includes('--finalize')){
  for(const name of ['preview-landscape','preview-portrait'])finalizeMP4(path.join(output,name+'.mp4'));
  process.exit(0);
}
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'crucevia-marketing-'));
const server=http.createServer((req,res)=>{
  const pathname=req.url.split('?')[0];
  if(/^\/marketing\/(cover-(landscape|portrait|square)\.png|preview-(landscape|portrait)\.mp4)$/.test(pathname)){
    const data=fs.readFileSync(path.join(output,path.basename(pathname)));
    res.setHeader('Content-Type',pathname.endsWith('.png')?'image/png':'video/mp4');
    res.setHeader('Accept-Ranges','bytes');
    const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    if(range){const from=Number(range[1]),to=range[2]?Math.min(data.length-1,Number(range[2])):data.length-1;res.statusCode=206;res.setHeader('Content-Range','bytes '+from+'-'+to+'/'+data.length);res.setHeader('Content-Length',to-from+1);res.end(data.subarray(from,to+1));return;}
    res.setHeader('Content-Length',data.length);res.end(data);return;
  }
  const name=({'/':'index.html','/index.html':'index.html','/platform.js':'platform.js','/campaign.js':'campaign.js','/game.js':'game.js'})[pathname];
  if(!name){res.statusCode=404;res.end();return;}
  let content=fs.readFileSync(path.join(root,name),'utf8');
  if(name==='game.js')content=content.replace('/* TEST_HOOK */','window.captureGame={snapshot,update,choose,draw,reset,setStage:(n)=>{selected=n;reset();}};');
  res.setHeader('Content-Type',name.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');res.end(content);
});
const edge=spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ['--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking','--autoplay-policy=no-user-gesture-required','--disable-renderer-backgrounding','--disable-background-timer-throttling','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true});
let socket;
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const endpoint=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Edge startup timeout')),20000);edge.stderr.on('data',d=>{out+=d;const m=out.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){clearTimeout(timer);resolve(m[1]);}});edge.on('error',reject);});
  const origin=new URL(endpoint).origin.replace('ws:','http:');
  const tabs=await(await fetch(origin+'/json/list')).json();
  socket=new WebSocket(tabs.find(p=>p.type==='page').webSocketDebuggerUrl);
  await new Promise(r=>socket.addEventListener('open',r,{once:true}));
  let next=0;const pending=new Map();
  socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  async function evaluate(expression,awaitPromise=false){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  await send('Network.setBlockedURLs',{urls:['https://sdk.crazygames.com/*']});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:"window.recordRAF=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>1;window.CrazyGames={SDK:{init:async()=>{},data:{getItem:k=>localStorage.getItem('capture:'+k),setItem:(k,v)=>localStorage.setItem('capture:'+k,v)},game:{gameplayStart(){},gameplayStop(){}}}};"});
  await send('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/'});
  for(let n=0;n<100;n++){if(await evaluate("Boolean(window.captureGame&&document.getElementById('start')&&!document.getElementById('start').disabled)"))break;await new Promise(r=>setTimeout(r,50));}
  await evaluate(fs.readFileSync(path.join(__dirname,'marketing-art.js'),'utf8'));
  if(process.argv.includes('--verify')){
    for(const [name,w,h]of [['cover-landscape',1920,1080],['cover-portrait',800,1200],['cover-square',800,800]]){
      const info=await evaluate('(async()=>{const i=new Image();i.src="/marketing/'+name+'.png";await i.decode();return {width:i.naturalWidth,height:i.naturalHeight}})()',true);
      if(info.width!==w||info.height!==h)throw Error('Wrong cover dimensions: '+name);
      console.log(name+': '+JSON.stringify(info));
    }
    for(const [name,w,h]of [['preview-landscape',1920,1080],['preview-portrait',1080,1620]]){
      const info=await evaluate('('+inspectVideo.toString()+')('+JSON.stringify('/marketing/'+name+'.mp4')+')',true);
      if(info.width!==w||info.height!==h||!Number.isFinite(info.duration)||info.duration<15||info.duration>20)throw Error('Wrong video format: '+name+' '+info.width+'x'+info.height+' duration='+info.duration);
      if(info.firstFrameMeanError>20)throw Error('The video must open on the matching cover: '+name);
      fs.writeFileSync(path.join(output,name+'-decoded.png'),Buffer.from(info.sample,'base64'));delete info.sample;
      const data=fs.readFileSync(path.join(output,name+'.mp4')),handlers=[];
      function boxes(start,end){
        for(let pos=start;pos+8<=end;){
          let size=data.readUInt32BE(pos),header=8;const type=data.toString('ascii',pos+4,pos+8);
          if(size===1){size=Number(data.readBigUInt64BE(pos+8));header=16;}if(size===0)size=end-pos;
          if(size<header||pos+size>end)throw Error('Invalid MP4 box');
          if(['moov','trak','mdia'].includes(type))boxes(pos+header,pos+size);
          if(type==='hdlr')handlers.push(data.toString('ascii',pos+header+8,pos+header+12));
          pos+=size;
        }
      }
      boxes(0,data.length);
      if(handlers.includes('soun')||!handlers.includes('vide')||data.length>50000000)throw Error('Unexpected audio, size or video track');
      console.log(name+': '+JSON.stringify({...info,bytes:data.length,tracks:handlers}));
    }
    return;
  }
  const support=await evaluate("['video/mp4;codecs=avc1.42E028','video/mp4;codecs=avc1','video/mp4'].filter(t=>MediaRecorder.isTypeSupported(t))");
  console.log('MP4 recording support: '+JSON.stringify(support));
  if(!support.length)throw Error('This browser has no MP4 recorder.');
  for(const [name,w,h]of [['cover-landscape',1920,1080],['cover-portrait',800,1200],['cover-square',800,800]]){
    const base64=await evaluate('makeCruceviaCover('+w+','+h+').toDataURL("image/png").split(",")[1]');
    fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(base64,'base64'));console.log(name+'.png ready');
  }
  await evaluate('window.exportMime='+JSON.stringify(support[0]));
  await evaluate('window.exportCapture='+exportCapture.toString());
  for(const [name,w,h]of [['preview-landscape',1920,1080],['preview-portrait',1080,1620]]){
    console.log('Recording '+name+' (18 seconds)…');
    const result=await evaluate('window.exportCapture('+w+','+h+')',true);
    fs.writeFileSync(path.join(output,name+'.mp4'),Buffer.from(result.base64,'base64'));
    finalizeMP4(path.join(output,name+'.mp4'));
    fs.writeFileSync(path.join(output,name+'-sample.png'),Buffer.from(result.sample,'base64'));
    console.log(name+'.mp4 ready: '+result.bytes+' bytes, '+result.duration.toFixed(2)+'s');
  }
  console.log('OUTPUT: '+output);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{if(socket)socket.close();edge.kill();server.close();});

async function exportCapture(width,height){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d'),portrait=height>width;
  const cover=makeCruceviaCover(portrait?800:1920,portrait?1200:1080);
  const game=document.getElementById('game'),G=window.captureGame;
  game.width=2280;game.height=1560;game.getContext('2d').setTransform(3,0,0,3,0,0);
  function drive(dt){
    const s=G.snapshot(),clearing=s.cars.some(c=>c.pos>-43&&c.pos<90)||s.ped.some(p=>p.pos>-12&&p.pos<=130);
    if(!clearing){
      const weights={ns:0,ew:0,walk:0};
      for(const c of s.cars)if(c.pos<=-43)weights[c.dir%2===0?'ns':'ew']+=1/Math.max(.25,(c.amb?8:18)-c.wait);
      for(const p of s.ped)weights.walk+=1/Math.max(.25,18-p.wait);
      const best=Object.entries(weights).sort((a,b)=>b[1]-a[1])[0];if(best[1]>0)G.choose(best[0]);
    }
    G.update(dt);
  }
  function setup(stage){G.setStage(stage);for(let n=0;n<800;n++)drive(.02);G.draw();}
  setup(2);
  function pill(x,y,w,h,text,active=false){
    ctx.fillStyle=active?'#77c7a4':'#fff1ce';ctx.strokeStyle='#243b37';ctx.lineWidth=3;
    ctx.beginPath();ctx.roundRect(x,y,w,h,18);ctx.fill();ctx.stroke();
    ctx.fillStyle='#243b37';ctx.textAlign='center';ctx.font='700 '+(portrait?32:26)+'px Arial';ctx.fillText(text,x+w/2,y+h/2+11);
  }
  function draw(){
    const s=G.snapshot(),C=window.CruceviaCampaign,stage=C.stages[s.stage];
    ctx.fillStyle='#f4ead7';ctx.fillRect(0,0,width,height);
    ctx.fillStyle='#243b37';ctx.textAlign='left';ctx.font='900 '+(portrait?105:88)+'px Arial Black, Arial';
    ctx.fillText('CRUCEVIA',portrait?55:65,portrait?130:130);
    ctx.font='700 '+(portrait?32:28)+'px Arial';ctx.fillText('NEIGHBORHOOD SHIFT',portrait?58:70,portrait?182:178);
    if(portrait){
      ctx.font='700 40px Arial';ctx.fillText(stage.name,58,275);
      ctx.drawImage(game,20,325,1040,1040*520/760);
      pill(35,1090,310,85,'Score '+s.score);pill(385,1090,310,85,'Lives '+s.lives);pill(735,1090,310,85,'Time '+Math.ceil(stage.duration-s.elapsed)+'s');
      ctx.textAlign='left';ctx.font='700 30px Arial';ctx.fillText(document.getElementById('objective').textContent.split(' · ')[1],45,1255);
      pill(35,1340,310,110,'North–South',s.phase==='ns');pill(385,1340,310,110,'East–West',s.phase==='ew');pill(735,1340,310,110,'Pedestrians',s.phase==='walk');
    }else{
      ctx.font='700 39px Arial';ctx.fillText(stage.name,70,280);
      ctx.drawImage(game,600,190,1280,1280*520/760);
      pill(70,340,450,80,'Score '+s.score+' / '+stage.target);pill(70,440,210,75,'Lives '+s.lives);pill(310,440,210,75,Math.ceil(stage.duration-s.elapsed)+'s');
      ctx.textAlign='left';ctx.font='700 29px Arial';ctx.fillText('District '+(s.stage+1)+' / 8',85,585);
      pill(70,660,450,85,'North–South',s.phase==='ns');pill(70,765,450,85,'East–West',s.phase==='ew');pill(70,870,450,85,'Pedestrians',s.phase==='walk');
    }
  }
  ctx.drawImage(cover,0,0,width,height);
  const stream=canvas.captureStream(30),chunks=[];
  const recorder=new MediaRecorder(stream,{mimeType:window.exportMime,videoBitsPerSecond:6000000});
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  const stopped=new Promise(r=>recorder.onstop=r),start=performance.now();
  recorder.start(1000);
  let previous=start,switched=false,sample='';
  await new Promise(resolve=>{
    function frame(now){
      const elapsed=(now-start)/1000,dt=Math.min(.05,Math.max(0,(now-previous)/1000));previous=now;
      if(elapsed>=9&&!switched){setup(4);switched=true;}
      if(elapsed>.2){drive(dt);G.draw();draw();}
      if(elapsed>=5&&!sample)sample=canvas.toDataURL('image/png').split(',')[1];
      if(elapsed>=18){resolve();return;}window.recordRAF(frame);
    }
    window.recordRAF(frame);
  });
  recorder.stop();await stopped;stream.getTracks().forEach(t=>t.stop());
  const blob=new Blob(chunks,{type:window.exportMime});
  const base64=await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(blob);});
  return {base64,sample,bytes:blob.size,duration:(performance.now()-start)/1000};
}

function finalizeMP4(filename){
  // MediaRecorder emits fragmented MP4 with an unfinished duration in its header.
  // Complete that metadata from the encoded sample timestamps, without retiming.
  const b=fs.readFileSync(filename),headers=[],tracks=[];
  let movieScale=1000,trackScale=30000,total=0;
  function walk(start,end){
    let decode=0;
    for(let pos=start;pos+8<=end;){
      let size=b.readUInt32BE(pos),h=8;const type=b.toString('ascii',pos+4,pos+8);
      if(size===1){size=Number(b.readBigUInt64BE(pos+8));h=16;}if(!size)size=end-pos;
      if(size<h||pos+size>end)throw Error('Invalid MP4');
      const p=pos+h;
      if(['mvhd','mdhd','tkhd'].includes(type)){
        const v=b[p],scaleOffset=v?20:12,durationOffset=type==='tkhd'?(v?28:20):(v?24:16);
        if(type==='mvhd')movieScale=b.readUInt32BE(p+scaleOffset);
        if(type==='mdhd')trackScale=b.readUInt32BE(p+scaleOffset);
        headers.push({type,p:p+durationOffset,v});
      }
      if(type==='tfdt')decode=b[p]?Number(b.readBigUInt64BE(p+4)):b.readUInt32BE(p+4);
      if(type==='trun'){
        const flags=b.readUIntBE(p+1,3),count=b.readUInt32BE(p+4);
        let cursor=p+8+(flags&1?4:0)+(flags&4?4:0),duration=0;
        for(let n=0;n<count;n++){
          if(flags&256){duration+=b.readUInt32BE(cursor);cursor+=4;}
          if(flags&512)cursor+=4;if(flags&1024)cursor+=4;if(flags&2048)cursor+=4;
        }
        total=Math.max(total,decode+duration);
      }
      if(['moov','trak','mdia','moof','traf'].includes(type))walk(p,pos+size);
      pos+=size;
    }
  }
  walk(0,b.length);
  if(!total)throw Error('Missing encoded sample duration');
  for(const header of headers){
    const value=header.type==='mdhd'?total:Math.round(total*movieScale/trackScale);
    if(header.v)b.writeBigUInt64BE(BigInt(value),header.p);else b.writeUInt32BE(value,header.p);
  }
  fs.writeFileSync(filename,b);
  console.log('Finalized '+path.basename(filename)+': '+(total/trackScale).toFixed(3)+'s');
}

async function inspectVideo(url){
  const v=document.createElement('video');v.muted=true;
  await new Promise((resolve,reject)=>{v.onloadeddata=resolve;v.onerror=reject;v.src=url;});
  const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;
  const ctx=c.getContext('2d',{willReadFrequently:true});
  const seek=time=>new Promise(resolve=>{v.onseeked=resolve;v.currentTime=time;});
  await seek(.05);ctx.drawImage(v,0,0);
  const frame=ctx.getImageData(0,0,c.width,c.height).data;
  const reference=makeCruceviaCover(c.width>c.height?1920:800,c.width>c.height?1080:1200);
  ctx.drawImage(reference,0,0,c.width,c.height);
  const expected=ctx.getImageData(0,0,c.width,c.height).data;let error=0,count=0;
  for(let i=0;i<frame.length;i+=400){for(let channel=0;channel<3;channel++){error+=Math.abs(frame[i+channel]-expected[i+channel]);count++;}}
  await seek(5);ctx.drawImage(v,0,0);
  return {width:v.videoWidth,height:v.videoHeight,duration:v.duration,firstFrameMeanError:error/count,sample:c.toDataURL('image/png').split(',')[1]};
}

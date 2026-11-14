// Windows smoke test using installed Edge; no npm dependencies.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawn} = require('node:child_process');
const http=require('node:http');
const liveSDK=process.argv.includes('--live-sdk');
const server=http.createServer((request,response)=>{
  const requested=request.url.split('?')[0];
  const name=({'/platform.js':'platform.js','/privacy.html':'privacy.html','/NOTICE.txt':'NOTICE.txt'})[requested]||'index.html';
  response.setHeader('Content-Type',name.endsWith('.js')?'application/javascript':'text/html; charset=utf-8');
  response.end(fs.readFileSync(path.join(__dirname,'..',name)));
});
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'crucevia-qa-'));
const browser = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ['--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking',
   '--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'], {windowsHide:true});
let socket;
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const endpoint = await new Promise((resolve,reject)=>{
    let output='';
    const timer=setTimeout(()=>reject(Error('Browser startup timeout')),20000);
    browser.stderr.on('data',data=>{output+=data;const m=output.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){clearTimeout(timer);resolve(m[1]);}});
    browser.on('error',reject);
  });
  const origin = new URL(endpoint).origin.replace('ws:','http:');
  const pages = await (await fetch(origin+'/json/list')).json();
  socket=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
  await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
  let nextId=0; const pending=new Map(); const errors=[];
  socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(Error(JSON.stringify(m.error)));else p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);});
  function send(method,params={}){return new Promise((resolve,reject)=>{const id=++nextId;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});}
  async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
  await send('Runtime.enable'); await send('Page.enable');
  if(!liveSDK){
    await send('Network.enable');
    await send('Network.setBlockedURLs',{urls:['https://sdk.crazygames.com/*']});
    await send('Page.addScriptToEvaluateOnNewDocument',{source:"window.sdkEvents=[];window.CrazyGames={SDK:{init:async()=>window.sdkEvents.push('init'),game:{gameplayStart:()=>window.sdkEvents.push('start'),gameplayStop:()=>window.sdkEvents.push('stop')}}};"});
  }
  await send('Page.addScriptToEvaluateOnNewDocument',{source:'window.requestAnimationFrame=cb=>{window.qaFrame=cb;return 1};'});
  const started=Date.now();
  await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`});
  for(let n=0;n<100;n++){if(await evaluate("document.readyState==='complete' && typeof window.qaFrame==='function'"))break;await new Promise(r=>setTimeout(r,50));}
  assert.ok(await evaluate("typeof window.qaFrame==='function'"));
  assert.ok(Date.now()-started<20000);
  for(let n=0;n<120;n++){if(await evaluate("window.CruceviaPlatform.status!=='initializing'"))break;await new Promise(r=>setTimeout(r,50));}
  assert.equal(await evaluate('window.CruceviaPlatform.status'),'ready');
  for(const [width,height] of [[1280,800],[907,510],[821,462],[800,450],[390,844],[320,568]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
    const layout=await evaluate(`(()=>{const b=document.querySelector('#start').getBoundingClientRect();return {lang:document.documentElement.lang,overflow:document.documentElement.scrollWidth>innerWidth,startVisible:b.top>=0&&b.bottom<=innerHeight}})()`);
    assert.equal(layout.lang,'en'); assert.equal(layout.overflow,false); assert.equal(layout.startVisible,true);
    const fit=await evaluate("(()=>{const c=document.getElementById('controls').getBoundingClientRect(),b=document.getElementById('game').getBoundingClientRect();return c.bottom<=innerHeight&&b.height>50&&b.width<=innerWidth})()");
    assert.equal(fit,true,`Controls and board must fit at ${width}x${height}`);
    const shot=await send('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(path.join(profile,`intro-${width}.png`),Buffer.from(shot.data,'base64'));
  }
  await evaluate("document.getElementById('start').click();document.getElementById('pause').click()");
  assert.equal(await evaluate("document.getElementById('pause').textContent"),'Resume');
  if(!liveSDK)assert.deepEqual(await evaluate('window.sdkEvents'),['init','start','stop']);
  const controls=await evaluate("(()=>{const c=document.getElementById('controls').getBoundingClientRect(),b=document.getElementById('game').getBoundingClientRect();return {bottom:c.bottom,height:b.height}})()");
  assert.ok(controls.bottom<=568);assert.ok(controls.height>50);
  await evaluate("document.getElementById('pause').click();for(let n=0;n<6000;n++){if(n%150===0)document.getElementById(['ns','ew','walk'][Math.floor(n/150)%3]).click();window.qaFrame(n*20);}");
  assert.equal(await evaluate("document.getElementById('overlay').classList.contains('hidden')"),false);
  assert.match(await evaluate("document.getElementById('ot').textContent"),/Shift (over|complete!)/);
  await evaluate("document.getElementById('start').click()");
  assert.equal(await evaluate("document.getElementById('time').textContent"),'90');
  assert.equal(await evaluate("document.getElementById('score').textContent"),'0');
  const shot=await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync(path.join(profile,'game-mobile.png'),Buffer.from(shot.data,'base64'));
  assert.deepEqual(errors,[]);
  console.log('PASS: Edge load <20s, desktop/mobile layout, pause/resume, simulated full session, replay, no JS exceptions.');
  console.log('Screenshots: '+profile);
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{if(socket)socket.close();browser.kill();server.close();});

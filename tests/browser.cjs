// Windows smoke test using installed Edge; no npm dependencies.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {spawn} = require('node:child_process');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'crucevia-qa-'));
const browser = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ['--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking',
   '--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'], {windowsHide:true});
let socket;
(async()=>{
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
  await send('Page.addScriptToEvaluateOnNewDocument',{source:'window.requestAnimationFrame=cb=>{window.qaFrame=cb;return 1};'});
  const started=Date.now();
  await send('Page.navigate',{url:pathToFileURL(path.join(__dirname,'..','index.html')).href});
  for(let n=0;n<100;n++){if(await evaluate("document.readyState==='complete' && typeof window.qaFrame==='function'"))break;await new Promise(r=>setTimeout(r,50));}
  assert.ok(await evaluate("typeof window.qaFrame==='function'"));
  assert.ok(Date.now()-started<20000);
  for(const [width,height] of [[1280,800],[390,844],[320,568]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
    const layout=await evaluate(`(()=>{const b=document.querySelector('#start').getBoundingClientRect();return {lang:document.documentElement.lang,overflow:document.documentElement.scrollWidth>innerWidth,startVisible:b.top>=0&&b.bottom<=innerHeight}})()`);
    assert.equal(layout.lang,'en'); assert.equal(layout.overflow,false); assert.equal(layout.startVisible,true);
    const shot=await send('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(path.join(profile,`intro-${width}.png`),Buffer.from(shot.data,'base64'));
  }
  await evaluate("document.getElementById('start').click();document.getElementById('pause').click()");
  assert.equal(await evaluate("document.getElementById('pause').textContent"),'Resume');
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
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{if(socket)socket.close();browser.kill();});

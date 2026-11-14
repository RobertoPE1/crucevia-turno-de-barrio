const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','platform.js'),'utf8');
async function check(mode){
  const events=[],handlers={};let timeout,initFinished=false;
  const sdk={async init(){events.push('init');if(mode==='reject')throw Error('Unavailable');initFinished=true;},
    game:{gameplayStart(){assert.ok(initFinished);events.push('start');},gameplayStop(){assert.ok(initFinished);events.push('stop');}}};
  const context={window:{},document:{getElementById:()=>({addEventListener:(name,fn)=>handlers[name]=fn})},console,
    setTimeout:fn=>{timeout=fn;return 1;},clearTimeout(){}};
  vm.runInNewContext(source,context);
  const api=context.window.CruceviaPlatform;
  assert.throws(()=>api.getItem('test'),/loading/);
  api.setPlaying(true);api.setPlaying(false); // stale loading-time state must not emit events
  if(mode==='timeout')timeout();
  else if(mode==='missing')handlers.error();
  else{context.window.CrazyGames={SDK:sdk};await handlers.load();}
  const ready=await api.ready;
  assert.equal(ready,mode==='ready');
  api.setPlaying(true);api.setPlaying(true);api.setPlaying(false);api.setPlaying(false);
  assert.deepEqual(events,mode==='ready'?['init','start','stop']:mode==='reject'?['init']:[]);
  assert.equal(api.status,ready?'ready':'unavailable');
  if(ready){
    let localCalls=0;
    context.localStorage={getItem(){localCalls++;return 'local';},setItem(){localCalls++;}};
    const data=new Map();
    sdk.data={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};
    api.setItem('campaign','saved');assert.equal(api.getItem('campaign'),'saved');
    assert.equal(api.storageMode,'platform');assert.equal(localCalls,0);
    sdk.data.getItem=()=>{throw Error('dataModuleDisabled');};
    assert.throws(()=>api.getItem('campaign'),/Disabled/);assert.equal(localCalls,0);
  }
}
(async()=>{for(const mode of ['ready','reject','missing','timeout'])await check(mode);console.log('PASS: SDK initialization, event ordering, deduplication, error and timeout fallback.');})().catch(e=>{console.error(e);process.exitCode=1;});

const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const campaign=fs.readFileSync(path.join(root,'campaign.js'),'utf8');
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
new vm.Script(campaign);new vm.Script(game);
const model={};vm.runInNewContext(campaign,model);const C=model.CruceviaCampaign;
assert.equal(C.stages.length,8);
let p=C.fresh();assert.equal(C.unlocked(p),1);
assert.equal(C.complete(p,1,100,3,{cars:100,ped:100,amb:100,collisions:0}),0);
for(let i=0;i<8;i++){
  const s=C.stages[i],metrics={cars:s.cars,ped:s.ped,amb:s.amb,collisions:0};
  assert.equal(C.goals(i,s.target-1,metrics),false);
  assert.equal(C.complete(p,i,s.target,3,metrics),3);
  assert.equal(C.unlocked(p),Math.min(8,i+2));
}
assert.equal(p.results.reduce((n,r)=>n+r.stars,0),24);
assert.equal(C.normalize({version:99}).results[0].stars,0);
assert.equal(C.normalize({version:2,results:[{stars:99,best:-3}],active:{stage:7}}).active,null);
function element(){
  const classes=new Set();
  return {textContent:'',disabled:false,children:[],className:'',classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),toggle:(v,b)=>b?classes.add(v):classes.delete(v),contains:v=>classes.has(v)},
    setAttribute(){},appendChild(child){this.children.push(child);},replaceChildren(){this.children=[];}};
}
async function boot(store=new Map(),blocked=false){
  const elements={},events=[],listeners={};
  for(const id of ['game','menu','score','lives','time','level','objective','ns','ew','walk','start','pause','overlay','message','ot','od','secondary','map','instructions','save-status'])elements[id]=element();
  elements.game.getContext=()=>new Proxy({},{get:()=>()=>{}});
  const context={window:{CruceviaPlatform:{ready:Promise.resolve(),storageMode:'local',getItem:key=>{if(blocked)throw Error('blocked');return store.get(key)||null;},setItem:(key,value)=>{if(blocked)throw Error('blocked');store.set(key,value);},setPlaying:v=>events.push(v)}},
    document:{hidden:false,getElementById:id=>elements[id],createElement:element,addEventListener:(n,f)=>listeners[n]=f},
    localStorage:{getItem:()=>null},addEventListener(){},requestAnimationFrame(){},Math,console};
  vm.runInNewContext(campaign,context);
  vm.runInNewContext(game.replace('/* TEST_HOOK */','globalThis.test={update,reset,finish,choose,showMap,pauseGame,resumeGame,persist,snapshot,boot,inspect:()=>({state,selected,progress}),set:(a)=>{if(a.elapsed!==undefined)elapsed=a.elapsed;if(a.score!==undefined)score=a.score;if(a.lives!==undefined)lives=a.lives;if(a.metrics)metrics=a.metrics;if(a.cars)cars=a.cars;if(a.ped)ped=a.ped;}};'),context);
  await Promise.resolve();await Promise.resolve();
  return {api:context.test,e:elements,events,listeners,context};
}
if(require.main===module)(async()=>{
  const store=new Map(),{api,e,events,listeners,context}=await boot(store);
  assert.equal(api.inspect().state,'map');assert.equal(e.map.children.length,8);assert.equal(e.map.children[1].disabled,true);
  e.start.onclick();assert.equal(api.inspect().state,'play');
  api.update(1);e.pause.onclick();assert.equal(api.inspect().state,'pause');
  assert.deepEqual(events.slice(-2),[true,false]);
  const again=await boot(store);
  assert.equal(again.e.start.textContent,'Resume saved shift');
  again.e.start.onclick();assert.equal(again.api.snapshot().elapsed,1);
  assert.equal(again.api.inspect().state,'play');
  context.document.hidden=true;listeners.visibilitychange();e.pause.onclick();assert.equal(api.inspect().state,'pause');
  context.document.hidden=false;e.pause.onclick();
  api.set({cars:[{dir:1,amb:true,pos:-43,spd:105,wait:7.99,col:'#fafafa'}]});api.update(.05);
  assert.equal(api.snapshot().score,0);assert.equal(api.snapshot().lives,2);
  api.set({elapsed:44.99,cars:[],score:0});api.update(.02);
  assert.equal(api.inspect().progress.results[0].stars,0);
  assert.equal(e.ot.textContent,'Shift incomplete');
  e.start.onclick();
  api.set({elapsed:44.99,score:10,metrics:{cars:10,ped:0,amb:0,collisions:0,lost:0}});
  api.update(.02);
  assert.equal(e.ot.textContent,'District complete!');assert.equal(api.inspect().progress.results[0].stars,3);
  assert.equal(api.inspect().progress.active,null);
  e.start.onclick();assert.equal(api.inspect().selected,1);
  const afterUnlock=await boot(store);assert.equal(afterUnlock.e.map.children[1].disabled,false);
  assert.equal(afterUnlock.api.inspect().progress.results[0].stars,3);
  const corrupt=new Map([['crucevia-campaign-v2','{broken']]);const recovered=await boot(corrupt);
  assert.equal(recovered.api.inspect().state,'map');recovered.e.start.onclick();
  assert.equal(recovered.api.inspect().state,'play');
  const temporary=await boot(new Map(),true);temporary.e.start.onclick();temporary.api.update(.1);
  assert.equal(temporary.api.inspect().state,'play');assert.match(temporary.e['save-status'].textContent,/unavailable/i);
  const active=C.fresh();active.active={...api.snapshot(),stage:7};assert.equal(C.normalize(active).active,null);
  console.log('PASS: 8-stage progression, locked stages, objectives, stars, autosave/reload, exact resume, defeat, corrupt/blocked saves and pause events.');
})().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={boot,C};

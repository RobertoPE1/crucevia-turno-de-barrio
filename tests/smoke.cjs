// Run with: node tests/smoke.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert.match(html, /<html lang="en">/);
assert.equal([...html.matchAll(/<script>/g)].length, 1);
assert.doesNotMatch(html, /Pausa|Reanudar|Entregas|Vidas:|Tiempo:|Nivel:|Récord|PEATONES|Turno terminado/);
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script);

function boot(blockStorage = false) {
  const elements = {};
  for (const id of ['game','score','lives','time','level','ns','ew','walk','start','pause','overlay','message','ot','od']) {
    elements[id] = { textContent: '', classList: { add(){}, remove(){}, toggle(){} } };
  }
  elements.game.getContext = () => new Proxy({}, { get: () => () => {} });
  const context = { document: { getElementById: id => elements[id] },
    localStorage: { getItem(){ if(blockStorage) throw Error('blocked'); return 'broken'; },
      setItem(){ if(blockStorage) throw Error('blocked'); } },
    addEventListener(){}, requestAnimationFrame(){}, Math };
  const exposed = script.replace('ui();requestAnimationFrame(loop)})();',
    'globalThis.test={reset,update,choose,draw,finish,snapshot:()=>({state,phase,score,lives,elapsed,record}),set:(s)=>{if(s.cars)cars=s.cars;if(s.ped)ped=s.ped;if(s.elapsed!==undefined)elapsed=s.elapsed;}};ui();requestAnimationFrame(loop)})();');
  assert.notEqual(exposed, script);
  vm.runInNewContext(exposed, context);
  return { api: context.test, elements };
}
for (const blocked of [false, true]) {
  const {api, elements:e} = boot(blocked);
  assert.equal(api.snapshot().record, 0);
  e.start.onclick();
  e.pause.onclick();
  const before = api.snapshot().elapsed;
  assert.equal(api.snapshot().state, 'pause');
  assert.equal(e.pause.textContent, 'Resume');
  api.draw();
  e.pause.onclick();
  assert.equal(e.pause.textContent, 'Pause');
  assert.equal(api.snapshot().elapsed, before);
  e.ew.onclick(); assert.equal(api.snapshot().phase, 'ew');
  e.walk.onclick(); assert.equal(api.snapshot().phase, 'walk');
  api.reset();
  const car = {dir:1, amb:true, pos:-52, spd:105, wait:7.99};
  api.set({cars:[car]}); api.update(.05);
  assert.equal(api.snapshot().lives, 2);
  assert.equal(api.snapshot().score, 0, 'An abandoned car must not earn points');
  assert.match(e.message.textContent, /ambulance/);
  api.set({cars:[], ped:[{pos:-12,wait:17.99,done:false,side:0}]}); api.update(.05);
  assert.equal(api.snapshot().lives, 1);
  assert.match(e.message.textContent, /Pedestrians/);
  api.set({cars:[{...car,wait:7.99,pos:-52}],ped:[]}); api.update(.05);
  assert.equal(api.snapshot().state, 'end'); assert.equal(e.ot.textContent, 'Shift over');
  api.reset(); assert.match(e.message.textContent, /Survive 90 seconds/);
  api.set({cars:[{dir:0,amb:false,pos:501,spd:75,wait:0}]}); api.update(.01);
  assert.equal(api.snapshot().score, 1);
  api.set({elapsed:89.99}); api.update(.02);
  assert.equal(api.snapshot().state, 'end'); assert.equal(e.ot.textContent, 'Shift complete!');
  assert.match(e.od.textContent, /Score: 1/); api.draw();
}
console.log('PASS: English UI, controls, reset, scoring, win/loss, blocked and invalid storage.');

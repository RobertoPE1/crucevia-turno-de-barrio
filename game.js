(()=>{
'use strict';
const C=globalThis.CruceviaCampaign,platform=window.CruceviaPlatform;
const $=id=>document.getElementById(id),c=$('game'),x=c.getContext('2d');
const SAVE='crucevia-campaign-v2',colors=['#ec8768','#4c9caa','#d6ae58','#8c7cb8'];
let progress=C.fresh(),selected=0,state='loading',phase='ns',cars=[],ped=[],score=0,lives=3,elapsed=0,spawn=0,pedSpawn=0,spawnCount=0,seed=1,last=null,autosave=0;
let metrics={cars:0,ped:0,amb:0,collisions:0,lost:0},lastWin=false,storageOK=true;
const stage=()=>C.stages[selected];
function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
function saveText(text){$('save-status').textContent=text;}
function snapshot(){return {stage:selected,elapsed,lives,phase,score,cars:cars.map(a=>({...a})),ped:ped.map(p=>({...p})),spawn,pedSpawn,spawnCount,seed,metrics:{...metrics}};}
function persist(capture=true){
  if(capture&&(state==='play'||state==='pause'))progress.active=snapshot();
  progress.selected=selected;progress.best=Math.max(progress.best,score);
  try{
    // Preserve previously earned stars and records when writing a new checkpoint.
    const stored=platform.getItem(SAVE);let previous;
    try{previous=C.normalize(JSON.parse(stored||'null'));}catch{previous=C.fresh();}
    progress.results.forEach((r,i)=>{r.stars=Math.max(r.stars,previous.results[i].stars);r.best=Math.max(r.best,previous.results[i].best);});
    progress.best=Math.max(progress.best,previous.best);
    platform.setItem(SAVE,JSON.stringify(progress));storageOK=true;
    saveText(platform.storageMode==='platform'?'Progress saved via CrazyGames.':'Progress saved on this browser.');
  }catch{storageOK=false;saveText('Saving unavailable. You can play, but progress may be lost.');}
}
function goalText(){
  const s=stage(),parts=['Score '+score+'/'+s.target];
  if(s.cars)parts.push('Cars '+metrics.cars+'/'+s.cars);
  if(s.ped)parts.push('Walkers '+metrics.ped+'/'+s.ped);
  if(s.amb)parts.push('Ambulances '+metrics.amb+'/'+s.amb);
  return parts.join(' · ');
}
function ui(){
  $('score').textContent=score;$('lives').textContent='♥ '.repeat(Math.max(0,lives));
  $('time').textContent=Math.max(0,Math.ceil(stage().duration-elapsed));
  $('level').textContent=(selected+1)+' / '+C.stages.length;
  $('objective').textContent=stage().name+' · '+goalText();
  ['ns','ew','walk'].forEach(k=>{$(k).classList.toggle('active',phase===k);$(k).disabled=state!=='play';});
  $('pause').disabled=state!=='play'&&state!=='pause';
  $('pause').textContent=state==='pause'?'Resume':'Pause';
}
function buildMap(){
  $('map').replaceChildren();
  C.stages.forEach((s,i)=>{
    const button=document.createElement('button'),r=progress.results[i];
    button.className='stage'+(i===selected?' selected':'');button.disabled=i>=C.unlocked(progress);
    button.textContent=(i+1)+'. '+s.name;
    button.setAttribute('aria-pressed',String(i===selected));
    const detail=document.createElement('small');
    detail.textContent=button.disabled?'Locked — finish the previous district':r.stars?'★'.repeat(r.stars)+' · Best '+r.best:s.duration+'s · '+s.target+' points';
    button.appendChild(detail);
    button.onclick=()=>{selected=i;progress.selected=i;showMap();};
    $('map').appendChild(button);
  });
}
function showMap(){
  if(state==='play'||state==='pause')persist();
  state='map';platform.setPlaying(false);
  const completed=progress.results.filter(r=>r.stars>0).length,total=progress.results.reduce((n,r)=>n+r.stars,0);
  $('ot').textContent=completed===8?'Neighborhood connected!':'Your neighborhood route';
  $('od').textContent=completed+'/8 districts completed · '+total+'/24 stars. '+stage().detail+' Finish the '+stage().duration+'-second shift with lives remaining and meet every target.';
  $('start').disabled=false;
  $('start').textContent=progress.active?.stage===selected?'Resume saved shift':'Start '+stage().name;
  $('secondary').classList.add('hidden');$('map').classList.remove('hidden');$('instructions').classList.remove('hidden');
  if(!storageOK)saveText('Saving unavailable. This session will not be preserved.');
  $('overlay').classList.remove('hidden');buildMap();ui();
}
function reset(){
  cars=[];ped=[];score=0;lives=3;elapsed=0;spawn=0;pedSpawn=0;spawnCount=0;phase='ns';seed=7919*(selected+1);
  metrics={cars:0,ped:0,amb:0,collisions:0,lost:0};autosave=0;last=null;state='play';
  $('message').textContent=stage().detail;platform.setPlaying(true);$('overlay').classList.add('hidden');ui();draw();persist();
}
function restore(){
  const a=progress.active;if(!a||a.stage!==selected){reset();return;}
  ({cars,ped,score,lives,elapsed,spawn,pedSpawn,spawnCount,phase,seed,metrics}=JSON.parse(JSON.stringify(a)));
  state='play';last=null;autosave=0;platform.setPlaying(true);
  $('message').textContent='Saved shift resumed. '+stage().detail;$('overlay').classList.add('hidden');ui();draw();
}
function choose(p){if(state==='play'){phase=p;ui();}}
function pauseGame(){
  if(state!=='play')return;state='pause';platform.setPlaying(false);persist();
  $('ot').textContent='Shift paused';$('od').textContent=stage().name+' · '+goalText()+'. Your current shift is checkpointed when saving is available.';
  $('start').textContent='Resume shift';$('start').disabled=false;$('secondary').textContent='Neighborhood map';
  $('secondary').classList.remove('hidden');$('map').classList.add('hidden');$('instructions').classList.add('hidden');$('overlay').classList.remove('hidden');ui();
}
function resumeGame(){
  if(state!=='pause'||document.hidden)return;state='play';last=null;platform.setPlaying(true);$('overlay').classList.add('hidden');ui();
}
function finish(win){
  if(state==='end')return;
  lastWin=Boolean(win&&lives>0&&C.goals(selected,score,metrics));
  state='end';platform.setPlaying(false);progress.best=Math.max(progress.best,score);progress.active=null;
  let stars=0;if(lastWin)stars=C.complete(progress,selected,score,lives,metrics);
  persist(false);ui();
  $('ot').textContent=lastWin?(selected===7?'Campaign complete!':'District complete!'):'Shift incomplete';
  $('od').textContent=lastWin?'★'.repeat(stars)+' · '+stage().name+' completed. Score '+score+'. '+(selected<7?'The next neighborhood is unlocked.':'All eight neighborhoods are connected! Replay districts to improve your stars.'):goalText()+'. '+(lives<=0?'You ran out of lives.':'The shift ended before all targets were reached.')+' Retry this district; completed districts stay unlocked.';
  $('start').textContent=lastWin&&selected<7?'Next neighborhood':lastWin?'Replay district':'Retry district';
  $('secondary').textContent='Neighborhood map';$('secondary').classList.remove('hidden');$('map').classList.add('hidden');$('instructions').classList.add('hidden');$('overlay').classList.remove('hidden');
}
function addCar(){
  spawnCount++;const dir=Math.floor(random()*4),amb=stage().ambulanceEvery>0&&spawnCount%stage().ambulanceEvery===0;
  let pos=-150;for(const car of cars)if(car.dir===dir&&car.pos<-100)pos=Math.min(pos,car.pos-55);
  cars.push({dir,amb,pos:Math.max(-590,pos),spd:amb?105:stage().speed+random()*12,wait:0,col:amb?'#fafafa':colors[Math.floor(random()*colors.length)]});
}
function addPed(){ped.push({side:random()<.5?0:1,pos:-12,wait:0,done:false});}
function lose(message){lives=Math.max(0,lives-1);metrics.lost++;$('message').textContent=message;}
function update(dt){
  if(state!=='play')return;
  elapsed=Math.min(stage().duration,elapsed+dt);
  if(elapsed>=stage().duration){finish(true);return;}
  spawn+=dt;pedSpawn+=dt;autosave+=dt;
  if(spawn>=stage().interval){spawn-=stage().interval;addCar();}
  if(pedSpawn>=stage().pedInterval){pedSpawn-=stage().pedInterval;addPed();}
  // Move front vehicles first so a queue cannot overlap its leader.
  cars.sort((a,b)=>b.pos-a.pos);
  for(let i=0;i<cars.length;i++){
    const a=cars[i],allowed=(a.dir%2===0?'ns':'ew')===phase,before=a.pos<=-43;
    let next=a.pos+a.spd*dt;
    if(before&&!allowed)next=Math.min(-43,next);
    for(let j=0;j<i;j++){const b=cars[j];if(b.dir===a.dir&&b.pos>a.pos)next=Math.min(next,b.pos-49);}
    if(next<=a.pos+.001){a.wait+=dt;if((a.amb&&a.wait>8)||a.wait>18){lose(a.amb?'An ambulance waited too long. You lost a life.':'A driver waited too long. You lost a life.');a.gone=true;}}
    else a.pos=next;
    if(a.pos>500&&!a.gone){score+=a.amb?4:1;metrics[a.amb?'amb':'cars']++;a.gone=true;}
  }
  cars=cars.filter(a=>!a.gone);
  for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++){
    const a=cars[i],b=cars[j];
    if(!a.gone&&!b.gone&&a.dir%2!==b.dir%2&&a.pos>0&&a.pos<52&&b.pos>0&&b.pos<52){
      a.gone=b.gone=true;metrics.collisions++;lose('Collision! Let traffic clear before switching directions.');
    }
  }
  cars=cars.filter(a=>!a.gone);
  for(const p of ped){
    if(phase==='walk'){p.pos+=70*dt;if(p.pos>130){p.done=true;score+=2;metrics.ped++;}}
    else{p.wait+=dt;if(p.wait>18){p.done=true;lose('Pedestrians waited too long. You lost a life.');}}
  }
  ped=ped.filter(p=>!p.done);
  if(lives<=0){finish(false);return;}
  if(autosave>=5){autosave=0;persist();}
  ui();
}
$('ns').onclick=()=>choose('ns');$('ew').onclick=()=>choose('ew');$('walk').onclick=()=>choose('walk');
$('start').onclick=()=>{
  if(state==='map')restore();
  else if(state==='pause')resumeGame();
  else if(state==='end'){if(lastWin&&selected<7)selected++;reset();}
};
$('secondary').onclick=showMap;$('menu').onclick=()=>{if(state!=='loading')showMap();};
$('pause').onclick=()=>state==='play'?pauseGame():resumeGame();
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseGame();});
addEventListener('blur',pauseGame);addEventListener('pagehide',()=>{pauseGame();if(state==='map')persist(false);});
addEventListener('keydown',e=>{
  if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
  if(e.key==='1')choose('ns');if(e.key==='2')choose('ew');if(e.key==='3')choose('walk');
  if(e.code==='Space'&&!e.repeat&&e.target.tagName!=='BUTTON'&&e.target.tagName!=='A'){e.preventDefault();$('pause').click();}
});
async function boot(){
  await platform.ready;
  try{
    const raw=platform.getItem(SAVE);progress=C.normalize(raw?JSON.parse(raw):null);
    if(!raw){try{const legacy=Number(localStorage.getItem('crucevia-record'));if(Number.isFinite(legacy)&&legacy>0)progress.best=Math.floor(legacy);}catch{}}
    saveText(platform.storageMode==='platform'?'CrazyGames progress storage ready.':'Progress is saved on this browser.');
  }catch{storageOK=false;saveText('Saving unavailable. Progress is temporary for this session.');}
  selected=progress.active?.stage??Math.min(C.unlocked(progress)-1,progress.selected);
  showMap();
}
function rect(a,b,w,h,color){x.fillStyle=color;x.fillRect(a,b,w,h)}function txt(s,a,b,size=15,color='#243b37'){x.fillStyle=color;x.font=`700 ${size}px system-ui`;x.fillText(s,a,b)}function drawWalker(xx,yy){x.strokeStyle='#243b37';x.fillStyle='#243b37';x.lineWidth=3;x.beginPath();x.arc(xx,yy-10,3,0,Math.PI*2);x.fill();x.beginPath();x.moveTo(xx,yy-5);x.lineTo(xx,yy+3);x.moveTo(xx-5,yy);x.lineTo(xx+5,yy);x.moveTo(xx,yy+3);x.lineTo(xx-5,yy+9);x.moveTo(xx,yy+3);x.lineTo(xx+5,yy+9);x.stroke()}function draw(){x.clearRect(0,0,760,520);rect(0,0,760,520,stage().theme[0]);for(let i=0;i<8;i++){const xx=(i%4)*190+22,yy=Math.floor(i/4)*340+18;if(xx>255&&xx<530)continue;rect(xx,yy,110,86,[stage().theme[1],'#dfb0a1','#b1c4e0'][i%3]);rect(xx+9,yy+9,18,20,'#fff5dc');rect(xx+39,yy+9,18,20,'#fff5dc');rect(xx+68,yy+9,18,20,'#fff5dc');rect(xx+10,yy+60,85,10,'#9a785d')}drawDistrict();rect(0,190,760,140,'#657c7b');rect(310,0,140,520,'#657c7b');rect(0,187,760,5,'#fff5db');rect(0,330,760,5,'#fff5db');rect(307,0,5,520,'#fff5db');rect(450,0,5,520,'#fff5db');for(let a=0;a<760;a+=50){if(a>280&&a<480)continue;rect(a,257,25,5,'#e9ddae')}for(let b=0;b<520;b+=48){if(b>160&&b<360)continue;rect(378,b,5,24,'#e9ddae')}for(let i=0;i<7;i++){rect(285+i*7,160,4,28,'#fff5dc');rect(285+i*7,333,4,28,'#fff5dc');rect(275,180+i*7,30,4,'#fff5dc');rect(455,180+i*7,30,4,'#fff5dc')}const light=(p,xx,yy)=>{x.beginPath();x.arc(xx,yy,12,0,7);x.fillStyle=phase===p?'#77e2a0':'#e26f65';x.fill();x.strokeStyle='#243b37';x.lineWidth=3;x.stroke()};light('ns',333,158);light('ns',427,362);light('ew',270,215);light('ew',490,306);txt(stage().name.toUpperCase(),16,28,17);txt('DISTRICT '+(selected+1),635,28,14);if(stage().rain){for(let n=0;n<45;n++){const rx=(n*97+elapsed*40)%760,ry=(n*61+elapsed*90)%520;x.strokeStyle='#a8c5dc';x.lineWidth=2;x.beginPath();x.moveTo(rx,ry);x.lineTo(rx-5,ry+12);x.stroke();}}drawWalker(286,375);for(const a of cars){const p=a.pos;let xx,yy,ang=0;if(a.dir===0){xx=352;yy=140+p;ang=Math.PI/2}else if(a.dir===2){xx=408;yy=380-p;ang=-Math.PI/2}else if(a.dir===1){xx=240+p;yy=230;ang=0}else{xx=520-p;yy=292;ang=Math.PI}x.save();x.translate(xx,yy);x.rotate(ang);rect(-20,-11,40,22,a.col);rect(-10,-9,13,18,a.amb?'#ed7e7e':'#cde9e5');rect(-16,-14,8,4,'#243b37');rect(8,-14,8,4,'#243b37');if(a.amb){rect(-3,-14,10,5,'#287be0');txt('A',5,6,12,'#243b37')}x.restore()}for(const p of ped){const xx=p.side===0?300+p.pos:460-p.pos;drawWalker(xx,178)}if(state==='pause'){rect(210,205,340,100,'#fff7e7');txt('PAUSED',324,268,35)}txt('Best: '+progress.best,16,505,15);txt('SIGNAL: '+(phase==='ns'?'VERTICAL':phase==='ew'?'HORIZONTAL':'PEDESTRIANS'),500,505,14)}
function drawDistrict(){
  // Local geometry gives each district its own scene without imported assets.
  if(selected===0){
    rect(34,390,198,66,'#9e7959');for(let n=0;n<10;n++)rect(30+n*21,378,21,20,n%2?'#fff1cf':'#db8165');
    for(let n=0;n<5;n++)rect(45+n*36,417,25,20,['#e9ba56','#83ad69','#d58a62'][n%3]);txt('NEIGHBORHOOD MARKET',38,477,13);
  }else if(selected===1){
    rect(515,375,210,88,'#e7cd82');rect(530,385,180,4,'#fff7df');rect(530,449,180,4,'#fff7df');rect(618,385,4,68,'#fff7df');
    txt('SCHOOL YARD',537,477,15);
  }else if(selected===2){
    rect(35,375,195,88,'#d6ebea');rect(48,390,35,35,'#287be0');txt('A',57,416,24,'#fff');txt('CLINIC',98,417,20);rect(100,435,92,27,'#9bbfc5');
  }else if(selected===3){
    rect(30,390,213,75,'#d8cdb2');for(let n=0;n<14;n++)rect(36+n*15,402,5,43,'#977960');
    rect(30,409,213,4,'#617574');rect(30,436,213,4,'#617574');txt('STATION',80,480,16);
  }else if(selected===4){
    rect(510,388,215,70,'#c9e4b3');for(let n=0;n<9;n++){rect(510+n*24,380+n%2*8,16,16,['#d7806d','#e6b957','#85aecd'][n%3]);}
    txt('PARK FESTIVAL',536,480,16);
  }else if(selected===5){
    rect(510,370,230,114,'#83b9ca');for(let n=0;n<4;n++){rect(522+n*52,390+n%2*25,44,30,['#da976c','#7d9d89'][n%2]);}
    txt('HARBOR',569,477,15);
  }else if(selected===6){
    rect(40,405,190,28,'#91b9c9');rect(70,430,140,20,'#91b9c9');txt('WET ROADS',62,480,16);
  }else{
    rect(510,382,217,84,'#536867');for(let n=0;n<12;n++)rect(524+n%6*33,394+Math.floor(n/6)*30,16,17,'#ffe2a2');
    txt('NIGHT CONNECTION',525,485,15,'#fff0c6');
  }
}
function loop(t){const dt=last===null?0:Math.max(0,Math.min(.05,(t-last)/1000));last=t;if(state==='play')update(dt);draw();requestAnimationFrame(loop);}
/* TEST_HOOK */
ui();requestAnimationFrame(loop);boot();
})();

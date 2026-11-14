/* Campaign data and save validation. All districts are drawn in code. */
(()=>{
  'use strict';
  const stages=[
    {name:'Market Morning',duration:45,interval:2.8,pedInterval:9,speed:70,ambulanceEvery:0,target:10,cars:0,ped:0,amb:0,theme:['#cee2be','#e6b67e'],detail:'Open the market route. Reach 10 points and finish the shift.'},
    {name:'School Crossing',duration:50,interval:2.6,pedInterval:5.5,speed:72,ambulanceEvery:0,target:14,cars:0,ped:4,amb:0,theme:['#c8dfd3','#e1bb73'],detail:'Give school walkers their turn. Escort at least 4 pedestrians.'},
    {name:'Clinic Call',duration:55,interval:2.5,pedInterval:8,speed:77,ambulanceEvery:3,target:18,cars:0,ped:0,amb:3,theme:['#c8e3df','#a9c9df'],detail:'Keep the clinic accessible. Deliver at least 3 ambulances.'},
    {name:'Station Rush',duration:60,interval:2.2,pedInterval:7,speed:82,ambulanceEvery:5,target:24,cars:10,ped:0,amb:0,theme:['#e1d9bd','#c4b2d7'],detail:'Clear the commuter queues. Deliver at least 10 regular cars.'},
    {name:'Park Festival',duration:60,interval:2.4,pedInterval:4.5,speed:75,ambulanceEvery:6,target:26,cars:0,ped:8,amb:0,theme:['#b9dab3','#e3b6b3'],detail:'Balance the festival crowds. Escort at least 8 pedestrians.'},
    {name:'Harbor Freight',duration:70,interval:1.9,pedInterval:8,speed:86,ambulanceEvery:5,target:32,cars:16,ped:0,amb:0,theme:['#c3dbdf','#d7ac7d'],detail:'Keep the port moving. Deliver at least 16 regular cars.'},
    {name:'Rainy Avenues',duration:75,interval:2.1,pedInterval:6,speed:68,ambulanceEvery:4,target:32,cars:8,ped:6,amb:0,theme:['#b8cbd0','#b4b6c9'],rain:true,detail:'Wet roads slow the flow. Deliver 8 cars and escort 6 pedestrians.'},
    {name:'Night Connection',duration:90,interval:1.8,pedInterval:5.5,speed:84,ambulanceEvery:4,target:48,cars:12,ped:8,amb:4,theme:['#687c7a','#b2a2c7'],night:true,detail:'Connect the whole neighborhood. Deliver 12 cars, 4 ambulances and 8 pedestrians.'}
  ];
  const integer=(value,max=1000000)=>Number.isInteger(value)&&value>=0&&value<=max?value:0;
  const fresh=()=>({version:2,results:stages.map(()=>({stars:0,best:0})),best:0,selected:0,active:null});
  function unlocked(progress){let count=1;while(count<stages.length&&progress.results[count-1].stars>0)count++;return count;}
  function normalize(raw){
    const out=fresh();
    if(!raw||raw.version!==2)return out;
    out.results=out.results.map((r,i)=>({stars:integer(raw.results?.[i]?.stars,3),best:integer(raw.results?.[i]?.best)}));
    // A corrupt save must not create gaps in the unlocked campaign.
    let gap=false;out.results.forEach(r=>{if(gap)r.stars=0;if(!r.stars)gap=true;});
    out.best=integer(raw.best);
    out.selected=Math.min(integer(raw.selected,7),unlocked(out)-1);
    const a=raw.active;
    if(a&&Number.isInteger(a.stage)&&a.stage>=0&&a.stage<unlocked(out)&&
      Number.isFinite(a.elapsed)&&a.elapsed>=0&&a.elapsed<stages[a.stage].duration&&
      Number.isInteger(a.lives)&&a.lives>0&&a.lives<=3&&
      ['ns','ew','walk'].includes(a.phase)&&
      Array.isArray(a.cars)&&a.cars.length<=100&&Array.isArray(a.ped)&&a.ped.length<=50){
      const validCars=a.cars.every(c=>Number.isInteger(c.dir)&&c.dir>=0&&c.dir<=3&&typeof c.amb==='boolean'&&Number.isFinite(c.pos)&&c.pos>=-600&&c.pos<520&&Number.isFinite(c.spd)&&c.spd>0&&c.spd<=150&&Number.isFinite(c.wait)&&c.wait>=0&&c.wait<=20);
      const validPed=a.ped.every(p=>[0,1].includes(p.side)&&Number.isFinite(p.pos)&&p.pos>=-12&&p.pos<=142&&Number.isFinite(p.wait)&&p.wait>=0&&p.wait<=20);
      if(validCars&&validPed){
        out.active={stage:a.stage,elapsed:a.elapsed,lives:a.lives,phase:a.phase,score:integer(a.score),
          cars:a.cars.map(c=>({dir:c.dir,amb:c.amb,pos:c.pos,spd:c.spd,wait:c.wait,col:['#ec8768','#4c9caa','#d6ae58','#8c7cb8','#fafafa'].includes(c.col)?c.col:'#4c9caa'})),
          ped:a.ped.map(p=>({side:p.side,pos:p.pos,wait:p.wait,done:false})),
          spawn:Number.isFinite(a.spawn)?Math.max(0,Math.min(4,a.spawn)):0,
          pedSpawn:Number.isFinite(a.pedSpawn)?Math.max(0,Math.min(10,a.pedSpawn)):0,
          spawnCount:integer(a.spawnCount,10000),seed:Number.isInteger(a.seed)&&a.seed>=0&&a.seed<=0xffffffff?a.seed:1,
          metrics:{cars:integer(a.metrics?.cars),ped:integer(a.metrics?.ped),amb:integer(a.metrics?.amb),collisions:integer(a.metrics?.collisions),lost:integer(a.metrics?.lost)}};
      }
    }
    return out;
  }
  function goals(stage,score,metrics){const s=stages[stage];return score>=s.target&&metrics.cars>=s.cars&&metrics.ped>=s.ped&&metrics.amb>=s.amb;}
  function complete(progress,stage,score,lives,metrics){
    if(stage>=unlocked(progress)||!goals(stage,score,metrics))return 0;
    const stars=1+(lives>=2?1:0)+(lives===3&&metrics.collisions===0?1:0);
    progress.results[stage].stars=Math.max(progress.results[stage].stars,stars);
    progress.results[stage].best=Math.max(progress.results[stage].best,score);
    progress.best=Math.max(progress.best,score);
    progress.active=null;return stars;
  }
  globalThis.CruceviaCampaign=Object.freeze({stages,fresh,normalize,unlocked,goals,complete});
})();

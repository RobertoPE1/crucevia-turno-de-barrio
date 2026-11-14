// Check that a legal priority strategy can complete every district.
const assert=require('node:assert/strict');
const {boot,C}=require('./smoke.cjs');
(async()=>{
  for(let i=0;i<8;i++){
    const progress=C.fresh();progress.selected=i;
    for(let j=0;j<i;j++)progress.results[j]={stars:3,best:100};
    const save=new Map([['crucevia-campaign-v2',JSON.stringify(progress)]]);
    const {api,e}=await boot(save);e.start.onclick();
    for(let n=0;n<10000&&api.inspect().state==='play';n++){
      const s=api.snapshot();
      const clearing=s.cars.some(c=>c.pos>-43&&c.pos<90)||s.ped.some(p=>p.pos>-12&&p.pos<=130);
      if(!clearing){
        const weights={ns:0,ew:0,walk:0};
        for(const c of s.cars)if(c.pos<=-43)weights[c.dir%2===0?'ns':'ew']+=1/Math.max(.25,(c.amb?8:18)-c.wait);
        for(const p of s.ped)weights.walk+=1/Math.max(.25,18-p.wait);
        const best=Object.entries(weights).sort((a,b)=>b[1]-a[1])[0];
        if(best[1]>0)api.choose(best[0]);
      }
      api.update(.02);
    }
    assert.equal(api.inspect().progress.results[i].stars,3,C.stages[i].name+' must be achievable');
  }
  console.log('PASS: all eight district simulations complete with all targets and three stars.');
})().catch(e=>{console.error(e);process.exitCode=1;});

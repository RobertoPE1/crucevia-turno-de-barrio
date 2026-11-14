/* Original procedural cover composition, using the game's visual vocabulary. */
globalThis.makeCruceviaCover=function(width,height){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d'),portrait=height>width,square=height===width;
  const scale=width/1200;ctx.scale(scale,scale);
  const W=1200,H=height/scale;
  ctx.fillStyle='#e8edda';ctx.fillRect(0,0,W,H);
  const sky=ctx.createLinearGradient(0,0,W,H);sky.addColorStop(0,'#d6e3c7');sky.addColorStop(1,'#abd0bd');
  ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  function box(x,y,w,h,color,r=0){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
  function stroke(x,y,w,h,color,r=0){ctx.strokeStyle=color;ctx.lineWidth=5;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.stroke();}
  const cx=portrait?560:square?560:610,cy=portrait?1120:square?790:500;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(-.18);
  // Soft, offset building shadows remain part of the illustrated scene.
  const buildings=[[-720,-510,380,220,'#f0c47c'],[220,-510,420,240,'#adc6db'],[-720,210,380,230,'#dbb09f'],[235,225,410,210,'#e5c18c']];
  for(const [x,y,w,h,color]of buildings){
    box(x+16,y+20,w,h,'#28423d22',20);box(x,y,w,h,color,20);
    box(x+15,y+12,w-30,26,'#fff1cc66',10);
    for(let yy=65;yy<h-25;yy+=65)for(let xx=35;xx<w-25;xx+=70){box(x+xx,y+yy,42,37,'#fff3cf',6);box(x+xx+5,y+yy+5,32,14,'#96b6bd',3);}
  }
  box(-1100,-168,2400,336,'#6c8582');box(-167,-1000,334,2300,'#6c8582');
  box(-1100,-180,2400,12,'#fff3d3');box(-1100,168,2400,12,'#fff3d3');
  box(-180,-1000,12,2300,'#fff3d3');box(168,-1000,12,2300,'#fff3d3');
  for(let p=-1050;p<1200;p+=100){if(Math.abs(p)>230){box(p,-4,52,8,'#efe0a6',3);box(-4,p,8,52,'#efe0a6',3);}}
  for(let n=0;n<8;n++){box(-280+n*16,-240,10,55,'#fff5da',2);box(195,-100+n*27,55,13,'#fff5da',2);box(-280+n*16,190,10,55,'#fff5da',2);}
  function car(x,y,angle,color,amb=false){
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    box(-66,-31,132,62,'#243b3728',18);box(-72,-40,132,62,color,16);stroke(-72,-40,132,62,'#29453f',16);
    box(-41,-35,43,52,'#c8e7df',8);box(13,-35,27,52,'#fff7df66',7);
    box(-54,-48,29,10,'#243b37',3);box(23,-48,23,10,'#243b37',3);box(-54,22,29,10,'#243b37',3);box(23,22,23,10,'#243b37',3);
    box(51,-30,8,12,'#fff3ba',3);box(51,1,8,12,'#fff3ba',3);
    if(amb){box(-13,-48,36,13,'#287be0',4);ctx.fillStyle='#243b37';ctx.font='900 29px Arial';ctx.fillText('A',16,2);}
    ctx.restore();
  }
  car(-365,-84,0,portrait||square?'#ec8768':'#fff9ea',!portrait&&!square);car(-550,-84,0,'#d6ae58');car(350,84,Math.PI,'#8c7cb8');
  car(-82,-354,Math.PI/2,'#fff9ea',true);car(84,350,-Math.PI/2,'#4c9caa');car(600,84,Math.PI,'#ec8768');
  function light(x,y,on){box(x-23,y-42,46,84,'#29453f',18);for(let i=0;i<2;i++){ctx.fillStyle=i===on?(on?'#7be1a1':'#ed8b79'):'#425a52';ctx.beginPath();ctx.arc(x,y-19+i*38,14,0,Math.PI*2);ctx.fill();}}
  light(-233,portrait||square?-250:-140,1);light(240,portrait||square?240:100,1);light(-260,220,0);
  for(let i=0;i<4;i++){const x=-270+i*25,y=165;ctx.strokeStyle='#243b37';ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y-10);ctx.lineTo(x,y+15);ctx.moveTo(x-10,y+1);ctx.lineTo(x+10,y+1);ctx.moveTo(x,y+15);ctx.lineTo(x-9,y+29);ctx.moveTo(x,y+15);ctx.lineTo(x+8,y+29);ctx.stroke();ctx.fillStyle='#243b37';ctx.beginPath();ctx.arc(x,y-23,8,0,Math.PI*2);ctx.fill();}
  ctx.restore();
  // The title is the only cover copy. Keep the top-left label area unoccupied.
  const ty=portrait?365:square?300:140;
  ctx.fillStyle='#e8edda';ctx.beginPath();ctx.ellipse(655,ty-32,620,portrait?230:square?195:140,-.05,0,Math.PI*2);ctx.fill();
  ctx.textAlign='center';ctx.lineJoin='round';
  ctx.font='900 '+(portrait?164:square?164:132)+'px Arial Black, Arial, sans-serif';
  ctx.strokeStyle='#243b37';ctx.lineWidth=17;ctx.strokeText('CRUCEVIA',650,ty+8);
  ctx.fillStyle='#fff1c8';ctx.fillText('CRUCEVIA',650,ty+8);
  ctx.font='800 '+(portrait?42:36)+'px Arial, sans-serif';ctx.fillStyle='#243b37';
  ctx.fillText('NEIGHBORHOOD SHIFT',650,ty+80);
  return canvas;
};

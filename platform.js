/* Crucevia's adapter. The CrazyGames SDK is supplied by CrazyGames, not bundled. */
(()=>{
  'use strict';
  let sdk=null,playing=false,reported=false,status='initializing';
  function report(){
    if(!sdk||playing===reported)return;
    try{
      sdk.game[playing?'gameplayStart':'gameplayStop']();
      reported=playing;
    }catch(error){console.warn('Crucevia platform event unavailable.',error);}
  }
  const hosted=typeof location!=='undefined'&&/(^|\.)crazygames\.com$/i.test(location.hostname);
  const api={
    setPlaying(value){playing=Boolean(value);report();},
    get status(){return status;},
    get storageMode(){return sdk?.data?'platform':hosted?'unavailable':'local';},
    getItem(key){
      if(status==='initializing')throw Error('Storage is still loading');
      if(sdk?.data)return sdk.data.getItem(key);
      if(hosted)throw Error('CrazyGames Progress Save is unavailable');
      return localStorage.getItem(key);
    },
    setItem(key,value){
      if(status==='initializing')throw Error('Storage is still loading');
      if(sdk?.data){sdk.data.setItem(key,value);return;}
      if(hosted)throw Error('CrazyGames Progress Save is unavailable');
      localStorage.setItem(key,value);
    }
  };
  window.CruceviaPlatform=api;
  api.ready=new Promise(resolve=>{
    let finished=false;
    const timeout=setTimeout(()=>finish(null),5000);
    function finish(candidate){
      if(finished)return;
      finished=true;clearTimeout(timeout);sdk=candidate;
      status=sdk?'ready':'unavailable';report();resolve(Boolean(sdk));
    }
    async function initialize(){
      try{
        const candidate=window.CrazyGames?.SDK;
        if(!candidate){finish(null);return;}
        await candidate.init();finish(candidate);
      }catch{finish(null);}
    }
    const loader=document.getElementById('crazygames-sdk');
    if(window.CrazyGames?.SDK)initialize();
    else if(loader){loader.addEventListener('load',initialize,{once:true});loader.addEventListener('error',()=>finish(null),{once:true});}
    else finish(null);
  });
})();

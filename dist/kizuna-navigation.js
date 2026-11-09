/* One entry point for player navigation. Economy and account APIs stay unchanged. */
(() => {
  'use strict';
  const aliases={collection:'col',encyclopedia:'wiki',ranking:'rank',anomalies:'events',boosters:'boosts',marketPage:'market',rewards:'daily'};
  const basic=new Set(['home','boosts','col','wiki','universes','nexus','market','rank','community','profile','staff']);
  const adventures=new Set(['constellations','missions','journey','awakening','sanctuary']);
  let navigating=false;
  function navigate(input,{history:remember=true,id=''}={}) {
    const key=aliases[input]||input;
    if(navigating||(!basic.has(key)&&!adventures.has(key)&&!['events','daily','notices'].includes(key)))return false;
    if(!window.KizunaGame){window.KizunaAccount?.open?.();return false;}
    const before=location.href;
    navigating=true;
    try {
      if(adventures.has(key))window.KizunaAdventure?.navigate(key,id);
      else if(key==='events')window.KizunaAnomalies?.open();
      else if(key==='notices')document.getElementById('kzNotifications')?.click();
      else if(key==='daily'){
        window.KizunaGame.showTab('boosts',{scroll:false});
        document.querySelector('#kTabs [data-t="daily"]')?.click();
        history.replaceState(history.state,'',location.pathname+location.search+'#rewards');
      }else window.KizunaGame.showTab(key,{scroll:false});
      const after=location.href;
      if(remember&&after!==before){history.replaceState(history.state,'',before);history.pushState(null,'',after);}
      document.querySelector('main')?.scrollIntoView({block:'start',behavior:'instant'});
      window.dispatchEvent(new CustomEvent('kizuna:navigation',{detail:{destination:key}}));
      return true;
    }finally{navigating=false;}
  }
  function route(){
    const hash=location.hash.slice(1);
    if(hash.startsWith('character/'))return;
    const match=hash.match(/^adventure(?:\/([^/]+))?(?:\/(.+))?$/);
    let id='';try{id=decodeURIComponent(match?.[2]||'');}catch{}
    navigate(match?.[1]|| (match?'constellations':hash||'home'),{history:false,id});
  }
  document.addEventListener('click',event=>{
    if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    const button=event.target.closest?.('[data-v3-go],[data-kg-go],[data-kza-destination],button[data-tab],a[data-tab],a[href^="#"]');
    if(!button||button.disabled)return;
    const key=button.dataset.v3Go||button.dataset.kgGo||button.dataset.kzaDestination||button.dataset.tab||button.getAttribute('href')?.slice(1);
    const normalized=aliases[key]||key;
    if(!basic.has(normalized)&&!adventures.has(normalized)&&!['events','daily','notices'].includes(normalized))return;
    event.preventDefault();event.stopImmediatePropagation();
    if(document.getElementById('kzaNavigation')?.open)document.getElementById('kzaNavigation').close();
    window.KizunaGame?.closeCard?.();navigate(normalized);
  },true);
  window.KizunaNavigation=Object.freeze({navigate,route});
  window.addEventListener('hashchange',route);window.addEventListener('popstate',route);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route,{once:true});else route();
})();

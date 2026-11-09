/* Optional online odds. The base engine remains unchanged while V3 is disabled. */
const kv3Available=kzAvailablePacks;
kzAvailablePacks=function(){return window.KizunaV3?.available?.(state.selectedBooster,{chakra,stock})??kv3Available();};
const kv3CostLabel=packCostLabel;
packCostLabel=function(n){const e=window.KizunaV3?.event?.(state.selectedBooster);return e?.source==='chakra'?fmt(Number(e.price)*n)+' Chakra':e?.source==='nexus'?n+' coffret(s) Nexus':kv3CostLabel(n);};
const kv3RenderPack=renderKyaraPackSelection;
const kv3Online=()=>window.KIZUNA_CONFIG?.v3Economy===true&&!!window.KizunaAccount?.getSnapshot?.().user;
let kv3ReadyToken=-1;
function kv3GateOpening(){if(kv3Online()&&kv3ReadyToken!==state.packToken)$('kyaraRevealRoot')?.querySelectorAll('[data-kr-action="open-pack"],[data-kr-action="drag-pack"]').forEach(b=>b.disabled=true);}
const kv3Quantity=updateKyaraQuantity;
updateKyaraQuantity=function(n){kv3Quantity(n);kv3GateOpening();};
const kv3Start=startKyaraOpening;
startKyaraOpening=async function(){if(kv3Online()&&kv3ReadyToken!==state.packToken){toast('Attends la vérification des probabilités avant d’ouvrir.');return;}return kv3Start();};
const kv3Panel=renderPanel;
renderPanel=function(){kv3Panel();if(kv3Online()){$('kBars').innerHTML='<p>Les taux personnels et les garanties seront vérifiés avant de confirmer l’ouverture.</p>';const edition=window.KizunaV3?.event?.(state.selectedBooster);if(edition)$('kOpenSub').textContent=kzAvailablePacks()>0?edition.source==='chakra'?fmt(edition.price)+' Chakra par paquet':edition.source==='nexus'?'Réserve de coffrets Nexus':'Réserve de boosters':'Édition indisponible ou réserve insuffisante';}};
renderKyaraPackSelection=function(n){
 kv3ReadyToken=-1;
 kv3RenderPack(n);
 const root=$('kyaraRevealRoot'),buttons=[...root.querySelectorAll('[data-kr-action="open-pack"],[data-kr-action="drag-pack"]')];
 if(!kv3Online())return;
 const booster=state.selectedBooster,token=state.packToken;
 buttons.forEach(b=>b.disabled=true);
 const box=document.createElement('details');box.className='kv3-opening-odds';box.open=true;box.innerHTML='<summary>Probabilités de la prochaine ouverture</summary><p role="status">Vérification des taux et des garanties…</p>';
 root.querySelector('.kr-pack-controls').prepend(box);
 window.KizunaV3.getQuote(booster).then(q=>{
  if(token!==state.packToken||!box.isConnected)return;
  const odds=Object.fromEntries(rarityData.map(r=>[r.name,1-q.slots.reduce((p,s)=>p*(1-(s[r.name]||0)),1)]));
  const bonus=(value,model)=>esc(value)+(model==='points'?' point(s) de pourcentage':' % relatif');
  box.innerHTML='<summary>Probabilités du prochain paquet</summary><p>Au moins une carte de chaque rareté, garanties incluses. En ouverture multiple, les compteurs et les taux évoluent après chaque paquet.</p><ul>'+rarityData.map(r=>'<li>'+esc(r.name)+' : <b>'+formatBoosterChance(100*odds[r.name])+'</b></li>').join('')+'</ul><p>Base mythique, carte sans garantie : 0,1 %. Bonus du booster : '+bonus(q.boosterBonus,q.boosterModel)+'. Fortune : '+(q.fortuneEnabled?'palier '+q.fortuneTier+', +'+bonus(q.fortuneBonus,q.fortuneModel):'aucun supplément appliqué')+'.</p><p>Rare ou mieux garantie · Légendaire au plus tard dans '+q.legendaryRemaining+' paquets · Mythique au plus tard dans '+q.mythicRemaining+' paquets.</p>';
  kv3ReadyToken=token;
  box.insertAdjacentHTML('beforeend','<p>Garanties par emplacement : '+q.minimumLevels.map(level=>esc(rarityData.find(r=>r.level===level)?.name||level)+' ou mieux').join(' · ')+'.</p>');
  buttons.forEach(b=>b.disabled=kzAvailablePacks()<state.requestedBoosters);
 }).catch(error=>{if(token===state.packToken&&box.isConnected)box.innerHTML='<summary>Probabilités indisponibles</summary><p>'+esc(error.message)+'. Ferme cet aperçu puis réessaie.</p>';});
};
window.addEventListener('kizuna:v3-change',()=>{if(!state.opening){renderPanel();renderPacks();}});

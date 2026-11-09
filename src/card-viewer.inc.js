/* Accessible card inspection and factual Wiki presentation. No inventory writes. */
let kzViewerReturn=null,kzViewerBack=false,kzViewerZoom=false,kzProfileReturn=null;
const kzViewerFocusable=root=>[...root.querySelectorAll('button:not([disabled]),a[href]:not([tabindex="-1"]),input:not([disabled]),select:not([disabled]),[tabindex="0"]')].filter(node=>!node.closest('[hidden],[aria-hidden="true"]'));
function kzViewerUpdate(){
  const viewer=$('cardViewer'),flip=$('kzViewerFlip'),zoom=$('kzViewerZoom');if(!viewer)return;
  viewer.classList.toggle('kz-zoomed',kzViewerZoom);viewer.querySelector('.fcard')?.classList.toggle('flipped',kzViewerBack);
  viewer.querySelector('.ff')?.setAttribute('aria-hidden',String(kzViewerBack));viewer.querySelector('.fb')?.setAttribute('aria-hidden',String(!kzViewerBack));
  viewer.querySelectorAll('.fb a,.fb button').forEach(link=>link.tabIndex=kzViewerBack?0:-1);
  if(flip){flip.textContent=kzViewerBack?'Voir le recto':'Voir le verso';flip.setAttribute('aria-pressed',String(kzViewerBack));}
  if(zoom){zoom.textContent='Illustration entière';zoom.removeAttribute('aria-pressed');}
  if($('kzViewerStatus'))$('kzViewerStatus').textContent=(kzViewerBack?'Verso':'Recto')+' · '+(kzViewerZoom?'Agrandissement activé':'Taille normale');
}
// Keep the original drag / tilt / flip viewer for direct card clicks.
const kzInteractiveCardOpen = openDetail;
function openCardViewer(card){
  if(!card)return;
  kzViewerReturn=document.activeElement;kzViewerBack=false;kzViewerZoom=false;
  kzInteractiveCardOpen(card);
  const root=$('detailBackdrop'),content=$('detailContent'),viewer=$('cardViewer');if(!root||!content||!viewer)return;
  root.classList.add('kz-card-viewer');root.setAttribute('aria-label','Carte de '+card.name);
  const head=document.createElement('div');head.className='kz-viewer-head';
  head.innerHTML='<div><small>'+esc(card.rarity)+'</small><h2>'+esc(card.name)+'</h2><p>'+esc(card.series)+'</p></div>';
  head.append($('viewerClose'));content.prepend(head);
  const stage=document.createElement('div');stage.className='kz-viewer-stage';viewer.before(stage);stage.append(viewer);
  content.querySelector('.detail-hint')?.remove();
  const controls=document.createElement('div');controls.className='kz-viewer-controls';
  controls.innerHTML='<button type="button" id="kzViewerFlip">Voir le verso</button><button type="button" id="kzViewerZoom">Illustration entière</button>';
  content.append(controls);
  const status=document.createElement('p');status.id='kzViewerStatus';status.className='kz-viewer-caption';status.setAttribute('aria-live','polite');content.append(status);
  $('kzViewerFlip').addEventListener('click',()=>{kzViewerBack=!kzViewerBack;kzViewerUpdate();});
  $('kzViewerZoom').addEventListener('click',event=>kzOpenArtwork(card,event.currentTarget));
  viewer.addEventListener('click',()=>{kzViewerBack=viewer.querySelector('.fcard').classList.contains('flipped');kzViewerUpdate();});
  kzViewerUpdate();$('viewerClose').focus({preventScroll:true});
}

document.addEventListener('click',event=>{
  const link=event.target.closest('[data-kz-open-profile]');
  if(!link)return;
  event.preventDefault();
  const card=LOCAL_CARDS.find(row=>String(row.id)===String(link.dataset.kzOpenProfile));
  if(card)openDetail(card);
});
openDetail=function(card,source){
  if(!card)return;
  const tab=document.body.dataset.tab||'';
  const origin=source||(
    tab==='col'||tab==='collection'?'collection':
    tab==='market'?'market':
    tab==='boosts'||tab==='booster'?'booster':
    tab==='universes'||tab==='universe'?'universes':
    tab==='home'||tab==='lobby'?'home':'wiki'
  );
  state.activeCharacter=card;
  if($('detailBackdrop')?.classList.contains('open'))closeBackdrop('detailBackdrop');
  openCharacterProfile(card,origin);
};
document.addEventListener('error',event=>{
  const img=event.target;
  if(!(img instanceof HTMLImageElement)||!img.dataset.kzFallback||img.dataset.kzFallbackUsed)return;
  img.dataset.kzFallbackUsed='true';
  img.src=img.dataset.kzFallback;
},true);
const kzViewerPriorClose=closeBackdrop;
closeBackdrop=function(id){const restore=id==='detailBackdrop'&&$('detailBackdrop')?.classList.contains('open');kzViewerPriorClose(id);if($('kyaraProfileOverlay')?.classList.contains('open'))document.body.style.overflow='hidden';if(restore&&kzViewerReturn?.isConnected){kzViewerReturn.focus({preventScroll:true});kzViewerReturn=null;}};
document.addEventListener('keydown',event=>{
  if($('kdArtwork')?.open){if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();$('kdArtwork').close();}else if(event.key==='Tab'){event.preventDefault();event.stopImmediatePropagation();$('kdArtwork').querySelector('button').focus();}return;}
  const root=$('detailBackdrop');if(!root?.classList.contains('open')||!root.classList.contains('kz-card-viewer'))return;
  if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeBackdrop('detailBackdrop');return;}
  if(event.key==='Tab'){const nodes=kzViewerFocusable($('detailContent'));if(!nodes.length)return;const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&(document.activeElement===first||!nodes.includes(document.activeElement))){event.preventDefault();last.focus();}else if(!event.shiftKey&&(document.activeElement===last||!nodes.includes(document.activeElement))){event.preventDefault();first.focus();}}
},true);

// Owned character dossiers may enrich the local catalogue with public AniList biography and appearance data.
const kzOriginalProfileOpen=openCharacterProfile;
openCharacterProfile=function(card,source='wiki',options={}){
  if(!$('kyaraProfileOverlay')?.classList.contains('open'))kzProfileReturn=document.activeElement;
  kzOriginalProfileOpen(card,source,options);
  const root=$('kyaraProfileOverlay');if(!root)return;
  if($('cpKicker'))$('cpKicker').textContent='KIZUNA · FICHE PERSONNAGE';
  root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Fiche de '+card.name);
};

// Catalogue artwork is public, even before ownership. Inventory and biography
// unlocks are distinct; this view never fabricates an owned copy.
if(typeof cpLockedMarkup==='function')cpLockedMarkup=function(card,source,info,r){
 const back=cpReturnLabel(source);
 return `<div class="cp-main"><section class="cp-panel"><div class="cp-section-id">01 · CATALOGUE</div><h2 class="cp-section-title">À la rencontre de ${esc(card.name)}</h2><div class="cp-copy"><p>${esc(card.name)} appartient à l’univers <strong>${esc(card.series)}</strong>.</p><p>Cette carte ne fait pas encore partie de ta collection. Tu peux découvrir son illustration, sa rareté et ses liens.</p></div><div class="cp-actions"><button class="cp-action primary" type="button" data-cp-action="boosters">Voir les boosters</button><button class="cp-action" type="button" data-cp-action="return">${esc(back)}</button></div></section>${cpRelatedMarkup(card,r)}${kaMarketProfilePanel(card,r)}</div><aside class="cp-side"><div class="cp-side-inner"><div class="cp-card-art"><img src="${esc(kzPortraitForCard(card))}" alt="Illustration de ${esc(card.name)}" data-kz-fallback="${esc(card.imageFallback||'')}" decoding="async"><span class="cp-card-name">${esc(card.name)}</span><span class="cp-card-rarity">${esc(LET[card.rarity]||'C')}</span></div><div class="cp-tags"><span class="cp-tag">${esc(r.name)}</span><span class="cp-tag">Non obtenue</span></div><div class="cp-actions"><button class="cp-action" type="button" data-kv3-art="${esc(card.id)}">Illustration entière</button>${card.rarity==='Mythique'?'<button class="cp-action" type="button" data-km-open="'+esc(card.id)+'">Découvrir ses Éveils</button>':''}</div></div></aside>`;
};
// The original implementation already includes the market panel. An older wrapper
// added it a second time to owned dossiers.
if(typeof kaBaseOwnedMarkup==='function')cpOwnedMarkup=kaBaseOwnedMarkup;
function kzOpenArtwork(card,button){
 const dialog=document.createElement('dialog');dialog.id='kdArtwork';dialog.className='kv3-artwork-dialog';dialog.setAttribute('aria-label','Illustration de '+card.name);
 dialog.innerHTML='<button type="button" aria-label="Fermer l’illustration">×</button><img src="'+esc(kzPortraitForCard(card))+'" alt="'+esc(card.name)+'">';document.body.append(dialog);
 dialog.querySelector('button').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{dialog.remove();button.focus();},{once:true});dialog.showModal();
}
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-kv3-art]');if(!button)return;
 const card=LOCAL_CARDS.find(c=>String(c.id)===button.dataset.kv3Art);if(card)kzOpenArtwork(card,button);
});
const kzOriginalProfileHide=cpHideProfile;
cpHideProfile=function(){const open=$('kyaraProfileOverlay')?.classList.contains('open');kzOriginalProfileHide();if(open&&kzProfileReturn?.isConnected){kzProfileReturn.focus({preventScroll:true});kzProfileReturn=null;}};
document.addEventListener('click',event=>{const button=event.target.closest('[data-kz-profile-inspect]');if(!button)return;const card=LOCAL_CARDS.find(row=>String(row.id)===button.dataset.kzProfileInspect);if(card)openCardViewer(card);});
document.addEventListener('keydown',event=>{
  const root=$('kyaraProfileOverlay');if($('kdArtwork')?.open||!root?.classList.contains('open')||$('detailBackdrop')?.classList.contains('open'))return;
  if(event.key==='Tab'){const nodes=kzViewerFocusable(root),first=nodes[0],last=nodes.at(-1);if(!first)return;if(event.shiftKey&&(document.activeElement===first||!root.contains(document.activeElement))){event.preventDefault();last.focus();}else if(!event.shiftKey&&(document.activeElement===last||!root.contains(document.activeElement))){event.preventDefault();first.focus();}}
},true);

// The character sheet must not turn catalogue recycle values or asking prices into observed sales.
kaMarketProfilePanel=function(card,r){
  const now=Date.now(),week=now-7*86400000,month=now-30*86400000,cutoff=now-kyaraMarketChartRange*86400000;
  const actual=kyaraMarketHistory.filter(row=>String(row.cardId)===String(card.id)&&['buy','auction','buy-now'].includes(row.type)&&Number.isFinite(Number(row.at))&&row.at>0&&row.at<=now&&Number.isFinite(Number(row.gross))&&row.gross>0).map(row=>({at:Number(row.at),value:Number(row.gross)})).sort((a,b)=>a.at-b.at);
  const w=actual.filter(row=>row.at>=week),m=actual.filter(row=>row.at>=month),visible=actual.filter(row=>row.at>=cutoff);
  const median=rows=>rows.length?fmt(kaMedian(rows.map(row=>row.value)))+' ◆':'—';
  const chart=visible.length>=2?kaChartSvg(visible,r?.color||'#d9b86f',165):'<p class="kz-price-empty">'+(visible.length?'Une vente enregistrée sur cette période. Le graphique apparaîtra à partir de deux ventes.':'Aucune vente enregistrée sur cette période.')+'</p>';
  return '<section class="cp-panel cp-market-panel"><div class="cp-section-id">MARCHÉ · HISTORIQUE DES PRIX</div><div class="cp-market-title-row"><h2 class="cp-section-title">Cote de la carte</h2><div class="ka-range-toggle" role="group" aria-label="Période du graphique">'+[7,30].map(days=>'<button type="button" data-ka-range="'+days+'" data-ka-range-card="'+esc(card.id)+'" class="'+(kyaraMarketChartRange===days?'active':'')+'" aria-pressed="'+(kyaraMarketChartRange===days)+'">'+days+' j</button>').join('')+'</div></div><div class="cp-market-stats"><div><span>Médiane 7 j</span><b>'+median(w)+'</b></div><div><span>Médiane 30 j</span><b>'+median(m)+'</b></div><div><span>Ventes 30 j</span><b>'+fmt(m.length)+'</b></div></div>'+chart+'<p class="cp-market-foot">Transactions enregistrées dans ton espace de jeu. Les prix demandés dans les annonces ne sont pas des ventes conclues.</p><div class="cp-market-actions"><button class="cp-action primary" type="button" data-cp-market-list="'+esc(card.id)+'">Voir les annonces</button><button class="cp-action" type="button" data-cp-toggle-wishlist="'+esc(card.id)+'">'+(kyaraMarketWishlistIds.includes(String(card.id))?'Retirer de mes envies':'Ajouter à mes envies')+'</button></div></section>';
};

/* Card-back action: open the character dossier inside Kizuna. */
const kzOriginalCardBackMarkup = backMarkup;
backMarkup = function(card, info) {
  const markup = kzOriginalCardBackMarkup(card, info);
  return markup.replace(
    /<a href="#character\/[^"]+" data-kz-open-profile="([^"]+)" aria-label="([^"]+)">Voir la fiche du perso<\/a>/,
    '<button type="button" class="kz-card-profile-link" data-kz-open-profile="$1" aria-label="$2" aria-haspopup="dialog">Voir la fiche du perso <span aria-hidden="true">↗</span></button>'
  );
};

/* Shared presentation: classify controls, disclose secondary actions; never writes game state. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  function fold(selectors, title, key, hint='') {
    const existing=$('[data-rf-fold="'+key+'"]');
    if(existing)return existing;
    const nodes=selectors.map($).filter(Boolean);
    if(!nodes.length)return null;
    const details=document.createElement('details');details.className='rf-fold';details.dataset.rfFold=key;
    const summary=document.createElement('summary');
    const name=document.createElement('span');name.textContent=title;summary.append(name);
    if(hint){const small=document.createElement('small');small.textContent=hint;summary.append(small);}
    details.append(summary);nodes[0].before(details);
    const content=document.createElement('div');content.className='rf-fold-body';details.append(content);
    nodes.forEach(node=>content.append(node));return details;
  }
  function label(id,text){const node=document.getElementById(id);if(node&&!node.hasAttribute('aria-label'))node.setAttribute('aria-label',text);}
  function enhance(){
    fold(['#collection #colChips','#collection .col-filters'],'Affiner ma collection','collection-filters','Rareté, univers, exemplaires');
    fold(['#collection #colUni'],'Progression par univers','collection-progress');
    fold(['#marketFilterbar'],'Affiner les annonces','market-filters','Rareté, univers, prix');
    fold(['#marketPage .km-local-notice','#marketPage .km-market-collection-link'],'À propos de ce comptoir','market-help','Marché local · frais de vente : 5 %');
    fold(['#ranking .rank-search-row','#rankList','#ranking .rank-note'],'Détail de mon parcours','ranking-details');
    fold(['#kzwControls','#v8WikiFilter','#encyclopedia .kzw-help'],'Affiner le catalogue','wiki-filters','Univers, rareté, possession');
    fold(['#universes .ka-entry-links'],'Prolonger l’aventure','universe-links','Constellations, voyages, missions');
    fold(['#kzNexusPage .knx-benefits','#kzNexusPage .knx-rewards'],'Les trésors de mes liens','nexus-rewards','Cadeaux, cadre et récompenses');
    fold(['#kzNexusPage .knx-priorities','#kzNexusPage .knx-statistics'],'Suivre mes rencontres','nexus-priorities','Priorités et statistiques');
    fold(['#kzNexusPage .knx-archive'],'Ouvrir mes archives','nexus-archive','Filtres et suivi de collection');
    fold(['#kzNexusPage .knx-gallery','#kzNexusPage .knx-cosmetics'],'Explorer mes Éveils','nexus-awakening','Galerie et auras');
    const colFold=$('[data-rf-fold="collection-filters"]'),chips=$('#colChips');
    if(colFold&&chips)colFold.hidden=chips.style.display==='none';
    const progress=$('[data-rf-fold=collection-progress]'),filterBody=colFold?.querySelector('.rf-fold-body');if(progress&&filterBody&&progress.parentElement!==filterBody)filterBody.append(progress);
    const ranking=$('[data-rf-fold="ranking-details"]'),podium=$('#rankPodium');
    if(ranking&&podium&&ranking.previousElementSibling!==podium)podium.after(ranking);
    const journeys=$('[data-rf-fold="universe-links"]'),heading=$('#universes .section-heading');
    if(journeys&&heading&&journeys.previousElementSibling!==heading)heading.after(journeys);
    const rewards=$('[data-rf-fold="nexus-rewards"]'),count=$('#kanxAltarCount')?.textContent?.trim();
    if(rewards&&!count&&rewards.dataset.rewardReady==='true'){rewards.dataset.rewardReady='false';rewards.querySelector('summary small').textContent='Cadeaux, cadre et récompenses';}
    if(rewards&&count){const small=rewards.querySelector('summary small');if(small.textContent!==count)small.textContent=count;rewards.dataset.rewardReady='true';}
    // Keep an active, collapsed filter visible in its summary. Values still belong to the engine.
    for(const key of ['collection-filters','market-filters','wiki-filters']){
      const panel=$('[data-rf-fold="'+key+'"]');if(!panel)continue;
      const active=[...panel.querySelectorAll('select')].some(n=>n.value!==([...n.options].find(o=>o.defaultSelected)||n.options[0])?.value)||[...panel.querySelectorAll('input')].some(n=>n.type==='checkbox'?n.checked:!!n.value)||!!panel.querySelector('button.on:not(:first-child),button.active:not(:first-child),button[aria-pressed="true"]:not(:first-child)');
      if(panel.dataset.active!==String(active))panel.dataset.active=String(active);
    }
    document.querySelectorAll('.ik-arrow-glyph:not([data-rf-icon])').forEach(node=>{
      node.dataset.rfIcon='arrow';node.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg>';
    });
    document.querySelectorAll('button:not([data-ui-kind])').forEach(node=>{
      if(node.matches('.tcard,.fcard,.kpack,.rb-stage-pack,.kg-hero-pack,.ka-companion-card,.knx-node,.knx-branch-label,.ka-star-node,.ka-constellation-tile,.ka-destination,[data-colcard],[data-wiki]')||node.closest('.kza-navigation'))return;
      if(!node.matches('.soft-btn,.primary-btn,.secondary-btn,.km-action,.knx-primary,.knx-secondary,.kp-button,.kz-col-view,.kz-col-flip,.col-market-sell-btn,.kb-open,#kzFeaturedOpen,[data-ka-view],[data-ka-map],[data-kn-zoom],[data-kn-view],[data-market-view],.col-chip,.col-seg button,.rank-tabs button,.kb-tabs button,.kb-multi button,.kg-binder-controls button'))return;
      node.dataset.uiKind=node.matches('.primary,.primary-btn,.knx-primary,.kb-open,#kzFeaturedOpen')?'hero':node.matches('[data-ka-view],[data-market-view],.col-seg button,.rank-tabs button,.kb-tabs button')?'tab':node.matches('[data-ka-map],[data-kn-zoom],[data-kn-view],.kz-col-view,.kz-col-flip,.kg-binder-controls button')?'compact':'secondary';
    });
    const market=$('#marketTabs'),selected=market?.querySelector('[aria-selected="true"]');
    if(market&&selected){market.dataset.category=selected.dataset.marketView;market.querySelector('.kd-market-secondary')?.classList.toggle('is-purchase', ['buy','auction'].includes(selected.dataset.marketView));}
    // The display font is reserved for letters; directional symbols use the platform glyph set.
    document.querySelectorAll('button').forEach(button=>{
      const walker=document.createTreeWalker(button,NodeFilter.SHOW_TEXT),nodes=[];let node;
      while((node=walker.nextNode()))if(/[↗←→↑↓↖↘↙−＋✦✧]/.test(node.data)&&!node.parentElement.closest('.kd-symbol,svg'))nodes.push(node);
      nodes.forEach(node=>{const fragment=document.createDocumentFragment();node.data.split(/([↗←→↑↓↖↘↙−＋✦✧])/).forEach(part=>{if(/^[↗←→↑↓↖↘↙−＋✦✧]$/.test(part)){const span=document.createElement('span');span.className='kd-symbol';span.textContent=part;fragment.append(span);}else fragment.append(document.createTextNode(part));});node.replaceWith(fragment);});
    });
    label('colSearch' ,'Rechercher dans ma collection');label('marketSearch','Rechercher une annonce');label('kzUniverseSearch','Rechercher un univers');
  }
  let queued=false;
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance();});}
  function mount(){
    enhance();
    // Only child changes trigger enhancement. Attribute styling and zoom never re-run it.
    const main=$('main');if(main)new MutationObserver(schedule).observe(main,{childList:true,subtree:true});
    document.addEventListener('click',event=>{if(event.target.closest('[data-ka-view]')){const menu=$('#kaActivities');if(menu){menu.open=false;menu.querySelector('summary').focus({preventScroll:true});}}});
    document.addEventListener('keydown',event=>{const menu=$('#kaActivities');if(event.key==='Escape'&&menu?.open){menu.open=false;menu.querySelector('summary').focus();}});
    document.addEventListener('change',schedule);document.addEventListener('click',schedule);window.addEventListener('kizuna:tab-change',schedule);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();

/* Presentation routes and real account notifications. No economic operations. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id), routes={home:'home',boosters:'boosts',collection:'col',universes:'universes',marketPage:'market',encyclopedia:'wiki',ranking:'rank',community:'community',profile:'profile',staff:'staff',nexus:'nexus'};
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let pending=false,albumSignature='',dialog,lastFocus;
  const format=n=>Number(n||0).toLocaleString('fr-FR');
  function routeHash(){const tab=routes[location.hash.slice(1)];if(tab&&tab!==document.body.dataset.tab)window.KizunaGame?.showTab(tab);}
  function navigation(){
    const active={wiki:'universes',rank:'community',adventure:'universes'}[document.body.dataset.tab]||document.body.dataset.tab;
    document.querySelectorAll('.kz-shell-nav a').forEach(link=>{const selected=link.dataset.tab===active;link.classList.toggle('active',selected);if(selected)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
    schedule();
  }
  function renderUniverses(){
    if(!$('kzUniverseGrid'))return;
    const query=($('kzUniverseSearch')?.value||'').trim().toLocaleLowerCase('fr');
    const loading=window.KizunaAccount?.getSnapshot?.().loading;
    const albums=(window.KizunaGame?.getAlbums?.()||[]).filter(a=>a.name.toLocaleLowerCase('fr').includes(query));
    const signature=JSON.stringify([loading,query,albums.map(a=>[a.key,a.name,a.owned,a.total,a.cover])]);
    if(signature===albumSignature)return;albumSignature=signature;
    $('kzUniverseCount').textContent=albums.length+' univers · ordre alphabétique';
    $('kzUniverseGrid').innerHTML=albums.map((a,i)=>'<button class="kz-universe-tile" data-kz-album="'+esc(a.key)+'" type="button"><span class="kad-universe-number" aria-hidden="true">'+String(i+1).padStart(2,'0')+'</span><img src="'+esc(a.cover)+'" alt="" width="300" height="180" loading="lazy" decoding="async"><span class="kz-universe-name">'+esc(a.name)+'</span><span class="kz-universe-count">'+(loading?'Chargement…':format(a.owned)+' / '+format(a.total)+' cartes')+'</span><span class="kad-universe-progress" aria-hidden="true"><i style="width:'+(loading?0:Math.min(100,a.owned/Math.max(1,a.total)*100))+'%"></i></span><span class="kz-universe-link">Ouvrir l’album <span aria-hidden="true">↗</span></span></button>').join('')||'<p class="kz-empty">Aucun univers ne correspond à ta recherche.</p>';
  }
  function renderNotifications(){
    if(!dialog?.open)return;
    const account=window.KizunaAccount?.getSnapshot?.()||{},game=window.KizunaGame?.getSnapshot?.()||{};
    const status=account.loading?'Chargement de ton compte…':account.error||(!account.user?'Mode invité. Connecte-toi avec Discord pour synchroniser ta collection.':account.status==='synced'?'Ta collection est synchronisée.':'Synchronisation de ta progression en cours.');
    dialog.querySelector('[data-kz-notice-status]').textContent=status;
    const pulls=account.loading?[]:(game.pulls||[]).filter(p=>['Légendaire','Mythique'].includes(p.rarity)).slice(0,3);
    dialog.querySelector('[data-kz-notice-list]').innerHTML=pulls.length?pulls.map(p=>'<li><strong>'+esc(p.name)+'</strong><span>'+esc(p.rarity)+' · '+esc(new Date(p.at).toLocaleDateString('fr-FR'))+'</span></li>').join(''):'<li>Aucune découverte exceptionnelle enregistrée pour le moment.</li>';
  }
  function refresh(){pending=false;const active={wiki:'universes',rank:'community',adventure:'universes'}[document.body.dataset.tab]||document.body.dataset.tab;document.querySelectorAll('.kz-shell-nav a').forEach(link=>link.classList.toggle('active',link.dataset.tab===active));const account=window.KizunaAccount?.getSnapshot?.();$('kzHeaderChakra').textContent=account?.loading?'—':format(window.KizunaGame?.getSnapshot?.().chakra);if(document.body.dataset.tab==='universes')renderUniverses();renderNotifications();}
  function schedule(){if(pending)return;pending=true;(window.requestAnimationFrame||window.setTimeout)(refresh);}
  function openNotifications(){
    const account=window.KizunaAccount?.getSnapshot?.();
    if(account?.user&&!account.loading&&window.KizunaMarketInbox){window.KizunaMarketInbox.open();return;}
    if(!dialog){dialog=document.createElement('dialog');dialog.className='kz-notice-dialog';dialog.id='kzNoticeDialog';dialog.setAttribute('aria-labelledby','kzNoticeTitle');dialog.innerHTML='<header><h2 id="kzNoticeTitle">Ton carnet</h2><button class="soft-btn" type="button" data-kz-close aria-label="Fermer les notifications">Fermer</button></header><p data-kz-notice-status role="status"></p><h3>Tes dernières découvertes</h3><ul class="kz-notice-list" data-kz-notice-list></ul>';document.body.append(dialog);dialog.querySelector('[data-kz-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>lastFocus?.focus());dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});}
    lastFocus=document.activeElement;dialog.showModal();renderNotifications();
  }
  $('kzNotifications')?.addEventListener('click',openNotifications);
  $('kzUniverseSearch')?.addEventListener('input',renderUniverses);
  $('kzUniverseGrid')?.addEventListener('click',event=>{const tile=event.target.closest('[data-kz-album]');if(tile)window.KizunaGame?.openAlbumKey(tile.dataset.kzAlbum);});
  window.addEventListener('hashchange',routeHash);window.addEventListener('kizuna:tab-change',navigation);
  for(const type of ['kizuna:game-change','kizuna:albums-change','kizuna:ready'])window.addEventListener(type,schedule);
  document.addEventListener('kizuna:account-change',schedule);
  window.KizunaShell=Object.freeze({navigate:tab=>window.KizunaGame?.showTab(tab),refresh:schedule});
  routeHash();navigation();
})();

/* Direct navigation; no intermediary Explorer dialog. */
(() => {
 'use strict';
 const root=document.body,nav=document.querySelector('.kz-shell-nav');if(!nav)return;
 root.classList.add('kz-art','kz-v3');
 document.addEventListener('error',event=>{const img=event.target;if(!(img instanceof HTMLImageElement)||!img.closest('.tcard,.ka-companion-card,.kzw-card,#kadWikiStage,.ka-star-node,.ka-linked-portraits,.kz-universe-tile')||img.dataset.rbFallback)return;img.dataset.rbFallback='true';img.src='assets/rebirth/card-unavailable.svg';},true);
 const primary=['home','boosts','col','nexus','market','wiki'];
 nav.querySelectorAll('a').forEach(a=>{if(!primary.includes(a.dataset.tab)&&a.id!=='staffNav')a.remove();});
 let wiki=nav.querySelector('[data-tab="wiki"]');if(!wiki){wiki=document.createElement('a');wiki.href='#wiki';wiki.dataset.tab='wiki';nav.append(wiki);}wiki.innerHTML='<span>Wiki</span>';wiki.title='Encyclopédie des personnages';
 const labels={home:'Accueil',boosts:'Invocation',col:'Collection',nexus:'Nexus',market:'Marché',wiki:'Wiki',adventure:'Aventure',universes:'Univers',community:'Communauté',rank:'Classement',profile:'Mon profil',staff:'Staff'};
 const context=document.createElement('span');context.id='kzaHeaderContext';context.className='kza-header-context';context.setAttribute('aria-hidden','true');document.querySelector('.brand-logo')?.after(context);
 function sync(){root.dataset.artSection=root.dataset.tab;context.textContent=labels[root.dataset.tab]||'Kizuna';nav.querySelectorAll('a[data-tab]').forEach(a=>a.classList.toggle('kza-primary-destination',primary.includes(a.dataset.tab)));}
 window.addEventListener('kizuna:tab-change',sync);window.addEventListener('kizuna:adventure-view-change',sync);
 window.KizunaArt=Object.freeze({version:3,refresh:sync});sync();
})();

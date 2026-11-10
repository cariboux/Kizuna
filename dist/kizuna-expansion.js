/* Reviewed catalogue decisions. This module never writes player state or imports remotely. */
(() => {
  'use strict';
  const data=window.KIZUNA_EXPANSION_DATA||{cards:[],franchises:[],retained:[]};
  const tiers=new Set(['Commun','Peu commune','Rare','Épique','Légendaire','Mythique']);
  const byId=new Map(),bySource=new Map(),metadata=new Map(),franchises=new Map();
  for(const row of data.retained){byId.set(row.id,row.rarity);if(row.sourceId)bySource.set(String(row.sourceId),row.rarity);}
  for(const row of data.cards){byId.set(row.card.id,row.card.rarity);bySource.set(row.card.sourceId,row.card.rarity);metadata.set(row.card.id,row);}
  for(const row of data.franchises)franchises.set(row.name,row);
  const localPreview=window.KIZUNA_EXPANSION_PREVIEW===true&&['127.0.0.1','localhost','[::1]'].includes(location.hostname);
  window.KizunaExpansion=Object.freeze({
    rarityFor(card){return tiers.has(card?.catalogueRarity)?card.catalogueRarity:byId.get(String(card?.id))||bySource.get(String(card?.sourceId))||null;},
    aliasesFor(card){const row=metadata.get(String(card?.id)),f=franchises.get(card?.series);return [...(row?.aliases||[]),...(f?.aliases||[])].join(' ');},
    metadataFor(id){return metadata.get(String(id))||null;},
    // Only the isolated localhost fixture opts in. Production waits for the approved database import.
    previewCards:()=>localPreview?data.cards.map(row=>({...row.card})):[],
    previewAlbums:()=>localPreview?data.franchises.map(row=>({...row.album,card_ids:row.album.card_ids.slice()})):[],
    localPreview
  });
})();

/* Global presentation regression. Fresh guest data; no production requests or writes.
   KIZUNA_PLAYWRIGHT_MODULE=/path/to/playwright-core node scripts/test-finish.cjs */
const {chromium}=require(process.env.KIZUNA_PLAYWRIGHT_MODULE||'playwright-core');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/rest/v1/**',route=>route.abort()); // Explicitly test the unavailable service state.
 await page.goto(process.env.KIZUNA_TEST_URL||'http://127.0.0.1:8000');
 await page.waitForFunction(()=>window.KizunaAdventure&&window.KizunaGame?.getSnapshot().cards.length>0);
 await page.emulateMedia({reducedMotion:'reduce'});
 fs.mkdirSync('outputs/finish',{recursive:true});
 const go=t=>page.evaluate(t=>KizunaGame.showTab(t),t);
 const snapshot=()=>page.evaluate(()=>{const s=KizunaGame.getSnapshot();return {owned:s.owned,chakra:s.chakra,stock:s.stock}});
 const initial=await snapshot();
 await go('col');
 const collectionFold=page.locator('[data-rf-fold=collection-filters]');
 assert.equal(await collectionFold.evaluate(n=>n.open),false);
 await collectionFold.locator('summary').focus();await page.keyboard.press('Enter');
 await page.selectOption('#colOwn','all');await page.fill('#colSearch','Naruto');
 await page.waitForFunction(()=>document.querySelectorAll('#colGrid [data-colcard]').length>0);
 assert.ok((await page.locator('#colCount').innerText()).includes('30 cartes'));
 await page.click('#colFiltersReset');await page.fill('#colSearch','');
 await page.click('#colSeg [data-v=albums]');
 await page.waitForFunction(()=>document.querySelector('[data-rf-fold=collection-filters]').hidden);
 assert.ok(await page.locator('#colAlbums').isVisible());
 const albums=await page.evaluate(()=>KizunaGame.getAlbums());assert.ok(albums.length>0);
 await page.evaluate(key=>KizunaGame.openAlbumKey(key),albums[0].key);
 assert.ok(await page.locator('#colAlbumDetail').isVisible());assert.ok(await collectionFold.isVisible());
 await page.click('#colAlbumBack');assert.ok(await page.locator('#colAlbums').isVisible());
 await go('market');
 await page.click('[data-rf-fold=market-filters]>summary');await page.fill('#marketPriceMin','100');
 await page.click('[data-market-rarity="Rare"]');assert.ok(await page.locator('[data-market-rarity="Rare"]').evaluate(n=>n.classList.contains('active')));
 await page.click('#marketFiltersReset');assert.equal(await page.inputValue('#marketPriceMin'),'');
 for(const view of ['sell','auction','trade','activity','buy']){
  await page.click('[data-market-view='+view+']');
  assert.equal(await page.getAttribute('[data-market-view='+view+']','aria-selected'),'true');
  assert.ok(await page.locator('#market'+view[0].toUpperCase()+view.slice(1)+'View').isVisible());
 }
 await go('wiki');await page.click('[data-rf-fold=wiki-filters]>summary');await page.selectOption('#kzwUniverse','Naruto');
 await page.waitForFunction(()=>document.querySelector('#wikiCount').textContent.startsWith('30 '));
 assert.equal(await page.locator('#wikiGrid [data-wiki]').count(),30);
 await page.click('#kzwReset');await page.fill('#wikiSearch','Sasuke');
 await page.waitForFunction(()=>document.querySelectorAll('#wikiGrid [data-wiki]').length===1);
 await page.locator('#wikiGrid [data-wiki]').click();await page.waitForSelector(':is(#detailBackdrop,#kyaraProfileOverlay).open');await page.keyboard.press('Escape');
 await go('nexus');assert.equal(await page.getAttribute('#kzNexusPage','data-kn-mode'),'discovery');
 for(const branch of ['destin','resonance','collection','prestige','invocation']){
  await page.click('#knxBranchProgress [data-kn-branch-select='+branch+']');
  assert.equal(await page.getAttribute('#kzNexusPage','data-kn-focus'),branch);
  assert.match(await page.locator('#knxDetail').innerText(),/DÉCOUVERTE/);
 }
 assert.equal(await page.locator('#knxNodes [data-kn-node]').count(),0,'guest must not get invented purchase nodes');
 assert.equal(await page.locator('#knxDetail [data-kn-action=buy]').count(),0);
 await page.click('[data-kn-view=list]');assert.equal(await page.locator('#knxList .rf-branch-preview').count(),5);
 await page.locator('#knxList [data-kn-branch-select=destin]').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.closest('#knxList')?.id),'knxList','keyboard selection must retain focus in the list');assert.match(await page.locator('#knxDetail').innerText(),/Suis les rencontres/);
 await page.click('[data-kn-view=tree]');const zoom=await page.locator('#knxZoomLabel').innerText();
 await page.click('[data-kn-zoom=in]');assert.notEqual(await page.locator('#knxZoomLabel').innerText(),zoom);
 await page.click('[data-kn-zoom=fit]');
 await page.evaluate(()=>KizunaAdventure.navigate('constellations'));await page.waitForSelector('[data-ka-select]');
 await page.locator('.ka-constellation-tile').first().click();await page.waitForSelector('.ka-star-node');
 assert.equal(await page.locator('.ka-star-node').count(),2);
 const transform=await page.getAttribute('#kaMapCanvas','style');await page.click('[data-ka-map=in]');assert.notEqual(await page.getAttribute('#kaMapCanvas','style'),transform);
 await page.click('[data-ka-map=reset]');await page.locator('.ka-star-node').first().click();
 await page.waitForSelector(':is(#detailBackdrop,#kyaraProfileOverlay).open');await page.keyboard.press('Escape');
 await page.screenshot({path:'outputs/finish/after-desktop-constellation-detail.png'});
 await page.evaluate(()=>KizunaAdventure.navigate('sanctuary'));
 assert.equal(await page.locator('.kad-gallery-studio').evaluate(n=>n.open),false);
 await page.click('.kad-gallery-studio>summary');assert.ok(await page.locator('#kaSanctuaryForm').isVisible());
 await go('community');await page.waitForSelector('#kaPublicSanctuaries [role=alert]');
 assert.match(await page.locator('#kaPublicSanctuaries').innerText(),/momentanément inaccessibles/);
 assert.equal(await page.locator('#kaPublicSanctuaries .ka-empty').count(),0,'a failed request must not claim an empty directory');
 await page.click('[data-ka-directory-refresh]');
 // All route changes and presentation filters must leave the economic snapshot intact.
 assert.deepEqual(await snapshot(),initial);
 for(const [name,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844],['small',360,800]]){
  await page.setViewportSize({width,height});
  for(const route of ['col','market','nexus','wiki','universes','profile','community','rank','constellations','missions','journey','sanctuary','awakening','events']){
   await page.evaluate(t=>['constellations','missions','journey','sanctuary','awakening','events'].includes(t)?KizunaAdventure.navigate(t):KizunaGame.showTab(t),route);
   await page.waitForTimeout(80);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' '+route+' overflow');
   if(name==='mobile'&&route==='nexus'){
    await page.click('#knxBranchProgress [data-kn-branch-select=destin]');assert.match(await page.locator('#knxDetail').innerText(),/Suis les rencontres/);
    await page.screenshot({path:'outputs/finish/after-mobile-nexus-detail.png'});
   }
  }
 }
 // Isolated renderer fixture: these synthetic values validate UI states, never the remote service.
 const fixture=await browser.newPage({viewport:{width:1440,height:1000}});
 fixture.on('pageerror',e=>errors.push('fixture: '+e.message));
 await fixture.route('**/__nexus_fixture',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><link rel="stylesheet" href="kizuna-nexus.css"><link rel="stylesheet" href="kizuna-art-nexus.css"><link rel="stylesheet" href="kizuna-finish.css"></head><body class="theme-kizuna kz-game kz-art" data-tab="nexus"><main></main><script>
 window.fixtureCalls=[];
 const branches=['invocation','destin','resonance','collection','prestige'];
 const state={stateRevision:1,serverNow:Date.now(),level:3,xp:120,levelFloor:100,nextLevelXp:200,unlocked:['invocation_1'],preferences:{priorityCardIds:[]},bonuses:{},daily:{available:0,claimed:false},rewards:[],nodes:branches.flatMap(branch=>Array.from({length:5},(_,i)=>({id:branch+'_'+(i+1),branch,tier:i+1,name:'Fixture '+branch+' '+(i+1),description:'Effet de test du rendu uniquement.',enabled:i<4,cost:branch==='prestige'?600:100,requiredLevel:1,prerequisites:i?[branch+'_'+i]:[]})))};
 window.KizunaGame={getSnapshot:()=>({cards:[],owned:[],chakra:500,stock:{}})};
 window.KizunaAccount={getSnapshot:()=>({user:{id:'test-only'},loading:false}),nexusRequest:async(action)=>{fixtureCalls.push(action);if(action!=='get')throw Error('Unexpected mutation');return state;},economyRequest:async()=>{fixtureCalls.push('mutation');throw Error('Unexpected mutation');}};
 </script><script src="kizuna-nexus.js"></script><script src="kizuna-finish.js"></script></body></html>`}));
 await fixture.goto((process.env.KIZUNA_TEST_URL||'http://127.0.0.1:8000')+'/__nexus_fixture');
 await fixture.waitForFunction(()=>KizunaNexus.getSnapshot().loaded);
 assert.equal(await fixture.locator('#knxNodes [data-kn-node]').count(),25);
 for(const [id,state] of [['invocation_1','owned'],['destin_1','available'],['destin_2','locked'],['destin_5','future'],['prestige_1','insufficient']]){
  assert.equal(await fixture.getAttribute('#knxNodes [data-kn-node='+id+']','data-state'),state);
 }
 await fixture.click('#knxBranchProgress [data-kn-branch-select=destin]');
 assert.ok(await fixture.locator('#knxDetail [data-kn-action=buy]').isEnabled());
 await fixture.click('#knxDetail [data-kn-action=buy]');await fixture.waitForSelector('#knxConfirm[open]');
 await fixture.click('[data-kn-confirm=cancel]');
 assert.deepEqual(await fixture.evaluate(()=>fixtureCalls),['get'],'cancel must not call a mutation');
 await fixture.click('[data-kn-view=list]');await fixture.click('#knxList [data-kn-node=destin_2]');
 assert.ok(await fixture.locator('#knxDetail [data-kn-action=buy]').isDisabled());
 await fixture.click('#knxList [data-kn-node=destin_5]');assert.equal(await fixture.locator('#knxDetail [data-kn-action=buy]').count(),0);
 await fixture.setViewportSize({width:390,height:844});await fixture.click('[data-kn-view=tree]');
 await fixture.click('#knxBranchProgress [data-kn-branch-select=destin]');
 assert.ok((await fixture.locator('#knxNodes [data-kn-node=destin_1]').boundingBox()).width>=44,'mobile branch focus must enlarge the real node');
 await fixture.close();
 assert.deepEqual(errors,[]);
 console.log('PASS: collection filters/albums, five market views, wiki filters/detail, five guest Nexus branches/list/zoom, constellation map/detail, sanctuary editor, unavailable directory/retry, unchanged economy, 14 routes × 4 sizes; isolated Nexus fixture: 25 nodes, five states, cancel without mutation, mobile node focus; no JS errors.');
 fs.writeFileSync('outputs/finish/test-results.json',JSON.stringify({passed:true,errors,remoteAuthenticated:false,sizes:[1440,768,390,360]},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

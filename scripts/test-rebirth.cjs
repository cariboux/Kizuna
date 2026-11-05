/* Browser regression tests in a fresh guest context; no production writes.
   KIZUNA_PLAYWRIGHT_MODULE=/path/to/playwright-core node scripts/test-rebirth.cjs */
const { chromium }=require(process.env.KIZUNA_PLAYWRIGHT_MODULE||'playwright-core');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
 const context=await browser.newContext({viewport:{width:1366,height:768}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 fs.mkdirSync('outputs/rebirth',{recursive:true});
 const base=process.env.KIZUNA_TEST_URL||'http://127.0.0.1:8000';
 await page.goto(base);await page.waitForFunction(()=>window.KizunaHome&&document.querySelector('.ka-lobby-scene'));
 const snapshot=()=>page.evaluate(()=>{const s=KizunaGame.getSnapshot();return {owned:s.owned,chakra:s.chakra,stock:s.stock}});
 const before=await snapshot();
 assert.equal(await page.locator('.kz-shell-nav a').count(),5);
 // Cancel before a draw: stock, collection and currency must remain identical.
 await page.click('#kzFeaturedOpen');await page.waitForSelector('#kyaraRevealRoot[data-phase=pack]');
 await page.keyboard.press('Escape');assert.deepEqual(await snapshot(),before);
 // Real guest draw, then reveal its saved results and inspect a card.
 await page.click('.kz-shell-nav [data-tab=home]');
 await page.click('#kzFeaturedOpen');await page.click('[data-kr-action=open-pack]');
 await page.waitForSelector('#kyaraRevealRoot[data-phase=opening]');
 const one=await snapshot();assert.equal(one.owned.length,before.owned.length+5);assert.equal(one.chakra,before.chakra);assert.equal(one.stock.free+one.stock.inv,before.stock.free+before.stock.inv-1);
 await page.waitForTimeout(1500);
 await page.screenshot({path:'outputs/rebirth/after-laptop-reveal.png'});
 await page.click('[data-kr-action=all]');await page.waitForSelector('#kyaraRevealRoot[data-phase=finale]');
 assert.equal(await page.locator('.kr-finale-card').count(),5);
 const rarities=await page.locator('.kz-summary-rarities').innerText();assert.match(rarities,/Rare|Épique|Légendaire|Mythique/);
 await page.waitForTimeout(1500);
 await page.screenshot({path:'outputs/rebirth/after-laptop-summary.png'});
 await page.locator('.rb-reveal-more summary').focus();await page.keyboard.press('Enter');assert.ok(await page.locator('[data-kr-action=image]').isVisible());await page.keyboard.press('Enter');
 await page.click('[data-kr-action=detail]');await page.waitForSelector('#detailBackdrop.open');await page.keyboard.press('Escape');
 await page.evaluate(()=>KizunaGame.closeCard());await page.evaluate(()=>KizunaGame.showTab('home'));
 await page.click('#kaFavouriteSettings');await page.waitForSelector('#kaFavouriteDialog[open]');await page.locator('[data-ka-favourite-pick]').first().click();
 assert.equal(await page.locator('.ka-companion-card').count(),1);
 await page.reload();await page.waitForSelector('.ka-companion-card');assert.deepEqual((await snapshot()).owned,one.owned);
 // Each primary and secondary route remains reachable through actual controls.
 for(const tab of ['boosts','col','nexus','market','home']){await page.click('.kz-shell-nav [data-tab='+tab+']');assert.equal(await page.evaluate(()=>document.body.dataset.tab),tab);}
 for(const [key,tab] of [['universes','universes'],['wiki','wiki'],['missions','adventure'],['constellations','adventure'],['journey','adventure'],['awakening','adventure'],['sanctuary','adventure'],['profile','profile'],['rank','rank'],['community','community']]){await page.click('#kzaMenuButton');await page.click('[data-kza-destination='+key+']');assert.equal(await page.evaluate(()=>document.body.dataset.tab),tab,key);}
 await page.click('#kzaMenuButton');await page.click('[data-kza-destination=notices]');await page.waitForSelector('#kzNoticeDialog[open]');await page.keyboard.press('Escape');
 await page.click('#kzaMenuButton');await page.click('[data-kza-destination=events]');assert.equal(await page.evaluate(()=>document.body.dataset.tab),'adventure');
 await page.click('.kz-shell-nav [data-tab=home]');await page.click('[data-rb-activities]');await page.keyboard.press('Escape');assert.equal(await page.locator('#kzaNavigation').evaluate(n=>n.open),false);
 // Selecting a booster is free and updates the central stage and odds.
 await page.click('.kz-shell-nav [data-tab=boosts]');const selectionBefore=await snapshot();
 await page.locator('#kGrid .kpack').nth(1).click();assert.equal(await page.locator('#rbBoosterStage').getAttribute('data-pack'),await page.locator('#kGrid .kpack.sel').getAttribute('data-id'));assert.deepEqual(await snapshot(),selectionBefore);
 await page.click('.rb-odds>summary');assert.ok(await page.locator('#kBars').isVisible());assert.ok(await page.locator('#kPity1').isVisible());await page.click('.rb-odds>summary');
 // Daily claim and multi-open use the same existing handlers and real guest stock.
 await page.click('#kTabs [data-t=daily]');await page.click('[data-act=daily]');assert.equal((await snapshot()).stock.inv+(await snapshot()).stock.free,7);
 await page.click('#kTabs [data-t=free]');assert.ok(await page.locator('#kOpen10').isDisabled());
 await page.click('#kOpen5');await page.click('[data-kz-reveal-setting=quick]');await page.click('[data-kr-action=open-pack]');await page.waitForSelector('#kyaraRevealRoot[data-phase=finale]');
 assert.equal(await page.locator('.kr-finale-card').count(),25);assert.equal((await snapshot()).owned.length,30);assert.equal((await snapshot()).chakra,500);
 await page.keyboard.press('Escape');await page.reload();await page.waitForFunction(()=>window.KizunaGame?.getSnapshot().owned.length===30);
 // Respect both user preferences and the OS, and preserve the original sound default.
 await page.evaluate(()=>KizunaExperience.setPreference('reduce',true));assert.equal(await page.locator('html').getAttribute('data-kz-motion'),'reduced');assert.equal(await page.evaluate(()=>KizunaExperience.getPreferences().sound),false);
 await page.evaluate(()=>KizunaExperience.setPreference('reduce',false));await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.evaluate(()=>KizunaExperience.reduced()),true);
 // Responsive navigation and overflow on all three target sizes.
 for(const [name,width,height] of [['desktop',1600,1000],['laptop',1366,768],['mobile',390,844],['tablet',768,1024]]){
 await page.setViewportSize({width,height});
 for(const tab of ['home','boosts','col','nexus','market']){
 await page.click('.kz-shell-nav [data-tab='+tab+']');await page.waitForTimeout(100);
 if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)){console.log('OVERFLOW',await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,nodes:[...document.querySelectorAll('body *')].filter(n=>{const r=n.getBoundingClientRect();return r.width&&r.right>innerWidth}).slice(0,15).map(n=>({tag:n.tagName,id:n.id,c:String(n.className),right:n.getBoundingClientRect().right,display:getComputedStyle(n).display,visibility:getComputedStyle(n).visibility}))})));await page.screenshot({path:'outputs/overflow-debug.png'});}
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' '+tab+' overflow');
 if(tab==='home'||tab==='boosts')await page.screenshot({path:'outputs/rebirth/test-'+name+'-'+tab+'.png'});
 }
 }
 assert.deepEqual(errors,[]);console.log('PASS: cancel, normal draw, guarantee, detail, favourite, persistence, 15 routes, selection, odds, daily claim, 5-pack quick draw, preferences, 4 responsive sizes; no JS errors.');
 fs.writeFileSync('outputs/rebirth/test-results.json',JSON.stringify({passed:true,errors,owned:30,sizes:[1600,1366,390,768]},null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

/* Viewport comparisons in an isolated guest context. Set KIZUNA_CAPTURE_PHASE=before on the baseline checkout. */
const {chromium}=require(process.env.KIZUNA_PLAYWRIGHT_MODULE||'playwright-core');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 const page=await browser.newPage();await page.goto(process.env.KIZUNA_TEST_URL||'http://127.0.0.1:8000');
 await page.waitForFunction(()=>window.KizunaAdventure&&window.KizunaNexus);await page.emulateMedia({reducedMotion:'reduce'});
 const phase=process.env.KIZUNA_CAPTURE_PHASE==='before'?'before':'after',out='outputs/finish';fs.mkdirSync(out,{recursive:true});
 for(const [size,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  await page.setViewportSize({width,height});
  for(const tab of ['col','market','nexus','universes','wiki','profile','community','rank','constellations','missions','sanctuary','awakening','events']){
   await page.evaluate(t=>['constellations','missions','sanctuary','awakening','events'].includes(t)?KizunaAdventure.navigate(t):KizunaGame.showTab(t),tab);
   await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(400);
   await page.screenshot({path:out+'/'+phase+'-'+size+'-'+tab+'.png'});
  }
  await page.evaluate(()=>KizunaAdventure.navigate('constellations'));
  await page.locator('.ka-constellation-tile').first().click();await page.click('[data-ka-map=reset]');await page.evaluate(()=>scrollTo(0,0));
  await page.locator('.ka-constellation-layout').screenshot({path:out+'/'+phase+'-'+size+'-constellation-detail.png',style:'.topline,.kz-shell-nav{visibility:hidden!important}'});
 }
 console.log('Captured 13 routes and constellation detail on desktop and mobile.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});

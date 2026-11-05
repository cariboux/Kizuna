/* Local renderer comparison. The 25 nodes are an isolated fixture, never a live account. */
const {chromium}=require(process.env.KIZUNA_PLAYWRIGHT_MODULE||'playwright-core');
const fs=require('node:fs'),assert=require('node:assert/strict');
const phase=process.argv[2]||'after',base=process.env.KIZUNA_TEST_URL||'http://127.0.0.1:8000';
if(!['before','after'].includes(phase))throw Error('Expected before or after');
const out=`outputs/nexus-restore/${phase}`;fs.mkdirSync(out,{recursive:true});
let template=fs.readFileSync('scripts/test-finish.cjs','utf8').match(/contentType:'text\/html',body:`([\s\S]*?)`\}\)\)/)[1];
template=template.replace('</head>',`<link rel="stylesheet" href="kizuna-nexus-effects.css"><link rel="stylesheet" href="kizuna-design-system.css"><style>
@font-face{font-family:Rajdhani;src:url(assets/fonts/rajdhani-latin-600.woff2)}
@font-face{font-family:Manrope;src:url(assets/fonts/manrope-latin-400.woff2)}
body{margin:0;background:#0b172a;font-family:Manrope,sans-serif}h1,h2,h3{font-family:Rajdhani,sans-serif}main{max-width:1440px;margin:auto}#kzNexusPage{padding:24px}button{font:inherit}*{box-sizing:border-box}
@media(max-width:600px){#kzNexusPage{padding:12px}}
</style></head>`);
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('**/__nexus_restoration',r=>r.fulfill({contentType:'text/html',body:template}));
 for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  await page.setViewportSize({width,height});await page.goto(base+'/__nexus_restoration');await page.waitForFunction(()=>KizunaNexus.getSnapshot().loaded);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(250);
  assert.equal(await page.locator('#knxNodes>button').count(),25);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:`${out}/${name}-overview.png`});
  await page.locator('.knx-layout').screenshot({path:`${out}/${name}-tree.png`});
  await page.click('#knxBranchProgress [data-kn-branch-select=destin]');await page.waitForTimeout(300);
  await page.locator('.knx-layout').screenshot({path:`${out}/${name}-selection.png`});
 }
 if(phase==='after'){
  for(const width of [320,360,768,1024,1920]){
   await page.setViewportSize({width,height:900});await page.goto(base+'/__nexus_restoration');await page.waitForFunction(()=>KizunaNexus.getSnapshot().loaded);await page.evaluate(()=>document.fonts.ready);await page.click('[data-kn-zoom=fit]');
   assert.equal(await page.locator('.kanx-tree-scenery .kanx-bough').count(),25);
   assert.ok(await page.evaluate(()=>{
    const viewport=document.querySelector('#knxViewport').getBoundingClientRect();
    return [...document.querySelectorAll('#knxNodes>button,#knxBranchLabels>button')].every(node=>{const r=node.getBoundingClientRect();return r.left>=viewport.left&&r.right<=viewport.right&&r.top>=viewport.top&&r.bottom<=viewport.bottom;});
   }),width+'px: the overview must contain every node and branch heading');
   assert.ok(await page.locator('.knx-atlas-toolbar button').evaluateAll(nodes=>nodes.every(node=>node.getBoundingClientRect().height>=44)));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   const scale=await page.locator('#knxZoomLabel').innerText();await page.click('[data-kn-zoom=out]');assert.ok(parseInt(await page.locator('#knxZoomLabel').innerText())<=parseInt(scale),'Zoom out must never zoom in on a narrow screen');
   for(const branch of ['invocation','destin','resonance','collection','prestige']){
    await page.click(`#knxBranchProgress [data-kn-branch-select=${branch}]`);
    const node=page.locator('#knxNodes [aria-pressed=true]');if(width<=600)assert.ok((await node.boundingBox()).width>=44);
    await node.click();assert.equal(await page.getAttribute('#kzNexusPage','data-kn-focus'),branch);
   }
  }
 }
 // Real application in guest mode, including the current navigation and discovery controls.
 await page.route('**/rest/v1/**',r=>r.abort());
 for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  await page.setViewportSize({width,height});await page.goto(base);await page.waitForFunction(()=>window.KizunaGame?.getSnapshot().cards.length>0);await page.evaluate(()=>KizunaGame.showTab('nexus'));await page.waitForSelector('#knxViewport');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(300);
  await page.screenshot({path:`${out}/${name}-guest.png`});
 }
 assert.deepEqual(errors,[]);console.log(`PASS: ${phase}, desktop/mobile captures, 25 fixture nodes, no page overflow or JS errors.${phase==='after'?' Five branches and all overview bounds checked at 320, 360, 768, 1024 and 1920px; controls >=44px.':''}`);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});

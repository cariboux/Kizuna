/* Nexus acceptance uses an in-browser server double. It never authenticates or writes to Supabase. */
const {chromium}=require(process.env.KIZUNA_PLAYWRIGHT_MODULE||'playwright-core'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.KIZUNA_TEST_URL||'http://127.0.0.1:8000';
 let template=fs.readFileSync('scripts/test-finish.cjs','utf8').match(/contentType:'text\/html',body:`([\s\S]*?)`\}\)\)/)[1];
 template=template.replace('</head>','<link rel="stylesheet" href="kizuna-design-system.css"><style>@font-face{font-family:Rajdhani;src:url(assets/fonts/rajdhani-latin-600.woff2)}@font-face{font-family:Manrope;src:url(assets/fonts/manrope-latin-400.woff2)}body{margin:0;background:#0b172a}main{max-width:1440px;margin:auto}#kzNexusPage{padding-inline:20px}</style></head>');
 for(const mode of ['virgin','partial','complete','rewards']){
  const setup=mode==='virgin'?'state.unlocked=[];':mode==='complete'?'state.unlocked=state.nodes.map(n=>n.id);state.level=20;':mode==='rewards'?"state.rewards=[{key:'prestige_daily',name:'Récompense disponible — fixture',kind:'daily',chakra:50,available:true,claimed:false,locked:false},{key:'weekly',name:'Récompense verrouillée — fixture',packs:1,available:false,claimed:false,locked:true}];":'';
  await page.route('**/__nexus_acceptance',r=>r.fulfill({contentType:'text/html',body:template.replace('</script><script src="kizuna-nexus.js">',`${setup}
   window.fixtureBalance=500;window.fixtureState=state;
   KizunaGame.getSnapshot=()=>({cards:[],owned:[],chakra:fixtureBalance,stock:{}});
   KizunaAccount.economyRequest=async(action,payload)=>{fixtureCalls.push(action);if(action!=='nexus_buy')throw Error('Unexpected fixture action');const n=state.nodes.find(n=>n.id===payload.nodeId);if(!n||state.unlocked.includes(n.id))throw Error('Invalid fixture purchase');fixtureBalance-=n.cost;state.unlocked.push(n.id);state.stateRevision++;state.serverNow=Date.now();return {result:{nodeId:n.id,nexus:structuredClone(state)}};};
   </script><script src="kizuna-nexus.js">`)}));
  await page.setViewportSize({width:1366,height:900});await page.goto(base+'/__nexus_acceptance');await page.waitForFunction(()=>KizunaNexus.getSnapshot().loaded);
  for(const[name,width,height]of [['desktop',1920,1080],['laptop',1366,768],['tablet',768,1024],['mobile',390,844]]){await page.setViewportSize({width,height});await page.waitForTimeout(250);await page.screenshot({path:'outputs/definitive/after/'+name+'-nexus-'+mode+'.png'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
  if(mode==='rewards'){assert.match(await page.locator('[data-rf-fold=nexus-rewards]>summary').innerText(),/1 récompense/);await page.click('[data-rf-fold=nexus-rewards]>summary');assert.ok(await page.locator('[data-kn-reward=prestige_daily]').isEnabled());assert.ok(await page.locator('[data-kn-reward=weekly]').isDisabled());await page.locator('.knx-rewards').scrollIntoViewIfNeeded();await page.screenshot({path:'outputs/definitive/after/mobile-nexus-rewards-open.png'});}
  if(mode==='partial'){
   const before=await page.getAttribute('#knxWorld','style');await page.click('#knxBranchProgress [data-kn-branch-select=destin]');await page.waitForFunction(()=>document.querySelector('#knxNodes [data-kn-node=destin_1]').getBoundingClientRect().width>=44);assert.notEqual(await page.getAttribute('#knxWorld','style'),before);
   assert.equal(await page.locator('#knxNodes [data-kn-branch=invocation]').first().getAttribute('data-dimmed'),'true');assert.equal(await page.locator('#knxNodes [data-kn-branch=destin]').first().getAttribute('data-dimmed'),'false');
   await page.click('#knxDetail [data-kn-action=buy]');await page.click('[data-kn-confirm=cancel]');assert.deepEqual(await page.evaluate(()=>fixtureCalls),['get']);
   await page.click('#knxDetail [data-kn-action=buy]');await page.click('[data-kn-confirm=buy]');await page.waitForFunction(()=>KizunaNexus.getSnapshot().state.unlocked.includes('destin_1'));
   assert.equal(await page.evaluate(()=>fixtureBalance),400);assert.equal(await page.locator('#knxNodes [data-kn-node=destin_1]').getAttribute('data-state'),'owned');assert.ok(await page.locator('#knxCelebration').isVisible());await page.screenshot({path:'outputs/definitive/after/mobile-nexus-unlock.png'});
  }await page.unroute('**/__nexus_acceptance');
 }assert.deepEqual(errors,[]);fs.writeFileSync('outputs/definitive/nexus-acceptance.json',JSON.stringify({passed:true,remoteWrites:0,fixtureOnly:true,states:['virgin','partial','complete','rewards'],sizes:4,purchase:'cancel + accepted response',errors},null,2));console.log('PASS: Nexus virgin/partial/complete, 4 sizes, branch focus/dimming, reward states, cancel without mutation, accepted fixture purchase and celebration.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});

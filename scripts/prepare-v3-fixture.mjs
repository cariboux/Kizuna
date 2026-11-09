// Local browser acceptance harness. Never copied by the production build.
import {readFileSync,writeFileSync} from 'node:fs';
const original=readFileSync('scripts/test-finish.cjs','utf8');
let html=original.match(/contentType:'text\/html',body:`([\s\S]*?)`\}\)\)/)[1];
html=html.replace('</head>',`<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline'; connect-src 'none'; img-src 'self' data:"><link rel="stylesheet" href="kizuna-design-system.css"><link rel="stylesheet" href="kizuna-v3.css?v=3.3"><style>@font-face{font-family:Rajdhani;src:url(assets/fonts/rajdhani-latin-600.woff2)}@font-face{font-family:Manrope;src:url(assets/fonts/manrope-latin-400.woff2)}body{margin:0;background:#0b172a;color:white;font-family:Manrope,sans-serif}main{max-width:1440px;margin:auto}#kzNexusPage{padding:20px}#fixtureBanner{padding:14px;background:#38445b}#staffPage{padding:20px}#staffPage[hidden]{display:none!important}</style></head>`);
html=html.replace('kz-game kz-art','kz-game kz-art kz-v3').replace('<main></main>',`<div id="fixtureBanner"><strong>TEST LOCAL · données fictives · aucune connexion ni écriture distante</strong><p id="fixtureResult">Solde de test : 500 Chakra · 0 achat</p><button id="fixtureNexus">Tester le Nexus</button><button id="fixtureAdmin">Tester les brouillons</button></div><main><section id="staffPage" hidden><div class="ks-wrap"><nav class="ks-tabs"></nav></div></section></main>`);
const setup=`
let fixtureBalance=500,fixturePurchases=0;
window.KIZUNA_CONFIG={v3Economy:false};
KizunaGame.getSnapshot=()=>({cards:['Commun','Peu commune','Rare','Épique','Légendaire','Mythique'].map((rarity,i)=>({id:String(i+1),name:'Personnage test '+(i+1),series:'Univers de test',rarity})),owned:[],chakra:fixtureBalance,stock:{}});
KizunaAccount.getSnapshot=()=>({user:{id:'local-v3-fixture'},loading:false,isAdmin:true});
KizunaAccount.economyRequest=async(action,payload)=>{if(action!=='nexus_buy')throw Error('Action non prévue dans le test');const n=state.nodes.find(n=>n.id===payload.nodeId);if(!n||state.unlocked.includes(n.id)||fixtureBalance<n.cost)throw Error('Achat fictif invalide');fixtureBalance-=n.cost;fixturePurchases++;state.unlocked.push(n.id);state.stateRevision++;state.serverNow=Date.now();document.getElementById('fixtureResult').textContent='Solde de test : '+fixtureBalance+' Chakra · '+fixturePurchases+' achat';return {result:{nodeId:n.id,nexus:structuredClone(state)}};};
document.getElementById('fixtureAdmin').onclick=()=>{document.body.dataset.tab='staff';document.getElementById('staffPage').hidden=false;document.getElementById('kzNexusPage').hidden=true;};
document.getElementById('fixtureNexus').onclick=()=>{document.body.dataset.tab='nexus';document.getElementById('staffPage').hidden=true;document.getElementById('kzNexusPage').hidden=false;};
`;
html=html.replace('</script><script src="kizuna-nexus.js">',setup+'</script><script src="kizuna-nexus.js?v=3.3">');
html=html.replace('</body>','<script src="kizuna-v3-economy.js?v=3.3"></script></body>');
writeFileSync('public/v3-fixture.html',html);
console.log('Prepared public/v3-fixture.html; the next build removes it. Local doubles only.');

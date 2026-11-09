const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function fixture(){
 const calls=[],listeners={},location={href:'https://test.invalid/#home',pathname:'/',search:'',hash:'#home'};
 const set=url=>{location.href=new URL(url,location.href).href;location.hash=new URL(location.href).hash;};
 const history={state:null,replaceState:(s,_,u)=>{history.state=s;set(u);},pushState:(s,_,u)=>{history.state=s;calls.push(['push',u]);set(u);}};
 const context={location,history,CustomEvent:class{constructor(type,options){this.type=type;Object.assign(this,options);}},document:{readyState:'loading',getElementById:()=>null,querySelector:()=>null,addEventListener:(name,fn)=>listeners[name]=fn},window:{KizunaGame:{showTab:tab=>{calls.push(['tab',tab]);set('#'+tab);},closeCard:()=>calls.push(['close'])},KizunaAdventure:{navigate:(tab,id)=>{calls.push(['adventure',tab,id]);set('#adventure/'+tab+(id?'/'+encodeURIComponent(id):''));}},addEventListener:()=>{},dispatchEvent:()=>{}}};
 vm.runInNewContext(fs.readFileSync('dist/kizuna-navigation.js','utf8'),context);
 return {context,calls,listeners};
}
test('navigation preserves the previous history entry and supports adventure deep links',()=>{
 const f=fixture();assert.equal(f.context.window.KizunaNavigation.navigate('collection'),true);
 assert.deepEqual(f.calls,[['tab','col'],['push','https://test.invalid/#col']]);
 f.context.location.hash='#adventure/constellations/team%207';f.context.window.KizunaNavigation.route();
 assert.deepEqual(f.calls.at(-1),['adventure','constellations','team 7']);
});
test('ordinary controls never match the body data-tab or close a dossier',()=>{
 const f=fixture();let selector='';
 f.listeners.click({button:0,target:{closest:s=>{selector=s;return s.split(',').includes('[data-tab]')?{dataset:{tab:'home'}}:null;}},preventDefault:()=>{},stopImmediatePropagation:()=>{}});
 assert.match(selector,/button\[data-tab\]/);assert.deepEqual(f.calls,[]);
});
test('character routes remain owned by the dossier; unknown routes do nothing',()=>{
 const f=fixture();f.context.location.hash='#character/real-card';f.context.window.KizunaNavigation.route();
 assert.equal(f.context.window.KizunaNavigation.navigate('unknown'),false);assert.deepEqual(f.calls,[]);
});

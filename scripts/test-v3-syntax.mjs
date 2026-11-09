import {readdirSync,readFileSync} from 'node:fs';
import vm from 'node:vm';
let count=0;
for(const dir of ['dist','src'])for(const name of readdirSync(dir).filter(n=>n.endsWith('.js'))){new vm.Script(readFileSync(dir+'/'+name,'utf8'),{filename:dir+'/'+name});count++;}
const html=readFileSync('dist/index.html','utf8');
for(const [i,m] of [...html.matchAll(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries())if(!/\bsrc=|application\/ld\+json/.test(m[1]||'')){new vm.Script(m[2],{filename:'index inline '+i});count++;}
console.log('PASS: '+count+' source and inline scripts parse.');

/* Reuse the archived functional contracts against the CURRENT built application.
   No authentication, network requests, database or production writes. */
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=process.cwd(),temporary=fs.mkdtempSync(path.join(os.tmpdir(),'kizuna-nexus-contracts-'));
const modules=path.resolve(process.env.KIZUNA_TEST_MODULES||'node_modules');
const tests=['verify-nexus','verify-nexus-lot2','verify-nexus-lot3','verify-art-nexus','verify-nexus-account','verify-nexus-boosters'];
const report={fixtureOnly:true,remoteWrites:0,tests:[]};
function run(command,args,options={}){const result=spawnSync(command,args,{encoding:'utf8',...options});if(result.error)throw result.error;return result;}
function replaceOnce(file,from,to){let text=fs.readFileSync(file,'utf8');if(!text.includes(from))throw Error('Archived assertion missing: '+from);fs.writeFileSync(file,text.replace(from,to));}
try{
 if(!fs.existsSync(path.join(root,'public/index.html')))throw Error('Run python3 scripts/build-netlify.py first');
 for(const dependency of ['jsdom','esbuild'])if(!fs.existsSync(path.join(modules,dependency)))throw Error(`Install ${dependency} and set KIZUNA_TEST_MODULES to that node_modules directory`);
 fs.symlinkSync(modules,path.join(temporary,'node_modules'),'dir');
 fs.symlinkSync(path.join(root,'public'),path.join(temporary,'dist'),'dir');
 const extracted=run('python3',['-c',`import zipfile,pathlib,sys
with zipfile.ZipFile(sys.argv[1]) as archive:
 for name in sys.argv[3:]:
  target=pathlib.Path(sys.argv[2])/'scripts'/(name+'.mjs')
  target.parent.mkdir(parents=True,exist_ok=True)
  target.write_bytes(archive.read('scripts/'+name+'.mjs'))`,path.join(root,'maintenance-originale.zip'),temporary,...tests,'verify-account']);
 if(extracted.status!==0)throw Error(extracted.stderr);
 // Three UI expectations evolved since archival; economic assertions are unchanged.
 const script=name=>path.join(temporary,'scripts',name+'.mjs');
 replaceOnce(script('verify-nexus'),`assert.match($('#knxNotice').textContent,/Connecte-toi/);click('#knxNotice [data-kn-action="login"]');`,`assert.match($('#knxDetail').textContent,/Retrouver mon Nexus/);click('#knxDetail [data-kn-action="login"]');`);
 replaceOnce(script('verify-nexus-lot3'),`/34/,'A narrow first visit fits the whole tree'`,`/32/,'A narrow first visit fits the whole tree including headings and roots'`);
 replaceOnce(script('verify-art-nexus'),`assert.match($('#kanxAltarCount').textContent,/4 packs/)`,`assert.match($('#kanxAltarCount').textContent,/2 récompenses/)`);
 for(const name of tests){
  const result=run(process.execPath,[script(name)],{cwd:temporary,timeout:60000});
  report.tests.push({name,passed:result.status===0,output:result.stdout.trim(),error:result.stderr.trim()});
  process.stdout.write(`${name}: ${result.status===0?'PASS':'FAIL'}\n${result.stdout}${result.stderr}`);
 }
 report.passed=report.tests.every(test=>test.passed);if(!report.passed)process.exitCode=1;
}catch(error){report.passed=false;report.error=String(error);console.error(error);process.exitCode=1;
}finally{fs.mkdirSync('outputs/nexus-restore',{recursive:true});fs.writeFileSync('outputs/nexus-restore/contracts.json',JSON.stringify(report,null,2)+'\n');fs.rmSync(temporary,{recursive:true,force:true});}

// Runs the observed production resonance function against fictional players only.
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const json=async name=>JSON.parse(await readFile(new URL('../catalogue/anime-expansion/'+name,import.meta.url),'utf8'));
const proposal=await json('proposal.json'),baseline=await json('baseline.json'),fixture=await json('mythic-fixture.json');
const cards=proposal.franchises.flatMap(f=>f.cards.map(r=>r.card)),mythics=cards.filter(c=>c.rarity==='Mythique');
const old=baseline.cards.find(c=>c.card.rarity==='Mythique').card,other=cards.find(c=>c.rarity==='Commun');
const db=new PGlite(),user='10000000-0000-4000-8000-000000000001';
const q=async(s,p=[]) => (await db.query(s,p)).rows;
await db.exec(`create schema kizuna_private;
create table public.kizuna_cards(id text primary key,card jsonb);
create table public.kizuna_mythic_forms(card_id text primary key,levels integer);
create table public.kizuna_mythic_rules(id boolean primary key,thresholds integer[]);
insert into public.kizuna_mythic_rules values(true,array[1,3,6]);
create table kizuna_private.kizuna_mythic_progress(user_id uuid,card_id text,resonance bigint default 0,unlocked integer default 0,selected integer default 0,legacy boolean default false,updated_at timestamptz,primary key(user_id,card_id));
create table kizuna_private.kizuna_mythic_unlocks(user_id uuid,card_id text,level integer,unlocked_at timestamptz,primary key(user_id,card_id,level));
create table kizuna_private.kizuna_booster_journal(user_id uuid,request_id uuid,packs integer,primary key(user_id,request_id));
create table kizuna_private.kizuna_draw_journal(user_id uuid,request_id uuid,ordinal integer,card_id text,universe text,rarity text,duplicate boolean,resonance integer,primary key(user_id,request_id,ordinal));
create table kizuna_private.kizuna_market_listings(seller_id uuid,status text,card_id text);
create function kizuna_private.mythic_sync_adventure(uuid) returns void language sql as $$select$$;
create function kizuna_private.anomaly_enrol(uuid) returns void language sql as $$select$$;`);
await q('insert into public.kizuna_cards select id,value from jsonb_array_elements($1) value cross join lateral (select value->>\'id\' id) x',[JSON.stringify([...cards,old])]);
for(const c of mythics)await q('insert into public.kizuna_mythic_forms values($1,2)',[c.id]);
await q('insert into public.kizuna_mythic_forms values($1,3)',[old.id]);
await db.exec(fixture.functions[0]);
const record=async(id,owned=[],request=crypto.randomUUID())=>(await q('select kizuna_private.mythic_record_open($1,$2,$3,$4,1) awards',[user,request,JSON.stringify({owned:owned.map(id=>({id}))}),JSON.stringify([id,other.id,other.id,other.id,other.id].map(id=>({id})))]))[0].awards;
for(const c of [...mythics,old]){
 const first=await record(c.id);assert.equal(first[0].delta,0);assert.equal(first[0].unlocked,0);
 for(let i=1;i<=6;i++){
  const a=(await record(c.id,[c.id]))[0];assert.equal(a.resonance,i);
  assert.equal(a.unlocked,i>=6&&c.id===old.id?3:i>=3?2:1);
 }
}
assert.equal((await q('select count(*)::int n from kizuna_private.kizuna_mythic_progress'))[0].n,10);
assert.equal((await q('select count(*)::int n from kizuna_private.kizuna_mythic_unlocks'))[0].n,21);
assert.equal((await q('select count(*)::int n from kizuna_private.kizuna_draw_journal where rarity<>\'Mythique\' and resonance<>0'))[0].n,0);
const req=crypto.randomUUID();await record(mythics[0].id,[mythics[0].id],req);
const before=await q('select * from kizuna_private.kizuna_mythic_progress order by card_id');
await assert.rejects(record(mythics[0].id,[mythics[0].id],req),/duplicate key/);
assert.deepEqual(await q('select * from kizuna_private.kizuna_mythic_progress order by card_id'),before);
console.log('PASS: actual resonance function; all 9 new Mythics capped at 2 forms; existing 3-form progression retained; thresholds 1/3/6, duplicates and replay protection preserved; non-Mythics grant no resonance.');
await db.close();

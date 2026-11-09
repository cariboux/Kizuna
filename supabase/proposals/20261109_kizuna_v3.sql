-- PROPOSAL ONLY. Do not apply to production without owner approval.
-- Installs disabled configuration; no existing wallet, inventory, Nexus IDs or prices are migrated.
begin;
create table if not exists kizuna_private.kizuna_v3_config (
 id boolean primary key default true check(id),
 revision integer not null default 1,
 version integer not null default 0,
 draft jsonb not null,
 live jsonb not null,
 updated_by uuid,
 updated_at timestamptz not null default now()
);
create table if not exists kizuna_private.kizuna_v3_versions (
 version integer primary key, config jsonb not null, actor uuid not null, created_at timestamptz not null default now()
);
create table if not exists kizuna_private.kizuna_fortune_purchases (
 user_id uuid not null references auth.users(id), tier integer not null check(tier between 1 and 5),
 cost bigint not null check(cost>=0), config_version integer not null,
 created_at timestamptz not null default now(),primary key(user_id,tier)
);
revoke all on kizuna_private.kizuna_v3_config,kizuna_private.kizuna_v3_versions,kizuna_private.kizuna_fortune_purchases from public,anon,authenticated;
alter table kizuna_private.kizuna_v3_config enable row level security;
alter table kizuna_private.kizuna_v3_versions enable row level security;
alter table kizuna_private.kizuna_fortune_purchases enable row level security;
insert into kizuna_private.kizuna_v3_config(id,draft,live)
select true,c,c from (select jsonb_build_object('fortune',jsonb_build_object(
 'enabled',false,'model','relative','cap',null,
 'eligible',jsonb_build_object('standard',false,'thematic',false,'event',false,'shop',false,'nexus',false),
 'levels',jsonb_build_array(jsonb_build_object('cost',null,'bonus',null),jsonb_build_object('cost',null,'bonus',null),jsonb_build_object('cost',null,'bonus',null),jsonb_build_object('cost',null,'bonus',null),jsonb_build_object('cost',null,'bonus',null))),
 'events','[]'::jsonb) c) initial on conflict do nothing;

-- All probabilities in configuration are percentages. Relative +10 means x1.10;
-- points +0.1 means +0.1 percentage point. Values are incremental per purchased tier.
-- Order: conditional base -> booster -> cumulative Fortune -> cap -> existing pity.
-- Inactive settings return exactly the historical weights, including rounding behavior.
create or replace function kizuna_private.v3_weights(p_min integer,p_booster_model text,p_booster_bonus numeric,p_fortune_model text,p_fortune_bonus numeric,p_cap numeric)
returns integer[] language plpgsql immutable set search_path='' as $$
declare w integer[]:=array[600,230,125,42,2,1];out_w integer[]:=array[0,0,0,0,0,0];
 total numeric:=0;prob numeric;original numeric;remainder integer;idx integer;largest integer;
begin
 if p_min<1 or p_min>6 or p_min is null then raise exception 'INVALID_MINIMUM';end if;
 if p_min=6 then return array[0,0,0,0,0,1000000];end if;
 if coalesce(p_booster_bonus,0)=0 and coalesce(p_fortune_bonus,0)=0 then return w;end if;
 if p_booster_model not in ('relative','points') or p_fortune_model not in ('relative','points') or p_cap is null or p_cap<0 or p_cap>100 or p_booster_bonus<0 or p_fortune_bonus<0 then raise exception 'INVALID_ODDS';end if;
 for idx in p_min..6 loop total:=total+w[idx];end loop;
 original:=1/total;prob:=original;
 prob:=case p_booster_model when 'relative' then prob*(1+coalesce(p_booster_bonus,0)/100) else prob+coalesce(p_booster_bonus,0)/100 end;
 prob:=case p_fortune_model when 'relative' then prob*(1+coalesce(p_fortune_bonus,0)/100) else prob+coalesce(p_fortune_bonus,0)/100 end;
 prob:=least(1,greatest(original,least(prob,p_cap/100)));
 out_w[6]:=round(prob*1000000);remainder:=1000000-out_w[6];largest:=p_min;
 for idx in p_min..5 loop out_w[idx]:=floor((1000000-out_w[6])*w[idx]/(total-1));remainder:=remainder-out_w[idx];end loop;
 out_w[largest]:=out_w[largest]+remainder;
 return out_w;
end $$;

create or replace function kizuna_private.v3_validate(c jsonb,publish boolean default false)
returns void language plpgsql set search_path='' as $$
declare f jsonb:=c->'fortune';level jsonb;e jsonb;ids text[];n integer;name text;key text;
begin
 if c is null or jsonb_typeof(c)<>'object' or (select count(*) from jsonb_object_keys(c))<>2 or not(c ?& array['fortune','events']) then raise exception 'V3_INVALID_CONFIG';end if;
 if jsonb_typeof(f) is distinct from 'object' or jsonb_typeof(f->'enabled') is distinct from 'boolean' or coalesce(f->>'model','') not in ('relative','points') or jsonb_typeof(f->'levels') is distinct from 'array' or jsonb_array_length(f->'levels')<>5 or jsonb_typeof(f->'eligible') is distinct from 'object' then raise exception 'V3_INVALID_FORTUNE';end if;
 if (select count(*) from jsonb_object_keys(f))<>5 or not(f ?& array['enabled','model','cap','levels','eligible']) then raise exception 'V3_INVALID_FORTUNE';end if;
 if (select count(*) from jsonb_object_keys(f->'eligible'))<>5 then raise exception 'V3_INVALID_ELIGIBILITY';end if;
 foreach key in array array['standard','thematic','event','shop','nexus'] loop
  if jsonb_typeof(f->'eligible'->key) is distinct from 'boolean' then raise exception 'V3_INVALID_ELIGIBILITY';end if;
 end loop;
 if publish and (f->>'enabled')::boolean and (jsonb_typeof(f->'cap') is distinct from 'number' or (f->>'cap')::numeric<=0 or (f->>'cap')::numeric>100) then raise exception 'V3_CAP_REQUIRED';end if;
 for level in select value from jsonb_array_elements(f->'levels') loop
  if not(level ?& array['cost','bonus']) or (select count(*) from jsonb_object_keys(level))<>2 then raise exception 'V3_INVALID_LEVEL';end if;
  if level->'cost'<>'null'::jsonb and (jsonb_typeof(level->'cost')<>'number' or (level->>'cost')::numeric<0 or (level->>'cost')::numeric>1000000000 or (level->>'cost')::numeric<>trunc((level->>'cost')::numeric)) then raise exception 'V3_INVALID_COST';end if;
  if level->'bonus'<>'null'::jsonb and (jsonb_typeof(level->'bonus')<>'number' or (level->>'bonus')::numeric<0 or (level->>'bonus')::numeric>10000) then raise exception 'V3_INVALID_BONUS';end if;
  if publish and (f->>'enabled')::boolean and (level->'cost'='null'::jsonb or level->'bonus'='null'::jsonb) then raise exception 'V3_LEVEL_VALUES_REQUIRED';end if;
 end loop;
 if jsonb_typeof(c->'events')<>'array' or jsonb_array_length(c->'events')>40 then raise exception 'V3_INVALID_EVENTS';end if;
 if (select count(distinct value->>'id') from jsonb_array_elements(c->'events'))<>jsonb_array_length(c->'events') then raise exception 'V3_DUPLICATE_EVENT';end if;
 for e in select value from jsonb_array_elements(c->'events') loop
  perform (e->>'id')::uuid;
  if not(e ?& array['id','name','description','image','pool','source','price','startsAt','endsAt','bonusModel','bonus','cap','fortuneEligible','collectionBonus','minLevels','enabled']) or (select count(*) from jsonb_object_keys(e))<>16 then raise exception 'V3_INVALID_EVENT';end if;
  if jsonb_typeof(e->'enabled') is distinct from 'boolean' or jsonb_typeof(e->'fortuneEligible') is distinct from 'boolean' or jsonb_typeof(e->'name') is distinct from 'string' or length(btrim(e->>'name')) not between 3 and 60 or jsonb_typeof(e->'description') is distinct from 'string' or length(e->>'description')>300 or coalesce(e->>'source','') not in ('stock','chakra','nexus') or coalesce(e->>'bonusModel','') not in ('relative','points') then raise exception 'V3_INVALID_EVENT';end if;
  if jsonb_typeof(e->'pool')<>'array' or jsonb_array_length(e->'pool')>500 or jsonb_typeof(e->'minLevels') is distinct from 'array' or jsonb_array_length(e->'minLevels')<>5 or exists(select 1 from jsonb_array_elements(e->'minLevels') with ordinality as g(value,idx) where jsonb_typeof(value) is distinct from 'number' or value::text::numeric<>trunc(value::text::numeric) or value::text::numeric<case when idx=5 then 3 when idx=4 then 2 else 1 end or value::text::numeric>6) then raise exception 'V3_INVALID_POOL_OR_GUARANTEE';end if;
  if publish and (e->>'enabled')::boolean then
   if coalesce(e->>'image','') !~ '^https://[^[:space:]]+' and coalesce(e->>'image','') !~ '^assets/[A-Za-z0-9_./-]+$' then raise exception 'V3_IMAGE_REQUIRED';end if;
   if (e->>'startsAt') is not null then perform (e->>'startsAt')::timestamptz;end if;
   if (e->>'endsAt') is not null then perform (e->>'endsAt')::timestamptz;end if;
   if (e->>'endsAt')::timestamptz<=(e->>'startsAt')::timestamptz then raise exception 'V3_INVALID_DATES';end if;
   if e->>'bonus' is null or (e->>'bonus')::numeric<0 or (e->>'bonus')::numeric>10000 or e->>'cap' is null or (e->>'cap')::numeric<=0 or (e->>'cap')::numeric>100 then raise exception 'V3_INVALID_ODDS';end if;
   if e->>'collectionBonus' is null or (e->>'collectionBonus')::numeric<0 or (e->>'collectionBonus')::numeric>100 then raise exception 'V3_INVALID_COLLECTION_BONUS';end if;
   if e->>'source'='chakra' and (e->>'price' is null or (e->>'price')::numeric<0 or (e->>'price')::numeric<>trunc((e->>'price')::numeric) or (e->>'price')::numeric>1000000000) then raise exception 'V3_PRICE_REQUIRED';end if;
   select array_agg(value) into ids from jsonb_array_elements_text(e->'pool');
   if coalesce(cardinality(ids),0)<6 or cardinality(ids)<>(select count(distinct x) from unnest(ids) x) or exists(select 1 from unnest(ids) x where not exists(select 1 from public.kizuna_cards k where k.id=x)) then raise exception 'V3_INVALID_POOL';end if;
   select count(distinct card->>'rarity') into n from public.kizuna_cards where id=any(ids);
   if n<>6 then raise exception 'V3_SIX_RARITIES_REQUIRED';end if;
  end if;
 end loop;
end $$;

create or replace function kizuna_private.v3_event(p_booster text)
returns jsonb language sql stable set search_path='' as $$
 select e from kizuna_private.kizuna_v3_config c cross join lateral jsonb_array_elements(c.live->'events') e where 'staff:'||(e->>'id')=p_booster;
$$;
create or replace function kizuna_private.v3_draw_weights(p_user uuid,p_booster text,p_min integer)
returns integer[] language plpgsql stable set search_path='' as $$
declare f jsonb;e jsonb;rank integer;bonus numeric:=0;kind text;cap numeric:=100;
begin
 select live->'fortune' into f from kizuna_private.kizuna_v3_config where id;
 e:=kizuna_private.v3_event(p_booster);
 kind:=case when p_booster='nexus:weekly' then 'nexus' when e is not null then case e->>'source' when 'chakra' then 'shop' when 'nexus' then 'nexus' else 'event' end when p_booster='mix' then 'standard' else 'thematic' end;
 if e is not null and (not coalesce((e->>'enabled')::boolean,false) or now()<(e->>'startsAt')::timestamptz or now()>=(e->>'endsAt')::timestamptz) then raise exception 'BOOSTER_UNAVAILABLE';end if;
 if coalesce((f->>'enabled')::boolean,false) and coalesce((f->'eligible'->>kind)::boolean,false) and (e is null or coalesce((e->>'fortuneEligible')::boolean,false)) then
  select coalesce(max(tier),0) into rank from kizuna_private.kizuna_fortune_purchases where user_id=p_user;
  select coalesce(sum((value->>'bonus')::numeric),0) into bonus from jsonb_array_elements(f->'levels') with ordinality where ordinality<=rank;
  cap:=(f->>'cap')::numeric;
 end if;
 if e is not null then cap:=least(cap,(e->>'cap')::numeric);end if;
 return kizuna_private.v3_weights(p_min,coalesce(e->>'bonusModel','relative'),coalesce((e->>'bonus')::numeric,0),coalesce(f->>'model','relative'),bonus,cap);
end $$;

create or replace function kizuna_private.v3_buy(p_user uuid,p_payload jsonb,p_snapshot jsonb)
returns jsonb language plpgsql set search_path='' as $$
declare c kizuna_private.kizuna_v3_config;rank integer;item jsonb;cost bigint;
begin
 select * into strict c from kizuna_private.kizuna_v3_config where id;
 if not (c.live->'fortune'->>'enabled')::boolean then raise exception 'FORTUNE_DISABLED';end if;
 select coalesce(max(tier),0) into rank from kizuna_private.kizuna_fortune_purchases where user_id=p_user;
 if rank>=5 or (p_payload->>'tier')::integer is distinct from rank+1 then raise exception 'FORTUNE_TIER_CHANGED';end if;
 item:=c.live->'fortune'->'levels'->rank;cost:=(item->>'cost')::bigint;
 if cost is null or (p_payload->>'expectedCost')::bigint is distinct from cost or (p_payload->>'version')::integer is distinct from c.version then raise exception 'V3_CONFIG_CHANGED';end if;
 if (p_snapshot->>'chakra')::bigint<cost then raise exception 'INSUFFICIENT_CHAKRA';end if;
 insert into kizuna_private.kizuna_fortune_purchases(user_id,tier,cost,config_version) values(p_user,rank+1,cost,c.version);
 return jsonb_build_object('snapshot',jsonb_set(p_snapshot,'{chakra}',to_jsonb((p_snapshot->>'chakra')::bigint-cost)),'result',jsonb_build_object('fortuneTier',rank+1));
end $$;

create or replace function kizuna_private.kizuna_v3_admin(p_action text,p_payload jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();c kizuna_private.kizuna_v3_config;hash text;e jsonb;old_e jsonb;next_version integer;
begin
 if actor is null or not exists(select 1 from public.kizuna_admins where user_id=actor) then raise exception 'ADMIN_REQUIRED' using errcode='42501';end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>200000 then raise exception 'INVALID_INPUT';end if;
 perform pg_advisory_xact_lock(17493,700);
 if not exists(select 1 from public.kizuna_admins where user_id=actor) then raise exception 'ADMIN_REQUIRED' using errcode='42501';end if;
 select * into strict c from kizuna_private.kizuna_v3_config where id for update;
 if p_action='get' then return to_jsonb(c)-'id';end if;
 if (p_payload->>'revision')::integer is distinct from c.revision then raise exception 'REVISION_CONFLICT';end if;
 if p_action='save' then
  perform kizuna_private.v3_validate(p_payload->'config',false);
  update kizuna_private.kizuna_v3_config set draft=p_payload->'config',revision=revision+1,updated_by=actor,updated_at=now() where id returning * into c;
  return to_jsonb(c)-'id';
 end if;
 perform kizuna_private.v3_validate(c.draft,true);
 hash:=md5(c.draft::text||':'||c.version::text||':'||c.revision::text);
 if p_action='preview' then return jsonb_build_object('hash',hash,'revision',c.revision,'version',c.version,'config',c.draft,'purchasesPreserved',true);end if;
 if p_action<>'publish' or (p_payload->>'approved')::boolean is distinct from true or p_payload->>'hash' is distinct from hash then raise exception 'PREVIEW_REQUIRED';end if;
 -- Serialize with economy and record every approved version. Existing purchases are never rewritten.
 next_version:=c.version+1;
 insert into kizuna_private.kizuna_v3_versions(version,config,actor) values(next_version,c.draft,actor);
 for old_e in select value from jsonb_array_elements(c.live->'events') loop
  update public.kizuna_boosters set published=false,updated_at=now() where id=(old_e->>'id')::uuid;
 end loop;
 for e in select value from jsonb_array_elements(c.draft->'events') loop
  -- IDs may only refer to editions already owned by V3 or newly created editions.
  if exists(select 1 from public.kizuna_boosters where id=(e->>'id')::uuid) and not exists(select 1 from jsonb_array_elements(c.live->'events') x where x->>'id'=e->>'id') then raise exception 'V3_BOOSTER_ID_CONFLICT';end if;
  insert into public.kizuna_boosters(id,name,description,card_ids,published) values((e->>'id')::uuid,e->>'name',e->>'description',array(select jsonb_array_elements_text(e->'pool')),(e->>'enabled')::boolean)
  on conflict(id) do update set name=excluded.name,description=excluded.description,card_ids=excluded.card_ids,published=excluded.published,updated_at=now();
 end loop;
 update kizuna_private.kizuna_v3_config set live=draft,version=next_version,updated_by=actor,updated_at=now() where id returning * into c;
 return to_jsonb(c)-'id';
end $$;

create or replace function public.kizuna_v3_admin(p_action text,p_payload jsonb default '{}')
returns jsonb language sql security invoker set search_path='' as $$ select kizuna_private.kizuna_v3_admin(p_action,p_payload); $$;
revoke all on function public.kizuna_v3_admin(text,jsonb) from public,anon;
grant execute on function public.kizuna_v3_admin(text,jsonb) to authenticated;
-- Individual grants, never grant all functions in a shared schema.
revoke all on function kizuna_private.v3_weights(integer,text,numeric,text,numeric,numeric),kizuna_private.v3_validate(jsonb,boolean),kizuna_private.v3_event(text),kizuna_private.v3_draw_weights(uuid,text,integer),kizuna_private.v3_buy(uuid,jsonb,jsonb),kizuna_private.kizuna_v3_admin(text,jsonb) from public,anon,authenticated;
grant usage on schema kizuna_private to authenticated;
grant execute on function kizuna_private.kizuna_v3_admin(text,jsonb) to authenticated;
commit;

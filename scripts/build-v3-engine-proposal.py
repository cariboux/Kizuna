from pathlib import Path
import hashlib
root=Path(__file__).resolve().parent.parent
s=(root/'scripts/fixtures/economy-20261109.sql').read_text(encoding='utf-8')
# A SQL patch of the observed function preserves every unrelated branch and refuses drift.
replacements=[
 ("minlevel:=case when j=5 then 3 when j=4 then 2 else 1 end;","minlevel:=coalesce((v3_event_config->'minLevels'->>(j-1))::integer,case when j=5 then 3 when j=4 then 2 else 1 end);"),
 ("if n is null or n not in (1,5,10) then raise exception 'INVALID_QUANTITY';end if;", "if n is null or n not in (1,5,10) then raise exception 'INVALID_QUANTITY';end if;\n  if (select v3cfg.version from kizuna_private.kizuna_v3_config v3cfg where v3cfg.id)>0 and ((p_payload->>'quoteVersion')::integer is distinct from (select v3cfg.version from kizuna_private.kizuna_v3_config v3cfg where v3cfg.id) or (p_payload->'expectedPity'->>'pm')::integer is distinct from coalesce((st->>'pm')::integer,0) or (p_payload->'expectedPity'->>'pl')::integer is distinct from coalesce((st->>'pl')::integer,0)) then raise exception 'V3_CONFIG_CHANGED';end if;"),
 ('nexus_weekly boolean:=false;','nexus_weekly boolean:=false; v3_event_config jsonb; v3_uses_weekly boolean:=false; v3_missing jsonb; v3_cost bigint:=0;'),
 ("if p_action in ('nexus_buy'","if p_action='fortune_buy' then\n  reward:=kizuna_private.v3_buy(u,p_payload,s);s:=reward->'snapshot';result:=reward->'result';\n elsif p_action in ('nexus_buy'"),
 ("n:=(p_payload->>'count')::integer;selected:=p_payload->>'booster';","n:=(p_payload->>'count')::integer;selected:=p_payload->>'booster';\n  v3_event_config:=kizuna_private.v3_event(selected);\n  if v3_event_config is not null then\n   perform kizuna_private.v3_draw_weights(u,selected,1);\n   v3_uses_weekly:=v3_event_config->>'source'='nexus';\n   if v3_uses_weekly and coalesce((st->>'nexusWeekly')::bigint,0)<n then raise exception 'INSUFFICIENT_WEEKLY_PACKS';end if;\n   if v3_event_config->>'source'='chakra' then v3_cost:=(v3_event_config->>'price')::bigint*n;if (s->>'chakra')::bigint<v3_cost then raise exception 'INSUFFICIENT_CHAKRA';end if;end if;\n  end if;"),
 ("elsif free_n+inv<n then raise exception 'INSUFFICIENT_PACKS';end if;","elsif not v3_uses_weekly and coalesce(v3_event_config->>'source','stock')<>'chakra' and free_n+inv<n then raise exception 'INSUFFICIENT_PACKS';end if;"),
 ('total:=0;for tier in minlevel..6 loop','weights:=kizuna_private.v3_draw_weights(u,p_payload->>\'booster\',minlevel);\n    total:=0;for tier in minlevel..6 loop'),
 ('card:=choices->kizuna_private.econ_random(jsonb_array_length(choices));',"if coalesce((v3_event_config->>'collectionBonus')::numeric,0)>0 and kizuna_private.econ_random(1000000)<(v3_event_config->>'collectionBonus')::numeric*10000 then\n     select jsonb_agg(c) into v3_missing from jsonb_array_elements(choices) c where not exists(select 1 from jsonb_array_elements(s->'owned') o where o->>'id'=c->>'id');\n     if v3_missing is not null then choices:=v3_missing;end if;\n    end if;\n    card:=choices->kizuna_private.econ_random(jsonb_array_length(choices));"),
 ("if nexus_weekly then\n   st:=st||", "if nexus_weekly or v3_uses_weekly then\n   st:=st||"),
 ("else\n   st:=st||jsonb_build_object('free'", "elsif v3_event_config->>'source'='chakra' then\n   s:=jsonb_set(s,'{chakra}',to_jsonb((s->>'chakra')::bigint-v3_cost));st:=st||jsonb_build_object('pm',pm,'pl',pl);\n  else\n   st:=st||jsonb_build_object('free'")
]
for a,b in replacements: assert s.count(a)==1,a
digest=hashlib.md5(s.rstrip().encode()).hexdigest()
sql="""-- PROPOSAL ONLY. Apply only after explicit approval and 20261109_kizuna_v3.sql.
-- Disabled settings preserve the historical sampler. The existing receipt, lock,
-- pity, stock, Mythic resonance, Nexus progression and save paths are retained.
begin;
do $patch$
declare body text;
begin
 select replace(pg_get_functiondef('kizuna_private.kizuna_economy(text,jsonb,uuid)'::regprocedure),chr(13),'') into body;
"""
sql+=f" if md5(regexp_replace(body,'[[:space:]]+$','','g'))<>'{digest}' then raise exception 'V3_ENGINE_CHANGED_REAUDIT_REQUIRED';end if;\n"
for i,(a,b) in enumerate(replacements):
 sql+=f" if position(replace($old{i}${a}$old{i}$,chr(13),'') in body)=0 then raise exception 'V3_ENGINE_PATCH_{i}_MISSING';end if;\n"
 sql+=f" body:=replace(body,replace($old{i}${a}$old{i}$,chr(13),''),replace($new{i}${b}$new{i}$,chr(13),''));\n"
sql+=" execute body;\nend $patch$;\ncommit;\n"
(root/'supabase/proposals/20261109_kizuna_v3_engine.sql').write_text(sql,encoding='utf-8')

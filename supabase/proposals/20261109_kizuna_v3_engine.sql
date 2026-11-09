-- PROPOSAL ONLY. Apply only after explicit approval and 20261109_kizuna_v3.sql.
-- Disabled settings preserve the historical sampler. The existing receipt, lock,
-- pity, stock, Mythic resonance, Nexus progression and save paths are retained.
begin;
do $patch$
declare body text;
begin
 select replace(pg_get_functiondef('kizuna_private.kizuna_economy(text,jsonb,uuid)'::regprocedure),chr(13),'') into body;
 if md5(regexp_replace(body,'[[:space:]]+$','','g'))<>'828c25e17b0e1c1244c3879b60d65c77' then raise exception 'V3_ENGINE_CHANGED_REAUDIT_REQUIRED';end if;
 if position(replace($old0$minlevel:=case when j=5 then 3 when j=4 then 2 else 1 end;$old0$,chr(13),'') in body)=0 then raise exception 'V3_ENGINE_PATCH_0_MISSING';end if;
 body:=replace(body,replace($old0$minlevel:=case when j=5 then 3 when j=4 then 2 else 1 end;$old0$,chr(13),''),replace($new0$minlevel:=coalesce((v3_event_config->'minLevels'->>(j-1))::integer,case when j=5 then 3 when j=4 then 2 else 1 end);$new0$,chr(13),''));
 if position(replace($old1$if n is null or n not in (1,5,10) then raise exception 'INVALID_QUANTITY';end if;$old1$,chr(13),'') in body)=0 then raise exception 'V3_ENGINE_PATCH_1_MISSING';end if;
 body:=replace(body,replace($old1$if n is null or n not in (1,5,10) then raise exception 'INVALID_QUANTITY';end if;$old1$,chr(13),''),replace($new1$if n is null or n not in (1,5,10) then raise exception 'INVALID_QUANTITY';end if;
  if (select v3cfg.version from kizuna_private.kizuna_v3_config v3cfg where v3cfg.id)>0 and ((p_payload->>'quoteVersion')::integer is distinct from (select v3cfg.version from kizuna_private.kizuna_v3_config v3cfg where v3cfg.id) or (p_payload->'expectedPity'->>'pm')::integer is distinct from coalesce((st->>'pm')::integer,0) or (p_payload->'expectedPity'->>'pl')::integer is distinct from coalesce((st->>'pl')::integer,0)) then raise exception 'V3_CONFIG_CHANGED';end if;$new1$,chr(13),''));
 if position(replace($old2$nexus_weekly boolean:=false;$old2$,chr(13),'') in body)=0 then raise exception 'V3_ENGINE_PATCH_2_MISSING';end if;
 body:=replace(body,replace($old2$nexus_weekly boolean:=false;$old2$,chr(13),''),replace($new2$nexus_weekly boolean:=false; v3_event_config jsonb; v3_uses_weekly boolean:=false; v3_missing jsonb; v3_cost bigint:=0;$new2$,chr(13),''));
 if position(replace($old3$if p_action in ('nexus_buy'$old3$,chr(13),'') in body)=0 then raise exception 'V3_ENGINE_PATCH_3_MISSING';end if;
 body:=replace(body,replace($old3$if p_action in ('nexus_buy'$old3$,chr(13),''),replace($new3$if p_action='fortune_buy' then
  reward:=kizuna_private.v3_buy(u,p_payload,s);s:=reward->'snapshot';result:=reward->'result';
 elsif p_action in ('nexus_buy'$new3$,chr(13),''));
 if position(replace($old4$n:=(p_payload->>'count')::integer;selected:=p_payload->>'booster';$old4$,chr(13),'') in body)=0 then raise exception 'V3_ENGINE_PATCH_4_MISSING';end if;
 body:=replace(body,replace($old4$n:=(p_payload->>'count')::integer;selected:=p_payload->>'booster';$old4$,chr(13),''),replace($new4$n:=(p_payload->>'count')::integer;selected:=p_payload->>'booster';
  v3_event_config:=kizuna_private.v3_event(selected);
  if v3_event_config is not null then
   perform kizuna_private.v3_draw_weights(u,selected,1);
   v3_uses_weekly:=v3_event_config->>'source'='nexus';
   if v3_uses_weekly and coalesce((st->>'nexusWeekly')::bigint,0)<n then raise exception 'INSUFFICIENT_WEEKLY_PACKS';end if;
   if v3_event_config->>'source'='chakra' then v3_cost:=(v3_event_config->>'price')::bigint*n;if (s->>'chakra')::bigint<v3_cost then raise exception 'INSUFFICIENT_CHAKRA';end if;end if;
  end if;$new4$,chr(13),''));
 if position(replace($old5$elsif free_n+inv<n then raise exception 'INSUFFICIENT_PACKS';end if;$old5$,chr(13),'') in body)=0 then raise exception 'V3_ENGINE_PATCH_5_MISSING';end if;
 body:=replace(body,replace($old5$elsif free_n+inv<n then raise exception 'INSUFFICIENT_PACKS';end if;$old5$,chr(13),''),replace($new5$elsif not v3_uses_weekly and coalesce(v3_event_config->>'source','stock')<>'chakra' and free_n+inv<n then raise exception 'INSUFFICIENT_PACKS';end if;$new5$,chr(13),''));
 if position(replace($old6$total:=0;for tier in minlevel..6 loop$old6$,chr(13),'') in body)=0 then raise exception 'V3_ENGINE_PATCH_6_MISSING';end if;
 body:=replace(body,replace($old6$total:=0;for tier in minlevel..6 loop$old6$,chr(13),''),replace($new6$weights:=kizuna_private.v3_draw_weights(u,p_payload->>'booster',minlevel);
    total:=0;for tier in minlevel..6 loop$new6$,chr(13),''));
 if position(replace($old7$card:=choices->kizuna_private.econ_random(jsonb_array_length(choices));$old7$,chr(13),'') in body)=0 then raise exception 'V3_ENGINE_PATCH_7_MISSING';end if;
 body:=replace(body,replace($old7$card:=choices->kizuna_private.econ_random(jsonb_array_length(choices));$old7$,chr(13),''),replace($new7$if coalesce((v3_event_config->>'collectionBonus')::numeric,0)>0 and kizuna_private.econ_random(1000000)<(v3_event_config->>'collectionBonus')::numeric*10000 then
     select jsonb_agg(c) into v3_missing from jsonb_array_elements(choices) c where not exists(select 1 from jsonb_array_elements(s->'owned') o where o->>'id'=c->>'id');
     if v3_missing is not null then choices:=v3_missing;end if;
    end if;
    card:=choices->kizuna_private.econ_random(jsonb_array_length(choices));$new7$,chr(13),''));
 if position(replace($old8$if nexus_weekly then
   st:=st||$old8$,chr(13),'') in body)=0 then raise exception 'V3_ENGINE_PATCH_8_MISSING';end if;
 body:=replace(body,replace($old8$if nexus_weekly then
   st:=st||$old8$,chr(13),''),replace($new8$if nexus_weekly or v3_uses_weekly then
   st:=st||$new8$,chr(13),''));
 if position(replace($old9$else
   st:=st||jsonb_build_object('free'$old9$,chr(13),'') in body)=0 then raise exception 'V3_ENGINE_PATCH_9_MISSING';end if;
 body:=replace(body,replace($old9$else
   st:=st||jsonb_build_object('free'$old9$,chr(13),''),replace($new9$elsif v3_event_config->>'source'='chakra' then
   s:=jsonb_set(s,'{chakra}',to_jsonb((s->>'chakra')::bigint-v3_cost));st:=st||jsonb_build_object('pm',pm,'pl',pl);
  else
   st:=st||jsonb_build_object('free'$new9$,chr(13),''));
 execute body;
end $patch$;
commit;

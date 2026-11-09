-- PROPOSAL ONLY. Read-only quote uses the exact weight helper used by the existing draw engine.
begin;
create or replace function kizuna_private.kizuna_v3_read(p_action text,p_payload jsonb default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare c kizuna_private.kizuna_v3_config;u uuid:=auth.uid();rank integer;selected text:=p_payload->>'booster';
 pool jsonb;ids text[];snapshot jsonb;weights integer[];baseline integer[];base_total numeric;tot numeric;slots jsonb:='[]';slot jsonb;chance numeric;actual integer;
 mins integer[]:=array[1,1,1,2,3];names text[]:=array['Commun','Peu commune','Rare','Épique','Légendaire','Mythique'];
 j integer;tier integer;resolved integer;pm integer;pl integer;e jsonb;rankbonus numeric:=0;engine_ready boolean;fortune_applied boolean:=false;
begin
 select * into strict c from kizuna_private.kizuna_v3_config where id;
 engine_ready:=position('kizuna_private.v3_draw_weights' in pg_get_functiondef('kizuna_private.kizuna_economy(text,jsonb,uuid)'::regprocedure))>0;
 select coalesce(max(p.tier),0) into rank from kizuna_private.kizuna_fortune_purchases p where p.user_id=u;
 if p_action='state' then return jsonb_build_object('version',c.version,'engineReady',engine_ready,'fortune',c.live->'fortune','tier',rank,'events',c.live->'events');end if;
 if p_action<>'quote' or not engine_ready then raise exception 'V3_ENGINE_NOT_READY';end if;
 if selected='nexus:weekly' then selected:='staff:'||kizuna_private.nexus_weekly_definition()::text;end if;
 if selected like 'staff:%' then
  select card_ids into ids from public.kizuna_boosters where id::text=substr(selected,7) and (published or p_payload->>'booster'='nexus:weekly');
  if not found then raise exception 'BOOSTER_UNAVAILABLE';end if;
 elsif selected is null or selected not in ('mix','shonen','seinen','isekai','shojo','sport','mecha','waifus','husbandos') then raise exception 'BOOSTER_UNAVAILABLE';end if;
 select jsonb_agg(card) into pool from public.kizuna_cards where ids is null or id=any(ids);
 if coalesce(jsonb_array_length(pool),0)=0 then raise exception 'EMPTY_POOL';end if;
 select s.snapshot into snapshot from public.kizuna_player_states s where user_id=u;
 pm:=coalesce((snapshot->'stock'->>'pm')::integer,0);pl:=coalesce((snapshot->'stock'->>'pl')::integer,0);
 e:=kizuna_private.v3_event(p_payload->>'booster');
 if e is not null then select array_agg(value::text::integer order by idx) into mins from jsonb_array_elements(e->'minLevels') with ordinality as g(value,idx);end if;
 for j in 1..5 loop
  weights:=kizuna_private.v3_draw_weights(u,p_payload->>'booster',mins[j]);tot:=0;
  baseline:=kizuna_private.v3_draw_weights(null,p_payload->>'booster',mins[j]);base_total:=0;
  for tier in mins[j]..6 loop tot:=tot+weights[tier];end loop;
  for tier in mins[j]..6 loop base_total:=base_total+baseline[tier];end loop;
  fortune_applied:=fortune_applied or weights[6]/tot>baseline[6]/base_total;
  slot:='{}';
  for tier in mins[j]..6 loop
   resolved:=case when j=5 and pm+1>=250 then 6 when j=5 and pl+1>=50 then greatest(5,tier) else tier end;
   select coalesce(min(kizuna_private.econ_level(x->>'rarity')) filter(where kizuna_private.econ_level(x->>'rarity')>=resolved),max(kizuna_private.econ_level(x->>'rarity'))) into actual from jsonb_array_elements(pool) x;
   chance:=weights[tier]/tot;
   slot:=jsonb_set(slot,array[names[actual]],to_jsonb(coalesce((slot->>names[actual])::numeric,0)+chance));
  end loop;
  slots:=slots||jsonb_build_array(slot);
 end loop;
 e:=kizuna_private.v3_event(p_payload->>'booster');
 if fortune_applied then select coalesce(sum((value->>'bonus')::numeric),0) into rankbonus from jsonb_array_elements(c.live->'fortune'->'levels') with ordinality where ordinality<=rank;end if;
 return jsonb_build_object('version',c.version,'booster',p_payload->>'booster','slots',slots,'fortuneTier',rank,
  'fortuneEnabled',fortune_applied,'fortuneBonus',rankbonus,'fortuneModel',c.live->'fortune'->>'model','boosterBonus',coalesce(e->'bonus','0'::jsonb),'boosterModel',coalesce(e->>'bonusModel','relative'),
  'baseWeights',jsonb_build_array(600,230,125,42,2,1),'minimumLevels',to_jsonb(mins),
  'mythicRemaining',greatest(0,250-pm),'legendaryRemaining',greatest(0,50-pl),
  'source',coalesce(e->>'source','stock'),'price',e->'price','pity',jsonb_build_object('pm',pm,'pl',pl));
end $$;
create or replace function public.kizuna_v3_read(p_action text,p_payload jsonb default '{}')
returns jsonb language sql security invoker set search_path='' as $$ select kizuna_private.kizuna_v3_read(p_action,p_payload); $$;
revoke all on function kizuna_private.kizuna_v3_read(text,jsonb),public.kizuna_v3_read(text,jsonb) from public;
grant usage on schema kizuna_private to anon,authenticated;
grant execute on function kizuna_private.kizuna_v3_read(text,jsonb),public.kizuna_v3_read(text,jsonb) to anon,authenticated;
commit;

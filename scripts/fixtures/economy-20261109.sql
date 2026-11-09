CREATE OR REPLACE FUNCTION kizuna_private.kizuna_economy(p_action text, p_payload jsonb DEFAULT '{}'::jsonb, p_request_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
#variable_conflict use_variable
declare
 u uuid:=auth.uid(); profile_name text; s jsonb; before_s jsonb; st jsonb; rec kizuna_private.kizuna_economy_receipts;
 result jsonb:='{}'; nowms bigint:=floor(extract(epoch from now())*1000); n integer; free_n integer; inv integer; elapsed integer;
 i integer; j integer; minlevel integer; tier integer; actual integer; choice integer; weights integer[]:=array[600,230,125,42,2,1];
 names text[]:=array['Commun','Peu commune','Rare','Épique','Légendaire','Mythique']; total integer; card jsonb; picked jsonb:='[]'; pack jsonb;
 pool jsonb; choices jsonb; selected text; custom_ids text[]; pm integer; pl integer; due_m boolean; due_l boolean;
 id text; idx integer; amount bigint; fee bigint; copy jsonb; newowned jsonb; keep jsonb; seen text[]:='{}'; day text; reward jsonb;
 l kizuna_private.kizuna_market_listings; target uuid; wants text[]; hours integer; mode text; page integer; rows jsonb; q text; nexus_weekly boolean:=false;
begin
 if u is null then raise exception 'AUTH_REQUIRED' using errcode='42501';end if;
 select p.username into profile_name from public.kizuna_profiles p where p.id=u;
 if not found then raise exception 'PROFILE_REQUIRED' using errcode='42501';end if;
 if jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>32000 then raise exception 'INVALID_INPUT';end if;
 -- One bounded economic transaction at a time avoids cross-account lock inversion.
 perform pg_advisory_xact_lock(17493,700);
 insert into public.kizuna_player_states(user_id,snapshot) values(u,jsonb_build_object('owned','[]'::jsonb,'pulls','[]'::jsonb,'catalogue','[]'::jsonb,'chakra',500,'username',profile_name,
  'stock',jsonb_build_object('free',3,'t',nowms,'inv',2,'pm',0,'pl',0,'day',''),'market',jsonb_build_object('listings','[]'::jsonb,'history','[]'::jsonb,'cards','[]'::jsonb,'credits','{}'::jsonb,'wishlist','[]'::jsonb))) on conflict do nothing;
 perform kizuna_private.econ_settle();
 select snapshot into strict s from public.kizuna_player_states where user_id=u for update;
 before_s:=s;
 s:=jsonb_set(s,'{username}',to_jsonb(profile_name));
 if p_action not in ('get','browse','history') then
  if p_request_id is null then raise exception 'REQUEST_ID_REQUIRED';end if;
  select * into rec from kizuna_private.kizuna_economy_receipts where user_id=u and request_id=p_request_id;
  if found then
   if rec.action<>p_action or rec.payload<>p_payload then raise exception 'REQUEST_REUSED';end if;
   return kizuna_private.econ_snapshot(u)||jsonb_build_object('result',rec.result||jsonb_build_object('nexus',kizuna_private.nexus_snapshot(u)),'replayed',true);
  end if;
 end if;
 st:=kizuna_private.nexus_refresh_stock(u,s->'stock',nowms);
 free_n:=(st->>'free')::integer;inv:=coalesce((st->>'inv')::integer,2);
 s:=jsonb_set(s,'{stock}',st);
 if p_action in ('nexus_buy','nexus_daily','nexus_preferences','nexus_reward','nexus_cosmetic') then
  reward:=kizuna_private.nexus_mutate(u,p_action,p_payload,s);s:=reward->'snapshot';result:=reward->'result';
 elsif p_action='get' then null;
 elsif p_action='open' then
  n:=(p_payload->>'count')::integer;selected:=p_payload->>'booster';
  if n is null or n not in (1,5,10) then raise exception 'INVALID_QUANTITY';end if;
  nexus_weekly:=coalesce(selected='nexus:weekly',false);
  if nexus_weekly then
   if coalesce((st->>'nexusWeekly')::bigint,0)<n then raise exception 'INSUFFICIENT_WEEKLY_PACKS';end if;
   selected:='staff:'||kizuna_private.nexus_weekly_definition()::text;
  elsif free_n+inv<n then raise exception 'INSUFFICIENT_PACKS';end if;
  if jsonb_array_length(s->'owned')+n*5>5000 then raise exception 'INVENTORY_FULL';end if;
  if selected like 'staff:%' then
   if not nexus_weekly and substr(selected,7)=(select cfg.weekly_booster_id::text from kizuna_private.kizuna_nexus_config cfg where cfg.id) then raise exception 'NEXUS_WEEKLY_REQUIRED';end if;
   select b.card_ids into custom_ids from public.kizuna_boosters b where b.id::text=substr(selected,7) and (published or (nexus_weekly and b.id=(select cfg.weekly_booster_id from kizuna_private.kizuna_nexus_config cfg where cfg.id and cfg.weekly_enabled)));
   if not found then raise exception 'BOOSTER_UNAVAILABLE';end if;
  elsif selected is null or selected not in ('mix','shonen','isekai','seinen','shojo','sport','mecha','waifus','husbandos') then raise exception 'BOOSTER_UNAVAILABLE';end if;
  select jsonb_agg(c.card||jsonb_build_object('id',c.id)) into pool from public.kizuna_cards c where custom_ids is null or c.id=any(custom_ids);
  if coalesce(jsonb_array_length(pool),0)=0 then raise exception 'EMPTY_POOL';end if;
  pm:=coalesce((st->>'pm')::integer,0);pl:=coalesce((st->>'pl')::integer,0);
  for i in 1..n loop
   pm:=pm+1;pl:=pl+1;due_m:=pm>=250;due_l:=pl>=50;pack:='[]';
   for j in 1..5 loop
    minlevel:=case when j=5 then 3 when j=4 then 2 else 1 end;
    total:=0;for tier in minlevel..6 loop total:=total+weights[tier];end loop;
    choice:=kizuna_private.econ_random(total);tier:=minlevel;
    while choice>=weights[tier] loop choice:=choice-weights[tier];tier:=tier+1;end loop;
    if j=5 and due_m then tier:=6;elsif j=5 and due_l then tier:=greatest(5,tier);end if;
    select coalesce(min(kizuna_private.econ_level(x->>'rarity')) filter(where kizuna_private.econ_level(x->>'rarity')>=tier),max(kizuna_private.econ_level(x->>'rarity'))) into actual from jsonb_array_elements(pool) x;
    select jsonb_agg(x) into choices from jsonb_array_elements(pool) x where kizuna_private.econ_level(x->>'rarity')=actual and
     (custom_ids is not null or selected='mix' or (selected='waifus' and x->>'g'='F') or (selected='husbandos' and x->>'g'='M') or coalesce(x->'cats','[]') ? selected);
    if choices is null then select jsonb_agg(x) into choices from jsonb_array_elements(pool) x where kizuna_private.econ_level(x->>'rarity')=actual;end if;
    card:=choices->kizuna_private.econ_random(jsonb_array_length(choices));
    copy:=jsonb_build_object('id',card->>'id','at',nowms,'rarity',names[actual],'level',actual);
    pack:=pack||jsonb_build_array(copy);s:=jsonb_set(s,'{owned}',(s->'owned')||jsonb_build_array(copy));
    if actual>=5 then s:=jsonb_set(s,'{pulls}',jsonb_build_array(copy||jsonb_build_object('name',card->>'name','series',card->>'series','username',profile_name,'pullId',gen_random_uuid()))||(s->'pulls'));end if;
   end loop;
   if exists(select 1 from jsonb_array_elements(pack) x where (x->>'level')::integer=6) then pm:=0;end if;
   if exists(select 1 from jsonb_array_elements(pack) x where (x->>'level')::integer>=5) then pl:=0;end if;
   picked:=picked||pack;
  end loop;
  if nexus_weekly then
   st:=st||jsonb_build_object('nexusWeekly',(st->>'nexusWeekly')::bigint-n,'pm',pm,'pl',pl);
  else
   st:=st||jsonb_build_object('free',greatest(0,free_n-n),'inv',inv-greatest(0,n-free_n),'pm',pm,'pl',pl);
  end if;
  s:=jsonb_set(s,'{stock}',st);select coalesce(jsonb_agg(x),'[]') into keep from (select value x from jsonb_array_elements(s->'pulls') with ordinality order by ordinality limit 30) z;
  s:=jsonb_set(s,'{pulls}',keep);result:=jsonb_build_object('cards',picked,'packs',n,'booster',p_payload->>'booster');
 elsif p_action='daily' then
  day:=to_char(now() at time zone 'UTC','YYYY-MM-DD');
  if st->>'day'=day or st->>'day'=to_char(now() at time zone 'UTC','Dy Mon DD YYYY') then raise exception 'DAILY_CLAIMED';end if;
  s:=jsonb_set(s,'{stock}',st||jsonb_build_object('inv',inv+3,'day',day));result:='{"rolls":3}';
 elsif p_action='shop' then
  n:=(p_payload->>'count')::integer;
  amount:=case n when 1 then 100 when 5 then 450 when 10 then 850 else null end;
  if amount is null then raise exception 'INVALID_QUANTITY';end if;
  if (s->>'chakra')::bigint<amount then raise exception 'INSUFFICIENT_CHAKRA';end if;
  s:=jsonb_set(jsonb_set(s,'{chakra}',to_jsonb((s->>'chakra')::bigint-amount)),'{stock}',st||jsonb_build_object('inv',inv+n));
 elsif p_action in ('recycle','recycle_all') then
  if (p_payload->>'revision')::bigint is distinct from (select revision from public.kizuna_player_states where user_id=u) then raise exception 'STATE_CONFLICT';end if;
  amount:=0;newowned:='[]';
  if p_action='recycle' then
   id:=p_payload->>'cardId';select max(ordinality)::integer-1 into idx from jsonb_array_elements(s->'owned') with ordinality where value->>'id'=id;
   if idx is null then raise exception 'CARD_UNAVAILABLE';end if;
   select kizuna_private.econ_value(c.card->>'rarity') into amount from public.kizuna_cards c where c.id=id;
   newowned:=(s->'owned')-idx;
  else
   for copy in select value from jsonb_array_elements(s->'owned') loop
    if copy->>'id'=any(seen) then
     select kizuna_private.econ_value(c.card->>'rarity') into n from public.kizuna_cards c where c.id=copy->>'id';
     if n is null then raise exception 'UNKNOWN_CARD';end if;amount:=amount+n;
    else seen:=array_append(seen,copy->>'id');newowned:=newowned||jsonb_build_array(copy);end if;
   end loop;
  end if;
  if amount is null then raise exception 'UNKNOWN_CARD';end if;
  reward:=kizuna_private.nexus_recycle(u,p_action,p_payload,s,amount);amount:=(reward->>'total')::bigint;
  s:=jsonb_set(jsonb_set(s,'{owned}',newowned),'{chakra}',to_jsonb((s->>'chakra')::bigint+amount));result:=reward||jsonb_build_object('chakra',amount);
 elsif p_action='preferences' then
  select coalesce(jsonb_agg(to_jsonb(z.id)),'[]') into keep from (select distinct value#>>'{}' id from jsonb_array_elements(coalesce(p_payload->'wishlist','[]')) where exists(select 1 from public.kizuna_cards c where c.id=value#>>'{}') limit 5000) z;
  s:=jsonb_set(s,'{market}',coalesce(s->'market','{}')||jsonb_build_object('wishlist',keep));
 elsif p_action='claim_rewards' then
  perform kizuna_private.econ_write(u,s,'refresh_before_rewards');
  select revision into n from public.kizuna_player_states where user_id=u;
  reward:=private.kizuna_staff_dispatch(u,'claim_rewards',jsonb_build_object('expectedRevision',n));
  select snapshot into s from public.kizuna_player_states where user_id=u;before_s:=s;
  result:=jsonb_build_object('rolls',coalesce(reward->'rolls','0'),'chakra',coalesce(reward->'chakra','0'));
 elsif p_action='publish' then
  if (select count(*) from kizuna_private.kizuna_market_listings where seller_id=u and status='active')>=50 then raise exception 'LISTING_LIMIT';end if;
  id:=p_payload->>'cardId';mode:=p_payload->>'mode';hours:=(p_payload->>'hours')::integer;
  if mode is null or mode not in ('sale','auction','trade') or hours is null or hours not in (12,24,48) then raise exception 'INVALID_INPUT';end if;
  select max(ordinality)::integer-1 into idx from jsonb_array_elements(s->'owned') with ordinality where value->>'id'=id;
  if idx is null then raise exception 'CARD_UNAVAILABLE';end if;
  select kizuna_private.econ_value(c.card->>'rarity') into n from public.kizuna_cards c where c.id=id;
  if n is null then raise exception 'UNKNOWN_CARD';end if;
  amount:=coalesce((p_payload->>'price')::bigint,0);fee:=0;wants:='{}';
  if mode='trade' then
   select array_agg(distinct value) into wants from jsonb_array_elements_text(p_payload->'wants');
   if cardinality(wants) is null or cardinality(wants) not between 1 and 5 or id=any(wants) or exists(select 1 from unnest(wants) x where not exists(select 1 from public.kizuna_cards c where c.id=x)) then raise exception 'INVALID_WANTS';end if;amount:=0;
  else
   if amount not between n and 100000000 then raise exception 'INVALID_PRICE';end if;
   fee:=greatest(1,ceil(amount*.02)::bigint);
   if (s->>'chakra')::bigint<fee then raise exception 'INSUFFICIENT_CHAKRA';end if;
  end if;
  insert into kizuna_private.kizuna_market_listings(seller_id,card_id,copy,mode,price,wants,deposit,ends_at,buy_now)
   values(u,id,s->'owned'->idx,mode,amount,wants,fee,case when mode='trade' then null else now()+make_interval(hours=>hours) end,case when mode='auction' then least(100000000,amount+100) else 0 end) returning * into l;
  s:=jsonb_set(jsonb_set(s,'{owned}',(s->'owned')-idx),'{chakra}',to_jsonb((s->>'chakra')::bigint-fee));result:=jsonb_build_object('listingId',l.id);
 elsif p_action in ('cancel','buy','bid','trade') then
  select m.* into l from kizuna_private.kizuna_market_listings m where m.id=(p_payload->>'id')::uuid for update;
  if not found or l.status<>'active' or (l.ends_at is not null and l.ends_at<=now()) then raise exception 'LISTING_UNAVAILABLE';end if;
  if p_action='cancel' then
   if l.seller_id<>u then raise exception 'NOT_OWNER' using errcode='42501';end if;
   if l.bidder_id is not null then raise exception 'BID_EXISTS';end if;
   s:=jsonb_set(s,'{owned}',(s->'owned')||jsonb_build_array(l.copy));
   update kizuna_private.kizuna_market_listings set status='cancelled',completed_at=now() where kizuna_private.kizuna_market_listings.id=l.id;
  else
   if l.seller_id=u then raise exception 'SELF_TRADE';end if;
   if p_action='bid' then
    if l.mode<>'auction' then raise exception 'INVALID_MODE';end if;
    amount:=(p_payload->>'amount')::bigint;
    if amount is null or amount<greatest(l.price,l.top_bid+1) or amount>100000000 then raise exception 'INVALID_BID';end if;
    fee:=case when l.bidder_id=u then l.top_bid else 0 end;
    if (s->>'chakra')::bigint+fee<amount then raise exception 'INSUFFICIENT_CHAKRA';end if;
    if l.bidder_id is not null and l.bidder_id<>u then perform kizuna_private.econ_deliver(l.bidder_id,null,l.top_bid,'outbid_refund');end if;
    s:=jsonb_set(s,'{chakra}',to_jsonb((s->>'chakra')::bigint+fee-amount));
    update kizuna_private.kizuna_market_listings set bidder_id=u,top_bid=amount,ends_at=greatest(ends_at,now()+interval '2 minutes') where kizuna_private.kizuna_market_listings.id=l.id;
   elsif p_action='buy' then
    if l.mode not in ('sale','auction') then raise exception 'INVALID_MODE';end if;
    amount:=case when l.mode='auction' then l.buy_now else l.price end;
    fee:=case when l.bidder_id=u then l.top_bid else 0 end;
    if (s->>'chakra')::bigint+fee<amount then raise exception 'INSUFFICIENT_CHAKRA';end if;
    if l.bidder_id is not null and l.bidder_id<>u then perform kizuna_private.econ_deliver(l.bidder_id,null,l.top_bid,'buy_now_refund');end if;
    s:=jsonb_set(jsonb_set(s,'{chakra}',to_jsonb((s->>'chakra')::bigint+fee-amount)),'{owned}',(s->'owned')||jsonb_build_array(l.copy));
    update kizuna_private.kizuna_market_listings set status='sold',buyer_id=u,completed_at=now(),top_bid=case when l.mode='auction' then amount else l.top_bid end where kizuna_private.kizuna_market_listings.id=l.id;
    perform kizuna_private.econ_deliver(l.seller_id,null,amount-greatest(1,ceil(amount*.05)::bigint),'sale');
   else
    if l.mode<>'trade' then raise exception 'INVALID_MODE';end if;
    id:=p_payload->>'cardId';if not(id=any(l.wants)) then raise exception 'INVALID_WANTS';end if;
    select max(ordinality)::integer-1 into idx from jsonb_array_elements(s->'owned') with ordinality where value->>'id'=id;
    if idx is null then raise exception 'CARD_UNAVAILABLE';end if;
    copy:=s->'owned'->idx;s:=jsonb_set(s,'{owned}',((s->'owned')-idx)||jsonb_build_array(l.copy));
    update kizuna_private.kizuna_market_listings set status='traded',buyer_id=u,completed_at=now() where kizuna_private.kizuna_market_listings.id=l.id;
    perform kizuna_private.econ_deliver(l.seller_id,copy,0,'trade_card');
   end if;
  end if;
 elsif p_action='browse' then
  page:=coalesce((p_payload->>'page')::integer,0);q:=coalesce(p_payload->>'q','');mode:=coalesce(p_payload->>'mode','all');
  if page not between 0 and 10000 or length(q)>100 then raise exception 'INVALID_INPUT';end if;
  select coalesce(jsonb_agg(z.row order by z.dt desc,z.id),'[]') into rows from (
   select kizuna_private.econ_listing(m) row,m.created_at dt,m.id from kizuna_private.kizuna_market_listings m join public.kizuna_cards c on c.id=m.card_id
   where m.status='active' and (mode='mine' or m.ends_at is null or m.ends_at>now()) and (mode='all' or m.mode=mode or (mode='mine' and m.seller_id=u))
    and (q='' or position(lower(q) in lower((c.card->>'name')||' '||(c.card->>'series')))>0)
   order by m.created_at desc,m.id offset page*24 limit 25
  ) z;result:=jsonb_build_object('listings',rows,'page',page);
 elsif p_action='history' then
  id:=p_payload->>'cardId';
  select coalesce(jsonb_agg(z.row order by z.at desc),'[]') into rows from (
   select jsonb_build_object('at',floor(extract(epoch from m.completed_at)*1000),'gross',case when m.mode='auction' then m.top_bid else m.price end) row,m.completed_at at
   from kizuna_private.kizuna_market_listings m where m.card_id=id and m.status='sold' and m.completed_at>=now()-interval '30 days' order by m.completed_at desc limit 1000
  ) z;result:=jsonb_build_object('sales',rows);
 else raise exception 'UNKNOWN_ACTION';end if;
 if s is distinct from before_s then perform kizuna_private.econ_write(u,s,p_action);end if;
 if p_action='open' then result:=result||jsonb_build_object('resonance',kizuna_private.mythic_record_open(u,p_request_id,before_s,result->'cards',(result->>'packs')::integer));end if;
 result:=result||jsonb_build_object('nexus',kizuna_private.nexus_snapshot(u));
 if p_action not in ('get','browse','history') then insert into kizuna_private.kizuna_economy_receipts(user_id,request_id,action,payload,result) values(u,p_request_id,p_action,p_payload,result);end if;
 return kizuna_private.econ_snapshot(u)||jsonb_build_object('result',result);
end; $function$


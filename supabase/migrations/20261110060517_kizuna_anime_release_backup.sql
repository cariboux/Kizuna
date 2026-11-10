-- Release preflight: apply this before the owner-approved anime import.
-- Only the catalogue objects changed by that import are copied; this is not
-- a full-project backup and contains no player snapshots or credentials.
begin;
create table if not exists private.kizuna_anime_release_backup (
  release_id text primary key,
  captured_at timestamptz not null default now(),
  snapshot jsonb not null,
  old_rebalance text not null
);
alter table private.kizuna_anime_release_backup enable row level security;
revoke all on private.kizuna_anime_release_backup from public,anon,authenticated;
create table if not exists private.kizuna_anime_release_parts (
  release_id text not null,
  part integer not null,
  payload_text text not null,
  primary key(release_id,part),
  check(jsonb_typeof(payload_text::jsonb)='object')
);
alter table private.kizuna_anime_release_parts enable row level security;
revoke all on private.kizuna_anime_release_parts from public,anon,authenticated;
insert into private.kizuna_anime_release_backup(release_id,snapshot,old_rebalance)
select 'anime-expansion-v1',jsonb_build_object(
  'cards',(select coalesce(jsonb_agg(to_jsonb(c) order by c.id),'[]') from public.kizuna_cards c),
  'albums',(select coalesce(jsonb_agg(to_jsonb(a) order by a.id),'[]') from public.kizuna_albums a),
  'members',(select coalesce(jsonb_agg(to_jsonb(a) order by a.album_id,a.card_id),'[]') from public.kizuna_album_cards a),
  'forms',(select coalesce(jsonb_agg(to_jsonb(f) order by f.card_id),'[]') from public.kizuna_mythic_forms f)
),pg_get_functiondef('private.kizuna_rebalance_album_mythics()'::regprocedure)
on conflict(release_id) do nothing;
commit;

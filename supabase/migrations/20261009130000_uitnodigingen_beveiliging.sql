-- Beveiliging van gezinsuitnodigingen en lidmaatschap
-- Idempotent: veilig om opnieuw te draaien in de Supabase SQL Editor.
--
-- Regels (aan te passen waar 'INSTELLING' staat):
--   * Een code is 8 hex-tekens (0-9, A-F) en 7 dagen geldig.
--   * Een code mag door meerdere mensen worden gebruikt, zonder limiet.
--   * Er is één actieve code per gezin: een nieuwe code maken trekt de vorige in.
--   * Rate limit: maximaal 3 mislukte pogingen per gebruiker per 15 minuten.
--   * Code genereren en vervaldatum bepalen gebeurt alleen in de database,
--     niet meer door de client.
--   * Lidmaatschap en uitnodigingen kunnen alleen via de functies hieronder
--     worden gewijzigd, nooit direct via de API.
--   * Alleen de eigenaar kan een code intrekken of een lid verwijderen.

-- ---------------------------------------------------------------------------
-- 1. Mislukte pogingen (voor de rate limit)
-- ---------------------------------------------------------------------------
create table if not exists public.uitnodiging_pogingen (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  gepoogd_op timestamptz not null default now()
);

create index if not exists uitnodiging_pogingen_user_tijd
  on public.uitnodiging_pogingen (user_id, gepoogd_op desc);

alter table public.uitnodiging_pogingen enable row level security;
-- Geen policies en geen rechten: alleen de functies hieronder (security definer) komen erbij.
revoke all on table public.uitnodiging_pogingen from public;
revoke all on table public.uitnodiging_pogingen from anon;
revoke all on table public.uitnodiging_pogingen from authenticated;

-- ---------------------------------------------------------------------------
-- 2. Oude functies vervangen (andere argumenten / ander returntype)
-- ---------------------------------------------------------------------------
drop function if exists public.create_family_with_invite(text, text, timestamptz);
drop function if exists public.join_family_with_code(text);

-- ---------------------------------------------------------------------------
-- 3. Code genereren (intern, niet aanroepbaar via de API)
--    8 hex-tekens uit een cryptografisch willekeurige UUID. Controleert dat de
--    code niet al actief is bij een ander gezin.
-- ---------------------------------------------------------------------------
create or replace function public.genereer_uitnodigingscode()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  kandidaat text;
  poging int := 0;
begin
  loop
    kandidaat := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (
      select 1 from public.gezin_uitnodigingen
      where code = kandidaat and vervalt_op > now()
    );
    poging := poging + 1;
    if poging > 10 then raise exception 'code_generatie_mislukt'; end if;
  end loop;
  return kandidaat;
end;
$$;

revoke all on function public.genereer_uitnodigingscode() from public;
revoke all on function public.genereer_uitnodigingscode() from anon;
revoke all on function public.genereer_uitnodigingscode() from authenticated;

-- ---------------------------------------------------------------------------
-- 4. Gezin aanmaken (met eerste uitnodiging)
-- ---------------------------------------------------------------------------
create or replace function public.create_family_with_invite(family_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  naam text := btrim(family_name);
  nieuw_gezin text;
  nieuwe_code text;
  vervalt timestamptz := now() + interval '7 days'; -- INSTELLING: geldigheid
begin
  if actor is null then raise exception 'not_authenticated'; end if;
  if naam is null or char_length(naam) < 2 then raise exception 'family_name_too_short'; end if;
  if char_length(naam) > 60 then raise exception 'family_name_too_long'; end if;
  if exists (select 1 from public.gezin_leden where user_id = actor) then raise exception 'already_in_family'; end if;

  insert into public.gezinnen (naam) values (naam) returning id into nieuw_gezin;
  insert into public.gezin_leden (gezin_id, user_id, rol) values (nieuw_gezin, actor, 'eigenaar');

  nieuwe_code := public.genereer_uitnodigingscode();
  insert into public.gezin_uitnodigingen (gezin_id, code, aangemaakt_door, vervalt_op)
    values (nieuw_gezin, nieuwe_code, actor, vervalt);

  return jsonb_build_object('gezin_id', nieuw_gezin, 'code', nieuwe_code, 'vervalt_op', vervalt);
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Deelnemen met een code (met rate limit)
--    Geeft altijd een jsonb terug in plaats van een exception te gooien bij een
--    foute code: een exception draait de transactie terug en dan zou de
--    mislukte poging niet worden onthouden.
-- ---------------------------------------------------------------------------
create or replace function public.join_family_with_code(invite_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  genormaliseerd text := upper(btrim(coalesce(invite_code, '')));
  max_pogingen int := 3;                        -- INSTELLING: toegestane mislukte pogingen
  venster interval := interval '15 minutes';    -- INSTELLING: periode waarin pogingen tellen
  uitnodiging public.gezin_uitnodigingen%rowtype;
  mislukt int;
  oudste timestamptz;
  wacht int;
begin
  if actor is null then raise exception 'not_authenticated'; end if;
  if exists (select 1 from public.gezin_leden where user_id = actor) then raise exception 'already_in_family'; end if;

  -- Per gebruiker één poging tegelijk, zodat parallelle verzoeken de limiet niet omzeilen.
  perform pg_advisory_xact_lock(hashtextextended(actor::text, 0));

  delete from public.uitnodiging_pogingen where gepoogd_op < now() - interval '1 day';

  select count(*), min(gepoogd_op) into mislukt, oudste
  from public.uitnodiging_pogingen
  where user_id = actor and gepoogd_op > now() - venster;

  if mislukt >= max_pogingen then
    wacht := greatest(1, ceil(extract(epoch from (oudste + venster - now())))::int);
    return jsonb_build_object('ok', false, 'fout', 'too_many_attempts', 'wachttijd_seconden', wacht);
  end if;

  -- Een code die niet eens het juiste formaat heeft kan nooit kloppen: niet als poging tellen.
  if genormaliseerd !~ '^[0-9A-F]{8}$' then
    return jsonb_build_object('ok', false, 'fout', 'invalid_or_expired_code');
  end if;

  select * into uitnodiging
  from public.gezin_uitnodigingen
  where code = genormaliseerd and vervalt_op > now()
  order by aangemaakt_op desc
  limit 1;

  if not found then
    insert into public.uitnodiging_pogingen (user_id) values (actor);
    mislukt := mislukt + 1;
    if mislukt >= max_pogingen then
      return jsonb_build_object(
        'ok', false, 'fout', 'invalid_or_expired_code', 'pogingen_over', 0,
        'wachttijd_seconden', ceil(extract(epoch from venster))::int
      );
    end if;
    return jsonb_build_object(
      'ok', false, 'fout', 'invalid_or_expired_code', 'pogingen_over', max_pogingen - mislukt
    );
  end if;

  insert into public.gezin_leden (gezin_id, user_id, rol)
    values (uitnodiging.gezin_id, actor, 'lid')
    on conflict do nothing;

  -- De code blijft geldig voor anderen (onbeperkt gebruik binnen de geldigheidsduur).
  delete from public.uitnodiging_pogingen where user_id = actor;

  return jsonb_build_object('ok', true, 'gezin_id', uitnodiging.gezin_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Nieuwe uitnodiging maken (elk lid mag); vorige actieve codes worden ingetrokken
-- ---------------------------------------------------------------------------
create or replace function public.maak_uitnodiging()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  mijn_gezin text;
  nieuwe_code text;
  vervalt timestamptz := now() + interval '7 days'; -- INSTELLING: geldigheid
begin
  if actor is null then raise exception 'not_authenticated'; end if;

  select gl.gezin_id into mijn_gezin
  from public.gezin_leden gl where gl.user_id = actor
  order by gl.aangemaakt_op limit 1;
  if mijn_gezin is null then raise exception 'not_in_family'; end if;

  update public.gezin_uitnodigingen set vervalt_op = now()
    where gezin_id = mijn_gezin and vervalt_op > now();

  nieuwe_code := public.genereer_uitnodigingscode();
  insert into public.gezin_uitnodigingen (gezin_id, code, aangemaakt_door, vervalt_op)
    values (mijn_gezin, nieuwe_code, actor, vervalt);

  return jsonb_build_object('code', nieuwe_code, 'vervalt_op', vervalt);
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Code intrekken (alleen eigenaar)
-- ---------------------------------------------------------------------------
create or replace function public.trek_uitnodiging_in()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  mijn_gezin text;
  mijn_rol text;
begin
  if actor is null then raise exception 'not_authenticated'; end if;

  select gl.gezin_id, gl.rol into mijn_gezin, mijn_rol
  from public.gezin_leden gl where gl.user_id = actor
  order by gl.aangemaakt_op limit 1;
  if mijn_gezin is null then raise exception 'not_in_family'; end if;
  if mijn_rol <> 'eigenaar' then raise exception 'not_owner'; end if;

  update public.gezin_uitnodigingen set vervalt_op = now()
    where gezin_id = mijn_gezin and vervalt_op > now();
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Gezinslid verwijderen (alleen eigenaar; de registraties blijven bij het gezin)
-- ---------------------------------------------------------------------------
create or replace function public.verwijder_gezinslid(doel_gebruiker uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  mijn_gezin text;
  mijn_rol text;
begin
  if actor is null then raise exception 'not_authenticated'; end if;

  select gl.gezin_id, gl.rol into mijn_gezin, mijn_rol
  from public.gezin_leden gl where gl.user_id = actor
  order by gl.aangemaakt_op limit 1;
  if mijn_gezin is null then raise exception 'not_in_family'; end if;
  if mijn_rol <> 'eigenaar' then raise exception 'not_owner'; end if;
  if doel_gebruiker = actor then raise exception 'cannot_remove_self'; end if;

  delete from public.gezin_leden
    where gezin_id = mijn_gezin and user_id = doel_gebruiker;
  if not found then raise exception 'not_a_member'; end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 9. Rechten op de functies: alleen ingelogde gebruikers
-- ---------------------------------------------------------------------------
revoke all on function public.create_family_with_invite(text) from public;
revoke all on function public.create_family_with_invite(text) from anon;
grant execute on function public.create_family_with_invite(text) to authenticated;

revoke all on function public.join_family_with_code(text) from public;
revoke all on function public.join_family_with_code(text) from anon;
grant execute on function public.join_family_with_code(text) to authenticated;

revoke all on function public.maak_uitnodiging() from public;
revoke all on function public.maak_uitnodiging() from anon;
grant execute on function public.maak_uitnodiging() to authenticated;

revoke all on function public.trek_uitnodiging_in() from public;
revoke all on function public.trek_uitnodiging_in() from anon;
grant execute on function public.trek_uitnodiging_in() to authenticated;

revoke all on function public.verwijder_gezinslid(uuid) from public;
revoke all on function public.verwijder_gezinslid(uuid) from anon;
grant execute on function public.verwijder_gezinslid(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 10. Direct schrijven op de gezinstabellen dicht
--     De app leest deze tabellen alleen; alle wijzigingen lopen via de functies
--     hierboven en in 20261009120000_account_beheer.sql. Hierdoor kan niemand
--     zichzelf via de API aan een gezin toevoegen, een eigen code of vervaldatum
--     invoeren of zichzelf eigenaar maken, wat de RLS-policies ook toestaan.
--     (De functies draaien als eigenaar en worden hierdoor niet geraakt.)
-- ---------------------------------------------------------------------------
revoke all on table public.gezinnen from anon;
revoke all on table public.gezin_leden from anon;
revoke all on table public.gezin_uitnodigingen from anon;

revoke insert, update, delete, truncate, references, trigger
  on table public.gezinnen from authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.gezin_leden from authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.gezin_uitnodigingen from authenticated;

-- ---------------------------------------------------------------------------
-- 11. Bestaande actieve codes: maximaal 7 dagen geldig
-- ---------------------------------------------------------------------------
update public.gezin_uitnodigingen
  set vervalt_op = now() + interval '7 days'
  where vervalt_op > now() + interval '7 days';

notify pgrst, 'reload schema';

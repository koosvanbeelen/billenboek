-- Verharding op basis van de schema-controle van 10 okt 2026
-- Idempotent: veilig om opnieuw te draaien in de Supabase SQL Editor.
--
--  1. Rechten op tabellen: `anon` heeft nergens iets te zoeken; `authenticated` hoeft
--     niet te kunnen TRUNCATE-n of triggers/references aan te maken.
--  2. Rechten op functies: `handle_new_user` en `is_gezin_lid` waren voor `anon` uitvoerbaar.
--  3. Codegenerator rekent nu ook met verlopen codes (er staat een globale UNIQUE op `code`).
--  4. Indexen op `gezin_id` (elke query filtert daarop).
--  5. Twee dode policies op gezin_uitnodigingen opruimen (de rechten zijn al weg).
--  6. Controle op rol-waarden in gezin_leden.

-- ---------------------------------------------------------------------------
-- 1. Tabelrechten
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;

-- Voor tabellen en functies die later worden aangemaakt: geen automatische rechten voor anon.
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke all on functions from anon;

-- ---------------------------------------------------------------------------
-- 2. Functierechten
--    Supabase geeft nieuwe functies standaard rechten aan anon en authenticated, los van
--    PUBLIC; `revoke from public` alleen is dus niet genoeg.
-- ---------------------------------------------------------------------------
-- Trigger-functie: wordt door de trigger aangeroepen en hoeft door niemand direct te kunnen worden uitgevoerd.
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

-- Wordt in de RLS-policies voor ingelogde gebruikers gebruikt.
revoke all on function public.is_gezin_lid(text) from public;
revoke all on function public.is_gezin_lid(text) from anon;
grant execute on function public.is_gezin_lid(text) to authenticated;

revoke all on function public.deelt_gezin_met(uuid) from anon;

-- ---------------------------------------------------------------------------
-- 3. Codegenerator: unieke code over ALLE codes, niet alleen de actieve
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
    exit when not exists (select 1 from public.gezin_uitnodigingen where code = kandidaat);
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
-- 4. Indexen
-- ---------------------------------------------------------------------------
create index if not exists voedingen_gezin_datum_idx on public.voedingen (gezin_id, datum_tijd);
create index if not exists luiers_gezin_datum_idx on public.luiers (gezin_id, datum_tijd);
create index if not exists temperaturen_gezin_datum_idx on public.temperaturen (gezin_id, datum_tijd);
create index if not exists spugen_gezin_datum_idx on public.spugen (gezin_id, datum_tijd);
create index if not exists vitamines_gezin_datum_idx on public.vitamines (gezin_id, datum_tijd);
create index if not exists medicatie_gezin_datum_idx on public.medicatie (gezin_id, datum_tijd);
create index if not exists groei_gezin_datum_idx on public.groei (gezin_id, datum_tijd);
create index if not exists kolven_gezin_datum_idx on public.kolven (gezin_id, datum_tijd);
create index if not exists notities_gezin_datum_idx on public.notities (gezin_id, datum_tijd);
create index if not exists slapen_gezin_start_idx on public.slapen (gezin_id, start);
create index if not exists huilen_gezin_start_idx on public.huilen (gezin_id, start);
create index if not exists kinderen_gezin_idx on public.kinderen (gezin_id);
create index if not exists gezin_leden_user_idx on public.gezin_leden (user_id);
create index if not exists gezin_uitnodigingen_gezin_idx on public.gezin_uitnodigingen (gezin_id, vervalt_op);

-- ---------------------------------------------------------------------------
-- 5. Dode policies opruimen (INSERT/UPDATE op gezin_uitnodigingen is niet meer mogelijk)
-- ---------------------------------------------------------------------------
drop policy if exists "gezin_uitnodigingen_insert_lid" on public.gezin_uitnodigingen;
drop policy if exists "gezin_uitnodigingen_update_lid" on public.gezin_uitnodigingen;

-- ---------------------------------------------------------------------------
-- 6. Alleen bekende rollen (de app en de functies kennen 'eigenaar' en 'lid').
--    NOT VALID: geldt voor nieuwe rijen. Bestaande rijen worden daarna gecontroleerd;
--    staat daar iets anders in, dan blijft het bij een melding en gaat niets stuk.
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    alter table public.gezin_leden
      add constraint gezin_leden_rol_check check (rol in ('eigenaar', 'lid')) not valid;
  exception when duplicate_object then null;
  end;
  begin
    alter table public.gezin_leden validate constraint gezin_leden_rol_check;
  exception when check_violation then
    raise notice 'gezin_leden bevat rollen buiten eigenaar/lid; controle geldt alleen voor nieuwe rijen';
  end;
end $$;

notify pgrst, 'reload schema';

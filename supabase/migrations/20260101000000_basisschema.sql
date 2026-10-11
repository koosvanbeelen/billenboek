-- BASISSCHEMA (vastgelegd vanuit de bestaande Supabase-database, 10 okt 2026)
--
-- Doel: de database kunnen reproduceren (test-omgeving, herstel). Dit bestand beschrijft
-- de toestand VOOR de migraties 20260821 t/m 20261009 (dus zonder `profielen`,
-- `uitnodiging_pogingen` en de nieuwe functies; die komen uit de latere migraties).
--
-- Veilig op de bestaande database: alles is `if not exists`, er wordt niets gewijzigd of
-- verwijderd. Op een lege database bouwt het alles op.
--
-- Let op: gebaseerd op een controle van tabellen, kolommen, indexen, foreign keys en policies.
-- Niet vastgelegd waren CHECK-constraints en de precisie van `numeric`-kolommen
-- (zie supabase/controle/schema-audit-aanvulling.sql). Op de bestaande database heeft dat
-- geen effect; op een nieuwe database zijn die kolommen dan minder strikt.
--
-- Rechten (GRANT/REVOKE) staan niet hier maar in 20261010000000_schema_verharding.sql.

-- ---------------------------------------------------------------------------
-- Gezinnen, leden en uitnodigingen
-- ---------------------------------------------------------------------------
create table if not exists public.gezinnen (
  id text primary key default (gen_random_uuid())::text,
  naam text not null,
  aangemaakt_op timestamptz not null default now()
);

create table if not exists public.gezin_leden (
  gezin_id text not null references public.gezinnen (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rol text not null default 'lid',
  aangemaakt_op timestamptz not null default now(),
  primary key (gezin_id, user_id)
);

create table if not exists public.gezin_uitnodigingen (
  id uuid primary key default gen_random_uuid(),
  gezin_id text not null references public.gezinnen (id) on delete cascade,
  code text not null unique,
  aangemaakt_door uuid not null references auth.users (id) on delete cascade,
  vervalt_op timestamptz not null,
  gebruikt_op timestamptz,
  gebruikt_door uuid references auth.users (id) on delete set null,
  aangemaakt_op timestamptz not null default now()
);

-- Kinderen (nog niet gekoppeld aan de registraties: die hebben geen kind_id)
create table if not exists public.kinderen (
  id serial primary key,
  gezin_id text,
  naam text not null,
  geboortedatum date,
  aangemaakt_op timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Controle op gezinslidmaatschap (gebruikt door alle policies)
-- ---------------------------------------------------------------------------
create or replace function public.is_gezin_lid(target_gezin_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.gezin_leden gl
    where gl.gezin_id = target_gezin_id
      and gl.user_id = (select auth.uid())
  );
$$;

-- ---------------------------------------------------------------------------
-- Registratietabellen
-- ---------------------------------------------------------------------------

create table if not exists public.voedingen (
  id serial primary key,
  datum_tijd timestamptz not null,
  type text not null,
  borst text,
  duur_minuten integer,
  hoeveelheid_ml integer,
  notitie text,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  gezin_id text,
  user_id uuid references auth.users (id) on delete cascade
);
create index if not exists voedingen_datum_tijd_idx on public.voedingen (datum_tijd);
create index if not exists voedingen_user_id_idx on public.voedingen (user_id);

create table if not exists public.luiers (
  id serial primary key,
  datum_tijd timestamptz not null,
  plas boolean not null default false,
  poep boolean not null default false,
  schoon boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  gezin_id text,
  user_id uuid references auth.users (id) on delete cascade
);
create index if not exists luiers_datum_tijd_idx on public.luiers (datum_tijd);
create index if not exists luiers_user_id_idx on public.luiers (user_id);

create table if not exists public.temperaturen (
  id serial primary key,
  datum_tijd timestamptz not null,
  temperatuur numeric not null,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  gezin_id text,
  user_id uuid references auth.users (id) on delete cascade
);
create index if not exists temperaturen_datum_tijd_idx on public.temperaturen (datum_tijd);
create index if not exists temperaturen_user_id_idx on public.temperaturen (user_id);

create table if not exists public.spugen (
  id serial primary key,
  datum_tijd timestamptz not null,
  notitie text,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  gezin_id text,
  user_id uuid references auth.users (id) on delete cascade
);
create index if not exists boertjes_spugen_datum_tijd_idx on public.spugen (datum_tijd);
create index if not exists spugen_user_id_idx on public.spugen (user_id);

create table if not exists public.vitamines (
  id serial primary key,
  datum_tijd timestamptz not null,
  vitamine_k boolean not null default false,
  vitamine_d boolean not null default false,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  gezin_id text,
  user_id uuid references auth.users (id) on delete cascade
);
create index if not exists vitamines_datum_tijd_idx on public.vitamines (datum_tijd);
create index if not exists vitamines_user_id_idx on public.vitamines (user_id);

create table if not exists public.medicatie (
  id serial primary key,
  datum_tijd timestamptz not null,
  naam text not null,
  dosering text,
  notitie text,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  gezin_id text,
  user_id uuid references auth.users (id) on delete cascade
);
create index if not exists medicatie_datum_tijd_idx on public.medicatie (datum_tijd);
create index if not exists medicatie_user_id_idx on public.medicatie (user_id);

create table if not exists public.groei (
  id serial primary key,
  datum_tijd timestamptz not null,
  gewicht_kg numeric,
  lengte_cm numeric,
  opmerking text,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  gezin_id text,
  user_id uuid references auth.users (id) on delete cascade
);
create index if not exists groei_datum_tijd_idx on public.groei (datum_tijd);
create index if not exists groei_user_id_idx on public.groei (user_id);

create table if not exists public.slapen (
  id serial primary key,
  start timestamptz not null,
  einde timestamptz not null,
  duur_minuten integer not null,
  locatie text,
  notitie text,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  gezin_id text,
  user_id uuid references auth.users (id) on delete cascade
);
create index if not exists slapen_start_idx on public.slapen (start);
create index if not exists slapen_user_id_idx on public.slapen (user_id);

create table if not exists public.huilen (
  id serial primary key,
  start timestamptz not null,
  einde timestamptz not null,
  duur_minuten integer not null,
  oorzaak text,
  troost text,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  gezin_id text,
  user_id uuid references auth.users (id) on delete cascade
);
create index if not exists huilen_start_idx on public.huilen (start);
create index if not exists huilen_user_id_idx on public.huilen (user_id);

create table if not exists public.kolven (
  id serial primary key,
  datum_tijd timestamptz not null,
  borst text not null,
  hoeveelheid_ml integer not null,
  notitie text,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  gezin_id text,
  user_id uuid references auth.users (id) on delete cascade
);
create index if not exists kolven_datum_tijd_idx on public.kolven (datum_tijd);
create index if not exists kolven_user_id_idx on public.kolven (user_id);

create table if not exists public.notities (
  id serial primary key,
  datum_tijd timestamptz not null default now(),
  notitie text not null,
  gezin_id text,
  user_id uuid references auth.users (id) on delete cascade
);
create index if not exists notities_datum_tijd_idx on public.notities (datum_tijd);
create index if not exists notities_user_id_idx on public.notities (user_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.gezinnen enable row level security;
alter table public.gezin_leden enable row level security;
alter table public.gezin_uitnodigingen enable row level security;
alter table public.kinderen enable row level security;
alter table public.voedingen enable row level security;
alter table public.luiers enable row level security;
alter table public.temperaturen enable row level security;
alter table public.spugen enable row level security;
alter table public.vitamines enable row level security;
alter table public.medicatie enable row level security;
alter table public.groei enable row level security;
alter table public.slapen enable row level security;
alter table public.huilen enable row level security;
alter table public.kolven enable row level security;
alter table public.notities enable row level security;

do $$
declare
  t text;
  nieuw_beleid record;
begin
  -- Gezinstabellen
  for nieuw_beleid in
    select * from (values
      ('gezinnen', 'gezinnen_select_lid', 'select', 'public.is_gezin_lid(id)', null),
      ('gezin_leden', 'gezin_leden_select_lid', 'select', 'public.is_gezin_lid(gezin_id)', null),
      ('gezin_uitnodigingen', 'gezin_uitnodigingen_select_lid', 'select', 'public.is_gezin_lid(gezin_id)', null),
      ('gezin_uitnodigingen', 'gezin_uitnodigingen_insert_lid', 'insert', null,
        '(aangemaakt_door = (select auth.uid())) and public.is_gezin_lid(gezin_id)'),
      ('gezin_uitnodigingen', 'gezin_uitnodigingen_update_lid', 'update', 'public.is_gezin_lid(gezin_id)',
        'public.is_gezin_lid(gezin_id)')
    ) as v(tabel, naam, commando, gebruik, controle)
  loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = nieuw_beleid.tabel and policyname = nieuw_beleid.naam) then
      execute format('create policy %I on public.%I for %s to authenticated %s %s',
        nieuw_beleid.naam, nieuw_beleid.tabel, nieuw_beleid.commando,
        case when nieuw_beleid.gebruik is not null then 'using (' || nieuw_beleid.gebruik || ')' else '' end,
        case when nieuw_beleid.controle is not null then 'with check (' || nieuw_beleid.controle || ')' else '' end);
    end if;
  end loop;

  -- Registratietabellen: leden van het gezin mogen alles met de rijen van dat gezin
  foreach t in array array['kinderen','voedingen','luiers','temperaturen','spugen','vitamines','medicatie','groei','slapen','huilen','kolven','notities']
  loop
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_gezin_select') then
      execute format('create policy %I on public.%I for select to authenticated using (public.is_gezin_lid(gezin_id))', t || '_gezin_select', t);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_gezin_insert') then
      execute format('create policy %I on public.%I for insert to authenticated with check (public.is_gezin_lid(gezin_id))', t || '_gezin_insert', t);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_gezin_update') then
      execute format('create policy %I on public.%I for update to authenticated using (public.is_gezin_lid(gezin_id)) with check (public.is_gezin_lid(gezin_id))', t || '_gezin_update', t);
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_gezin_delete') then
      execute format('create policy %I on public.%I for delete to authenticated using (public.is_gezin_lid(gezin_id))', t || '_gezin_delete', t);
    end if;
  end loop;
end $$;

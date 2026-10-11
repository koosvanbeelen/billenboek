-- Schema- en beveiligingscontrole (alleen lezen, wijzigt niets)
-- Draai dit in Supabase -> SQL Editor. Je krijgt EEN rij met EEN kolom ("rapport") terug.
-- Kopieer de inhoud van die cel en stuur hem terug: daarmee kan een volledige
-- basis-migratie (tabellen + RLS-policies) worden geschreven die overeenkomt met de echte database.
-- Er staan geen gegevens uit je tabellen in, alleen structuur.

select jsonb_pretty(jsonb_build_object(
  'tabellen', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'tabel', c.relname,
      'rls_aan', c.relrowsecurity,
      'rls_forced', c.relforcerowsecurity
    ) order by c.relname), '[]'::jsonb)
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  ),
  'kolommen', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'tabel', table_name, 'kolom', column_name, 'type', data_type,
      'nullable', is_nullable, 'default', column_default
    ) order by table_name, ordinal_position), '[]'::jsonb)
    from information_schema.columns where table_schema = 'public'
  ),
  'policies', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'tabel', tablename, 'naam', policyname, 'commando', cmd, 'rollen', roles,
      'using', qual, 'with_check', with_check
    ) order by tablename, policyname), '[]'::jsonb)
    from pg_policies where schemaname = 'public'
  ),
  'rechten_op_tabellen', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'tabel', table_name, 'rol', grantee, 'recht', privilege_type
    ) order by table_name, grantee, privilege_type), '[]'::jsonb)
    from information_schema.role_table_grants
    where table_schema = 'public' and grantee in ('anon', 'authenticated')
  ),
  'foreign_keys', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'tabel', conrelid::regclass::text, 'definitie', pg_get_constraintdef(oid)
    ) order by conrelid::regclass::text), '[]'::jsonb)
    from pg_constraint where contype = 'f' and connamespace = 'public'::regnamespace
  ),
  'indexen', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'tabel', tablename, 'definitie', indexdef
    ) order by tablename, indexname), '[]'::jsonb)
    from pg_indexes where schemaname = 'public'
  ),
  'functies', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'naam', p.proname,
      'argumenten', pg_get_function_identity_arguments(p.oid),
      'security_definer', p.prosecdef,
      'config', p.proconfig,
      'anon_mag_uitvoeren', has_function_privilege('anon', p.oid, 'execute'),
      'authenticated_mag_uitvoeren', has_function_privilege('authenticated', p.oid, 'execute')
    ) order by p.proname), '[]'::jsonb)
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  ),
  'triggers', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'tabel', event_object_table, 'naam', trigger_name, 'moment', action_timing,
      'gebeurtenis', event_manipulation
    )), '[]'::jsonb)
    from information_schema.triggers where trigger_schema in ('public', 'auth')
  )
)) as rapport;

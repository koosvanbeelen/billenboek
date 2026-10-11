-- Aanvulling op schema-audit.sql (alleen lezen, wijzigt niets, bevat geen gegevens)
-- Wat de eerste controle niet liet zien: CHECK-constraints, precisie van numerieke kolommen,
-- tekstlengtes, sequences en views. Met deze uitkomst kan basisschema.sql exact worden gemaakt.
-- Draai in Supabase -> SQL Editor; je krijgt een rij met een kolom ("rapport").

select jsonb_pretty(jsonb_build_object(
  'check_constraints', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'tabel', conrelid::regclass::text, 'naam', conname, 'definitie', pg_get_constraintdef(oid)
    ) order by conrelid::regclass::text, conname), '[]'::jsonb)
    from pg_constraint where contype in ('c', 'u', 'x') and connamespace = 'public'::regnamespace
  ),
  'numerieke_kolommen', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'tabel', table_name, 'kolom', column_name, 'type', data_type,
      'precisie', numeric_precision, 'schaal', numeric_scale, 'max_lengte', character_maximum_length
    ) order by table_name, column_name), '[]'::jsonb)
    from information_schema.columns
    where table_schema = 'public' and (data_type in ('numeric', 'character varying', 'character'))
  ),
  'views', (
    select coalesce(jsonb_agg(table_name), '[]'::jsonb)
    from information_schema.views where table_schema = 'public'
  ),
  'default_rechten_voor_nieuwe_objecten', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'eigenaar', pg_get_userbyid(defaclrole), 'soort', defaclobjtype, 'rechten', defaclacl::text
    )), '[]'::jsonb)
    from pg_default_acl
  )
)) as rapport;

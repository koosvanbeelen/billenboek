# Billenboek

Een rustige, Nederlandstalige app (PWA) waarmee ouders samen de dagelijkse verzorging van hun baby bijhouden: voedingen, luiers, temperatuur, spugen, vitamines, medicatie, groei, slapen, huilen, kolven en notities. Meerdere ouders delen één gezin en zien dezelfde gegevens.

## Techniek

Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (`@base-ui/react`) · React Hook Form + Zod · Server Actions · Supabase (Auth + Postgres met Row Level Security) · pnpm · Vercel.

## Lokaal draaien

```bash
pnpm install
cp .env.example .env.local   # vul je Supabase-gegevens in
pnpm dev                     # http://localhost:3000
```

Controleer de types altijd voordat je pusht: `pnpm exec tsc --noEmit`. Typefouten laten de Vercel-build mislukken (`ignoreBuildErrors` staat uit).

## Omgevingsvariabelen

| Variabele | Waar te vinden |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | idem (de publishable/anon-sleutel; die mag in de browser) |

Er is geen service-role-sleutel nodig. Zet dezelfde variabelen in Vercel (Project Settings → Environment Variables).

## Database opzetten

De database staat in `supabase/migrations/`. Draai de bestanden in Supabase → SQL Editor, op volgorde van bestandsnaam:

| Bestand | Inhoud |
|---|---|
| `20260101000000_basisschema.sql` | Tabellen, indexen en policies. **Alleen nodig op een lege database**; op een bestaande database doet het niets. |
| `20260821000000_family_invites_rpc.sql` | Eerste versie van gezin aanmaken en deelnemen (wordt later vervangen) |
| `20261005000000_fix_is_gezin_lid_rls.sql` | `is_gezin_lid` zonder recursie |
| `20261009000000_harden_family_setup.sql` | Eerste verharding |
| `20261009120000_account_beheer.sql` | Profielen (namen), account verwijderen |
| `20261009130000_uitnodigingen_beveiliging.sql` | Uitnodigingscodes: 7 dagen geldig, rate limit, rollen |
| `20261010000000_schema_verharding.sql` | Rechten aanscherpen, indexen op `gezin_id` |
| `20261012000000_kinderen_en_kind_id.sql` | Kinderen per gezin (geslacht, geboortegewicht) en `kind_id` op alle registraties; koppelt bestaande gegevens aan een kind |

Bestaande database? Draai alleen de bestanden die je nog niet hebt gedraaid. Maak vooraf een back-up. Draai de migraties één keer, op volgorde: de oudste zijn niet bedoeld om opnieuw te draaien nadat de nieuwere zijn uitgevoerd.

Een controle van het schema en de beveiliging krijg je met `supabase/controle/schema-audit.sql` (alleen lezen, bevat geen gegevens).

### Supabase-instellingen

- **Authentication → URL Configuration:** Site URL = je productiedomein; zet `https://<domein>/auth/callback` bij Redirect URLs (voor Vercel-previews een wildcard).
- **E-mail:** de ingebouwde Supabase-mail heeft een lage limiet en mailt alleen teamleden. Stel voor echte gebruikers een eigen SMTP in (Project Settings → Authentication → SMTP).
- **Wachtwoord vergeten werkt ook vanuit de geïnstalleerde app** als je het e-mailtemplate *Reset Password* aanpast naar een link `{{ .SiteURL }}/auth/bevestigen?token_hash={{ .TokenHash }}&type=recovery&next=/wachtwoord-resetten`.

## Hoe het in elkaar zit

```
app/
  (app)/            ingelogd gedeelte: Vandaag, Geschiedenis, Notities, Instellingen
  actions/          Server Actions (registraties, notities, gezinnen, kinderen, account, auth)
  login, registreren, wachtwoord-vergeten, wachtwoord-resetten, gezin/   niet-ingelogd en onboarding
  auth/             callback en bevestiging van e-mail (callback, bevestigen)
components/         schermen en herbruikbare onderdelen (ui/ = shadcn)
lib/
  supabase/         clients, proxy (middleware), gezin, env
  registratie-soorten.ts   per soort registratie: tabel, validatie, vertaling naar de database
  db/mappers.ts     databasekolommen <-> app-velden
  validations.ts    Zod-schema's
  fouten.ts         logging en nette foutmeldingen
supabase/
  migrations/       database (zie hierboven)
  controle/         controlescripts
```

**Kinderen:** elk gezin heeft minimaal één kind (verplicht bij het aanmelden; de `(app)`-layout stuurt iedereen zonder kind naar `/gezin/kind`). Kinderen beheer je onder Instellingen → Gezin. Elke registratie krijgt bij het opslaan `user_id`, `gezin_id` én `kind_id`. Het gekozen kind staat in de cookie `billenboek_kind`; de server controleert die altijd tegen de kinderen van het gezin en valt anders terug op het eerste kind (`lib/supabase/kind.ts`). Notities horen bij het gezin, niet bij een kind.

**Beveiliging in het kort:** elke tabel heeft Row Level Security; leden zien alleen de rijen van hun eigen gezin (`is_gezin_lid(gezin_id)`). Gezin, lidmaatschap en uitnodigingen kunnen alleen via vaste database-functies worden gewijzigd, niet rechtstreeks. Ingelogde gebruikers worden in de proxy lokaal gecontroleerd (`getClaims`) en in pagina's en acties opnieuw met `getUser()`.

## Een nieuwe soort registratie toevoegen

1. **Database:** tabel met `gezin_id`, `kind_id`, `user_id`, `aangemaakt_op`, `bijgewerkt_op`, RLS aan, vier policies naar het voorbeeld van `voedingen`, de samengestelde foreign key `(kind_id, gezin_id)` naar `kinderen (id, gezin_id)` (`on delete cascade`), een `kind_id is not null`-controle en een index op `(gezin_id, kind_id, datum_tijd)`. Zet het in een nieuwe migratie.
2. **Types:** de soort bij `Soort` en een `...Item`-type in `lib/types.ts`.
3. **Mapper:** `...FromDb` en `...ToDb` in `lib/db/mappers.ts`, en opnemen in `tableMappers`.
4. **Validatie:** Zod-schema en `...Input`-type in `lib/validations.ts`.
5. **Eén blok in `lib/registratie-soorten.ts`** (tabel, tijdkolom, schema, vertaling) en de soort toevoegen aan `SOORT_VOLGORDE`.
6. **Acties:** drie regels in `app/actions/registraties.ts` (`voeg...Toe`, `werk...Bij`, `verwijder...`).
7. Formulier en tijdlijnkaart in `components/`.

Opslaan, bijwerken, verwijderen en het ophalen van de dag werken daarna vanzelf mee.

## Werken met v0

Deze repository is gekoppeld aan [v0](https://v0.app/chat/projects/prj_Zn9okvrAeinw9HhcQN9P0xEANjtO). v0 pusht wijzigingen rechtstreeks naar de repo, en elke merge naar `main` wordt automatisch gedeployed. Werk voor grotere wijzigingen op een aparte branch en test eerst op de Vercel-preview. Een zip uploaden in v0 verwijdert bestanden die er niet in zitten; gebruik daarvoor liever GitHub.

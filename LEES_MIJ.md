# Beveiliging van uitnodigingen en gezinnen (punt 1)

Branch: `code-beveiliging` (gebouwd bovenop `account-beheer`).

## Jouw regels, zo uitgevoerd

| Regel | Uitvoering |
|---|---|
| Code 7 dagen geldig | Vervaldatum wordt in de database bepaald (client kan hem niet meer kiezen). Bestaande actieve codes die langer liepen, zijn ingekort tot maximaal 7 dagen. |
| Rate limit 3 | **Mijn interpretatie:** maximaal 3 mislukte pogingen per gebruiker per 15 minuten. Daarna is joinen geblokkeerd tot de oudste poging uit het venster valt, ook met de goede code. De gebruiker ziet "Te veel mislukte pogingen. Probeer het over 15 minuten opnieuw." en tijdens het proberen "Je hebt nog 2 pogingen". Wil je een andere periode of een ander aantal: in de SQL staat `INSTELLING` bij `max_pogingen` en `venster` (en de 7 dagen). |
| Onbeperkt gebruik | Een code mag door onbeperkt veel mensen worden gebruikt binnen de 7 dagen. |
| 8 hex-tekens | Blijft zo (0-9, A-F). Hoofdletters, kleine letters en spaties om de code worden goed verwerkt. |

## Wat ik daarnaast heb gedaan (punt 1)

1. **Code maken gebeurt alleen in de database.** Voorheen bedacht de app de code en de vervaldatum en kon elke ingelogde gebruiker via de API zelf een code met een willekeurige vervaldatum invoegen. Dat kan niet meer.
2. **Direct schrijven op `gezinnen`, `gezin_leden` en `gezin_uitnodigingen` is dichtgezet** voor de API-rollen. De app leest die tabellen alleen. Wijzigingen lopen via de functies. Daardoor kan niemand zichzelf aan een gezin toevoegen of eigenaar maken, wat de RLS-policies ook toestaan (die kon ik niet inzien, zie het controlescript hieronder).
3. **Eén actieve code per gezin.** Een nieuwe code maakt de vorige ongeldig. Dat is nodig omdat een code onbeperkt bruikbaar is: zo kun je een gelekte link vervangen.
4. **Rollen.** Elk lid mag een nieuwe code maken (handig voor je partner). Alleen de **eigenaar** kan een code **intrekken** en een gezinslid **verwijderen**. In Instellingen verschijnen daarvoor knoppen. Verwijderde leden verliezen toegang, de registraties blijven bij het gezin.
5. **Foutmeldingen zijn nu zichtbaar.** Gezin aanmaken en deelnemen gaven fouten via een gegooide `Error`; Next.js laat de tekst daarvan in productie weg, dus gebruikers zagen alleen een algemene fout. Nu geven de acties een resultaat terug (net als de accountacties).
6. **Eén plek voor de Supabase-instellingen** (`lib/supabase/env.ts`, was 4x gekopieerd) en een `.env.example` (in `.gitignore` staat nu een uitzondering, anders had Git het bestand genegeerd).
7. **Nettere foutafhandeling in de registratie- en notitieacties:** geen ruwe Zod- of Supabase-fouten meer, wel een logregel met context op de server (`lib/fouten.ts`).
8. **`ignoreBuildErrors` staat uit** (`next.config.mjs`). Typefouten laten een deploy nu mislukken in plaats van stil door te glippen. `tsc --noEmit` slaagt. Faalt je Vercel-build toch op een typefout die ik niet zie, meld die dan (of zet het tijdelijk terug).

## Uitrollen

### Stap 1: SQL (Supabase → SQL Editor)
Draai `supabase/migrations/20261009130000_uitnodigingen_beveiliging.sql`.
Heb je `20261009120000_account_beheer.sql` nog niet gedraaid? Eerst die, daarna deze.

Maak voor de zekerheid eerst een back-up (Database → Backups).

### Stap 2: code direct daarna deployen
De SQL vervangt `create_family_with_invite` en `join_family_with_code` door nieuwe versies. Tussen het draaien van de SQL en het live gaan van de nieuwe code werken "gezin aanmaken" en "deelnemen" niet. Voor jullie twee is dat een kwestie van minuten, doe het dus even achter elkaar.

### Stap 3: toepassen
- **Je hebt `account-beheer` al toegepast:** `git apply beveiliging.patch` op die branch (maak een nieuwe branch `code-beveiliging`).
- **Anders:** pak `billenboek-cumulatief.zip` uit over een branch vanaf `main`. Die bevat alles sinds `main`: accountbeheer, de datumfix en deze stap. In de terminal: `unzip -o billenboek-cumulatief.zip`.
- Niet in v0 uploaden (v0 verwijdert bestanden die niet in een zip zitten).

### Stap 4: schema vastleggen (eenmalig, 2 minuten)
Open `supabase/controle/schema-audit.sql`, plak hem in de SQL Editor, draai hem en stuur me de inhoud van de ene cel terug. Het script wijzigt niets en bevat geen gegevens, alleen structuur. Daarmee schrijf ik een basis-migratie die overeenkomt met je echte tabellen en policies, en controleer ik tegelijk de RLS (staat hij overal aan, is `FORCE` nodig, kan `anon` ergens bij).

## Testlijst (preview, testaccounts)
1. Gezin aanmaken: je ziet een code met "7 dagen geldig".
2. Tweede account: 3x een verkeerde code (bijv. `DEADBEEF`) → na de derde melding "Te veel mislukte pogingen". Probeer dan de goede code: ook geblokkeerd. Na 15 minuten werkt de goede code.
3. Een code met te weinig tekens (`AB12`) telt niet mee als poging.
4. Derde account gebruikt dezelfde code: werkt ook.
5. Nieuwe code maken: de oude werkt niet meer.
6. Als eigenaar: code intrekken, lid verwijderen. Als gewoon lid: die knoppen zijn er niet.
7. Verwijderd lid opent de app: komt bij "Koppel je Billenboek aan een gezin" uit.

## Bewust anders of niet gedaan
- De rate limit geldt per account. Wie veel accounts aanmaakt kan blijven gokken, maar bij 8 hex-tekens (circa 4,3 miljard mogelijkheden) en 3 pogingen per account per 15 minuten is dat niet haalbaar. Houd e-mailbevestiging aan bij Supabase om massaal accounts maken te remmen.
- Gezin hernoemen kan nog niet (de schrijfrechten zijn dicht). Dat komt later via een eigen functie.
- De kolommen `gebruikt_op` en `gebruikt_door` in `gezin_uitnodigingen` worden niet meer gebruikt (codes zijn onbeperkt bruikbaar). Ik heb ze laten staan.
- Niet gedaan, want het hoort niet bij punt 1: Drizzle-restanten opruimen, README, performance (`Promise.all`).

## Wat ik wel en niet heb getest
- Getest: `tsc --noEmit`; de SQL in een lokale Postgres 16 met nagebootst schema (alle migraties op volgorde, herhaald draaien, 3 pogingen + blokkade, onbeperkt gebruik, kleine letters/spaties, rollen, intrekken, lid verwijderen, en dat directe `INSERT/UPDATE/DELETE` door `authenticated`/`anon` wordt geweigerd terwijl lezen en de overige tabellen blijven werken).
- Niet getest: de echte Supabase-database, het gedrag in de browser en `next build` (Google Fonts is vanuit mijn omgeving niet bereikbaar).

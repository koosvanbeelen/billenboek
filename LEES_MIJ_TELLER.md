# Teller "Tijd sinds laatste slaap"

Nieuwe teller naast "Tijd sinds laatste voeding/luier". Rekent vanaf de **eindtijd**
van de laatste slaapregistratie (hele geschiedenis, niet alleen vandaag).

## Gedrag
- Toont `u:mm` sinds het einde van de laatste slaap; ververst elke 5 minuten en direct zodra je de app weer opent of ernaar terugkeert (ook voor de voeding- en luiertellers).
- Loopt er een slaaptimer? Dan toont de teller **"Slaapt"**.
- Nog nooit slaap geregistreerd: "—".
- Een gestopte maar nog niet opgeslagen timer (status "wacht") telt pas mee na opslaan.
- Staat niet in de Geschiedenis-tellers (net als de andere "tijd sinds"-tellers).
- Niet standaard aan: zet aan via Instellingen > Formulieren en tellers (max. 4).

## Stappen
1. Pak `billenboek-teller-slaap.zip` uit over je repo (mappenstructuur blijft behouden), of
   `git apply teller-slaap.patch`.
2. Voer `supabase/migrations/20261026000000_teller_tijd_sinds_slaap.sql` uit in de
   Supabase SQL Editor (idempotent, alleen een index; de teller werkt ook zonder).
3. `npx tsc --noEmit` (is hier al geslaagd), commit op een feature-branch, test, dan mergen.

## Gewijzigde bestanden
app/actions/registraties.ts, components/dag-tellers.tsx, components/geschiedenis-weergave.tsx,
lib/teller-voorkeur.ts, lib/tellers.tsx, lib/types.ts, + nieuwe migratie.

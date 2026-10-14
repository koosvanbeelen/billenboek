# Luier-notitie en kaart delen (van billenboek-neon naar billenboek)

Branch: `luier-notitie-kaart-delen`, gemaakt vanaf `main` (c40df7f). `tsc --noEmit` slaagt zonder fouten.

## Wat is overgenomen

- **9a0070e Notitie luiers**: optioneel notitieveld in het luierformulier, zichtbaar op de tijdlijnkaart.
- **fabc6d9 deelbare-kaart.tsx**: logo + "Billenboek" in de voet van de kaart. In `billenboek` bestond de deelfunctie nog helemaal niet, dus ook de commits 482714b en 200f8e9 waar fabc6d9 op voortbouwt zijn meegenomen: `components/deelbare-kaart.tsx`, `hooks/use-deel-kaart.tsx`, de deelknop in `RegistratieDialog` en `html-to-image` in `package.json`.

## Aanpassingen voor Supabase (anders dan in de neon-repo)

- Geen Drizzle: de kolom komt in `lib/db/mappers.ts` (`luierFromDb`/`luierToDb`) en `lib/registratie-soorten.ts`.
- **SQL nodig** (zie stap 1): `supabase/migrations/20261014000000_luier_notitie.sql`.
- `RegistratieDialog` behoudt de kindnaam ("Voor ...") en `pr-8` uit `billenboek`; alleen de deelknop is erbij gekomen.

## Toepassen

1. Draai in de Supabase SQL Editor: `alter table public.luiers add column if not exists notitie text;` (idempotent). Doe dit **voor** je de code uitrolt, anders mislukt het opslaan van luiers.
2. Kies een van twee manieren:
   - Patch: `git checkout -b luier-notitie-kaart-delen`, `git apply luier-notitie-kaart-delen.patch`, daarna `pnpm install` en commit ook `pnpm-lock.yaml` (de patch bevat de lockfile bewust niet).
   - Zip: pak uit over je projectmap (bevat ook de bijgewerkte `pnpm-lock.yaml`). Er wordt niets verwijderd.
3. Push de branch en controleer de Vercel-preview voordat je naar `main` mergt.

Niet via een v0-zip-upload als je ook bestanden hebt die niet in deze zip zitten: v0 verwijdert die dan stilletjes.

## Testlijst (preview)

1. Nieuwe luier met notitie opslaan; de notitie staat onder de luier op de tijdlijn.
2. Bestaande luier openen, notitie toevoegen/wijzigen/leegmaken.
3. Bestaande luiers zonder notitie tonen gewoon.
4. Open een bestaande registratie: het deel-icoon staat naast de prullenbak; bij een nieuwe registratie staat het er niet.
5. Delen op je telefoon opent het deelmenu met een PNG; op desktop wordt de afbeelding gedownload.
6. Deel een vitamine-kaart en een luier-kaart in donkere modus: kleuren blijven leesbaar (letterlijke hex-waarden).

## Niet getest

Echte Supabase, browser en de deelfunctie op een telefoon; geen `next build` gedraaid.

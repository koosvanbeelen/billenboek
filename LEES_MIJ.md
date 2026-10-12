# Herstel na de mislukte Vercel-build

Branch: `herstel-v0`, gemaakt vanaf je echte `main` (commit 1a3ba90). Vijf bestanden. Geen SQL, geen bestanden verwijderen, geen nieuwe pakketten.

## Wat er misging (mijn fout)

Mijn laatste zip was gebouwd vanaf een kloon van vóór de v0-wijzigingen van 10 oktober (PR #15 t/m #20, onder meer "Move logout to account settings", de gezin- en app-info-subpagina's en de eerste-gebruik-instellingen). Daardoor heeft de zip in vijf bestanden v0's wijzigingen overschreven:

| Bestand | Wat er stuk ging | Herstel |
|---|---|---|
| `components/instellingen-weergave.tsx` | Mijn oude versie (met props) overschreef v0's menu-versie. Dat was de fout in je Vercel-log. | Terug naar v0's versie, inclusief de tekstaanpassingen van PR #21 |
| `app/actions/registraties.ts` | Mijn herschrijving kende de teller `laatsteTemperatuur` niet (door v0 toegevoegd). Deze fout zou je na de eerste hebben gekregen. | Teller toegevoegd, op dezelfde plek en op dezelfde manier als v0 |
| `components/account-weergave.tsx` | De kop "Uitloggen" boven de uitlogknop (v0) was weg | 4 regels terug |
| `app/login/page.tsx` | "Welkom!" werd weer "Welkom terug" | Eén regel terug. Mijn melding bij een verwijderd account blijft staan |
| `package.json` | `version` stond weer op 0.1.0, terwijl je 1.1.0 had (Instellingen toont die versie) | `1.1.0` terug. De naam `billenboek` en het ontbreken van Drizzle blijven |

## Toepassen

Beste manier: `git apply herstel-v0.patch` op een branch vanaf `main`. Of pak de zip uit over je projectmap: er zitten alleen deze vijf bestanden in, en er wordt niets verwijderd. Niet via v0 uploaden.

## Wat ik deze keer heb gedaan

- De echte `main` opgehaald in plaats van mijn oude kloon te gebruiken.
- Met een driewegvergelijking gezocht naar álle bestanden die zowel door v0 als door mij zijn gewijzigd (er waren er vijf).
- `tsc --noEmit` op `main` met en zonder de herstelwijzigingen: eerst 2 fouten, daarna 0.
- Een volledige productiebuild gedraaid (`next build`): compileren, TypeScript, pagina's verzamelen en alle 17 routes slagen. Mijn omgeving kan Google Fonts niet ophalen; ik heb het lettertype nagebootst, de rest van de build is echt.
- De registratie-acties opnieuw naast de oude versie van `main` gelegd (62 aanroepen, inclusief de temperatuurteller): identiek.

## Niet getest

De echte Supabase en het gedrag in de browser. De Vercel-build zelf is de laatste controle.

## Testlijst (op de preview)

1. De build is groen.
2. Instellingen opent als menu met Account, Gezin, Formulieren en tellers en App-info; tekst bij Account noemt "uitloggen".
3. Instellingen → Account: de kop "Uitloggen" staat boven de knop.
4. Vandaag: de teller laatste temperatuur toont de meest recente meting.
5. Inlogscherm toont "Welkom!".
6. Instellingen toont versie 1.1.0 (App-info).

## Losse opmerkingen

- Vercel meldt dat `middleware.ts` in Next.js 16 `proxy.ts` hoort te heten. Dat is nu alleen een waarschuwing. Het hernoemen verandert ook de runtime, dus dat doe ik niet ongevraagd.
- `LEES_MIJ.md` in de hoofdmap van de repo is mijn leveringsnotitie en hoort daar eigenlijk niet. Verwijderen kan zonder gevolgen; de README is het blijvende document.

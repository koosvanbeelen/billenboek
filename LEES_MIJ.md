# Prestaties en onderhoud (punt 3 en 4)

Branch: `prestaties-onderhoud` (bovenop `code-beveiliging`). **Geen database-wijzigingen in deze stap**: je hoeft geen SQL te draaien. De indexen uit punt 3 staan al in `20261010000000_schema_verharding.sql`.

## Eerst lezen: bestanden verwijderen

Deze stap **verwijdert** vijf bestanden. Een zip kan geen bestanden verwijderen, een patch wel. Daarom is `prestaties-onderhoud.patch` hier de veiligste weg (`git apply prestaties-onderhoud.patch`).

Gebruik je toch de zip, verwijder dan zelf deze vijf bestanden (anders mislukt de build, omdat `lib/db/index.ts` het verwijderde pakket `pg` nog importeert):

```
lib/db/index.ts
lib/db/schema.ts
app/(app)/instellingen/formulieren-en-tellers/File
public/icons/File
public/splash/File
```

## Punt 3: prestaties

| Wat | Resultaat |
|---|---|
| `getDagGegevens` deed 12 queries na elkaar | Nu alle 12 tegelijk (`Promise.all`). In een simulatie met 30 ms per query: 364 ms → 30 ms. Dat is een simulatie van het mechanisme, geen meting op je echte Supabase; de winst in de praktijk hangt af van de reactietijd naar Supabase. |
| `getUser()` werd per actie 2x aangeroepen, plus een extra gezin-query | `getGebruiker()` en `getActiefGezinId()` worden per verzoek één keer opgehaald en gedeeld (`React.cache`). Layout, pagina en acties in hetzelfde verzoek delen het resultaat. |
| Middleware belde Supabase bij elke navigatie en elke voorgeladen link | Gebruikt nu `getClaims()`: het token wordt lokaal gecontroleerd. Pagina's en acties controleren de gebruiker daarna nog steeds met `getUser()`. Een verwijderd account komt dus nergens binnen; alleen de snelle poortwachter in de middleware is lichter. |
| `/offline.html` ging door de middleware | Uitgesloten in de matcher. |
| Index op `(gezin_id, datum_tijd)` | Stond al in de vorige stap. |

## Punt 4: code en onderhoud

| Wat | Resultaat |
|---|---|
| `registraties.ts` van 643 regels | 175 regels. Wat per soort verschilt (tabel, validatie, vertaling naar de database) staat in `lib/registratie-soorten.ts`; opslaan, bijwerken, verwijderen en de dag ophalen staan één keer. Alle 34 acties hebben dezelfde naam en dezelfde invoer, dus de formulieren zijn niet aangepast. Een nieuwe soort toevoegen staat stap voor stap in de README. |
| Drizzle | `lib/db/index.ts` en `lib/db/schema.ts` verwijderd (niets importeerde ze), en `drizzle-orm`, `drizzle-kit`, `pg` en `@types/pg` uit `package.json`. |
| `package.json` heette `my-project` | Heet nu `billenboek`. De `version` is ongemoeid gelaten omdat Instellingen die toont. |
| README | Nederlandse README met setup, omgevingsvariabelen, migratievolgorde, Supabase-instellingen, mappenoverzicht en de handleiding voor een nieuwe soort. |
| `[v0]`-logs | Er stond er nog één, in `server.ts`. Die is **weggehaald in plaats van vervangen door `logFout`**: de melding verscheen bij elke weergave van een pagina, omdat Server Components geen cookies mogen schrijven. Dat is normaal, de middleware en de acties vernieuwen de sessie. Elke keer een foutregel loggen was ruis. |
| Lege `File`-bestanden | Drie verwijderd. |

## Lockfile: belangrijk

Doordat vier pakketten uit `package.json` zijn gehaald, **moet `pnpm-lock.yaml` mee veranderen**. Zonder nieuwe lockfile weigert `pnpm install --frozen-lockfile` op Vercel de build. De meegeleverde lockfile is gemaakt met pnpm 9, en het verschil met je oude is alleen verwijderen (0 regels toegevoegd, je eigen pakketten op dezelfde versie). Ik heb hem laten installeren met `--frozen-lockfile` onder pnpm 9 en pnpm 10.

Jouw `package.json` bevat een **override** (`hono: 4.12.25`). Een nieuwere pnpm (11 of 12) negeert die en haalt het `overrides`-blok uit de lockfile weg. Dat levert op Vercel `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` op, ook al werkt `pnpm install` lokaal. Mijn eerste poging, gemaakt met pnpm 12, had precies dit probleem; die heb ik niet geleverd.

- Draai je lokaal pnpm 11 of nieuwer, voer dan geen `pnpm install` uit voordat je de lockfile commit zonder te kijken. Controleer vóór een commit met `git diff pnpm-lock.yaml` dat het blok `overrides: hono: 4.12.25` bovenin nog staat.
- Wil je eigen pakketten bijwerken, gebruik dan pnpm 9 of 10.

## Wat ik heb getest

- `tsc --noEmit` slaagt.
- **Oud tegen nieuw naast elkaar** voor `registraties`: 62 aanroepen (opslaan en bijwerken voor alle 10 soorten met meerdere invoervarianten, ongeldige invoer, verwijderen, `verwijderRegistratie`) gaven identiek resultaat: dezelfde gegevens naar de database, dezelfde fouten, dezelfde herlaadpaden. `getDagGegevens` gaf hetzelfde resultaat met dezelfde 12 queries.
- Ik heb de nieuwe code met opzet gesaboteerd om te controleren dat de test verschillen vindt. De eerste ronde miste een wijziging bij voeding door een blinde vlek in mijn testinvoer; die heb ik aangevuld, daarna werden beide sabotages gevonden.
- De lockfile onder pnpm 9 en 10, plus twee negatieve controles (oude lockfile met nieuwe `package.json`, en een lockfile zonder `overrides`): beide faalden zoals verwacht.

**Niet getest:** de echte Supabase, `next build` (Google Fonts is vanuit mijn omgeving niet bereikbaar), en twee dingen die alleen in een draaiende Next.js-omgeving te testen zijn:
- of `React.cache` de aanroepen binnen één verzoek echt dedupliceert. Als het dat niet zou doen, werkt alles nog steeds gelijk aan voorheen, alleen zonder de winst.
- `getClaims()` in de middleware. Heeft je Supabase-project nog de oude gedeelde JWT-sleutel, dan valt het vanzelf terug op een netwerkaanroep (dan is er geen winst, maar ook geen risico).

## Testlijst (op de Vercel-preview)

1. De build is groen.
2. Inloggen, uitloggen, en na een tijdje (een uur of langer) de app nog eens openen: je blijft ingelogd.
3. Vandaag laden: tellers en tijdlijn kloppen met gisteren.
4. Per soort een registratie toevoegen, bewerken en verwijderen (voeding, luier, temperatuur, spugen, vitamines, medicatie, groei, slapen, huilen, kolven).
5. Een voeding en een luier opslaan en kijken of "laatste voeding" en "laatste luier" in de tellers meekomen.
6. Navigeren tussen tabbladen voelt vlotter, vooral op mobiel.

## Terugdraaien

De onderdelen staan los van elkaar. De middleware terugzetten naar `getUser()` is één regel in `lib/supabase/proxy.ts`. De oude `registraties.ts` staat in je git-geschiedenis (`code-beveiliging`).

// Draaien met: pnpm test  (node:test, geen extra afhankelijkheden)
import test from "node:test"
import assert from "node:assert/strict"
import { isPubliekePad, proxyDoorstuurPad } from "./proxy-beleid.ts"

test("zonder sessie: beveiligde pagina's sturen naar /login", () => {
  for (const pad of ["/", "/geschiedenis", "/notities", "/instellingen/account", "/gezin/kind"]) {
    assert.equal(proxyDoorstuurPad(pad, false), "/login", pad)
  }
})

test("zonder sessie: publieke pagina's blijven bereikbaar (geen lus op /login)", () => {
  for (const pad of ["/login", "/registreren", "/wachtwoord-vergeten", "/gezin/deelnemen", "/gezin/onboarding", "/auth/callback", "/auth/bevestigen"]) {
    assert.equal(proxyDoorstuurPad(pad, false), null, pad)
  }
})

test("met geldige claims: /login wordt NIET door de proxy naar / gestuurd (regressie ERR_TOO_MANY_REDIRECTS)", () => {
  // De claims kunnen kloppen terwijl de sessie bij Supabase niet meer bestaat. De layout stuurt
  // dan naar /login; stuurde de proxy daar terug naar /, dan ontstond een eindeloze lus.
  assert.equal(proxyDoorstuurPad("/login", true), null)
})

test("met geldige claims: alle andere pagina's gaan gewoon door", () => {
  for (const pad of ["/", "/geschiedenis", "/registreren", "/gezin/onboarding"]) {
    assert.equal(proxyDoorstuurPad(pad, true), null, pad)
  }
})

test("de proxy stuurt nooit naar een pad dat zelf weer terugstuurt", () => {
  // Doel van een proxy-redirect moet publiek zijn, anders kan het met claims-zonder-sessie lussen.
  for (const claims of [true, false]) {
    for (const pad of ["/", "/login", "/geschiedenis", "/gezin/kind", "/auth/callback"]) {
      const doel = proxyDoorstuurPad(pad, claims)
      if (doel) assert.ok(isPubliekePad(doel), `${pad} -> ${doel}`)
    }
  }
})

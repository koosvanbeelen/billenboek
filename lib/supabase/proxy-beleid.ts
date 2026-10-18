// Beslisregels van de proxy (middleware) voor doorsturen, los van Next.js en Supabase zodat
// ze eenvoudig te testen zijn.
//
// Belangrijk: de proxy controleert de sessie alleen lokaal (getClaims: handtekening en
// verlooptijd van de JWT). Pagina's en de (app)-layout controleren met getUser() of de sessie
// ook bij Supabase nog bestaat. Die twee kunnen elkaar tegenspreken (bv. sessie ingetrokken
// of gebruiker verwijderd terwijl de JWT nog niet verlopen is). Daarom mag de proxy een
// bezoeker NOOIT van een publieke pagina (zoals /login) terugsturen naar een beveiligde
// pagina: de layout stuurt dan weer naar /login en dat geeft ERR_TOO_MANY_REDIRECTS.
// Wie echt ingelogd is, wordt door de loginpagina zelf (getUser) naar "/" gestuurd.

export function isPubliekePad(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/registreren" ||
    pathname === "/wachtwoord-vergeten" ||
    pathname === "/gezin/deelnemen" ||
    pathname === "/gezin/onboarding" ||
    pathname.startsWith("/auth/")
  )
}

// Geeft het pad waarheen de proxy moet doorsturen, of null om het verzoek door te laten.
export function proxyDoorstuurPad(pathname: string, heeftClaims: boolean): string | null {
  if (!heeftClaims && !isPubliekePad(pathname)) return "/login"
  return null
}

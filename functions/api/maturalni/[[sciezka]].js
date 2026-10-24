/*
 * Cloudflare Pages Function: bramka do API Maturalnych.
 * Adres w aplikacji:  /api/maturalni/lesson-plans/?perPage=100   ->   https://backend.maturalni.com/lesson-plans/?perPage=100
 *
 * Po co: przeglądarka ucznia nie może pytać backend.maturalni.com bezpośrednio (CORS, ewentualny token).
 * Funkcja działa na serwerze Cloudflare, więc token nigdy nie trafia do kodu strony.
 *
 * Token (jeśli API go wymaga): Cloudflare > Workers & Pages > maturalni > Settings > Variables and Secrets
 *   nazwa: MATURALNI_TOKEN, typ: Secret. Funkcja wyśle go jako "Authorization: Bearer <token>".
 *   Jeśli API oczekuje innego nagłówka, ustaw też MATURALNI_NAGLOWEK (np. "x-api-key").
 */
const BAZA = 'https://backend.maturalni.com/';
const DOZWOLONE = ['lesson-plans', 'products', 'course-plans', 'chapters', 'lessons', 'learning-resources', 'categories'];

function json(dane, status) {
  return new Response(JSON.stringify(dane), {
    status: status || 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

export async function onRequestGet(kontekst) {
  const { params, request, env } = kontekst;
  const czesci = [].concat(params.sciezka || []).filter(Boolean);
  if (!czesci.length || DOZWOLONE.indexOf(czesci[0]) === -1) {
    return json({ blad: 'Niedozwolona ścieżka. Dozwolone: ' + DOZWOLONE.join(', ') }, 400);
  }
  const wejscie = new URL(request.url);
  const ukosnik = wejscie.pathname.endsWith('/') ? '/' : '';
  const cel = BAZA + czesci.map(encodeURIComponent).join('/') + ukosnik + wejscie.search;
  const naglowki = { accept: 'application/json' };
  if (env && env.MATURALNI_TOKEN) {
    if (env.MATURALNI_NAGLOWEK) naglowki[env.MATURALNI_NAGLOWEK] = env.MATURALNI_TOKEN;
    else naglowki.authorization = 'Bearer ' + env.MATURALNI_TOKEN;
  }
  try {
    const odp = await fetch(cel, { headers: naglowki });
    const tresc = await odp.text();
    return new Response(tresc, {
      status: odp.status,
      headers: {
        'content-type': odp.headers.get('content-type') || 'application/json; charset=utf-8',
        'cache-control': odp.ok ? 'public, max-age=300' : 'no-store',
        'x-maturalni-cel': cel
      }
    });
  } catch (e) {
    return json({ blad: 'Nie udało się połączyć z API Maturalnych', szczegoly: String(e && e.message || e), cel: cel }, 502);
  }
}

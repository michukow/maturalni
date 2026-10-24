/*
 * app/produkty-api.js: katalog produktów Maturalnych na żywo z API (backend.maturalni.com/products/).
 *
 * - Na starcie (synchronicznie) nakłada na materiały ostatnio pobrane dane z pamięci przeglądarki,
 *   a gdy ich brak: zapis katalogu z dnia hackathonu (SNAPSHOT poniżej, prawdziwe dane z API).
 * - Potem w tle pobiera świeży katalog: najpierw przez bramkę /api/maturalni/products/ (Cloudflare),
 *   a gdy jej nie ma (np. lokalnie), bezpośrednio z backend.maturalni.com.
 * - API zwraca po 10 produktów; nazwę parametru strony wykrywamy automatycznie.
 * Ładowany PRZED app/nauka.js.
 */
(function (root) {
  'use strict';
  const M = root.Mikro = root.Mikro || {};
  const KLUCZ = 'maturalni-produkty-v1';
  const WAZNOSC_MS = 6 * 3600 * 1000;
  const BAZA_BRAMKA = '/api/maturalni/products/';
  const BAZA_API = 'https://backend.maturalni.com/products/';

  // Zapis z 24.10.2026 (strona 1 endpointu products: produkty do matematyki i Bank schematów)
  const SNAPSHOT = [
    { id: '699469ba54b96332e2c6117b', title: 'Arkusz od egzaminatora CKE (matematyka)', examType: 'matura', subject: 'Math', grossPrice: 7900, soldCount: 403,
      thumbnailUrl: 'https://pmaturalnineust01.blob.core.windows.net/photos/87966638-d37b-4b8f-af5f-ba87eb0736ee.png',
      learningResources: [{ id: '6994689854b96332e2c60c04', title: 'Arkusz od egzaminatora CKE (matematyka)', type: 'Url', url: 'https://online.flippingbook.com/view/890985666/', minimumRequiredPremiumStatus: 2, thumbnailUrl: 'https://pmaturalnineust01.blob.core.windows.net/photos/ed7310ad-bdad-4107-b59f-319765b8d1d6.png' }], coursePlans: [] },
    { id: '69a6c66163651df533c164eb', title: 'Bank schematów i gotowców maturalnych', examType: 'matura', subject: 'Other', grossPrice: 14900, soldCount: 2883,
      thumbnailUrl: '',
      learningResources: [{ id: '69a6bbeacf2171a0b3c7edb4', title: 'Bank schematów i gotowców maturalnych', type: 'Url', url: 'https://online.flippingbook.com/view/999105973/', minimumRequiredPremiumStatus: 2, thumbnailUrl: 'https://pmaturalnineust01.blob.core.windows.net/photos/27c96ad4-3636-47ca-ab9b-34d394ec4bb7.png' }], coursePlans: [] },
    { id: '698f0e02bf414c6f25436cfa', title: 'Arkusz od egzaminatora CKE (matematyka)', examType: 'primaryschoolexam', subject: 'Math', grossPrice: 9900, soldCount: 814,
      thumbnailUrl: 'https://pmaturalnineust01.blob.core.windows.net/photos/95bf6fa9-3488-4af1-a94b-58477801edb1.png',
      learningResources: [{ id: '6992ffb4f81f8a94181feb05', title: 'Arkusz od egzaminatora CKE (matematyka)', type: 'Url', url: 'https://online.flippingbook.com/view/118491447/', minimumRequiredPremiumStatus: 2 }], coursePlans: [] },
    { id: '6980c72613965962de6e7691', title: 'Egzaminatorium – matematyka', examType: 'primaryschoolexam', subject: 'Math', grossPrice: 7900, soldCount: 1526,
      thumbnailUrl: 'https://pmaturalnineust01.blob.core.windows.net/photos/42687373-a199-498e-9a4d-1d8c9c8f915e.png',
      learningResources: [{ id: '6980c16f13965962de6e5174', title: 'Egzaminatorium - matematyka', type: 'Url', url: 'https://online.flippingbook.com/view/119506644/', minimumRequiredPremiumStatus: 1 }], coursePlans: [] }
  ];

  // tylko pola potrzebne aplikacji (mniejszy zapis w przeglądarce)
  function przytnij(p) {
    return {
      id: p.id, title: String(p.title || '').trim(), examType: p.examType, subject: p.subject, grossPrice: p.grossPrice, promoPrice: p.promoPrice, soldCount: p.soldCount,
      deleted: !!p.deleted, thumbnailUrl: p.thumbnailUrl || '',
      learningResources: (p.learningResources || []).filter(r => !r.deleted && r.visible !== false).map(r => ({ id: r.id, title: r.title, type: r.type, url: r.url || '', minimumRequiredPremiumStatus: r.minimumRequiredPremiumStatus, thumbnailUrl: r.thumbnailUrl || '' })),
      coursePlans: (p.coursePlans || []).map(c => ({ id: c.id, title: c.title, type: c.type, subject: c.subject, introductionVideoUrl: c.introductionVideoUrl || '', totalCourseTime: c.totalCourseTime || '', numberOfChapters: c.numberOfChapters, numberOfLessons: c.numberOfLessons, chapters: c.chapters || [], slug: c.slug || '' }))
    };
  }
  function wczytajPamiec() { try { return JSON.parse(localStorage.getItem(KLUCZ)); } catch (e) { return null; } }

  const IDX = {};
  function indeksuj(lista) { Object.keys(IDX).forEach(k => delete IDX[k]); lista.forEach(p => { IDX[p.id] = p; }); }
  const czyMatma = p => /Math/.test(p.subject || '') || p.coursePlans.some(c => /Math/.test(c.subject || '')) || /matemat/i.test(p.title);
  const czyMatura = p => p.examType === 'matura';

  // Nakłada dane produktów na części materiałów (po produktId): tytuł, okładka, link, poziom Premium, cena.
  function zastosuj() {
    if (!M.MATERIALY) return;
    Object.keys(M.MATERIALY).forEach(komp => M.MATERIALY[komp].forEach(c => {
      if (!c.produktId) return;
      const p = IDX[c.produktId];
      if (!p) { c.niedostepny = true; return; }
      const r = p.learningResources[0] || {};
      c.niedostepny = false;
      c.produkt = p.title;
      c.okladka = r.thumbnailUrl || p.thumbnailUrl || c.okladka || '';
      c.urlBazowy = r.url || c.urlBazowy || '';
      c.url = c.urlBazowy && c.strona ? c.urlBazowy.replace(/\/?$/, '/') + c.strona + '/' : c.urlBazowy;
      c.premium = r.minimumRequiredPremiumStatus || null;
      c.cena = p.grossPrice || null;
    }));
  }

  async function pobierzStrone(baza, param, nr) {
    const url = baza + (param && nr > 1 ? '?' + param.replace('{n}', nr) : '');
    const odp = await fetch(url, { headers: { accept: 'application/json' } });
    if (!odp.ok) throw new Error('HTTP ' + odp.status);
    const json = await odp.json();
    if (!json || !Array.isArray(json.items)) throw new Error('Nieoczekiwany format odpowiedzi');
    return json;
  }
  // Szuka nazwy parametru strony, który faktycznie zwraca inne produkty niż strona 1.
  const WARIANTY = ['page={n}', 'Page={n}', 'pageNumber={n}', 'PageNumber={n}', 'p={n}', 'currentPage={n}', 'page={n}&perPage=10', 'PageNumber={n}&PageSize=10'];
  async function pobierzWszystko() {
    let baza = BAZA_BRAMKA, s1, zrodlo = 'bramka';
    try { s1 = await pobierzStrone(baza, null, 1); }
    catch (e) { baza = BAZA_API; zrodlo = 'bezpośrednio'; s1 = await pobierzStrone(baza, null, 1); }
    const wszystkie = s1.items.slice();
    const meta = s1.meta || {};
    const stron = meta.totalPages || 1;
    let param = null;
    if (stron > 1) {
      const pierwsze = s1.items.map(x => x.id).join();
      for (const w of WARIANTY) {
        try {
          const s2 = await pobierzStrone(baza, w, 2);
          if (s2.items.length && s2.items.map(x => x.id).join() !== pierwsze) { param = w; wszystkie.push(...s2.items); break; }
        } catch (e) { /* następny wariant */ }
      }
      if (param) for (let n = 3; n <= Math.min(stron, 30); n++) {
        try { wszystkie.push(...(await pobierzStrone(baza, param, n)).items); } catch (e) { break; }
      }
    }
    const lista = wszystkie.filter(p => p && p.id && !p.deleted).map(przytnij);
    return { lista: lista, zrodlo: zrodlo, param: param, stron: stron, wszystkichWApi: meta.total || lista.length };
  }

  // ───────── start: dane z pamięci albo zapis ─────────
  const pamiec = wczytajPamiec();
  const start = pamiec && Array.isArray(pamiec.lista) ? pamiec.lista : SNAPSHOT.map(przytnij);
  indeksuj(start);
  zastosuj();
  M.produktyInfo = pamiec
    ? { stan: 'pamiec', czas: pamiec.czas, liczba: pamiec.lista.length, wszystkichWApi: pamiec.wszystkichWApi, stron: pamiec.stron, param: pamiec.param, zrodlo: pamiec.zrodlo }
    : { stan: 'zapis', czas: '2026-10-24T12:00:00', liczba: start.length, wszystkichWApi: 78, stron: 8, param: null };

  let trwa = null;
  M.odswiezProdukty = function (wymus) {
    if (trwa) return trwa;
    const p = wczytajPamiec();
    if (!wymus && p && Date.now() - new Date(p.czas).getTime() < WAZNOSC_MS) return Promise.resolve(false);
    trwa = pobierzWszystko().then(w => {
      const zapis = { czas: new Date().toISOString(), lista: w.lista, zrodlo: w.zrodlo, param: w.param, stron: w.stron, wszystkichWApi: w.wszystkichWApi };
      try { localStorage.setItem(KLUCZ, JSON.stringify(zapis)); } catch (e) { /* bez zapisu */ }
      indeksuj(w.lista);
      zastosuj();
      M.produktyInfo = { stan: 'na-zywo', czas: zapis.czas, liczba: w.lista.length, wszystkichWApi: w.wszystkichWApi, stron: w.stron, param: w.param, zrodlo: w.zrodlo };
      return true;
    }).catch(e => {
      M.produktyInfo = Object.assign({}, M.produktyInfo, { blad: String(e && e.message || e) });
      return false;
    }).finally(() => {
      trwa = null;
      try { root.dispatchEvent(new CustomEvent('maturalni-produkty', { detail: M.produktyInfo })); } catch (e) { /* stare przeglądarki */ }
    });
    return trwa;
  };
  M.produktyMatematyka = () => Object.keys(IDX).map(k => IDX[k]).filter(p => czyMatma(p) || /schemat/i.test(p.title)).sort((a, b) => (czyMatura(b) - czyMatura(a)) || a.title.localeCompare(b.title));
  M.produkt = id => IDX[id] || null;
  M.cenaZl = gr => gr ? (gr / 100).toFixed(2).replace('.', ',').replace(',00', '') + ' zł' : '';

  // odśwież w tle zaraz po starcie (nie blokuje wyświetlania)
  setTimeout(() => { M.odswiezProdukty(false); }, 0);
})(window);

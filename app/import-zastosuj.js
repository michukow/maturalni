/*
 * app/import-zastosuj.js: podmienia przykładowe części materiałów na lekcje zaimportowane z API Maturalnych.
 * Ładowany PRZED app/nauka.js, bo silnik czyta materiały w chwili utworzenia.
 * Źródła (od najważniejszego): import w tej przeglądarce (localStorage), plik silnik/materialy-maturalni.js.
 */
(function (root) {
  'use strict';
  const M = root.Mikro = root.Mikro || {};
  const KLUCZ = 'maturalni-import-v1';

  function vimeoId(url) { const m = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url || ''); return m ? m[1] : null; }
  function typZUrl(url, typ) {
    if (typ === 'wideo' || typ === 'tekst' || typ === 'link') return typ;
    if (/vimeo|youtu|\.mp4|wistia|video/i.test(url || '')) return 'wideo';
    if (/flippingbook|\.pdf/i.test(url || '')) return 'tekst';
    if (!url) return 'wideo'; // lekcja kursu bez linku do pliku: zwykle wideo
    return 'link';
  }
  function czescZLekcji(l) {
    const typ = typZUrl(l.url, l.typ);
    const min = Math.max(1, Math.round(l.minuty || 10));
    const czesc = {
      id: 'imp-' + l.id, typ: typ === 'link' ? 'tekst' : typ, nazwa: l.tytul, minuty: min,
      produkt: (l.kontekst || '').split(' > ')[0] || 'Maturalni', fragment: l.kontekst || '', url: l.url || '',
      zaimportowane: true
    };
    if (typ === 'wideo') czesc.wideo = { lekcja: l.tytul, od: l.od || 0, do: l.do || min * 60, dlugosc: l.dlugosc || min * 60, vimeo: vimeoId(l.url) };
    if (typ !== 'wideo') czesc.osadz = true; // pokaż stronę materiału w ramce
    return czesc;
  }

  function zastosuj(imp) {
    if (!imp || !Array.isArray(imp.lekcje) || !M.MATERIALY) return 0;
    const wgKomp = {};
    imp.lekcje.forEach(l => { if (l.komp && M.MATERIALY[l.komp]) (wgKomp[l.komp] = wgKomp[l.komp] || []).push(czescZLekcji(l)); });
    Object.keys(wgKomp).forEach(komp => {
      const nowe = wgKomp[komp];
      let czesci = M.MATERIALY[komp].slice();
      if (nowe.some(c => c.typ === 'wideo')) czesci = czesci.filter(c => !(c.typ === 'wideo' && c.przyklad));
      const wideo = nowe.filter(c => c.typ === 'wideo'), inne = nowe.filter(c => c.typ !== 'wideo');
      const iTekst = czesci.findIndex(c => c.typ === 'tekst');
      czesci.splice(0, 0, ...wideo);
      const poz = iTekst === -1 ? czesci.length : czesci.findIndex(c => c.typ === 'tekst') + 1;
      czesci.splice(poz, 0, ...inne);
      M.MATERIALY[komp] = czesci;
    });
    return Object.keys(wgKomp).length;
  }

  let zLocal = null;
  try { zLocal = JSON.parse(localStorage.getItem(KLUCZ)); } catch (e) { zLocal = null; }
  const aktywny = zLocal || M.IMPORT_MATURALNI || null;
  const ile = zastosuj(aktywny);
  M.importInfo = aktywny ? { zrodlo: zLocal ? 'przeglądarka' : 'plik w repozytorium', data: aktywny.data, lekcji: (aktywny.lekcje || []).length, przypisanych: (aktywny.lekcje || []).filter(l => l.komp).length, tematow: ile } : null;
  M.IMPORT_KLUCZ = KLUCZ;
  M.vimeoId = vimeoId;
})(window);

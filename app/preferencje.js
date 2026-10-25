/*
 * app/preferencje.js: ostatni ekran Diagnozy (Kompasu) po 22 pytaniach: suwaki jak w kalibracji Maturalnych.
 * Przedmioty szkolne (Podstawowy > Ekspert) oraz zarobki, ambicja i ile chcesz pracować, wszystko na jednym ekranie.
 * Gdzie się przydaje:
 *  - wynik Kompasu: ostrzeżenie, gdy ścieżka wymaga przedmiotu, którego uczeń chce używać minimalnie,
 *  - AI w Kompasie (prompt 1 i 2): preferencje idą razem z wynikiem testu,
 *  - kalibracja matematyki: ambicja ustawia startowy cel %, a gotowość do pracy startowe minuty dziennie.
 */
(function (root) {
  'use strict';
  const N = root.Nauka, esc = N.pomoc.esc;
  const $ = id => document.getElementById(id);
  const app = document.getElementById('app');
  const KLUCZ = 'maturalni-preferencje-v1';

  const PRZEDMIOTY = [
    ['mat', 'Matematyka'], ['pol', 'J. polski'], ['obcy', 'J. angielski'], ['bio', 'Biologia'], ['chem', 'Chemia'],
    ['fiz', 'Fizyka'], ['inf', 'Informatyka'], ['geo', 'Geografia'], ['his', 'Historia'], ['wos', 'WOS']
  ];
  const POZIOMY = ['Podstawowy', 'Średni', 'Zaawansowany', 'Ekspert'];
  const OPIS_POZIOMOW = [
    'chcę go znać tylko w takim stopniu, w jakim przyda się w codziennym życiu',
    'przyda mi się w pracy od czasu do czasu',
    'chcę go używać w pracy na co dzień',
    'chcę na nim zbudować swoją karierę'
  ];
  const PRACA = [
    { id: 'zarobki', t: 'Ile chcesz zarabiać?', od: 'Na spokojne życie', do: 'Jak najwięcej', poz: ['Na spokojne życie', 'Powyżej średniej', 'Dużo', 'Jak najwięcej'] },
    { id: 'ambicja', t: 'Jak bardzo jesteś ambitny(-a)?', od: 'Wystarczy, że zdam', do: 'Chcę być w czołówce', poz: ['Wystarczy, że zdam', 'Chcę dobrze wypaść', 'Celuję wysoko', 'Chcę być w czołówce'] },
    { id: 'praca', t: 'Ile chcesz pracować?', od: 'Praca to tylko część życia', do: 'Na pełnych obrotach', poz: ['Praca to tylko część życia', 'Zwykły etat', 'Mogę więcej, jeśli to ma sens', 'Na pełnych obrotach'] }
  ];

  function domyslne() { const p = { przedmioty: {}, zarobki: 1, ambicja: 1, praca: 1 }; PRZEDMIOTY.forEach(([id]) => { p.przedmioty[id] = 1; }); return p; }
  function wczytaj() { try { return JSON.parse(localStorage.getItem(KLUCZ)) || null; } catch (e) { return null; } }
  function zapisz(p) { try { localStorage.setItem(KLUCZ, JSON.stringify(p)); } catch (e) { /* bez zapisu */ } }

  const suwak = (id, v, etykieta) => `<input type="range" class="pref-suwak" id="${id}" min="0" max="3" step="1" value="${v}" aria-label="${esc(etykieta)}" aria-valuetext="${esc(etykieta)}">`;

  function widok() {
    const p = wczytaj() || domyslne();
    app.innerHTML = `
      <span class="eyebrow">01 / Diagnoza · ostatni krok testu</span>
      <h1 class="pref-h">Przedmioty szkolne</h1>
      <p>Z którymi przedmiotami szkolnymi wiążesz swoją przyszłość zawodową, a które chcesz wykorzystywać jedynie w minimalnym stopniu? <b>Zaznacz na poniższych suwakach swoje preferencje.</b></p>
      <details class="pref-info"><summary><span class="i">i</span>Co oznaczają poszczególne poziomy przedmiotów?</summary>
        <ul>${POZIOMY.map((n, i) => `<li><b>${n}:</b> ${OPIS_POZIOMOW[i]}</li>`).join('')}</ul></details>
      <div class="pref-lista">${PRZEDMIOTY.map(([id, n]) => `<div class="pref-wiersz">
          <div class="pref-nazwa"><b>${esc(n)}</b><span class="pref-wart" id="w-${id}">${POZIOMY[p.przedmioty[id]]}</span></div>
          ${suwak('s-' + id, p.przedmioty[id], n + ': ' + POZIOMY[p.przedmioty[id]])}
          <div class="pref-konce"><span>Podstawowy</span><span>Ekspert</span></div></div>`).join('')}</div>
      <h2 class="pref-h">Ty i Twoja przyszła praca</h2>
      <p>Tu też nie ma dobrych ani złych odpowiedzi. Pomoże nam to dobrać kierunki i ustawić cel na maturze.</p>
      <div class="pref-lista">${PRACA.map(x => `<div class="pref-wiersz">
          <div class="pref-nazwa"><b>${esc(x.t)}</b><span class="pref-wart" id="w-${x.id}">${esc(x.poz[p[x.id]])}</span></div>
          ${suwak('s-' + x.id, p[x.id], x.t + ' ' + x.poz[p[x.id]])}
          <div class="pref-konce"><span>${esc(x.od)}</span><span>${esc(x.do)}</span></div></div>`).join('')}</div>
      ${N.duo('dalejP', 'Dalej', 'wsteczP', '← Wstecz')}
      <button class="btn link" id="odNowaP" style="align-self:center">↺ Zacznij test od nowa</button>`;
    const ustaw = (id, v, tekst) => { const s = $('s-' + id); s.style.setProperty('--p', (v / 3 * 100) + '%'); s.setAttribute('aria-valuetext', tekst); $('w-' + id).textContent = tekst; };
    PRZEDMIOTY.forEach(([id]) => {
      ustaw(id, p.przedmioty[id], POZIOMY[p.przedmioty[id]]);
      $('s-' + id).oninput = e => { p.przedmioty[id] = +e.target.value; ustaw(id, p.przedmioty[id], POZIOMY[p.przedmioty[id]]); zapisz(p); };
    });
    PRACA.forEach(x => {
      ustaw(x.id, p[x.id], x.poz[p[x.id]]);
      $('s-' + x.id).oninput = e => { p[x.id] = +e.target.value; ustaw(x.id, p[x.id], x.poz[p[x.id]]); zapisz(p); };
    });
    $('dalejP').onclick = () => { p.zapisane = true; zapisz(p); N.go(root.KompasAI ? 'kompas-ai' : 'kompas-wynik'); };
    $('wsteczP').onclick = () => N.go('kompas-test');
    $('odNowaP').onclick = () => N.kompasOdNowa && N.kompasOdNowa();
  }

  // dla wyniku Kompasu, AI i kalibracji
  function preferencje() { const p = wczytaj(); return p && p.zapisane ? p : null; }
  function opis() {
    const p = preferencje(); if (!p) return null;
    return {
      przedmioty: PRZEDMIOTY.map(([id, n]) => ({ nazwa: n, poziom: POZIOMY[p.przedmioty[id]] })),
      zarobki: PRACA[0].poz[p.zarobki], ambicja: PRACA[1].poz[p.ambicja], praca: PRACA[2].poz[p.praca]
    };
  }
  // przedmioty ścieżki (id), których uczeń chce używać minimalnie
  function konflikty(klucze) {
    const p = preferencje(); if (!p) return [];
    return (klucze || []).filter(id => p.przedmioty[id] === 0).map(id => (PRZEDMIOTY.find(x => x[0] === id) || [id, id])[1]);
  }
  const poziomPrzedmiotu = id => { const p = preferencje(); return p && p.przedmioty[id] != null ? p.przedmioty[id] : null; };
  // startowe ustawienia kalibracji matematyki
  function startKalibracji() {
    const p = preferencje(); if (!p) return null;
    return { cel: [55, 70, 80, 90][p.ambicja], minut: [10, 15, 30, 45][p.praca] };
  }

  N.rejestruj({ 'kompas-preferencje': widok }, ['kompas-preferencje']);
  Object.assign(N, { preferencje: preferencje, preferencjeOpis: opis, preferencjeKonflikty: konflikty, preferencjePoziom: poziomPrzedmiotu, preferencjeKalibracja: startKalibracji, POZIOMY_PRZEDMIOTOW: POZIOMY });
})(window);

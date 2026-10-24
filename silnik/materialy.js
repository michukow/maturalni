/*
 * materialy.js: materiały Maturalnych podzielone na krótkie części, osobno dla każdej mikrokompetencji
 *
 * Problem: produkty Maturalnych to całe kursy i arkusze (godziny materiału).
 * Rozwiązanie: każda mikrokompetencja dostaje swoje części, każda po kilka minut:
 *   wideo   = fragment lekcji z kursu (od-do w sekundach), więc nie trzeba nic nagrywać od nowa
 *   tekst   = notatka / schemat (na podstawie "Banku schematów i gotowców maturalnych")
 *   trening = krótkie pytania z natychmiastową odpowiedzią (bank pytań aplikacji)
 *   arkusz  = zadania z "Arkusza od egzaminatora CKE"
 *
 * KURS ma kształt jak w API Maturalnych (coursePlans > chapters > lessons). Na razie to DANE PRZYKŁADOWE
 * (przyklad: true), bo lekcje z endpointu lesson-plans nie były dostępne. Ekran "Import materiałów"
 * w aplikacji podmienia je na prawdziwe lekcje i zapisuje mapowanie lekcja > mikrokompetencja.
 *
 * Do ręcznej edycji (Milena): NOTATKI (treść notatek) oraz fragmenty "do uzupełnienia".
 */
(function (root) {
  const W = typeof module !== 'undefined' && module.exports && typeof require === 'function';
  const M = W ? Object.assign({}, require('./matryca'), require('./pytania')) : (root.Mikro || {});
  const KOMPETENCJE = M.KOMPETENCJE || [], DZIALY = M.DZIALY || [], PYTANIA = M.PYTANIA || [];

  // ───────────── produkty Maturalnych (z endpointu products) ─────────────
  const PRODUKTY = {
    kurs: {
      tytul: 'Kurs maturalny 2027: matematyka podstawowa', url: 'https://maturalni.com/', przyklad: true,
      opis: 'Kurs wideo (dane przykładowe, struktura jak coursePlans w API)'
    },
    bank: {
      produktId: '69a6c66163651df533c164eb', externalId: 588601, tytul: 'Bank schematów i gotowców maturalnych',
      url: 'https://online.flippingbook.com/view/999105973/', cenaBrutto: 14900,
      okladka: 'https://pmaturalnineust01.blob.core.windows.net/photos/27c96ad4-3636-47ca-ab9b-34d394ec4bb7.png'
    },
    arkusz: {
      produktId: '699469ba54b96332e2c6117b', externalId: 586068, tytul: 'Arkusz od egzaminatora CKE (matematyka)',
      url: 'https://online.flippingbook.com/view/890985666/', cenaBrutto: 7900,
      okladka: 'https://pmaturalnineust01.blob.core.windows.net/photos/ed7310ad-bdad-4107-b59f-319765b8d1d6.png'
    }
  };

  // ───────────── notatki pisane ręcznie (zakres demo: trygonometria i jej podstawy) ─────────────
  // Bloki: p = akapit, wzor = wzór w ramce, lista = punkty, tabela = { naglowki, wiersze },
  //        przyklad = przykład krok po kroku, uwaga = najczęstszy błąd
  const NOTATKI = {
    'LR-02': [
      { t: 'wzor', x: 'aᵐ · aⁿ = aᵐ⁺ⁿ    aᵐ : aⁿ = aᵐ⁻ⁿ    (aᵐ)ⁿ = aᵐ·ⁿ    √(a·b) = √a · √b' },
      { t: 'p', x: 'Zanim pomnożysz potęgi, sprowadź je do tej samej podstawy, np. 4³ = (2²)³ = 2⁶. Pod pierwiastkiem szukaj kwadratów: 50 = 25 · 2, 8 = 4 · 2.' },
      { t: 'przyklad', x: ['2⁵ · 4³ = 2⁵ · 2⁶ = 2¹¹', '√50 − √8 = 5√2 − 2√2 = 3√2'] },
      { t: 'uwaga', x: '√a − √b to nie to samo co √(a − b). Wykładniki dodajemy tylko przy tej samej podstawie.' }
    ],
    'PL-01': [
      { t: 'p', x: 'W trójkącie prostokątnym suma kwadratów przyprostokątnych równa się kwadratowi przeciwprostokątnej, czyli najdłuższego boku, leżącego naprzeciw kąta prostego.' },
      { t: 'wzor', x: 'a² + b² = c²' },
      { t: 'p', x: 'Twierdzenie odwrotne: dla boków a ≤ b ≤ c, jeśli a² + b² = c², to trójkąt jest prostokątny. Gdy a² + b² > c², jest ostrokątny, a gdy a² + b² < c², rozwartokątny.' },
      { t: 'przyklad', x: ['Przyprostokątne 6 i 8', 'c² = 36 + 64 = 100', 'c = 10'] },
      { t: 'lista', x: ['Trójki pitagorejskie warte zapamiętania: 3, 4, 5 · 5, 12, 13 · 8, 15, 17', 'Ich wielokrotności też działają, np. 6, 8, 10'] },
      { t: 'uwaga', x: 'Dodajemy kwadraty, a nie same długości (6 + 8 = 14 to błąd). Na końcu wyciągamy pierwiastek.' }
    ],
    'TR-01': [
      { t: 'p', x: 'Zaznacz kąt ostry α. Nazwij boki: a to przyprostokątna NAPRZECIW kąta, b to przyprostokątna PRZY kącie, c to przeciwprostokątna.' },
      { t: 'wzor', x: 'sin α = a / c     cos α = b / c     tg α = a / b' },
      { t: 'lista', x: ['sinus = naprzeciw / przeciwprostokątna', 'cosinus = przy / przeciwprostokątna', 'tangens = naprzeciw / przy'] },
      { t: 'przyklad', x: ['Trójkąt 3, 4, 5, kąt α naprzeciw boku 3', 'sin α = 3/5, cos α = 4/5, tg α = 3/4'] },
      { t: 'uwaga', x: 'Najczęstszy błąd to zamiana sinusa z cosinusem. Zawsze zacznij od zaznaczenia kąta i podpisania boków „naprzeciw” i „przy”.' }
    ],
    'TR-02': [
      { t: 'tabela', x: { naglowki: ['kąt', 'sin', 'cos', 'tg'], wiersze: [['30°', '1/2', '√3/2', '√3/3'], ['45°', '√2/2', '√2/2', '1'], ['60°', '√3/2', '1/2', '√3']] } },
      { t: 'p', x: 'Sposób na zapamiętanie sinusów: √1/2, √2/2, √3/2 dla 30°, 45°, 60°. Licznik rośnie, a cosinusy idą w odwrotnej kolejności.' },
      { t: 'p', x: 'sin 30° = cos 60° i sin 60° = cos 30°, bo sin α = cos(90° − α).' },
      { t: 'przyklad', x: ['sin 30° + cos 60° = 1/2 + 1/2 = 1'] },
      { t: 'uwaga', x: 'tg 45° = 1, bo przyprostokątne są równe. Nie myl go z sin 45° = √2/2.' }
    ],
    'TR-03': [
      { t: 'p', x: 'Dla kąta rozwartego (90° < α < 180°): sinus jest dodatni, cosinus i tangens ujemne.' },
      { t: 'wzor', x: 'sin(180° − α) = sin α     cos(180° − α) = −cos α' },
      { t: 'lista', x: ['sin 0° = 0, cos 0° = 1', 'sin 90° = 1, cos 90° = 0, tg 90° nie istnieje', 'sin 180° = 0, cos 180° = −1'] },
      { t: 'przyklad', x: ['α rozwarty, sin α = 3/5', 'cos²α = 1 − 9/25 = 16/25, więc cos α = 4/5 albo −4/5', 'kąt rozwarty, więc cos α = −4/5'] },
      { t: 'uwaga', x: 'Po wyciągnięciu pierwiastka zawsze sprawdź znak: dla kąta rozwartego cosinus jest ujemny.' }
    ],
    'TR-04': [
      { t: 'wzor', x: 'sin²α + cos²α = 1     tg α = sin α / cos α' },
      { t: 'p', x: 'Znając jedną funkcję, obliczysz pozostałe. Dla kąta ostrego wszystkie wartości są dodatnie.' },
      { t: 'przyklad', x: ['α ostry, cos α = 0,6', 'sin²α = 1 − 0,36 = 0,64, więc sin α = 0,8', 'tg α = 0,8 / 0,6 = 4/3'] },
      { t: 'uwaga', x: 'Najpierw kwadrat, potem odejmowanie (1 − 0,6 = 0,4 to błąd). Na końcu pierwiastek: 0,64 to sin²α, a nie sin α.' }
    ],
    'TR-05': [
      { t: 'p', x: 'Rozwiązać trójkąt to obliczyć brakujące boki i kąty. Zaznacz kąt, podpisz boki, wybierz funkcję, która łączy to, co znasz, z tym, czego szukasz.' },
      { t: 'lista', x: ['Znasz przeciwprostokątną, szukasz boku naprzeciw kąta: sinus', 'Znasz przeciwprostokątną, szukasz boku przy kącie: cosinus', 'Znasz jedną przyprostokątną, szukasz drugiej: tangens'] },
      { t: 'przyklad', x: ['Przeciwprostokątna 10, kąt 30°', 'bok naprzeciw kąta: 10 · sin 30° = 10 · 1/2 = 5', 'bok przy kącie: 10 · cos 30° = 5√3'] },
      { t: 'przyklad', x: ['Drabina 4 m, kąt z ziemią 60°', 'wysokość = 4 · sin 60° = 2√3 m ≈ 3,46 m'] },
      { t: 'uwaga', x: 'Sprawdź, przy czym leży kąt z treści (przy ziemi czy przy ścianie). To zmienia, który bok jest „naprzeciw”, a który „przy”.' }
    ],
    'TR-06': [
      { t: 'wzor', x: 'c² = a² + b² − 2ab · cos γ' },
      { t: 'p', x: 'γ to kąt między bokami a i b, leżący naprzeciw boku c. Dla γ = 90° cos γ = 0 i zostaje twierdzenie Pitagorasa.' },
      { t: 'przyklad', x: ['a = 5, b = 8, γ = 60°', 'c² = 25 + 64 − 2 · 5 · 8 · 1/2 = 89 − 40 = 49', 'c = 7'] },
      { t: 'uwaga', x: 'Kąt we wzorze musi leżeć MIĘDZY znanymi bokami. Dla kąta rozwartego cos γ < 0, więc wynik wychodzi większy niż z Pitagorasa.' }
    ],
    'TR-07': [
      { t: 'wzor', x: 'P = ½ · a · b · sin γ' },
      { t: 'p', x: 'Działa w każdym trójkącie, gdy znasz dwa boki i kąt między nimi. Dla kąta prostego sin 90° = 1 i wracamy do ½ · a · b.' },
      { t: 'przyklad', x: ['a = 6, b = 8, γ = 30°', 'P = ½ · 6 · 8 · ½ = 12'] },
      { t: 'p', x: 'Pole równoległoboku (np. rombu) o bokach a, b i kącie γ: P = a · b · sin γ.' },
      { t: 'uwaga', x: 'Nie gub ½ i bierz sinus kąta leżącego między znanymi bokami.' }
    ]
  };

  // ───────────── kurs wideo w kształcie API (chapters > lessons > fragmenty) ─────────────
  const DL_WYJ = { 1: 6, 2: 7, 3: 8 }, DL_PRZ = { 2: 5, 3: 6 };
  const pad = n => String(n).padStart(2, '0');
  function czas(s) { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + pad(m) : m) + ':' + pad(x); }

  const KURS = { id: 'demo-kurs-mat-pp-2027', title: PRODUKTY.kurs.tytul, type: 'Course', subject: 'Math', examType: 'matura', przyklad: true, chapters: [] };
  const FRAGMENTY = {}; // komp -> [{ lekcja, od, do, rodzaj }]
  DZIALY.forEach(d => {
    const ks = KOMPETENCJE.filter(k => k.dzial === d.id);
    const rozdzial = { id: 'rozdzial-' + d.id, title: d.id + '. ' + d.nazwa, lessons: [] };
    for (let i = 0; i < ks.length; i += 3) {
      const grupa = ks.slice(i, i + 3);
      const nr = rozdzial.lessons.length + 1;
      const lekcja = { id: 'lekcja-' + d.id + '-' + nr, title: d.nazwa + ', lekcja ' + nr, videoUrl: null, durationSeconds: 0, fragmenty: [] };
      let t = 90; // wstęp
      grupa.forEach(k => {
        const f = [{ rodzaj: 'wyjasnienie', dl: DL_WYJ[k.poziom] * 60 }];
        if (k.poziom >= 2) f.push({ rodzaj: 'przyklad', dl: DL_PRZ[k.poziom] * 60 + 40 });
        f.forEach(x => {
          const frag = { komp: k.id, rodzaj: x.rodzaj, od: t, do: t + x.dl };
          lekcja.fragmenty.push(frag);
          (FRAGMENTY[k.id] = FRAGMENTY[k.id] || []).push(Object.assign({ lekcja: lekcja, rozdzial: rozdzial }, frag));
          t += x.dl + 30;
        });
      });
      lekcja.durationSeconds = t + 60;
      rozdzial.lessons.push(lekcja);
    }
    KURS.chapters.push(rozdzial);
  });

  // ───────────── notatka automatyczna (gdy brak ręcznej) ─────────────
  function notatkaAuto(k) {
    const pyt = PYTANIA.filter(q => q.komp === k.id);
    const bloki = [{ t: 'p', x: 'Wymaganie CKE ' + k.cke + ': ' + k.nazwa + '. Poniżej rozwiązany przykład i błędy, które najczęściej kosztują tu punkty.' }];
    if (pyt[0]) bloki.push({ t: 'przyklad', x: [pyt[0].tresc, 'Odpowiedź: ' + pyt[0].odp[0]] });
    const bledy = [];
    pyt.forEach(q => Object.keys(q.bledy || {}).forEach(i => {
      const opis = q.bledy[i].replace(/^PRE:\S+\s*/, '');
      if (opis && bledy.indexOf(opis) === -1) bledy.push(opis);
    }));
    if (bledy.length) bloki.push({ t: 'uwaga', x: 'Uważaj na: ' + bledy.slice(0, 3).join('; ') + '.' });
    const pre = (k.wymaga || []).map(id => (KOMPETENCJE.find(x => x.id === id) || {}).nazwa).filter(Boolean);
    if (pre.length) bloki.push({ t: 'p', x: 'Ten temat opiera się na: ' + pre.join(', ') + '. Jeśli coś tu nie wychodzi, zacznij od podstaw.' });
    return bloki;
  }

  // ───────────── części dla każdej mikrokompetencji ─────────────
  const CZAS = { 1: 45, 2: 60, 3: 75 };
  const MATERIALY = {};
  KOMPETENCJE.forEach(k => {
    const dz = DZIALY.find(d => d.id === k.dzial) || { nazwa: '' };
    const czesci = [];
    (FRAGMENTY[k.id] || []).forEach((f, i) => {
      const min = Math.round((f.do - f.od) / 60);
      czesci.push({
        id: k.id + '-w' + (i + 1), typ: 'wideo',
        nazwa: f.rodzaj === 'wyjasnienie' ? 'Wyjaśnienie: ' + k.nazwa : 'Przykład krok po kroku',
        minuty: min, produkt: PRODUKTY.kurs.tytul, url: PRODUKTY.kurs.url,
        fragment: f.rozdzial.title + ' · ' + f.lekcja.title + ' · ' + czas(f.od) + '-' + czas(f.do),
        wideo: { lekcja: f.lekcja.title, lekcjaId: f.lekcja.id, od: f.od, do: f.do, dlugosc: f.lekcja.durationSeconds, vimeo: null },
        przyklad: true
      });
    });
    const reczna = NOTATKI[k.id];
    czesci.push({
      id: k.id + '-t', typ: 'tekst', nazwa: 'Notatka: ' + k.nazwa, minuty: reczna ? 6 : 4,
      produkt: PRODUKTY.bank.tytul, url: PRODUKTY.bank.url, okladka: PRODUKTY.bank.okladka,
      fragment: 'Schemat do tematu „' + k.nazwa + '” (strona do uzupełnienia)',
      notatka: reczna || notatkaAuto(k), przyklad: !reczna, notatkaReczna: !!reczna
    });
    const pyt = PYTANIA.filter(q => q.komp === k.id).map(q => q.id);
    if (pyt.length) czesci.push({ id: k.id + '-q', typ: 'trening', nazwa: 'Szybki trening: ' + pyt.length + ' ' + (pyt.length === 1 ? 'pytanie' : 'pytania') + ' z odpowiedzią od razu', minuty: Math.max(3, pyt.length * 2), pytania: pyt });
    const juz = czesci.reduce((s, c) => s + c.minuty, 0);
    let reszta = Math.max(10, (CZAS[k.poziom] || 60) - juz);
    const ile = reszta > 25 ? 2 : 1;
    for (let i = 1; i <= ile; i++) {
      const m = i < ile ? Math.round(reszta / ile / 5) * 5 : reszta - Math.round(reszta / ile / 5) * 5 * (ile - 1);
      czesci.push({
        id: k.id + '-a' + i, typ: 'arkusz', nazwa: 'Zadania z arkusza CKE' + (ile > 1 ? ' (zestaw ' + i + ' z ' + ile + ')' : ''), minuty: m,
        produkt: PRODUKTY.arkusz.tytul, url: PRODUKTY.arkusz.url, okladka: PRODUKTY.arkusz.okladka,
        fragment: 'Zadania z działu ' + dz.nazwa + ' do tematu „' + k.nazwa + '” (numery do uzupełnienia)'
      });
    }
    MATERIALY[k.id] = czesci;
  });

  const MATERIALY_DZIALU = { '*': [] };
  const eksport = { MATERIALY: MATERIALY, MATERIALY_DZIALU: MATERIALY_DZIALU, KURS_DEMO: KURS, PRODUKTY: PRODUKTY, NOTATKI: NOTATKI, czasWideo: czas };
  if (W) module.exports = eksport;
  else root.Mikro = Object.assign(root.Mikro || {}, eksport);
})(typeof window !== 'undefined' ? window : globalThis);

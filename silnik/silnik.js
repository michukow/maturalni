/*
 * silnik.js: silnik mikrokompetencji (matematyka, poziom podstawowy)
 *
 * JEDEN model wiedzy ucznia: dla każdej mikrokompetencji szacowany poziom opanowania (0-100%)
 * i pewność tego szacunku. Wszystkie kroki aplikacji czytają i zapisują ten sam stan:
 *
 *   ankieta ──> nowyStan()          wstępny szacunek z kalibracji (słaby dowód)
 *   test    ──> diagnoza adaptacyjna (A2) + cofanie w matrycy (A3) + przyczyny błędów
 *   plan    ──> zaplanuj()          priorytety (A4), harmonogram z buforem i blokadami (A5)
 *   quiz    ──> bramka 70% (A6), 2 porażki = cofnięcie do podstaw + materiał dostosowany
 *   powtórka──> odstępy rosną, gdy idzie dobrze (2, 5, 12, 30 dni), skracają się po błędzie
 *   diagnoza pełna ──> prognoza wyniku matury z przedziałem niepewności
 *   zmiana  ──> zaplanuj() od dziś (A7), plan nie jest zapisany na sztywno
 *   seria   ──> dni z nauką z rzędu; dni wolne i buforowe nie przerywają serii
 *
 * Działa w przeglądarce (<script src>, po matryca.js, pytania.js, materialy.js)
 * i w Node (require). Bez zależności. Daty jako tekst 'RRRR-MM-DD'.
 */
(function (root, fabryka) {
  const api = fabryka(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Mikro = Object.assign(root.Mikro || {}, api);
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';

  // ───────────── USTAWIENIA (można zmieniać bez ruszania logiki) ─────────────
  const KONFIG = {
    progOpanowane: 0.7,         // A1: >= 70% opanowane
    progLuka: 0.4,              // A1: < 40% luka, pomiędzy: do utrwalenia
    progZaliczenia: 0.7,        // A6: quiz zaliczony od 70%
    progPowrotu: 0.6,           // powtórka: temat wraca do planu, gdy poziom spadnie poniżej
    progPodstawPoPorazce: 0.85, // A6: po 2 porażkach sprawdzamy podstawy poniżej tego poziomu
    maxProb: 2,                 // A6: tyle nieudanych quizów uruchamia cofnięcie
    glebokoscCofania: 2,        // A3: maks. 2 poziomy w dół w matrycy
    czasPoziomu: { 1: 45, 2: 60, 3: 75 }, // minuty nauki na mikrokompetencję
    mnoznikUtrwalenia: 0.5,     // temat "do utrwalenia" dostaje połowę czasu
    mnoznikDysleksji: 1.25,     // dysleksja / dyskalkulia
    quizMin: 5,                 // quiz zaliczeniowy po jednostce
    powtorkaMin: 5,             // powtórka (active recall)
    diagnozaMin: 30,            // diagnoza pełna
    interwalyPowtorek: [2, 5, 12, 30], // dni do kolejnej powtórki; rosną, gdy idzie dobrze
    coKtoryDzienBufor: 5,       // co 5. dzień nauki wolny = planujemy 80% czasu
    diagnozaPytan: 20,          // diagnoza całościowa (ok. 15 min)
    quizPytan: 4,
    powtorkaPytan: 5,
    silaAnkiety: 2,             // samoocena = 2 "wirtualne" odpowiedzi
    propagacja: [0.5, 0.25],    // ile dowodu przechodzi na prerekwizyty (1 i 2 poziom)
    wagaTaguPRE: 0.75,          // błąd otagowany jako brak prerekwizytu
    zanik: 0.7,                 // w quizach starsze odpowiedzi ważą mniej (uczeń się zmienia)
    poziomPoNauce: 0.8,         // założenie do prognozy "po realizacji planu"
    interwalDiagnozy: { min: 14, max: 42, ileDoMatury: 5 }, // ok. 5 diagnoz pełnych do matury
    progZdania: 30,
    progPewnosciAI: 0.7,        // AI: przyczynę przyjmujemy dopiero od tej pewności, niżej decydują reguły
    wagaAI: 0.75                // AI: siła dowodu, że brakuje wskazanej podstawy (jak tag PRE)
  };

  // ───────────── DATY ─────────────
  function pad(n) { return String(n).padStart(2, '0'); }
  function naDate(s) { const c = s.split('-').map(Number); return new Date(Date.UTC(c[0], c[1] - 1, c[2])); }
  function naTekst(d) { return d.toISOString().slice(0, 10); }
  function dodajDni(s, n) { const d = naDate(s); d.setUTCDate(d.getUTCDate() + n); return naTekst(d); }
  function roznicaDni(a, b) { return Math.round((naDate(b) - naDate(a)) / 86400000); }
  function dzienTygodnia(s) { return naDate(s).getUTCDay(); } // 0 = niedziela
  function dzisiaj() { const t = new Date(); return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate()); }
  function naMinuty(g) { const c = String(g).split(':').map(Number); return c[0] * 60 + (c[1] || 0); }
  function naGodzine(m) { return pad(Math.floor(m / 60) % 24) + ':' + pad(m % 60); }

  // Wielkanoc (algorytm Meeusa/Jonesa/Butchera)
  function wielkanoc(rok) {
    const a = rok % 19, b = Math.floor(rok / 100), c = rok % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const miesiac = Math.floor((h + l - 7 * m + 114) / 31), dzien = ((h + l - 7 * m + 114) % 31) + 1;
    return rok + '-' + pad(miesiac) + '-' + pad(dzien);
  }

  // Domyślne blokady: przerwy świąteczne, Sylwester, Wielkanoc
  function swietaDomyslne(odRoku, doRoku) {
    const lista = [];
    for (let r = odRoku; r <= doRoku; r++) {
      lista.push({ od: r + '-12-23', do: r + '-12-26', nazwa: 'Boże Narodzenie' });
      lista.push({ od: r + '-12-31', do: (r + 1) + '-01-01', nazwa: 'Sylwester i Nowy Rok' });
      const w = wielkanoc(r);
      lista.push({ od: dodajDni(w, -3), do: dodajDni(w, 2), nazwa: 'Wielkanoc' });
    }
    return lista;
  }

  function interwalDiagnozy(dniDoMatury) {
    const c = KONFIG.interwalDiagnozy;
    return Math.min(c.max, Math.max(c.min, Math.round(dniDoMatury / c.ileDoMatury)));
  }

  function domyslneDane() {
    if (typeof module !== 'undefined' && module.exports && typeof require === 'function') {
      const m = require('./matryca'), p = require('./pytania');
      let mat = {};
      try { mat = require('./materialy'); } catch (e) { mat = {}; }
      return { kompetencje: m.KOMPETENCJE, dzialy: m.DZIALY, pytania: p.PYTANIA, materialy: mat.MATERIALY || {}, materialyDzialu: mat.MATERIALY_DZIALU || {} };
    }
    const M = root.Mikro || {};
    return { kompetencje: M.KOMPETENCJE, dzialy: M.DZIALY, pytania: M.PYTANIA || [], materialy: M.MATERIALY || {}, materialyDzialu: M.MATERIALY_DZIALU || {} };
  }

  // ═════════════════════════════ SILNIK ═════════════════════════════
  function utworzSilnik(dane, opcje) {
    dane = dane || domyslneDane();
    opcje = opcje || {};
    if (!dane.kompetencje || !dane.dzialy) throw new Error('Brak matrycy: załaduj matryca.js przed silnik.js');
    const losowa = opcje.losowa || Math.random;
    const pytania = dane.pytania || [];
    const materialy = dane.materialy || {};
    const materialyDzialu = dane.materialyDzialu || {};

    const K = {}, D = {}, W = {}, ZALEZNE = {}, PYT = {}, PYT_ID = {};
    dane.dzialy.forEach(d => { D[d.id] = d; });
    dane.kompetencje.forEach(k => { K[k.id] = k; ZALEZNE[k.id] = []; });
    dane.kompetencje.forEach(k => (k.wymaga || []).forEach(pre => { if (ZALEZNE[pre]) ZALEZNE[pre].push(k.id); }));
    const sumaDzialow = dane.dzialy.reduce((s, d) => s + d.waga, 0);
    const sumaWagDzialu = {};
    dane.kompetencje.forEach(k => { sumaWagDzialu[k.dzial] = (sumaWagDzialu[k.dzial] || 0) + (k.waga || 2); });
    // W = udział mikrokompetencji w wyniku matury (suma wszystkich = 1)
    dane.kompetencje.forEach(k => { W[k.id] = ((D[k.dzial] ? D[k.dzial].waga : 0) / sumaDzialow) * ((k.waga || 2) / sumaWagDzialu[k.dzial]); });
    pytania.forEach(q => { (PYT[q.komp] = PYT[q.komp] || []).push(q); PYT_ID[q.id] = q; });

    // ───────────── model wiedzy ─────────────
    // Każda kompetencja: a = "trafienia", b = "pudła" (z pseudoliczbą 1 i 1 na start),
    // n = ile realnych dowodów. Poziom = a / (a + b).
    function wiedza(stan, id) { return stan.wiedza[id] || (stan.wiedza[id] = { a: 1, b: 1, n: 0 }); }
    function poziom(stan, id) { const w = wiedza(stan, id); return w.a / (w.a + w.b); }
    function status(stan, id) {
      const w = wiedza(stan, id), p = w.a / (w.a + w.b);
      return { p: p, pewny: w.n >= 1, status: p >= KONFIG.progOpanowane ? 'opanowane' : p >= KONFIG.progLuka ? 'do_utrwalenia' : 'luka' };
    }
    function dodajDowod(stan, id, poprawna, sila, dzis) {
      if (!K[id]) return;
      const w = wiedza(stan, id);
      if (poprawna) w.a += sila; else w.b += sila;
      w.n += sila;
      if (dzis) w.ostatnio = dzis;
    }
    function uzupelnijStan(stan) {
      ['wiedza', 'zaliczone', 'proby', 'cofniecia', 'zrobioneMinuty', 'czesciZrobione', 'widzianePytania', 'aktywneDni', 'aiDiagnozy'].forEach(k => { if (!stan[k]) stan[k] = {}; });
      ['powtorki', 'przyczyny', 'doAnalizyAI', 'prognozy', 'historiaSesji'].forEach(k => { if (!stan[k]) stan[k] = []; });
      return stan;
    }
    function resetPostepu(stan, id) { stan.zrobioneMinuty[id] = 0; stan.czesciZrobione[id] = 0; }
    function zapiszAktywnosc(stan, dzis) { uzupelnijStan(stan); stan.aktywneDni[dzis || dzisiaj()] = true; }

    function tasuj(t) {
      for (let i = t.length - 1; i > 0; i--) { const j = Math.floor(losowa() * (i + 1)); const x = t[i]; t[i] = t[j]; t[j] = x; }
      return t;
    }
    // Najpierw pytania jeszcze niewidziane, potem najdawniej widziane.
    function wybierzPytania(stan, lista, n) {
      const kopia = tasuj(lista.slice());
      kopia.sort((x, y) => {
        const a = stan.widzianePytania[x.id] || '', b = stan.widzianePytania[y.id] || '';
        return a < b ? -1 : a > b ? 1 : 0;
      });
      return kopia.slice(0, n);
    }
    function maPytanie(sesja, id) { return (PYT[id] || []).some(q => sesja.zadane.indexOf(q.id) === -1); }
    function pytanieDla(stan, sesja, id) {
      const wolne = (PYT[id] || []).filter(q => sesja.zadane.indexOf(q.id) === -1);
      return wolne.length ? wybierzPytania(stan, wolne, 1)[0] : null;
    }

    // ───────────── A0: KALIBRACJA -> STAN POCZĄTKOWY ─────────────
    // ankieta = { cel: 80, ocena: 4, samoocena: { VII: 'slabo', V: 'srednio' },
    //             dzialyPriorytetowe: ['VII'], tylkoPriorytetowe: false }
    function nowyStan(ankieta, dzis) {
      dzis = dzis || dzisiaj();
      ankieta = ankieta || {};
      const stan = uzupelnijStan({ wersja: 2, utworzono: dzis, ankieta: ankieta, ostatniaDiagnozaPelna: null });
      const MAPA = { dobrze: 0.75, srednio: 0.5, slabo: 0.25 };
      dane.kompetencje.forEach(k => {
        let p0 = null, sila = 0;
        const so = ankieta.samoocena && ankieta.samoocena[k.dzial];
        if (so && MAPA[so] !== undefined) { p0 = MAPA[so]; sila = KONFIG.silaAnkiety; }
        else if (ankieta.ocena) { p0 = 0.15 + 0.14 * (Number(ankieta.ocena) - 1); sila = KONFIG.silaAnkiety * 0.75; }
        if (p0 === null) { stan.wiedza[k.id] = { a: 1, b: 1, n: 0 }; return; }
        p0 = Math.min(0.95, Math.max(0.05, p0 + (k.poziom === 1 ? 0.1 : k.poziom === 3 ? -0.1 : 0)));
        stan.wiedza[k.id] = { a: 1 + p0 * sila, b: 1 + (1 - p0) * sila, n: 0 };
      });
      return stan;
    }

    // ───────────── TESTY (jeden mechanizm dla 3 rodzajów) ─────────────
    // typ: 'diagnoza'  = adaptacyjna (na start i diagnoza pełna co kilka tygodni; opcje.pelna = zaplanowana)
    //      'jednostka' = quiz zaliczeniowy tematu (bramka 70%; opcje.sprawdzenie = szybkie sprawdzenie)
    //      'powtorka'  = quiz 5 min z tematów, którym przypada powtórka
    function utworzTest(stan, typ, opcjeTestu, dzis) {
      uzupelnijStan(stan);
      opcjeTestu = opcjeTestu || {};
      dzis = dzis || dzisiaj();
      const sesja = { typ: typ, dzis: dzis, opcje: opcjeTestu, zadane: [], odpowiedzi: [], kolejka: [], licznikDzialu: {}, zanik: {} };
      if (typ === 'diagnoza') {
        sesja.adaptacyjny = true;
        sesja.max = opcjeTestu.max || KONFIG.diagnozaPytan;
        sesja.dzialy = opcjeTestu.dzialy || null; // np. ['VII'] dla szybkiej ścieżki
      } else if (typ === 'jednostka') {
        if (!K[opcjeTestu.komp]) throw new Error('Nieznana mikrokompetencja: ' + opcjeTestu.komp);
        sesja.komp = opcjeTestu.komp;
        sesja.lista = wybierzPytania(stan, PYT[sesja.komp] || [], opcjeTestu.max || KONFIG.quizPytan).map(q => q.id);
      } else if (typ === 'powtorka') {
        sesja.komps = kompetencjeDoPowtorki(stan, dzis);
        sesja.lista = sesja.komps
          .map(id => wybierzPytania(stan, PYT[id] || [], 1)[0])
          .filter(Boolean).map(q => q.id)
          .slice(0, opcjeTestu.max || KONFIG.powtorkaPytan);
      } else {
        throw new Error('Nieznany typ testu: ' + typ);
      }
      return sesja;
    }

    function kompetencjeDoPowtorki(stan, dzis) {
      let ids = stan.powtorki.filter(x => x.data <= dzis).sort((a, b) => a.data < b.data ? -1 : 1).map(x => x.komp);
      if (!ids.length) {
        // nic nie przypada: tematy zaliczone w ostatnich 7 dniach
        ids = Object.keys(stan.zaliczone).filter(id => roznicaDni(stan.zaliczone[id], dzis) <= 7);
      }
      return Array.from(new Set(ids)).slice(0, KONFIG.powtorkaPytan);
    }

    const POZIOMY = ['', 'łatwe', 'średnie', 'trudne'];
    function nastepnePytanie(stan, sesja) {
      let q = null, powod = sesja.typ;
      if (!sesja.adaptacyjny) {
        const id = sesja.lista[sesja.zadane.length];
        if (!id) return null;
        q = PYT_ID[id];
      } else {
        if (sesja.zadane.length >= sesja.max) return null;
        const wybor = wybierzAdaptacyjnie(stan, sesja);
        if (!wybor) return null;
        q = wybor.q; powod = wybor.powod;
      }
      const k = K[q.komp];
      const kolejnosc = tasuj(q.odp.map((_, i) => i));
      return {
        id: q.id, komp: q.komp, kompNazwa: k.nazwa, dzial: D[k.dzial].nazwa, dzialId: k.dzial,
        poziom: k.poziom, poziomNazwa: POZIOMY[k.poziom],
        powod: powod, // 'przeglad' | 'cofniecie' | 'wyzej' | 'jednostka' | 'powtorka'
        tresc: q.tresc,
        odpowiedzi: kolejnosc.map(i => ({ idx: i, tekst: q.odp[i] })), // UI odsyła idx; -1 = "Nie wiem"
        numer: sesja.zadane.length + 1,
        z: sesja.adaptacyjny ? sesja.max : sesja.lista.length
      };
    }

    function wDzialach(sesja, id) { return !sesja.dzialy || sesja.dzialy.indexOf(K[id].dzial) !== -1; }
    function zgloszonySlaby(stan, dzial) {
      const a = stan.ankieta || {};
      return (a.samoocena && a.samoocena[dzial] === 'slabo') || (a.dzialyPriorytetowe && a.dzialyPriorytetowe.indexOf(dzial) !== -1);
    }
    function limitDzialu(stan, sesja, dzial) {
      const n = sesja.dzialy ? sesja.dzialy.length : dane.dzialy.length;
      return Math.max(3, Math.ceil(sesja.max / n)) + (zgloszonySlaby(stan, dzial) ? 2 : 0);
    }
    function juzZadana(sesja, id) { return sesja.odpowiedzi.some(o => o.komp === id); }

    // A2: najpierw pytania uzupełniające (cofanie / wyżej), potem tam, gdzie spodziewana luka
    // kosztuje najwięcej punktów, a wiemy o niej najmniej. Działy zgłoszone w kalibracji jako słabe idą na początek.
    function wybierzAdaptacyjnie(stan, sesja) {
      while (sesja.kolejka.length) {
        const z = sesja.kolejka.shift();
        const q = pytanieDla(stan, sesja, z.id);
        if (q) return { q: q, powod: z.powod };
      }
      const so = (stan.ankieta && stan.ankieta.samoocena) || {};
      let najlepsza = null, wynik = -1;
      dane.kompetencje.forEach(k => {
        if (!wDzialach(sesja, k.id) || !maPytanie(sesja, k.id)) return;
        const ile = sesja.licznikDzialu[k.dzial] || 0;
        if (ile >= limitDzialu(stan, sesja, k.dzial)) return;
        const w = wiedza(stan, k.id);
        let s = W[k.id] * (1 - poziom(stan, k.id)) / (1 + w.n);
        if (ile === 0) s *= (k.poziom === 2 ? 3 : 1.5); // nowy dział: start od pytania średniego
        if (zgloszonySlaby(stan, k.dzial)) s *= 3; else if (so[k.dzial] === 'srednio') s *= 1.5;
        if (s > wynik) { wynik = s; najlepsza = k.id; }
      });
      return najlepsza ? { q: pytanieDla(stan, sesja, najlepsza), powod: 'przeglad' } : null;
    }

    function dodajUzupelniajace(stan, sesja, q, poprawna, przyczyna) {
      const pozostalo = sesja.max - sesja.zadane.length;
      const niezbadane = dane.dzialy.filter(d =>
        (!sesja.dzialy || sesja.dzialy.indexOf(d.id) !== -1) && !sesja.licznikDzialu[d.id] &&
        dane.kompetencje.some(k => k.dzial === d.id && maPytanie(sesja, k.id))).length;
      if (pozostalo - 1 < niezbadane) return; // najpierw szerokość, żeby prognoza miała dane
      const k = K[q.komp];
      const wolny = id => maPytanie(sesja, id) && !juzZadana(sesja, id) && (sesja.licznikDzialu[K[id].dzial] || 0) < limitDzialu(stan, sesja, K[id].dzial);
      if (!poprawna) {
        // cofnij się do podstaw: wskazany w tagu błędu, inaczej najłatwiejszy słaby prerekwizyt
        if (przyczyna && przyczyna.pre && wolny(przyczyna.pre)) { sesja.kolejka.unshift({ id: przyczyna.pre, powod: 'cofniecie' }); return; }
        const kandydaci = (k.wymaga || []).filter(id => K[id] && wolny(id) && poziom(stan, id) < KONFIG.progOpanowane + 0.1)
          .sort((x, y) => K[x].poziom - K[y].poziom || poziom(stan, x) - poziom(stan, y));
        if (kandydaci.length) sesja.kolejka.unshift({ id: kandydaci[0], powod: 'cofniecie' });
      } else if (k.poziom < 3) {
        // dobrze: sprawdź trudniejszy temat z tego samego działu
        const wyzej = (ZALEZNE[k.id] || []).filter(id => K[id].dzial === k.dzial && K[id].poziom > k.poziom && wolny(id) && wDzialach(sesja, id))
          .sort((x, y) => W[y] - W[x]);
        if (wyzej.length) sesja.kolejka.unshift({ id: wyzej[0], powod: 'wyzej' });
      }
    }

    function rozpoznajPrzyczyne(tag) {
      if (!tag) return null;
      if (tag.indexOf('PRE:') === 0) {
        const reszta = tag.slice(4).trim(), spacja = reszta.indexOf(' ');
        const pre = spacja === -1 ? reszta : reszta.slice(0, spacja);
        const opis = spacja === -1 ? '' : reszta.slice(spacja + 1);
        return { pre: K[pre] ? pre : null, opis: opis || ('braki w: ' + (K[pre] ? K[pre].nazwa : pre)) };
      }
      return { pre: null, opis: tag };
    }

    function propaguj(stan, id, poprawna, dzis) {
      if (poprawna) {
        (K[id].wymaga || []).forEach(p1 => {
          dodajDowod(stan, p1, true, KONFIG.propagacja[0], dzis);
          ((K[p1] && K[p1].wymaga) || []).forEach(p2 => dodajDowod(stan, p2, true, KONFIG.propagacja[1], dzis));
        });
      } else {
        (ZALEZNE[id] || []).forEach(z => dodajDowod(stan, z, false, KONFIG.propagacja[0], dzis));
      }
    }

    // wybrana = idx z nastepnePytanie().odpowiedzi (0 = poprawna), -1 = "Nie wiem"
    function odpowiedz(stan, sesja, pytanieId, wybrana, dzis) {
      dzis = dzis || sesja.dzis;
      const q = PYT_ID[pytanieId];
      if (!q) throw new Error('Nieznane pytanie: ' + pytanieId);
      if (sesja.zadane.indexOf(pytanieId) !== -1) throw new Error('Na to pytanie już odpowiedziano: ' + pytanieId);
      wybrana = Number(wybrana);
      const k = K[q.komp], poprawna = wybrana === 0, nieWiem = wybrana === -1;

      // w quizach i powtórkach świeże odpowiedzi ważą więcej niż stare (uczeń się zmienia)
      if (sesja.typ !== 'diagnoza' && !sesja.zanik[k.id]) {
        const w = wiedza(stan, k.id);
        w.a = 1 + (w.a - 1) * KONFIG.zanik; w.b = 1 + (w.b - 1) * KONFIG.zanik; w.n *= KONFIG.zanik;
        sesja.zanik[k.id] = true;
      }
      dodajDowod(stan, k.id, poprawna, 1, dzis);

      let przyczyna = null;
      if (!poprawna) {
        przyczyna = nieWiem ? { pre: null, opis: 'nie wiem', nieWiem: true } : rozpoznajPrzyczyne(q.bledy && q.bledy[wybrana]);
        if (przyczyna && przyczyna.pre) dodajDowod(stan, przyczyna.pre, false, KONFIG.wagaTaguPRE, dzis);
        stan.przyczyny.push({ data: dzis, komp: k.id, pytanie: q.id, opis: przyczyna ? przyczyna.opis : 'nieznana', pre: przyczyna ? przyczyna.pre : null, test: sesja.typ });
        if (stan.przyczyny.length > 200) stan.przyczyny = stan.przyczyny.slice(-200);
      }
      if (sesja.typ === 'diagnoza') propaguj(stan, k.id, poprawna, dzis);

      sesja.zadane.push(q.id);
      sesja.licznikDzialu[k.dzial] = (sesja.licznikDzialu[k.dzial] || 0) + 1;
      sesja.odpowiedzi.push({ pytanie: q.id, komp: k.id, wybrana: wybrana, poprawna: poprawna, przyczyna: przyczyna });
      stan.widzianePytania[q.id] = dzis;
      if (sesja.adaptacyjny) dodajUzupelniajace(stan, sesja, q, poprawna, przyczyna);

      return {
        poprawna: poprawna, nieWiem: nieWiem, poprawnaOdpowiedz: q.odp[0],
        przyczyna: przyczyna && !nieWiem ? przyczyna.opis : null,
        podstawa: przyczyna && przyczyna.pre ? K[przyczyna.pre].nazwa : null
      };
    }

    function mnoznikInterwalu(wynik) { return wynik >= 0.9 ? 1.3 : wynik < 0.8 ? 0.7 : 1; }
    function zalicz(stan, id, dzis, wynik) {
      stan.zaliczone[id] = dzis;
      stan.proby[id] = 0;
      delete stan.cofniecia[id];
      stan.powtorki = stan.powtorki.filter(x => x.komp !== id);
      const dni = Math.max(1, Math.round(KONFIG.interwalyPowtorek[0] * mnoznikInterwalu(wynik == null ? 0.85 : wynik)));
      stan.powtorki.push({ komp: id, data: dodajDni(dzis, dni), etap: 0 });
      return dni;
    }

    function cofnijSlabeZaliczone(stan, tylko) {
      const wracaja = [];
      Object.keys(stan.zaliczone).forEach(id => {
        if (tylko && tylko.indexOf(id) === -1) return;
        if (poziom(stan, id) < KONFIG.progPowrotu) {
          delete stan.zaliczone[id];
          resetPostepu(stan, id);
          stan.powtorki = stan.powtorki.filter(x => x.komp !== id);
          wracaja.push({ komp: id, nazwa: K[id].nazwa });
        }
      });
      return wracaja;
    }

    function zakonczTest(stan, sesja, dzis) {
      dzis = dzis || sesja.dzis;
      const n = sesja.odpowiedzi.length, ok = sesja.odpowiedzi.filter(o => o.poprawna).length;
      const procent = n ? ok / n : 0;
      const wynik = { typ: sesja.typ, poprawne: ok, wszystkie: n, procent: Math.round(procent * 100) };
      const minutyTestu = { diagnoza: KONFIG.diagnozaMin, jednostka: KONFIG.quizMin, powtorka: KONFIG.powtorkaMin }[sesja.typ];
      if (sesja.typ !== 'diagnoza' || sesja.opcje.pelna) {
        stan.historiaSesji.push({ data: dzis, typ: sesja.typ === 'jednostka' ? 'quiz' : sesja.typ, komp: sesja.komp || null, minuty: minutyTestu, zrobiona: true });
      }
      zapiszAktywnosc(stan, dzis);

      if (sesja.typ === 'diagnoza') {
        stan.ostatniaDiagnozaPelna = dzis;
        wynik.wracajace = cofnijSlabeZaliczone(stan);
        wynik.prognoza = prognoza(stan);
        wynik.wiedza = podsumujWiedze(stan);
        const widziane = {};
        wynik.przyczyny = sesja.odpowiedzi.filter(o => o.przyczyna && !o.przyczyna.nieWiem).filter(o => {
          const klucz = o.komp + o.przyczyna.opis; if (widziane[klucz]) return false; widziane[klucz] = 1; return true;
        }).map(o => ({ komp: o.komp, nazwa: K[o.komp].nazwa, przyczyna: o.przyczyna.opis, podstawa: o.przyczyna.pre ? K[o.przyczyna.pre].nazwa : null }));
        wynik.cofniecia = sesja.odpowiedzi.length;
        stan.prognozy.push({ data: dzis, wynik: wynik.prognoza.wynik, min: wynik.prognoza.min, max: wynik.prognoza.max, pokrycie: wynik.prognoza.pokrycie });
        wynik.komunikat = wynik.prognoza.komunikat;
      } else if (sesja.typ === 'jednostka') {
        const id = sesja.komp, nazwa = K[id].nazwa;
        wynik.komp = id; wynik.nazwa = nazwa; wynik.sprawdzenie = !!sesja.opcje.sprawdzenie;
        if (n === 0) {
          wynik.zaliczona = true; wynik.bezQuizu = true;
          wynik.powtorkaZa = zalicz(stan, id, dzis, null);
          wynik.komunikat = 'Brak pytań w banku do tego tematu: odhaczono na podstawie deklaracji.';
        } else if (procent >= KONFIG.progZaliczenia) {
          wynik.zaliczona = true;
          wynik.powtorkaZa = zalicz(stan, id, dzis, procent);
          wynik.komunikat = (sesja.opcje.sprawdzenie ? 'Umiesz to! Temat odhaczony bez nauki: ' : 'Zaliczone: ') + nazwa + '.';
        } else if (sesja.opcje.sprawdzenie) {
          // szybkie sprawdzenie nie wyszło: to nie porażka, tylko informacja, że trzeba się tego nauczyć
          resetPostepu(stan, id);
          wynik.zaliczona = false;
          wynik.komunikat = 'Dobrze, że sprawdziliśmy. ' + nazwa + ' trafia do planu jako temat do nauki.';
        } else {
          stan.proby[id] = (stan.proby[id] || 0) + 1;
          resetPostepu(stan, id);
          wynik.zaliczona = false; wynik.proba = stan.proby[id];
          wynik.komunikat = 'Jeszcze nie: ' + wynik.procent + '% (próg ' + Math.round(KONFIG.progZaliczenia * 100) + '%). Temat wraca na najbliższy termin z innym materiałem i nowymi pytaniami.';
          if (stan.proby[id] >= KONFIG.maxProb) {
            // A6 + A3: cofnięcie do podstaw
            stan.cofniecia[id] = true;
            const podstawy = (K[id].wymaga || []).filter(pre => K[pre] && poziom(stan, pre) < KONFIG.progPodstawPoPorazce);
            podstawy.forEach(pre => { if (stan.zaliczone[pre]) { delete stan.zaliczone[pre]; resetPostepu(stan, pre); } });
            wynik.cofniecieDo = podstawy.map(pre => ({ komp: pre, nazwa: K[pre].nazwa }));
            stan.doAnalizyAI.push({
              data: dzis, komp: id, nazwa: nazwa,
              bledne: sesja.odpowiedzi.filter(o => !o.poprawna).map(o => ({
                pytanie: PYT_ID[o.pytanie].tresc, wybrana: o.wybrana === -1 ? 'nie wiem' : PYT_ID[o.pytanie].odp[o.wybrana],
                poprawna: PYT_ID[o.pytanie].odp[0], przyczyna: o.przyczyna ? o.przyczyna.opis : null
              })),
              historia: stan.przyczyny.filter(x => x.komp === id).slice(-5)
            });
            wynik.doAnalizyAI = true;
            wynik.komunikat = podstawy.length
              ? 'Dwie próby bez zaliczenia. Najpierw wzmacniamy podstawy: ' + podstawy.map(pre => K[pre].nazwa).join(', ') + '. Potem wracamy do tematu z prostszym materiałem.'
              : 'Podstawy masz opanowane. Zmieniamy materiał na wyjaśnienie krok po kroku, a przyczynę błędów sprawdzi analiza odpowiedzi.';
          }
        }
      } else if (sesja.typ === 'powtorka') {
        // powtórki adaptacyjne: dobrze = odstęp rośnie, błąd = jutro jeszcze raz albo temat wraca do planu
        const wyniki = {};
        sesja.odpowiedzi.forEach(o => { (wyniki[o.komp] = wyniki[o.komp] || []).push(o.poprawna); });
        const I = KONFIG.interwalyPowtorek;
        wynik.zmiany = []; wynik.wracajace = [];
        sesja.komps.forEach(id => {
          const wpis = stan.powtorki.find(x => x.komp === id);
          const etap = wpis ? (wpis.etap || 0) : 0;
          const dobrze = (wyniki[id] || []).every(Boolean);
          stan.powtorki = stan.powtorki.filter(x => x.komp !== id);
          if (!stan.zaliczone[id]) return;
          if (dobrze) {
            const nowy = Math.min(etap + 1, I.length - 1);
            const dni = Math.max(1, Math.round(I[nowy] * (poziom(stan, id) >= 0.85 ? 1.3 : 1)));
            stan.powtorki.push({ komp: id, data: dodajDni(dzis, dni), etap: nowy });
            wynik.zmiany.push({ komp: id, nazwa: K[id].nazwa, dobrze: true, za: dni });
          } else if (poziom(stan, id) < KONFIG.progPowrotu) {
            delete stan.zaliczone[id];
            resetPostepu(stan, id);
            wynik.wracajace.push({ komp: id, nazwa: K[id].nazwa });
            wynik.zmiany.push({ komp: id, nazwa: K[id].nazwa, dobrze: false, wraca: true });
          } else {
            stan.powtorki.push({ komp: id, data: dodajDni(dzis, 1), etap: 0 });
            wynik.zmiany.push({ komp: id, nazwa: K[id].nazwa, dobrze: false, za: 1 });
          }
        });
        const czesci = [];
        const ok = wynik.zmiany.filter(z => z.dobrze);
        if (ok.length) czesci.push('Pamiętasz! Kolejna powtórka później, bo wiedza się trzyma.');
        if (wynik.zmiany.some(z => !z.dobrze && !z.wraca)) czesci.push('Drobny błąd: powtórzymy jutro.');
        if (wynik.wracajace.length) czesci.push('Do planu wraca: ' + wynik.wracajace.map(x => x.nazwa).join(', ') + '.');
        wynik.komunikat = czesci.join(' ') || 'Powtórka zrobiona.';
      }
      return wynik;
    }

    // ───────────── PROGNOZA WYNIKU MATURY ─────────────
    function prognoza(stan) {
      let wynik = 0, pokrycie = 0;
      dane.kompetencje.forEach(k => {
        const w = wiedza(stan, k.id);
        wynik += W[k.id] * (w.a / (w.a + w.b));
        pokrycie += W[k.id] * Math.min(1, w.n / 2);
      });
      const pkt = Math.round(wynik * 100);
      const polowa = 5 + 25 * (1 - pokrycie); // im mniej danych, tym szerszy przedział
      const min = Math.max(0, Math.round(wynik * 100 - polowa)), max = Math.min(100, Math.round(wynik * 100 + polowa));
      const cel = stan.ankieta && stan.ankieta.cel ? Number(stan.ankieta.cel) : null;
      const zyski = dane.kompetencje
        .map(k => ({ komp: k.id, nazwa: k.nazwa, dzial: D[k.dzial].nazwa, zysk: W[k.id] * Math.max(0, 0.9 - poziom(stan, k.id)) * 100 }))
        .filter(z => z.zysk > 0).sort((a, b) => b.zysk - a.zysk).slice(0, 3)
        .map(z => Object.assign(z, { zysk: Math.round(z.zysk * 10) / 10 }));
      const zdawalnosc = min >= KONFIG.progZdania ? 'bezpieczna' : max < KONFIG.progZdania ? 'zagrożona' : 'niepewna';
      const pewnosc = pokrycie >= 0.7 ? 'wysoka' : pokrycie >= 0.4 ? 'średnia' : 'niska';
      let komunikat = 'Na dziś szacujemy wynik ok. ' + pkt + '% (przedział ' + min + '-' + max + '%). Pewność: ' + pewnosc + ', sprawdziliśmy ok. ' + Math.round(pokrycie * 100) + '% materiału.';
      if (cel) komunikat += pkt >= cel ? ' Jesteś na poziomie celu (' + cel + '%).' : ' Do celu ' + cel + '% brakuje ok. ' + (cel - pkt) + ' pkt proc.';
      if (pewnosc === 'niska') komunikat += ' Wynik orientacyjny: kolejna diagnoza zawęzi przedział.';
      return { wynik: pkt, min: min, max: max, pokrycie: Math.round(pokrycie * 100), pewnosc: pewnosc, zdawalnosc: zdawalnosc, cel: cel, doCelu: cel ? Math.max(0, cel - pkt) : null, najwiekszeZyski: zyski, komunikat: komunikat };
    }

    function podsumujWiedze(stan) {
      return dane.dzialy.map(d => {
        const ks = dane.kompetencje.filter(k => k.dzial === d.id);
        const suma = ks.reduce((s, k) => s + W[k.id], 0);
        const sredni = ks.reduce((s, k) => s + W[k.id] * poziom(stan, k.id), 0) / (suma || 1);
        return {
          dzial: d.id, nazwa: d.nazwa, poziom: Math.round(sredni * 100), waga: d.waga,
          kompetencje: ks.map(k => {
            const st = status(stan, k.id);
            return { id: k.id, nazwa: k.nazwa, poziomTrudnosci: k.poziom, opanowanie: Math.round(st.p * 100), status: st.status, pewny: st.pewny, zaliczona: !!stan.zaliczone[k.id], cke: k.cke };
          })
        };
      });
    }

    // ───────────── A4 + A3: CO I W JAKIEJ KOLEJNOŚCI ─────────────
    function mnoznikCelu(poz, cel) {
      if (poz < 3) return 1;
      if (cel < 50) return 0;     // cel do 50%: pomijamy zadania trudne, nie przytłaczamy
      if (cel < 80) return 0.6;
      return 1;
    }
    // "Sprawdzenie": nie wiemy, czy uczeń to umie, a szacunek nie wskazuje luki.
    // Zamiast godziny nauki planujemy 5-minutowy quiz; oblany zamienia się w naukę.
    function doSprawdzenia(stan, id) {
      const st = status(stan, id);
      return !st.pewny && st.p >= KONFIG.progLuka && !stan.proby[id] && !stan.cofniecia[id];
    }
    function powodDla(stan, id) {
      if (stan.cofniecia[id]) return 'Wracamy do tematu z prostszym materiałem';
      if (stan.proby[id]) return 'Powtórka tematu po nieudanym quizie';
      if ((stan.zrobioneMinuty[id] || 0) > 0) return 'Kontynuacja rozpoczętego tematu';
      const st = status(stan, id);
      if (doSprawdzenia(stan, id)) return 'Szybkie sprawdzenie: może już to umiesz';
      if (!st.pewny) return 'Prawdopodobna luka, do nauki';
      return st.status === 'luka' ? 'Luka: tu tracisz punkty' : 'Do utrwalenia';
    }
    // A4: priorytet = punkty na maturze do zyskania na każdą minutę nauki
    function priorytet(stan, k, cel, priorytetowe) {
      if (stan.cofniecia[k.id] || stan.proby[k.id]) return 1000 + W[k.id];       // A6: wraca na najbliższy termin
      if ((stan.zrobioneMinuty[k.id] || 0) > 0) return 500 + W[k.id];             // nie przerywamy tematu w połowie
      const czas = k.czas || KONFIG.czasPoziomu[k.poziom];
      let p = W[k.id] * (1 - poziom(stan, k.id)) * mnoznikCelu(k.poziom, cel) / czas;
      if (priorytetowe && priorytetowe.indexOf(k.dzial) !== -1) p *= 5;           // uczeń sam wskazał dział: idzie pierwszy
      else if (zgloszonySlaby(stan, k.dzial)) p *= 1.3;                           // samoocena "słabo"
      return p;
    }
    function kolejnoscJednostek(stan, cel, priorytetowe, tylko) {
      const kandydaci = dane.kompetencje.filter(k => {
        if (stan.zaliczone[k.id]) return false;
        if (tylko && priorytetowe && priorytetowe.indexOf(k.dzial) === -1) return false;
        if (mnoznikCelu(k.poziom, cel) === 0) return false;
        return poziom(stan, k.id) < KONFIG.progOpanowane || stan.cofniecia[k.id] || stan.proby[k.id];
      }).map(k => ({ id: k.id, prio: priorytet(stan, k, cel, priorytetowe) }))
        .sort((a, b) => b.prio - a.prio);

      const wynik = [], dodane = new Set(), czyKandydat = new Set(kandydaci.map(c => c.id));
      function potrzebny(pre, dla) {
        if (!K[pre] || dodane.has(pre)) return false;
        if (stan.cofniecia[dla]) return poziom(stan, pre) < KONFIG.progPodstawPoPorazce;
        return !stan.zaliczone[pre] && poziom(stan, pre) < KONFIG.progOpanowane;
      }
      // A3: prerekwizyt przed tematem zależnym. Poza zakresem planu (np. szybka ścieżka) maks. 2 poziomy w dół.
      function dodaj(id, glebokosc, powod) {
        if (dodane.has(id)) return;
        dodane.add(id);
        if (glebokosc < KONFIG.glebokoscCofania) {
          (K[id].wymaga || []).forEach(pre => {
            if (potrzebny(pre, id)) dodaj(pre, czyKandydat.has(pre) ? 0 : glebokosc + 1, 'Podstawa do: ' + K[id].nazwa);
          });
        }
        wynik.push({ id: id, powod: powod });
      }
      kandydaci.forEach(c => dodaj(c.id, 0, powodDla(stan, c.id)));
      return wynik;
    }

    // Części materiałów (wideo / tekst / trening / arkusz) w kolejności dopasowanej do ucznia:
    // styl z kalibracji, po porażce najpierw wyjaśnienie, przy utrwalaniu bez wideo (notatka + zadania).
    const KOLEJNOSC_TYPOW = {
      wideo: ['wideo', 'tekst', 'trening', 'arkusz'],
      teoria: ['tekst', 'wideo', 'trening', 'arkusz'],
      arkusz: ['trening', 'wideo', 'tekst', 'arkusz'],
      domyslna: ['wideo', 'tekst', 'trening', 'arkusz'],
      utrwalenie: ['tekst', 'trening', 'arkusz']
    };
    function materialDla(id, org, wTrudnosci, utrwalenie) {
      const k = K[id];
      const lista = (materialy[id] || materialyDzialu[k.dzial] || materialyDzialu['*'] || []).slice();
      const pref = org && (org.preferencja || ((org.dysleksja || org.dyskalkulia) ? 'wideo' : null));
      const kol = wTrudnosci ? KOLEJNOSC_TYPOW.domyslna : utrwalenie ? KOLEJNOSC_TYPOW.utrwalenie : (KOLEJNOSC_TYPOW[pref] || KOLEJNOSC_TYPOW.domyslna);
      const ocena = m => { const i = kol.indexOf(m.typ); return i === -1 ? 9 : i; };
      return lista.filter(m => ocena(m) < 9 || !utrwalenie).map((m, i) => ({ m: m, i: i }))
        .sort((a, b) => ocena(a.m) - ocena(b.m) || a.i - b.i).map(x => x.m);
    }
    // Gdy temat ma mniej czasu niż suma części (np. utrwalanie), bierzemy części po kolei i skracamy ostatnią.
    function dopasujDoCzasu(czesci, T) {
      if (!T) return czesci;
      const wynik = [];
      let suma = 0;
      for (const c of czesci) {
        if (suma + c.minuty <= T + 2) { wynik.push(c); suma += c.minuty; }
        else { if (T - suma >= 5) wynik.push(Object.assign({}, c, { minuty: T - suma, skrocone: true, nazwa: c.nazwa + ' (wybrane zadania)' })); break; }
      }
      return wynik.length ? wynik : czesci.slice(0, 1);
    }
    // Które części przypadają na sesję obejmującą minuty [a, b) tematu o długości T.
    function czesciSesji(czesci, T, a, b, ostatnia) {
      const P = czesci.reduce((s, c) => s + (c.minuty || 0), 0);
      if (!P || !T) return [];
      let c0 = 0;
      const wynik = [];
      czesci.forEach((c, i) => {
        const srodek = (c0 + c.minuty / 2) * T / P;
        if ((srodek >= a && srodek < b) || (ostatnia && srodek >= b)) wynik.push(i);
        c0 += c.minuty;
      });
      if (!wynik.length) { // długa część rozłożona na kilka sesji: kontynuacja
        let x = 0;
        const mid = (a + b) / 2 * P / T;
        for (let i = 0; i < czesci.length; i++) { if (mid < x + czesci[i].minuty) return [{ i: i, kontynuacja: true }]; x += czesci[i].minuty; }
        return [{ i: czesci.length - 1, kontynuacja: true }];
      }
      return wynik.map(i => ({ i: i }));
    }

    function dostosowanieDla(stan, id) {
      if (!stan.proby[id] && !stan.cofniecia[id]) return null;
      const bledy = stan.przyczyny.filter(x => x.komp === id && x.opis && x.opis !== 'nie wiem' && x.opis !== 'nieznana').slice(-6);
      const licz = {};
      bledy.forEach(b => { licz[b.opis] = (licz[b.opis] || 0) + 1; });
      const ai = (stan.aiDiagnozy || {})[id] || null;
      const przyczyna = ai ? ai.opis : Object.keys(licz).sort((a, b) => licz[b] - licz[a])[0] || null;
      const podstawy = (K[id].wymaga || []).filter(pre => K[pre]).sort((a, b) => poziom(stan, a) - poziom(stan, b));
      // rozgrzewka: podstawa wskazana przez AI, a bez AI najsłabsza podstawa
      const rozgrzewka = ai && ai.pre && PYT[ai.pre] ? ai.pre : podstawy.length && poziom(stan, podstawy[0]) < 0.9 ? podstawy[0] : null;
      const zmiany = ['Najpierw wyjaśnienie krok po kroku (schemat), dopiero potem zadania'];
      if (rozgrzewka) zmiany.push('Rozgrzewka z podstawy: ' + K[rozgrzewka].nazwa + (ai && ai.pre === rozgrzewka ? ' (wskazała AI)' : ''));
      if (ai && ai.wskazowka) zmiany.push('Wskazówka AI: ' + ai.wskazowka);
      zmiany.push('Quiz z nowym zestawem pytań');
      return { proby: stan.proby[id] || 0, cofniecie: !!stan.cofniecia[id], przyczyna: przyczyna, rozgrzewka: rozgrzewka, rozgrzewkaNazwa: rozgrzewka ? K[rozgrzewka].nazwa : null, zmiany: zmiany, ai: ai };
    }

    function utworzJednostke(stan, x, org) {
      const k = K[x.id], st = status(stan, x.id);
      const sprawdzenie = doSprawdzenia(stan, x.id);
      const dostosowanie = dostosowanieDla(stan, x.id);
      let min = 0;
      if (!sprawdzenie) {
        min = k.czas || KONFIG.czasPoziomu[k.poziom];
        if (st.pewny && st.status === 'do_utrwalenia' && !stan.cofniecia[x.id]) min *= KONFIG.mnoznikUtrwalenia;
        if (org.dysleksja || org.dyskalkulia) min *= KONFIG.mnoznikDysleksji;
        min = Math.max(10, Math.ceil(min / 5) * 5);
      }
      const powod = sprawdzenie
        ? (x.powod.indexOf('Podstawa do') === 0 ? 'Szybkie sprawdzenie podstawy do: ' + x.powod.slice(13) : powodDla(stan, x.id))
        : x.powod;
      return {
        komp: x.id, nazwa: k.nazwa, dzial: D[k.dzial].nazwa, dzialId: k.dzial, poziomTrudnosci: POZIOMY[k.poziom], cke: k.cke,
        typ: sprawdzenie ? 'sprawdzenie' : 'nauka',
        minuty: min, pozostalo: Math.max(0, min - (stan.zrobioneMinuty[x.id] || 0)),
        powod: powod, status: st.status, pewny: st.pewny, opanowanie: Math.round(st.p * 100),
        dostosowanie: dostosowanie,
        materialy: sprawdzenie ? [] : dopasujDoCzasu(materialDla(x.id, org, !!dostosowanie, st.pewny && st.status === 'do_utrwalenia' && !dostosowanie), min)
      };
    }

    // ───────────── KALENDARZ DNI (wspólny dla planu i serii) ─────────────
    function przygotujOrg(organizacja) {
      return Object.assign({ minutDziennie: 30, dniTygodnia: [1, 2, 3, 4, 5, 6], godzina: '18:00', blokady: [], swieta: true }, organizacja || {});
    }
    function blokadyDla(org, odRoku, doRoku) {
      return (org.swieta ? swietaDomyslne(odRoku, doRoku) : []).concat(org.blokady || []);
    }
    // Opis każdego dnia od startu nauki: nauka / bufor / blokada / wolne (dzień spoza wybranych).
    // Dni buforowe liczymy od dnia startu, więc nie "uciekają" przy każdym przeliczeniu planu.
    function mapaDni(stan, org, doDaty) {
      const start = stan.utworzono || dzisiaj();
      const blokady = blokadyDla(org, Number(start.slice(0, 4)) - 1, Number(doDaty.slice(0, 4)));
      const wynik = {};
      let licznik = 0;
      for (let d = start; d <= doDaty; d = dodajDni(d, 1)) {
        if (org.dniTygodnia.indexOf(dzienTygodnia(d)) === -1) { wynik[d] = { typ: 'wolne' }; continue; }
        const b = blokady.find(x => d >= x.od && d <= (x.do || x.od));
        if (b) { wynik[d] = { typ: 'blokada', nazwa: b.nazwa }; continue; }
        licznik++;
        wynik[d] = { typ: licznik % KONFIG.coKtoryDzienBufor === 0 ? 'bufor' : 'nauka' };
      }
      return wynik;
    }

    // Seria (streak): dni z nauką z rzędu. Dni wolne, buforowe i zablokowane nie przerywają serii.
    function seria(stan, organizacja, dzis) {
      uzupelnijStan(stan);
      dzis = dzis || dzisiaj();
      const org = przygotujOrg(organizacja);
      const mapa = mapaDni(stan, org, dzis);
      const akt = stan.aktywneDni;
      let n = 0, d = akt[dzis] ? dzis : dodajDni(dzis, -1);
      const start = stan.utworzono || dzis;
      while (d >= start) {
        const typ = mapa[d] ? mapa[d].typ : 'nauka';
        if (akt[d]) n++;
        else if (typ !== 'nauka') { /* dzień wolny: seria trwa */ }
        else break;
        d = dodajDni(d, -1);
      }
      let rekord = 0, biezaca = 0;
      for (let x = start; x <= dzis; x = dodajDni(x, 1)) {
        const typ = mapa[x] ? mapa[x].typ : 'nauka';
        if (akt[x]) { biezaca++; rekord = Math.max(rekord, biezaca); }
        else if (typ === 'nauka' && x !== dzis) biezaca = 0;
      }
      return { dni: n, rekord: Math.max(rekord, n), dzisZrobione: !!akt[dzis], dzisTyp: mapa[dzis] ? mapa[dzis].typ : 'nauka', dzisNazwa: mapa[dzis] && mapa[dzis].nazwa };
    }

    // ───────────── A5 + A7: HARMONOGRAM ─────────────
    // org = { dataMatury: 'RRRR-MM-DD', minutDziennie: 15, dniTygodnia: [1..6, 0 = nd],
    //         godzina: '18:00', blokady: [{ od, do, nazwa }], swieta: true,
    //         dysleksja: false, dyskalkulia: false, preferencja: 'wideo' | 'teoria' | 'arkusz' | null }
    function zaplanuj(stan, organizacja, dzis) {
      uzupelnijStan(stan);
      dzis = dzis || dzisiaj();
      const org = przygotujOrg(organizacja);
      if (!org.dataMatury) throw new Error('Podaj datę matury (organizacja.dataMatury, format RRRR-MM-DD).');
      if (org.dataMatury <= dzis) throw new Error('Data matury minęła. Ustaw kolejny rok matury.');
      if (!org.dniTygodnia.length) throw new Error('Wybierz co najmniej jeden dzień nauki w tygodniu.');
      if (org.minutDziennie < 10) throw new Error('Minimum to 10 minut dziennie.');
      const ankieta = stan.ankieta || {};
      const cel = ankieta.cel ? Number(ankieta.cel) : 70;
      const ostatni = dodajDni(org.dataMatury, -1);

      // 1. dni nauki, blokady i dni buforowe
      const mapa = mapaDni(stan, org, ostatni);
      const dni = [];
      for (let d = dzis; d <= ostatni; d = dodajDni(d, 1)) {
        const m = mapa[d] || { typ: 'nauka' };
        if (m.typ === 'wolne') continue;
        if (m.typ === 'blokada') { dni.push({ data: d, blokada: m.nazwa }); continue; }
        dni.push({ data: d, bufor: m.typ === 'bufor' });
      }
      // dzisiaj: odejmujemy minuty, które uczeń już przerobił
      const zuzyteDzis = stan.historiaSesji.filter(h => h.data === dzis && h.zrobiona).reduce((s, h) => s + (h.minuty || 0), 0);

      // 2. diagnozy pełne (np. 5 miesięcy do matury = co miesiąc)
      const interwal = interwalDiagnozy(roznicaDni(dzis, org.dataMatury));
      const terminy = [];
      let t = dodajDni(stan.ostatniaDiagnozaPelna || stan.utworzono || dzis, interwal);
      if (t < dzis) t = dzis;
      while (t <= dodajDni(ostatni, -3)) { terminy.push(t); t = dodajDni(t, interwal); }

      // 3. jednostki w kolejności priorytetu, prerekwizyty przed tematami zależnymi
      const jednostki = kolejnoscJednostek(stan, cel, ankieta.dzialyPriorytetowe || null, !!ankieta.tylkoPriorytetowe)
        .map(x => utworzJednostke(stan, x, org));

      // 4. ile się zmieści (bez dni buforowych = 80% czasu)
      const dniNauki = dni.filter(d => !d.blokada && !d.bufor).length;
      const pojemnosc = Math.max(0, (dniNauki - terminy.length) * org.minutDziennie - zuzyteDzis);
      const wybrane = [], pominiete = [], pominieteId = new Set();
      let suma = 0;
      jednostki.forEach(u => {
        const brakPodstawy = (K[u.komp].wymaga || []).some(pre => pominieteId.has(pre));
        const koszt = u.pozostalo + KONFIG.quizMin + KONFIG.powtorkaMin;
        if (!brakPodstawy && suma + koszt <= pojemnosc) { wybrane.push(u); suma += koszt; }
        else { pominiete.push(u); pominieteId.add(u.komp); }
      });

      // 5. rozkład na dni
      const I = KONFIG.interwalyPowtorek;
      const sesje = [], gotowe = [];
      const kolejka = wybrane.map(u => Object.assign({}, u, { etap: u.pozostalo > 0 ? 'nauka' : 'quiz', czesc: 0 }));
      const powt = stan.powtorki.map(x => ({ komp: x.komp, data: x.data, etap: x.etap || 0, zaplanowana: false }));
      let di = 0;
      dni.forEach(dzien => {
        if (dzien.blokada) return;
        const data = dzien.data;
        let minuta = naMinuty(org.godzina);
        const dodajSesje = s => {
          s.data = data; s.start = naGodzine(minuta); minuta += s.minuty; s.koniec = naGodzine(minuta);
          s.id = data + '#' + sesje.length;
          sesje.push(s);
        };
        if (dzien.bufor) { sesje.push({ id: data + '#' + sesje.length, data: data, typ: 'bufor', minuty: 0, tytul: 'Dzień buforowy: nadrabianie zaległości' }); return; }
        if (di < terminy.length && data >= terminy[di]) {
          dodajSesje({ typ: 'diagnoza', minuty: KONFIG.diagnozaMin, tytul: 'Diagnoza pełna: symulowany wynik matury', opis: 'Test sprawdza cały materiał i pokazuje przewidywany wynik matury na dziś. Plan zaktualizuje się automatycznie.' });
          di++;
          return;
        }
        let cap = data === dzis ? Math.max(0, org.minutDziennie - zuzyteDzis) : org.minutDziennie;
        // powtórki: max 5 tematów w jednym 5-minutowym quizie; reszta przechodzi na kolejny dzień
        const doPowtorki = powt.filter(x => !x.zaplanowana && x.data <= data).slice(0, KONFIG.powtorkaPytan);
        if (doPowtorki.length && cap >= KONFIG.powtorkaMin) {
          doPowtorki.forEach(x => {
            x.zaplanowana = true;
            // projekcja: zakładamy, że powtórka się uda, więc następna przypada później
            if (x.etap + 1 < I.length) powt.push({ komp: x.komp, data: dodajDni(data, I[x.etap + 1]), etap: x.etap + 1, zaplanowana: false });
          });
          const komps = Array.from(new Set(doPowtorki.map(x => x.komp)));
          dodajSesje({ typ: 'powtorka', komps: komps, minuty: KONFIG.powtorkaMin, tytul: 'Powtórka 5 min', opis: 'Krótki quiz z tematów: ' + komps.map(id => K[id].nazwa).join(', ') + '.' });
          cap -= KONFIG.powtorkaMin;
        }
        while (kolejka.length && cap >= 5) {
          const u = kolejka[0];
          if (u.etap === 'nauka') {
            if (u.czesc === 0 && cap < 10 && u.pozostalo > cap) break; // nie zaczynaj tematu w 5 minut
            const m = Math.min(cap, u.pozostalo);
            u.czesc++;
            if (!u.start) u.start = data;
            const a = u.minuty - u.pozostalo;
            const cz = czesciSesji(u.materialy, u.minuty, a, a + m, u.pozostalo - m <= 0).map(x => Object.assign({ kontynuacja: !!x.kontynuacja }, u.materialy[x.i]));
            const mat = cz[0] || u.materialy[0];
            dodajSesje({ typ: 'nauka', komp: u.komp, minuty: m, czesc: u.czesc, nazwa: u.nazwa, dostosowane: !!u.dostosowanie, powod: u.powod,
              czesci: cz.map(c => ({ id: c.id, typ: c.typ, nazwa: c.nazwa, minuty: c.minuty, kontynuacja: c.kontynuacja, url: c.url, produkt: c.produkt })),
              opis: 'Temat: ' + u.nazwa + '.' + (cz.length ? ' Dziś: ' + cz.map(c => (c.kontynuacja ? 'dokończ: ' : '') + c.nazwa + ' (' + c.minuty + ' min)').join(', ') + '.' : '') +
                (mat && mat.url ? ' Materiał Maturalnych: ' + (mat.produkt || mat.tytul) + (mat.fragment ? ', ' + mat.fragment : '') + '. ' + mat.url : '') });
            u.pozostalo -= m; cap -= m;
            if (u.pozostalo <= 0) u.etap = 'quiz';
          } else {
            if (cap < KONFIG.quizMin) break;
            if (!u.start) u.start = data;
            dodajSesje(u.typ === 'sprawdzenie'
              ? { typ: 'quiz', sprawdzenie: true, komp: u.komp, minuty: KONFIG.quizMin, tytul: 'Sprawdzenie: ' + u.nazwa, powod: u.powod, opis: 'Krótki quiz. Zaliczysz (min. ' + Math.round(KONFIG.progZaliczenia * 100) + '%), to temat odhaczony bez nauki. Jeśli nie, plan doda naukę tego tematu.' }
              : { typ: 'quiz', komp: u.komp, minuty: KONFIG.quizMin, tytul: 'Quiz: ' + u.nazwa, powod: u.powod, opis: 'Zalicz quiz (min. ' + Math.round(KONFIG.progZaliczenia * 100) + '%), żeby odhaczyć temat.' });
            cap -= KONFIG.quizMin;
            u.koniec = data;
            powt.push({ komp: u.komp, data: dodajDni(data, I[0]), etap: 0, zaplanowana: false });
            gotowe.push(kolejka.shift());
          }
        }
      });
      kolejka.forEach(u => { pominiete.push(u); });
      // numeracja części: "Funkcja liniowa (2/3)"
      const czesci = {};
      sesje.forEach(s => { if (s.typ === 'nauka') czesci[s.komp] = (czesci[s.komp] || 0) + 1; });
      const juz = {};
      sesje.forEach(s => {
        if (s.typ !== 'nauka') return;
        const wczesniej = stan.czesciZrobione[s.komp] || 0;
        juz[s.komp] = (juz[s.komp] || 0) + 1;
        s.czesc = juz[s.komp] + wczesniej; s.z = czesci[s.komp] + wczesniej;
        s.tytul = s.nazwa + ' (' + s.czesc + '/' + s.z + ')'; delete s.nazwa;
      });

      // 6. podsumowanie dla ucznia: przewidywalność
      const minutNauki = gotowe.reduce((s, u) => s + u.minuty, 0);
      // sprawdzenie nie podnosi wiedzy, tylko ją odkrywa: liczymy wyłącznie tematy z nauką
      const zaplanowane = new Set(gotowe.filter(u => u.typ === 'nauka').map(u => u.komp));
      const prognozaPoPlanie = Math.round(dane.kompetencje.reduce((s, k) =>
        s + W[k.id] * (zaplanowane.has(k.id) ? Math.max(poziom(stan, k.id), KONFIG.poziomPoNauce) : poziom(stan, k.id)), 0) * 100);
      const minutPominietych = pominiete.reduce((s, u) => s + u.pozostalo, 0);
      const koniecPlanu = gotowe.length ? gotowe[gotowe.length - 1].koniec : null;
      // ile minut dziennie trzeba, żeby zmieścić wszystko (przewidywalność dla ucznia)
      const kosztCalosci = jednostki.reduce((s, u) => s + u.pozostalo + KONFIG.quizMin + KONFIG.powtorkaMin, 0);
      const dniEfektywne = Math.max(1, dniNauki - terminy.length);
      const minutNaCalosc = Math.max(10, Math.ceil(kosztCalosci / dniEfektywne / 5) * 5);
      const komunikat = pominiete.length
        ? 'Przy ' + org.minutDziennie + ' min dziennie nie zmieścisz wszystkiego. Zaczynamy od tematów, które dają najwięcej punktów za minutę nauki. Poza planem: ' + pominiete.length + ' tematów (ok. ' + Math.round(minutPominietych / 60) + ' h). Na całość potrzeba ok. ' + minutNaCalosc + ' min dziennie.'
        : 'Plan mieści cały potrzebny materiał. Ostatni temat zaliczasz ' + koniecPlanu + ', potem czas na arkusze.';

      return {
        utworzono: dzis,
        organizacja: org,
        sesje: sesje,
        jednostki: gotowe.map(u => ({ komp: u.komp, nazwa: u.nazwa, dzial: u.dzial, dzialId: u.dzialId, typ: u.typ, poziomTrudnosci: u.poziomTrudnosci, cke: u.cke, minuty: u.minuty, pozostalo: u.pozostalo, start: u.start, koniec: u.koniec, powod: u.powod, opanowanie: u.opanowanie, dostosowanie: u.dostosowanie, materialy: u.materialy })),
        pominiete: pominiete.map(u => ({ komp: u.komp, nazwa: u.nazwa, dzial: u.dzial, typ: u.typ, minuty: u.pozostalo, powod: u.powod })),
        zaliczone: Object.keys(stan.zaliczone).map(id => ({ komp: id, nazwa: K[id].nazwa, dzial: D[K[id].dzial].nazwa, data: stan.zaliczone[id], powtorka: (stan.powtorki.find(x => x.komp === id) || {}).data || null })),
        terminyDiagnoz: terminy,
        podsumowanie: {
          jednostek: gotowe.length, godzinNauki: Math.round(minutNauki / 6) / 10, koniecPlanu: koniecPlanu,
          minutTygodniowo: org.minutDziennie * org.dniTygodnia.length, dniBuforowe: dni.filter(d => d.bufor).length,
          dniZablokowane: dni.filter(d => d.blokada).length, diagnozPelnych: terminy.length, coIleDniDiagnoza: interwal,
          sprawdzen: gotowe.filter(u => u.typ === 'sprawdzenie').length, minutDziennieNaCalosc: minutNaCalosc,
          prognozaTeraz: prognoza(stan).wynik, prognozaPoPlanie: prognozaPoPlanie, pominietych: pominiete.length,
          dniDoMatury: roznicaDni(dzis, org.dataMatury), komunikat: komunikat
        }
      };
    }

    // Uczeń odhacza sesję nauki ("zrobione"). Pominiętej nie trzeba zgłaszać: zaplanuj() od dziś ją przesunie.
    function oznaczSesje(stan, sesja, zrobiona, dzis) {
      uzupelnijStan(stan);
      dzis = dzis || dzisiaj();
      stan.historiaSesji.push({ data: dzis, sesja: sesja.id, typ: sesja.typ, komp: sesja.komp || null, minuty: sesja.minuty || 0, tytul: sesja.tytul, zrobiona: !!zrobiona });
      if (stan.historiaSesji.length > 600) stan.historiaSesji = stan.historiaSesji.slice(-600);
      if (zrobiona && sesja.typ === 'nauka') {
        stan.zrobioneMinuty[sesja.komp] = (stan.zrobioneMinuty[sesja.komp] || 0) + sesja.minuty;
        stan.czesciZrobione[sesja.komp] = (stan.czesciZrobione[sesja.komp] || 0) + 1;
      }
      if (zrobiona) zapiszAktywnosc(stan, dzis);
      return stan;
    }

    function grupujTygodnie(plan) {
      const tyg = {};
      plan.sesje.forEach(s => {
        const pon = dodajDni(s.data, -((dzienTygodnia(s.data) + 6) % 7));
        (tyg[pon] = tyg[pon] || []).push(s);
      });
      return Object.keys(tyg).sort().map(k => ({ tydzienOd: k, sesje: tyg[k], minut: tyg[k].reduce((a, s) => a + s.minuty, 0) }));
    }

    // ───────────── KALENDARZ ─────────────
    function escIcs(t) { return String(t || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
    function zawin(linia) {
      const enc = new TextEncoder(), czesci = [];
      let biez = '', dl = 0, limit = 75;
      for (const ch of linia) {
        const b = enc.encode(ch).length;
        if (dl + b > limit) { czesci.push(biez); biez = ''; dl = 0; limit = 74; }
        biez += ch; dl += b;
      }
      czesci.push(biez);
      return czesci.join('\r\n ');
    }
    function czasIcs(data, godz) { return data.replace(/-/g, '') + 'T' + godz.replace(':', '') + '00'; }

    // Opis wydarzenia w kalendarzu: CO i KIEDY + link do lekcji w aplikacji + zapasowy link do materiału.
    const IKONY = { wideo: '▶', tekst: '📄', trening: '✏️', arkusz: '📝' };
    function opisWydarzenia(s, adres) {
      const L = [];
      if (s.typ === 'nauka') {
        L.push('Co: ' + s.tytul + ', ' + s.minuty + ' min.');
        if (s.czesci && s.czesci.length) L.push('Dziś: ' + s.czesci.map(c => (IKONY[c.typ] || '') + ' ' + (c.kontynuacja ? 'dokończ: ' : '') + c.nazwa + ' (' + c.minuty + ' min)').join(' · '));
      } else L.push(s.opis || s.tytul);
      if (adres && s.komp && s.typ === 'nauka') L.push('Otwórz lekcję w aplikacji: ' + adres + '#/lekcja/' + s.komp);
      else if (adres) L.push('Otwórz aplikację: ' + adres + '#/dzis');
      const zapas = (s.czesci || []).find(c => c.url);
      if (zapas) L.push('Zapasowy link do materiału Maturalnych: ' + zapas.produkt + ' ' + zapas.url);
      L.push('Plan zmienia się po każdym quizie. Aktualny plan zawsze w aplikacji.');
      return L.join('\n');
    }

    function doIcs(plan, opcje) {
      opcje = opcje || {};
      const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
      const linie = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Maturalni//Plan nauki//PL', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Matura: plan nauki'];
      plan.sesje.forEach((s, i) => {
        if (!s.minuty) return;
        linie.push('BEGIN:VEVENT', 'UID:maturalni-' + s.data + '-' + i + '@plan', 'DTSTAMP:' + stamp,
          'DTSTART:' + czasIcs(s.data, s.start), 'DTEND:' + czasIcs(s.data, s.koniec),
          zawin('SUMMARY:' + escIcs('Matura: ' + s.tytul)), zawin('DESCRIPTION:' + escIcs(opisWydarzenia(s, opcje.adres))),
          ...(opcje.adres ? [zawin('URL:' + opcje.adres + (s.typ === 'nauka' && s.komp ? '#/lekcja/' + s.komp : '#/dzis'))] : []), 'END:VEVENT');
      });
      linie.push('END:VCALENDAR');
      return linie.join('\r\n');
    }

    function linkGoogle(s, opcje) {
      opcje = opcje || {};
      return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
        '&text=' + encodeURIComponent('Matura: ' + s.tytul) +
        '&dates=' + czasIcs(s.data, s.start) + '/' + czasIcs(s.data, s.koniec) +
        '&details=' + encodeURIComponent(opisWydarzenia(s, opcje.adres)) + '&ctz=Europe%2FWarsaw';
    }

    // ───────────── KONTROLA DANYCH (dla autorów matrycy i pytań) ─────────────
    function walidujDane() {
      const bledy = [], ostrzezenia = [], ids = new Set();
      dane.kompetencje.forEach(k => {
        if (ids.has(k.id)) bledy.push('Powtórzone id kompetencji: ' + k.id);
        ids.add(k.id);
        if (!D[k.dzial]) bledy.push(k.id + ': nieznany dział ' + k.dzial);
        if ([1, 2, 3].indexOf(k.poziom) === -1) bledy.push(k.id + ': poziom musi być 1, 2 lub 3');
        (k.wymaga || []).forEach(pre => { if (!K[pre]) bledy.push(k.id + ': nieznany prerekwizyt ' + pre); });
        if (!(PYT[k.id] || []).length) ostrzezenia.push(k.id + ' (' + k.nazwa + '): brak pytań w banku');
      });
      const stanDFS = {};
      function dfs(id, sciezka) {
        if (stanDFS[id] === 1) { bledy.push('Cykl w prerekwizytach: ' + sciezka.concat(id).join(' -> ')); return; }
        if (stanDFS[id] === 2 || !K[id]) return;
        stanDFS[id] = 1;
        (K[id].wymaga || []).forEach(pre => dfs(pre, sciezka.concat(id)));
        stanDFS[id] = 2;
      }
      dane.kompetencje.forEach(k => dfs(k.id, []));
      const pids = new Set();
      pytania.forEach(q => {
        if (pids.has(q.id)) bledy.push('Powtórzone id pytania: ' + q.id);
        pids.add(q.id);
        if (!K[q.komp]) bledy.push(q.id + ': nieznana kompetencja ' + q.komp);
        if (!q.odp || q.odp.length !== 4) bledy.push(q.id + ': pytanie musi mieć 4 odpowiedzi');
        if (q.odp && new Set(q.odp).size !== q.odp.length) bledy.push(q.id + ': powtórzone odpowiedzi');
        Object.keys(q.bledy || {}).forEach(i => {
          if (['1', '2', '3'].indexOf(i) === -1) bledy.push(q.id + ': bledy mogą dotyczyć tylko odpowiedzi 1, 2, 3');
          const p = rozpoznajPrzyczyne(q.bledy[i]);
          if (q.bledy[i].indexOf('PRE:') === 0 && !p.pre) bledy.push(q.id + ': tag PRE wskazuje nieznaną kompetencję');
        });
      });
      return { ok: bledy.length === 0, bledy: bledy, ostrzezenia: ostrzezenia, kompetencji: dane.kompetencje.length, pytan: pytania.length };
    }

    // ───────────── AI: przyczyna błędu (model językowy proponuje, silnik decyduje) ─────────────
    // Kandydaci = temat + jego podstawy do 2 poziomów w dół. AI może wskazać tylko jednego z nich.
    function kandydaciAI(id) {
      const L = [];
      const dodaj = x => { if (K[x] && L.indexOf(x) === -1) L.push(x); };
      dodaj(id);
      (K[id].wymaga || []).forEach(p1 => { dodaj(p1); ((K[p1] && K[p1].wymaga) || []).forEach(dodaj); });
      return L.map(x => ({ id: x, nazwa: K[x].nazwa, cke: K[x].cke }));
    }
    // Przyczyna według reguł (tag przy błędnej odpowiedzi w banku pytań): punkt odniesienia dla AI
    function regulaDla(pytanieId, wybrana) {
      const q = PYT_ID[pytanieId];
      if (!q || wybrana === 0) return null;
      if (wybrana === -1) return { komp: null, opis: 'nie wiem' };
      const p = rozpoznajPrzyczyne(q.bledy && q.bledy[wybrana]);
      return { komp: p && p.pre ? p.pre : q.komp, opis: p ? p.opis : 'brak opisu błędu w kluczu' };
    }
    // Dane do analizy jednego błędu (bez danych osobowych ucznia)
    function daneDoAI(pytanieId, wybrana, rozwiazanie) {
      const q = PYT_ID[pytanieId];
      const r = regulaDla(pytanieId, wybrana);
      return {
        tryb: 'pytanie',
        temat: { id: q.komp, nazwa: K[q.komp].nazwa, cke: K[q.komp].cke },
        kandydaci: kandydaciAI(q.komp),
        bledy: [{ pytanie: q.tresc, poprawna: q.odp[0], odpowiedzUcznia: wybrana === -1 ? 'nie wiem' : q.odp[wybrana], typowaPrzyczyna: r ? r.opis : null }],
        rozwiazanieUcznia: String(rozwiazanie || '').slice(0, 600)
      };
    }
    // Dane do analizy po 2 nieudanych quizach (wpis z stan.doAnalizyAI)
    function daneDoAIPoPorazce(wpis) {
      return {
        tryb: 'temat',
        temat: { id: wpis.komp, nazwa: K[wpis.komp].nazwa, cke: K[wpis.komp].cke },
        kandydaci: kandydaciAI(wpis.komp),
        bledy: (wpis.bledne || []).slice(0, 8).map(b => ({ pytanie: b.pytanie, poprawna: b.poprawna, odpowiedzUcznia: b.wybrana, typowaPrzyczyna: b.przyczyna })),
        rozwiazanieUcznia: ''
      };
    }
    function przyjmijAI(id, ai) {
      if (!ai || !ai.komp || !(Number(ai.pewnosc) >= KONFIG.progPewnosciAI)) return null;
      return kandydaciAI(id).some(x => x.id === ai.komp) ? ai.komp : null;
    }
    const powodOdrzucenia = (id, ai) => !ai || !ai.komp ? 'AI nie wskazała przyczyny: decydują reguły'
      : !kandydaciAI(id).some(x => x.id === ai.komp) ? 'AI wskazała temat spoza listy: decydują reguły' : 'AI niepewna: decydują reguły';
    // Po jednym błędzie: AI zmienia przyczynę i (w teście adaptacyjnym) kolejne pytanie
    function zastosujAI(stan, sesja, pytanieId, ai, dzis) {
      const q = PYT_ID[pytanieId];
      const o = sesja && sesja.odpowiedzi.find(x => x.pytanie === pytanieId);
      if (!q || !o || o.poprawna) return { przyjete: false, powod: 'brak błędu do analizy' };
      const komp = przyjmijAI(q.komp, ai);
      if (!komp) return { przyjete: false, powod: powodOdrzucenia(q.komp, ai) };
      const pre = komp !== q.komp ? komp : null;
      const regula = o.przyczyna ? o.przyczyna.pre : null;
      if (pre && pre !== regula) dodajDowod(stan, pre, false, KONFIG.wagaAI, dzis || sesja.dzis);
      o.przyczyna = Object.assign({}, o.przyczyna || {}, { pre: pre, opis: ai.opis || (o.przyczyna || {}).opis, ai: true, nieWiem: false });
      for (let i = stan.przyczyny.length - 1; i >= 0; i--) {
        const x = stan.przyczyny[i];
        if (x.pytanie === pytanieId) { x.opis = ai.opis || x.opis; x.pre = pre; x.zrodlo = 'AI'; x.pewnosc = ai.pewnosc; break; }
      }
      let zmianaTestu = null;
      if (sesja.adaptacyjny && pre && pre !== regula && maPytanie(sesja, pre) && !juzZadana(sesja, pre)) {
        const stare = sesja.kolejka[0] && sesja.kolejka[0].powod === 'cofniecie' ? sesja.kolejka.shift().id : null;
        sesja.kolejka.unshift({ id: pre, powod: 'cofniecie' });
        if (stare !== pre) zmianaTestu = { z: stare, na: pre, nazwa: K[pre].nazwa };
      }
      return { przyjete: true, komp: komp, pre: pre, podstawa: pre ? K[pre].nazwa : null, zmianaTestu: zmianaTestu };
    }
    // Po 2 nieudanych quizach: AI wskazuje podstawę do powtórki, plan ją uwzględnia
    function zastosujAIPoPorazce(stan, id, ai, dzis) {
      const wpis = stan.doAnalizyAI.slice().reverse().find(x => x.komp === id && !x.ai);
      if (wpis) wpis.ai = { komp: ai && ai.komp, pewnosc: ai && ai.pewnosc, opis: ai && ai.opis };
      const komp = przyjmijAI(id, ai);
      if (!komp) return { przyjete: false, powod: powodOdrzucenia(id, ai) };
      const pre = komp !== id ? komp : null;
      stan.aiDiagnozy[id] = { pre: pre, opis: ai.opis, wskazowka: ai.wskazowka, pewnosc: ai.pewnosc, data: dzis };
      let dodanaPodstawa = null;
      if (pre) {
        dodajDowod(stan, pre, false, KONFIG.wagaAI, dzis);
        if (stan.zaliczone[pre]) { delete stan.zaliczone[pre]; resetPostepu(stan, pre); }
        dodanaPodstawa = { komp: pre, nazwa: K[pre].nazwa };
      }
      return { przyjete: true, komp: komp, pre: pre, podstawa: dodanaPodstawa };
    }

    return {
      KONFIG: KONFIG,
      kandydaciAI: kandydaciAI, regulaDla: regulaDla, daneDoAI: daneDoAI, daneDoAIPoPorazce: daneDoAIPoPorazce,
      zastosujAI: zastosujAI, zastosujAIPoPorazce: zastosujAIPoPorazce,
      nowyStan: nowyStan, uzupelnijStan: uzupelnijStan,
      utworzTest: utworzTest, nastepnePytanie: nastepnePytanie, odpowiedz: odpowiedz, zakonczTest: zakonczTest,
      prognoza: prognoza, podsumujWiedze: podsumujWiedze,
      zaplanuj: zaplanuj, przeplanuj: zaplanuj, oznaczSesje: oznaczSesje, grupujTygodnie: grupujTygodnie,
      seria: seria, zapiszAktywnosc: zapiszAktywnosc, mapaDni: (stan, org, doDaty) => mapaDni(stan, przygotujOrg(org), doDaty),
      doIcs: doIcs, linkGoogle: linkGoogle, opisWydarzenia: opisWydarzenia,
      materialyDla: (id, org) => materialDla(id, org || {}, false, false),
      walidujDane: walidujDane,
      status: status, wagaWMaturze: id => W[id], kompetencja: id => K[id],
      kompetencje: () => dane.kompetencje, dzialy: () => dane.dzialy, dzial: id => D[id],
      pytaniaDla: id => PYT[id] || [], pytanie: id => PYT_ID[id]
    };
  }

  return { KONFIG: KONFIG, utworzSilnik: utworzSilnik, swietaDomyslne: swietaDomyslne, wielkanoc: wielkanoc, dodajDni: dodajDni, roznicaDni: roznicaDni, dzienTygodnia: dzienTygodnia, dzisiaj: dzisiaj };
});

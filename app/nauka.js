/*
 * app/nauka.js: interfejs modułu "Plan matury z matematyki"
 * Kalibracja (styl Maturalnych) > test diagnostyczny > wynik z mapą mikrokompetencji > plan dnia
 * z serią > lekcja z materiałem Maturalnych > quizy i powtórki > postępy > powiadomienia > kalendarz.
 * Cała logika liczenia jest w silnik/silnik.js. Dane ucznia zapisują się tylko w jego przeglądarce.
 */
(function (root) {
  'use strict';
  const M = root.Mikro;
  const S = M.utworzSilnik();
  const KLUCZ = 'maturalni-nauka-v1', KLUCZ_KAL = 'maturalni-kalibracja-v1';
  const app = document.getElementById('app');
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MIESIACE = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
  const DNI = ['nd', 'pn', 'wt', 'śr', 'cz', 'pt', 'sb'];
  const KOLEJNOSC_DNI = [1, 2, 3, 4, 5, 6, 0];
  const IKONA = { nauka: '📘', quiz: '✅', powtorka: '🔁', diagnoza: '🎯', bufor: '⏸' };
  const POZIOM = ['', 'łatwe', 'średnie', 'trudne'];
  const DATY_MATURY = { 2027: '2027-05-05' }; // harmonogram CKE: matematyka PP, 5 maja 2027, 9:00

  // ───────────── dane i pamięć ─────────────
  function wczytaj(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  let D = wczytaj(KLUCZ);
  if (D && D.stan) S.uzupelnijStan(D.stan); else D = null;
  let kal = wczytaj(KLUCZ_KAL);
  let T = null;   // trwający test
  let W = null;   // wynik ostatniego testu
  function zapisz() { try { localStorage.setItem(KLUCZ, JSON.stringify(D)); } catch (e) { /* tryb prywatny: działa bez zapisu */ } }
  function zapiszKal() { try { localStorage.setItem(KLUCZ_KAL, JSON.stringify(kal)); } catch (e) { } }
  function dzis() { return (D && D.demoDzis) || M.dzisiaj(); }
  function planTeraz() { try { return { plan: S.zaplanuj(D.stan, D.org, dzis()) }; } catch (e) { return { blad: e.message }; } }
  function seria() { return S.seria(D.stan, D.org, dzis()); }

  // ───────────── formatowanie ─────────────
  function fData(d, zRokiem) { const c = d.split('-').map(Number); return c[2] + ' ' + MIESIACE[c[1] - 1] + (zRokiem ? ' ' + c[0] : ''); }
  function fKrotko(d) { const c = d.split('-'); return DNI[M.dzienTygodnia(d)] + ' ' + Number(c[2]) + '.' + c[1]; }
  function odmiana(n, f1, f2, f5) { const a = Math.abs(n), b = a % 10, c = a % 100; return a === 1 ? f1 : (b >= 2 && b <= 4 && (c < 12 || c > 14)) ? f2 : f5; }
  const dniSl = n => n + ' ' + odmiana(n, 'dzień', 'dni', 'dni');
  const tematySl = n => n + ' ' + odmiana(n, 'temat', 'tematy', 'tematów');
  const ladneDaty = t => String(t).replace(/\d{4}-\d{2}-\d{2}/g, d => fData(d, true));
  function nazwaSesji(s) { return s.typ === 'powtorka' ? 'Powtórka 5 min' : s.typ === 'diagnoza' ? 'Diagnoza pełna (symulacja matury)' : s.tytul; }
  function imie() { return D && D.profil && D.profil.imie ? ' ' + esc(D.profil.imie) : ''; }
  function zacheta(i, n) {
    const r = i / Math.max(1, n - 1);
    if (i === 0) return 'Zaczynamy!';
    if (i === n - 1) return 'Ostatnia prosta!';
    return r < 0.3 ? 'Świetnie!' : r < 0.45 ? 'Tak trzymaj!' : r < 0.6 ? 'Jesteśmy w połowie' : r < 0.8 ? 'Będzie super!' : 'Jeszcze chwila';
  }
  function tasuj(t) { for (let i = t.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [t[i], t[j]] = [t[j], t[i]]; } return t; }

  // ───────────── router ─────────────
  const TRASY = {}, KOMPAS = new Set();
  const SZEROKIE = new Set(['', 'dzis', 'plan', 'postepy', 'powiadomienia', 'jak-to-dziala', 'mapa', 'matryca', 'wynik', 'kalendarz', 'materialy', 'import']);
  function rejestruj(t, kompasowe) { Object.assign(TRASY, t); (kompasowe || []).forEach(k => KOMPAS.add(k)); }
  function trasa() {
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    const i = h.indexOf('/');
    return i === -1 ? [h, null] : [h.slice(0, i), h.slice(i + 1)];
  }
  function go(n, p) {
    const h = '#/' + n + (p != null ? '/' + encodeURIComponent(p) : '');
    if (location.hash === h || (!location.hash && h === '#/')) { render(); window.scrollTo(0, 0); }
    else location.hash = h;
  }
  function render() {
    const [n, p] = trasa();
    const fn = TRASY[n] || TRASY[''];
    app.className = 'wrap' + (KOMPAS.has(n) ? ' kompas' : SZEROKIE.has(n) ? ' wide' : '');
    try { fn(p); } catch (e) {
      console.error(e);
      app.innerHTML = `<div class="card red"><h2>Ups, coś poszło nie tak</h2><p>${esc(e.message)}</p><div class="row"><button class="btn-small" onclick="location.hash='#/'">Wróć na start</button></div></div>`;
    }
    rysujGore(n);
    rysujStopke();
  }
  function fokus() { const h = app.querySelector('h1,h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
  window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); fokus(); });

  function rysujGore(n) {
    const ma = !!D;
    const s = ma ? seria() : null;
    const linki = [['', 'Start']].concat(ma
      ? [['dzis', 'Dziś'], ['plan', 'Plan'], ['materialy', 'Materiały'], ['postepy', 'Postępy'], ['powiadomienia', 'Powiadomienia'], ['kalendarz', 'Kalendarz']]
      : [['kalibracja', 'Kalibracja'], ['materialy', 'Materiały']], [['kompas', 'Kompas'], ['jak-to-dziala', 'Jak to działa'], ['mapa', 'Mapa']]);
    const aktywna = h => h === n || (h === 'kompas' && KOMPAS.has(n)) || (h === 'dzis' && (n === 'lekcja' || n === 'quiz' || n === 'quiz-wynik')) || (h === 'materialy' && n === 'import');
    $('topbar').innerHTML = `<div class="in"><a class="logo" href="#/"><i>M</i>Maturalni <small>plan matury</small></a>
      <nav class="nav" aria-label="Główna nawigacja">${linki.map(([h, t]) => `<a href="#/${h}" ${aktywna(h) ? 'aria-current="page"' : ''}>${t}</a>`).join('')}</nav>
      ${s ? `<a class="pill-fire ${s.dni ? '' : 'off'}" href="#/dzis" title="Seria: dni nauki z rzędu">🔥 ${s.dni}</a>` : ''}</div>`;
  }
  function rysujStopke() {
    $('stopka').innerHTML = `<span>Prototyp na EduHackaton Maturalnych 2026 · dane zapisują się tylko w Twojej przeglądarce</span>
      <span>${D && D.demoDzis ? `<b style="color:var(--fire)">Tryb demo: data w aplikacji ${fData(D.demoDzis, true)}</b> · ` : ''}<a href="#/mapa">Mapa strony i narzędzia demo</a></span>`;
  }
  let toastT;
  function toast(msg, ms) { const t = $('toast'); t.innerHTML = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, ms || 4200); }

  // ───────────── wspólne elementy ─────────────
  function krokiHtml(i, n, opis) {
    return `<div class="kroki"><div class="top"><span>${opis || 'Krok'} ${i} z ${n}</span><b>${zacheta(i - 1, n)}</b></div>
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${i}"><i style="width:${i / n * 100}%"></i></div></div>`;
  }
  function pushHtml(tyt, tekst, kiedy) {
    return `<div class="push"><div class="app">M</div><div class="tr"><div class="hd"><b>Maturalni</b><span>${esc(kiedy || 'teraz')}</span></div><div class="msg"><b>${tyt}</b>${tekst}</div></div></div>`;
  }
  function progBar(p, poPlanie) {
    const blisko = p.cel && poPlanie && Math.abs(p.cel - poPlanie) < 14;
    return `<div class="prog" role="img" aria-label="Prognoza ${p.wynik}%, przedział ${p.min}-${p.max}%">
      <div class="tor"></div><div class="pas" style="left:${p.min}%;width:${Math.max(2, p.max - p.min)}%"></div>
      <div class="znacznik" style="left:30%"><span>próg 30%</span></div>
      ${p.cel ? `<div class="znacznik cel" style="left:${p.cel}%"><span>cel ${p.cel}%</span></div>` : ''}
      ${poPlanie ? `<div class="znacznik po" style="left:${poPlanie}%"><span style="${blisko ? 'top:-24px' : ''}">po planie ${poPlanie}%</span></div>` : ''}
      <div class="pkt" style="left:${p.wynik}%"><span>${p.wynik}%</span></div></div>`;
  }
  const LEGENDA = `<div class="legenda"><span><i class="kr opanowane"></i>opanowane</span><span><i class="kr do_utrwalenia"></i>do utrwalenia</span><span><i class="kr luka"></i>luka</span><span><i class="kr szac do_utrwalenia"></i>szacunek (jeszcze nie sprawdzone)</span></div>`;
  function mapaHtml(wiedza) {
    const doOtwarcia = wiedza.filter(d => d.kompetencje.some(k => k.pewny && k.status === 'luka')).sort((a, b) => a.poziom - b.poziom).slice(0, 2).map(d => d.dzial);
    return `<div class="mapa">${wiedza.map(d => {
      const otworz = doOtwarcia.includes(d.dzial);
      return `<details ${otworz ? 'open' : ''}><summary><span class="dn">${esc(d.nazwa)}</span>
        <span class="kropki" aria-hidden="true">${d.kompetencje.map(k => `<i class="kr ${k.status} ${k.pewny ? '' : 'szac'}" title="${esc(k.nazwa)}: ${k.opanowanie}%"></i>`).join('')}</span>
        <span class="pct">${d.poziom}%</span></summary>
        <ul>${d.kompetencje.map(k => `<li><i class="kr ${k.status} ${k.pewny ? '' : 'szac'}"></i>
          <span>${esc(k.nazwa)} <span class="muted tiny">· ${POZIOM[k.poziomTrudnosci]} · CKE ${esc(k.cke)}</span>${k.zaliczona ? ' <span class="badge green">zaliczone</span>' : ''}</span>
          <b class="small">${k.opanowanie}%${k.pewny ? '' : '<span class="muted tiny"> szac.</span>'}</b></li>`).join('')}</ul></details>`;
    }).join('')}</div>`;
  }
  function brakDanych() {
    app.innerHTML = `<div class="q-head"><h1>Najpierw zróbmy kalibrację</h1><p class="sub">Ten ekran pokazuje Twój plan, a planu jeszcze nie ma. Zajmie to kilka minut.</p></div>
      <div class="cta"><button class="btn-main xl arrow" id="k">Rozpocznij kalibrację</button><button class="btn-link" id="d">Albo wczytaj ucznia demo (Ola, cel 80%)</button></div>`;
    $('k').onclick = () => startKalibracji(false);
    $('d').onclick = demoUczen;
  }
  function bladPlanu(msg) {
    app.innerHTML = `<div class="card yellow"><h2>Planu nie da się policzyć</h2><p>${esc(msg)}</p>
      <div class="row"><button class="btn-small" id="k">Zrób kalibrację jeszcze raz</button>${D && D.demoDzis ? '<button class="btn-small alt" id="r">Wróć do dzisiejszej daty</button>' : ''}</div></div>`;
    $('k').onclick = () => startKalibracji(false);
    if ($('r')) $('r').onclick = () => { D.demoDzis = null; zapisz(); render(); };
  }

  // ═════════════ START ═════════════
  function widokStart() {
    const s = D ? seria() : null;
    app.innerHTML = `
      ${D ? `<div class="callout blue"><span class="ico">🔥</span><div class="stack" style="gap:6px"><b class="t">Masz już swój plan${imie()}. Seria: ${dniSl(s.dni)}.</b>
        <div class="row"><button class="btn-small" id="dzis">Przejdź do dzisiejszej nauki</button><button class="btn-small alt" id="nowa">Zrób kalibrację od nowa</button></div></div></div>` : ''}
      <section class="stack" style="align-items:center;text-align:center;gap:18px;padding:24px 0 8px">
        <span class="small muted">● Matura 2027 z matematyki · poziom podstawowy</span>
        <h1 style="font-size:clamp(2.1rem,5.6vw,3.4rem);max-width:17ch">Skalibruj swój plan z matmy <span class="hl">co do umiejętności.</span></h1>
        <p class="lead" style="font-size:1.3rem">Odblokuj <b>plan na swój wynik</b>, a nie na liczbę godzin kursu.</p>
        <ul class="stack" style="list-style:none;padding:0;margin:4px 0;gap:10px;font-size:1.1rem;text-align:left">
          <li>✅ 9 pytań o Ciebie i test ok. 15 minut</li>
          <li>✅ Wiesz, czego nie umiesz <b>i dlaczego</b></li>
          <li>✅ Plan, który sam się przestawia, gdy życie się zmienia</li>
        </ul>
        <p class="small muted">Koniec z błądzeniem po omacku! Czas na plan zwycięstwa!</p>
        <button class="btn-main xl arrow" id="kal">Rozpocznij kalibrację</button>
        <div class="row" style="justify-content:center;gap:18px">
          <button class="btn-link" id="szybka">Wiem, co chcę poprawić: szybka ścieżka</button>
          <button class="btn-link" id="pomin">Pomiń ten krok, chcę dostęp od razu!</button>
        </div>
      </section>
      <section class="stack">
        <div class="row between"><h2>Co dostajesz, czego nie daje zwykła diagnoza</h2><span class="tag-new">Nowość</span></div>
        <div class="grid3">
          <div class="card"><span style="font-size:2rem">🧩</span><h3>67 mikrokompetencji z wymagań CKE</h3><p class="muted">Zamiast jednego wyniku z działu widzisz, którą konkretnie umiejętność masz, a której nie.</p></div>
          <div class="card"><span style="font-size:2rem">🔎</span><h3>Przyczyna błędu, nie tylko „źle”</h3><p class="muted">Test schodzi poziom niżej, gdy coś nie wychodzi, i znajduje brakującą podstawę, np. Pitagorasa pod trygonometrią.</p></div>
          <div class="card"><span style="font-size:2rem">🎯</span><h3>Prognoza wyniku matury</h3><p class="muted">Procent na dziś z uczciwym przedziałem. Co kilka tygodni diagnoza pełna pokazuje, ile już zyskałeś.</p></div>
          <div class="card"><span style="font-size:2rem">⏱️</span><h3>Wiesz, ile to zajmie</h3><p class="muted">Każdy temat ma swoje minuty. Tematy, które pewnie już umiesz, sprawdzamy 5-minutowym quizem zamiast godziny nauki.</p></div>
          <div class="card"><span style="font-size:2rem">🔁</span><h3>Powtórki, które się dopasowują</h3><p class="muted">Pamiętasz, to powtórka za 5, potem 12, potem 30 dni. Zapominasz, to jutro jeszcze raz.</p></div>
          <div class="card"><span style="font-size:2rem">🎄</span><h3>Plan dla prawdziwego życia</h3><p class="muted">Święta, studniówka, choroba, gorszy tydzień. Plan się przelicza, a seria nie przepada w dni wolne.</p></div>
        </div>
      </section>
      <section class="card soft">
        <div class="row between"><div class="stack" style="gap:4px"><h3>Nie wiesz jeszcze, jaki kierunek studiów?</h3><p class="muted">Kompas: 22 pytania o osobowość i zainteresowania, 5 minut. Podpowie ścieżkę, kierunki i przedmioty maturalne.</p></div>
        <button class="btn-small" id="kompas">Zrób Kompas</button></div>
      </section>
      <p class="center small"><button class="btn-link" id="demo">Pokaz dla jury: wczytaj ucznia demo (Ola, cel 80%, słaba z trygonometrii)</button></p>`;
    $('kal').onclick = () => startKalibracji(false);
    $('szybka').onclick = () => go('szybka');
    $('pomin').onclick = () => { kal = nowaKal(false); zapiszKal(); zbudujProfil(); go('test'); };
    $('kompas').onclick = () => go('kompas');
    $('demo').onclick = demoUczen;
    if ($('dzis')) $('dzis').onclick = () => go('dzis');
    if ($('nowa')) $('nowa').onclick = () => startKalibracji(false);
  }

  // ═════════════ KALIBRACJA ═════════════
  function dataMatury(rok) {
    if (DATY_MATURY[rok]) return DATY_MATURY[rok];
    let d = rok + '-05-05';
    const w = M.dzienTygodnia(d);
    if (w === 6) d = M.dodajDni(d, 2); else if (w === 0) d = M.dodajDni(d, 1);
    return d;
  }
  function lataMatury() {
    const t = dzis(), y = Number(t.slice(0, 4)), p = t >= dataMatury(y) ? y + 1 : y;
    return [p, p + 1, p + 2, p + 3, p + 4];
  }
  function nowaKal(szybka, dzialy) {
    return { szybka: !!szybka, szybkaDzialy: dzialy || [], rok: lataMatury()[0], skala: 60, poMaturze: null, cel: 70, celRuszony: false,
      klopot: [], nieWiemDzialy: false, styl: null, minut: 15, dni: [1, 2, 3, 4, 5, 6, 0], godzina: '18:00', imie: '', dysleksja: false, dyskalkulia: false, studniowka: '' };
  }
  function startKalibracji(szybka, dzialy) { kal = nowaKal(szybka, dzialy); zapiszKal(); go('kalibracja', 1); }
  function startPrzedmiot(id) { if (id !== 'mat') return; if (D) go('dzis'); else startKalibracji(false); }
  const ocenaZ = v => Math.min(6, Math.max(1, 1 + Math.round(v / 20)));
  const PO_MATURZE = [
    { t: 'Dostać się na wymarzony, konkretny kierunek (np. medycyna, prawo).', cel: 80 },
    { t: 'Dostać się na prestiżową uczelnię (np. UW, UJ, SGH).', cel: 85 },
    { t: 'Mieć święty spokój i zdać, żeby rodzice byli dumni.', cel: 50 },
    { t: 'Udowodnić sobie (i innym), że jestem super i daję radę!', cel: 90 },
    { t: 'Jeszcze nie wiem – chcę mieć jak najwięcej opcji po maturze', cel: 70 }
  ];
  const STYLE = [
    { id: 'wideo', ill: '📱', t: 'Oglądając konkretne video wyjaśnienia', fb: ['Rozumiem. Jesteś wzrokowcem.', 'Najpierw podsuniemy Ci krótkie wyjaśnienie, potem zadania.'] },
    { id: 'arkusz', ill: '📝', t: 'Rozwiązując zadania, testy i arkusze', fb: ['Rozumiem. Uczysz się w działaniu.', 'Każdy temat zaczniesz od zadań z arkuszy CKE.'] },
    { id: 'teoria', ill: '📖', t: 'Czytając skondensowane notatki i opracowania', fb: ['Rozumiem. Lubisz konkret.', 'Najpierw schemat i gotowiec, potem zadania.'] },
    { id: 'grupa', ill: '💬', t: 'Słuchając i dyskutując z ludźmi w grupie', fb: ['Rozumiem. Jesteś typem społecznym.', 'Mamy aktywną społeczność i grupowe sesje nauki. Razem łatwiej się uczyć!'] }
  ];
  function godzinNauki() {
    const dni = Math.max(0, M.roznicaDni(dzis(), dataMatury(kal.rok)));
    return Math.round(dni * (kal.dni.length / 7) * 0.8 * kal.minut / 60);
  }
  function fbSkali(v) {
    if (v < 25) return ['Spokojnie. Od tego jest plan.', 'Zaczniemy od podstaw, które dają najwięcej punktów.'];
    if (v < 50) return ['Jest dobra baza.', 'Znajdziemy luki, które kosztują Cię najwięcej punktów.'];
    if (v < 75) return ['Solidnie!', 'Teraz chodzi o szlif i pewność na maturze.'];
    return ['Czołówka!', 'Celujemy wysoko i nie tracimy czasu na to, co już umiesz.'];
  }
  function fbCelu(c) {
    if (c >= 80) return 'Przy celu ' + c + '% plan obejmie też zadania trudne.';
    if (c >= 50) return 'Przy celu ' + c + '% skupimy się na zadaniach łatwych i średnich, trudne dorzucimy później.';
    return 'Przy celu ' + c + '% pomijamy zadania trudne. Liczy się pewne zdanie, bez przeładowania.';
  }

  const KROKI_PELNE = ['rok', 'skala', 'po-maturze', 'wynik', 'dzialy', 'styl', 'czas', 'warunki', 'przypomnienia'];
  const KROKI_SZYBKIE = ['rok', 'czas', 'przypomnienia'];
  const KROK = {
    rok() {
      const dm = dataMatury(kal.rok), ile = M.roznicaDni(dzis(), dm);
      return {
        html: `<div class="q-head"><h1>W którym roku zdajesz maturę?</h1><p class="sub">Pomoże nam to określić plan nauki.</p></div>
          <div class="lata">${lataMatury().map(r => `<button class="rok" data-rok="${r}" aria-pressed="${r === kal.rok}">${r}</button>`).join('')}</div>
          <div class="os"><span>${fData(dzis(), true)}</span><span class="kropka"></span><span class="linia"></span><span>matura ${fData(dm)}</span></div>
          <div class="center"><span class="pill-dni">📅 ${ile} dni</span></div>`,
        fb: `<b>Super! Mamy jeszcze ${ile} dni!</b><span class="muted small">${DATY_MATURY[kal.rok] ? 'Matematyka podstawowa: ' + fData(dm, true) + ', godz. 9:00 (harmonogram CKE).' : 'Termin szacunkowy. CKE ogłasza harmonogram w sierpniu roku przed maturą.'}</span>`,
        ok: true, cta: 'Jedziemy dalej!',
        bind() { app.querySelectorAll('[data-rok]').forEach(b => b.onclick = () => { kal.rok = +b.dataset.rok; odswiez(); }); }
      };
    },
    skala() {
      const f = fbSkali(kal.skala);
      return {
        html: `<div class="q-head"><h1>Gdzie widzisz siebie na szkolnej skali z matmy?</h1><p class="sub">Nie zdradzimy tej informacji nikomu! 🤐</p></div>
          <div class="suwak-box"><div class="suwak-etykiety"><span>Walczę o przetrwanie ↘</span><span>↙ Jestem w czołówce</span></div>
          <input type="range" class="suwak" id="sk" min="0" max="100" step="1" value="${kal.skala}" style="--p:${kal.skala}%" aria-label="Twoje miejsce na szkolnej skali"></div>`,
        fb: `<b>${f[0]}</b><span class="muted">${f[1]}</span>`, ok: true, cta: 'Jedziemy dalej!',
        bind() {
          const s = $('sk');
          s.oninput = () => { kal.skala = +s.value; s.style.setProperty('--p', s.value + '%'); const g = fbSkali(kal.skala); app.querySelector('.feedback').innerHTML = `<b>${g[0]}</b><span class="muted">${g[1]}</span>`; zapiszKal(); };
        }
      };
    },
    'po-maturze'() {
      return {
        html: `<div class="q-head"><h1>Jaki jest Twój cel po maturze?</h1><p class="sub">Matura to krok w kierunku Twojej przyszłości. Warto wiedzieć, co dalej!</p></div>
          <div class="opcje">${PO_MATURZE.map((o, i) => `<button class="opcja" data-i="${i}" aria-pressed="${kal.poMaturze === i}"><span>${o.t}</span><span class="ok">✓</span></button>`).join('')}</div>`,
        fb: kal.poMaturze != null ? '<b>Mamy to. Cel jest jasny.</b>' : '', ok: kal.poMaturze != null, cta: 'Jedziemy dalej!',
        bind() { app.querySelectorAll('.opcja').forEach(b => b.onclick = () => { kal.poMaturze = +b.dataset.i; if (!kal.celRuszony) kal.cel = PO_MATURZE[kal.poMaturze].cel; odswiez(); }); }
      };
    },
    wynik() {
      return {
        html: `<div class="q-head"><h1>Jaki jest Twój wymarzony wynik?</h1><p class="sub">Jak określisz swój cel, o wiele łatwiej go zrealizować!</p></div>
          <div class="cel-box"><div class="cel-ikona">📐</div><div class="stack"><span class="naz">Matematyka podstawowa <b id="celv">${kal.cel}%</b></span>
          <input type="range" class="suwak zielony" id="cel" min="30" max="100" step="5" value="${kal.cel}" style="--p:${(kal.cel - 30) / 70 * 100}%" aria-label="Cel z matematyki w procentach"></div></div>`,
        fb: `<b>OK, mamy cel. Teraz dobierzemy narzędzia.</b><span class="muted" id="celfb">${fbCelu(kal.cel)}</span>`, ok: true, cta: 'Damy radę! Dalej!',
        bind() {
          const s = $('cel');
          s.oninput = () => { kal.cel = +s.value; kal.celRuszony = true; s.style.setProperty('--p', (kal.cel - 30) / 70 * 100 + '%'); $('celv').textContent = kal.cel + '%'; $('celfb').textContent = fbCelu(kal.cel); zapiszKal(); };
        }
      };
    },
    dzialy() {
      const nazwy = kal.klopot.map(id => S.dzial(id).nazwa);
      return {
        html: `<div class="q-head"><h1>Co w matmie sprawia Ci najwięcej kłopotu?</h1><p class="sub">Zaznacz śmiało. Test zacznie od tych działów i poszuka przyczyny.</p></div>
          <div class="chipy">${S.dzialy().map(d => `<button class="chip-sel" data-d="${d.id}" aria-pressed="${kal.klopot.includes(d.id)}">${esc(d.nazwa)}</button>`).join('')}
          <button class="chip-sel" id="nw" aria-pressed="${kal.nieWiemDzialy}">Nie wiem, sprawdźcie mnie</button></div>`,
        fb: nazwy.length ? `<b>Zapisane.</b><span class="muted">Test zacznie od: ${esc(nazwy.join(', '))}.</span>` : kal.nieWiemDzialy ? '<b>Spoko, test sam to znajdzie.</b>' : '',
        ok: true, cta: 'Jedziemy dalej!',
        bind() {
          app.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { const id = b.dataset.d; kal.klopot = kal.klopot.includes(id) ? kal.klopot.filter(x => x !== id) : kal.klopot.concat(id); kal.nieWiemDzialy = false; odswiez(); });
          $('nw').onclick = () => { kal.nieWiemDzialy = !kal.nieWiemDzialy; if (kal.nieWiemDzialy) kal.klopot = []; odswiez(); };
        }
      };
    },
    styl() {
      const w = STYLE.find(s => s.id === kal.styl);
      return {
        html: `<div class="q-head"><h1>Jak uczysz się najszybciej i najprzyjemniej?</h1><p class="sub">Dopasujemy metody do Ciebie, tak by lepszy efekt był jeszcze szybciej.</p></div>
          <div class="kafle">${STYLE.map(s => `<button class="kafel" data-s="${s.id}" aria-pressed="${kal.styl === s.id}"><span class="ok">✓</span><span class="ill" aria-hidden="true">${s.ill}</span><span>${s.t}</span></button>`).join('')}</div>`,
        fb: w ? `<b>${w.fb[0]}</b><span class="muted">${w.fb[1]}</span>` : '', ok: !!w, cta: 'Jedziemy dalej!',
        bind() { app.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { kal.styl = b.dataset.s; odswiez(); }); }
      };
    },
    czas() {
      return {
        html: `<div class="q-head"><h1>Ile czasu dziennie dasz radę?</h1><p class="sub">Lepiej mniej, a regularnie. Plan dopasuje się do Ciebie, nie odwrotnie.</p></div>
          <div class="chipy">${[10, 15, 20, 30, 45, 60].map(m => `<button class="chip-sel" data-m="${m}" aria-pressed="${kal.minut === m}">${m} min</button>`).join('')}</div>
          <div class="stack" style="align-items:center"><b>W które dni?</b><div class="dni-tyg">${KOLEJNOSC_DNI.map(d => `<button class="dzien" data-dz="${d}" aria-pressed="${kal.dni.includes(d)}">${DNI[d]}</button>`).join('')}</div></div>`,
        fb: kal.dni.length ? `<b>Przy ${kal.minut} min to ok. ${godzinNauki()} h nauki do matury.</b><span class="muted">Policzymy, co się w tym zmieści. Co 5. dzień zostawiamy wolny na zaległości, żeby plan się nie sypał.</span>` : '<b>Wybierz co najmniej jeden dzień.</b>',
        ok: kal.dni.length > 0, cta: 'Jedziemy dalej!',
        bind() {
          app.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { kal.minut = +b.dataset.m; odswiez(); });
          app.querySelectorAll('[data-dz]').forEach(b => b.onclick = () => { const d = +b.dataset.dz; kal.dni = kal.dni.includes(d) ? kal.dni.filter(x => x !== d) : kal.dni.concat(d); odswiez(); });
        }
      };
    },
    warunki() {
      const dys = kal.dysleksja || kal.dyskalkulia;
      return {
        html: `<div class="q-head"><h1>Coś, o czym powinniśmy wiedzieć?</h1><p class="sub">Dopasujemy tempo i formę materiałów. Wszystko zostaje u Ciebie.</p></div>
          <div class="opcje">
            <button class="opcja" id="dl" aria-pressed="${kal.dysleksja}"><span><b>Mam dysleksję</b><br><span class="muted small">Więcej czasu na temat i więcej wyjaśnień zamiast długich tekstów</span></span><span class="ok">✓</span></button>
            <button class="opcja" id="dk" aria-pressed="${kal.dyskalkulia}"><span><b>Mam dyskalkulię</b><br><span class="muted small">Więcej czasu na temat, krok po kroku</span></span><span class="ok">✓</span></button>
          </div>
          <div class="grid2"><label class="pole">Kiedy masz studniówkę? (opcjonalnie)<input type="date" id="st" value="${esc(kal.studniowka)}"></label>
          <div class="callout green"><span class="ico">🎄</span><span>Święta, Sylwester i Wielkanoc są już w planie jako dni wolne.</span></div></div>`,
        fb: dys ? '<b>Każdy temat dostanie 25% więcej czasu.</b><span class="muted">I najpierw krótkie wyjaśnienie, potem zadania.</span>' : kal.studniowka ? '<b>Studniówka zapisana. Tego dnia i dzień po masz wolne 🎉</b>' : '<b>Jeśli nic z tych rzeczy, po prostu jedziemy dalej.</b>',
        ok: true, cta: 'Jedziemy dalej!',
        bind() {
          $('dl').onclick = () => { kal.dysleksja = !kal.dysleksja; odswiez(); };
          $('dk').onclick = () => { kal.dyskalkulia = !kal.dyskalkulia; odswiez(); };
          $('st').onchange = e => { kal.studniowka = e.target.value; odswiez(); };
        }
      };
    },
    przypomnienia() {
      const temat = kal.szybka && kal.szybkaDzialy.length ? S.dzial(kal.szybkaDzialy[0]).nazwa : 'Funkcja liniowa';
      return {
        html: `<div class="q-head"><h1>O której mamy Ci przypominać?</h1><p class="sub">Jedno krótkie powiadomienie dziennie. Konkretnie: co dziś robimy i ile to zajmie.</p></div>
          <div class="chipy">${['07:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map(g => `<button class="chip-sel" data-g="${g}" aria-pressed="${kal.godzina === g}">${g}</button>`).join('')}</div>
          <div class="grid2" style="align-items:center"><label class="pole">Jak masz na imię? (opcjonalnie)<input type="text" id="im" maxlength="24" value="${esc(kal.imie)}" placeholder="np. Ola" autocomplete="given-name"></label>
          <div style="background:linear-gradient(160deg,#3B6CF6,#7A5CF0);padding:16px;border-radius:20px">${pushHtml('Hej' + (kal.imie ? ' ' + esc(kal.imie) : '') + '! 👋', ' Dzisiaj robimy: ' + esc(temat) + '. ' + kal.minut + ' min i masz to z głowy.', kal.godzina)}</div></div>`,
        fb: '<b>Ostatni krok: krótki test.</b><span class="muted">Bez stresu. Jeśli czegoś nie wiesz, kliknij „Nie wiem”. To też pomaga ustawić plan.</span>',
        ok: true, cta: 'Robimy test!',
        bind() {
          app.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { kal.godzina = b.dataset.g; odswiez(); });
          $('im').oninput = e => { kal.imie = e.target.value.trim(); zapiszKal(); app.querySelector('.push .msg b').textContent = 'Hej' + (kal.imie ? ' ' + kal.imie : '') + '! 👋'; };
        }
      };
    }
  };
  function odswiez() { zapiszKal(); const y = window.scrollY; render(); window.scrollTo(0, y); }

  function widokKalibracja(p) {
    if (!kal) kal = nowaKal(false);
    const kroki = kal.szybka ? KROKI_SZYBKIE : KROKI_PELNE;
    const i = Math.min(Math.max(1, parseInt(p, 10) || 1), kroki.length);
    const k = KROK[kroki[i - 1]]();
    app.innerHTML = `${krokiHtml(i, kroki.length)}
      ${k.html}
      <div class="feedback" aria-live="polite">${k.fb || ''}</div>
      <div class="cta"><button class="btn-main xl arrow" id="dalej" ${k.ok ? '' : 'disabled'}>${k.cta}</button>
      ${i > 1 ? '<button class="wstecz" id="wstecz">← Wstecz</button>' : '<button class="btn-link" id="pomin">Pomiń kalibrację, chcę od razu test</button>'}</div>`;
    k.bind();
    $('dalej').onclick = () => { if (i < kroki.length) go('kalibracja', i + 1); else { zbudujProfil(); go('test'); } };
    if ($('wstecz')) $('wstecz').onclick = () => go('kalibracja', i - 1);
    if ($('pomin')) $('pomin').onclick = () => { zbudujProfil(); go('test'); };
  }

  function zbudujProfil() {
    if (!kal) kal = nowaKal(false);
    const ankieta = { cel: kal.cel || 70, samoocena: {} };
    if (!kal.szybka) ankieta.ocena = ocenaZ(kal.skala);
    kal.klopot.forEach(d => { ankieta.samoocena[d] = 'slabo'; });
    if (kal.szybka) { ankieta.dzialyPriorytetowe = kal.szybkaDzialy.slice(); ankieta.tylkoPriorytetowe = true; }
    const org = { dataMatury: dataMatury(kal.rok), minutDziennie: kal.minut, dniTygodnia: kal.dni.slice(), godzina: kal.godzina,
      dysleksja: kal.dysleksja, dyskalkulia: kal.dyskalkulia, preferencja: kal.styl === 'grupa' ? null : kal.styl, blokady: [], swieta: true };
    if (kal.studniowka) org.blokady.push({ od: kal.studniowka, do: M.dodajDni(kal.studniowka, 1), nazwa: 'Studniówka' });
    const demoDzis = D && D.demoDzis ? D.demoDzis : null;
    D = { wersja: 1, profil: Object.assign({}, kal, { powiadomienia: { codzienne: true, powtorki: true, seria: true, diagnozy: true } }), org: org, demoDzis: demoDzis };
    D.stan = S.nowyStan(ankieta, dzis());
    zapisz();
  }

  // ═════════════ SZYBKA ŚCIEŻKA ═════════════
  let wybraneSzybko = [];
  function widokSzybka() {
    app.innerHTML = `<div class="q-head"><span class="eyebrow">Szybka ścieżka</span><h1>Wiesz, co chcesz poprawić?</h1>
        <p class="sub">Pomijamy diagnozę osobowości i celów. Krótki test tylko z wybranego działu (ok. 8 min) i plan od razu.</p></div>
      <div class="chipy">${S.dzialy().map(d => `<button class="chip-sel" data-d="${d.id}" aria-pressed="${wybraneSzybko.includes(d.id)}">${esc(d.nazwa)}</button>`).join('')}</div>
      <div class="feedback">${wybraneSzybko.length ? `<b>Robimy: ${esc(wybraneSzybko.map(id => S.dzial(id).nazwa).join(', '))}.</b><span class="muted">Jeśli braki będą w podstawach z innych działów, test i plan sięgną po nie same (maks. 2 poziomy w dół).</span>` : '<span class="muted">Wybierz 1-3 działy.</span>'}</div>
      <div class="cta"><button class="btn-main xl arrow" id="dalej" ${wybraneSzybko.length ? '' : 'disabled'}>Jedziemy dalej!</button><button class="wstecz" onclick="location.hash='#/'">← Wróć</button></div>`;
    app.querySelectorAll('[data-d]').forEach(b => b.onclick = () => {
      const id = b.dataset.d;
      wybraneSzybko = wybraneSzybko.includes(id) ? wybraneSzybko.filter(x => x !== id) : wybraneSzybko.concat(id).slice(-3);
      const y = window.scrollY; render(); window.scrollTo(0, y);
    });
    $('dalej').onclick = () => startKalibracji(true, wybraneSzybko.slice());
  }

  // ═════════════ TEST ═════════════
  function widokTestIntro() {
    if (!D) return brakDanych();
    const szybka = D.profil && D.profil.szybka;
    const zakres = szybka ? D.profil.szybkaDzialy.map(id => S.dzial(id).nazwa).join(', ') : 'cała matematyka podstawowa';
    app.innerHTML = `<div class="q-head"><span class="eyebrow">Test diagnostyczny</span><h1>Sprawdźmy, gdzie jesteś</h1>
        <p class="sub">${szybka ? 'ok. 8 minut · 10 pytań' : 'ok. 15 minut · 20 pytań'} · ${esc(zakres)}</p></div>
      <div class="grid3">
        <div class="card"><span style="font-size:1.8rem">🧭</span><h3>Pytania się dopasowują</h3><p class="muted">Gdy coś nie wyjdzie, schodzimy poziom niżej, żeby znaleźć źródło problemu. Gdy idzie dobrze, wchodzimy wyżej.</p></div>
        <div class="card"><span style="font-size:1.8rem">🔎</span><h3>Szukamy przyczyny</h3><p class="muted">Każda zła odpowiedź mówi nam, jaki błąd popełniasz, np. mylisz sinus z cosinusem.</p></div>
        <div class="card"><span style="font-size:1.8rem">🤷</span><h3>„Nie wiem” to też odpowiedź</h3><p class="muted">Nie zgaduj. Zgadywanie psuje diagnozę, a „Nie wiem” pomaga ją ustawić.</p></div>
      </div>
      <div class="cta"><button class="btn-main xl arrow" id="start">Zaczynamy test</button></div>`;
    $('start').onclick = () => startTest('diagnoza', szybka ? { dzialy: D.profil.szybkaDzialy, max: 10 } : {}, 'wynik');
  }

  function startTest(typ, opcje, po) {
    const sesja = S.utworzTest(D.stan, typ, opcje || {}, dzis());
    T = { sesja: sesja, typ: typ, opcje: opcje || {}, po: po || 'quiz-wynik', pyt: null, odp: null };
    T.pyt = S.nastepnePytanie(D.stan, sesja);
    if (!T.pyt) { zakonczTestUI(); return; }
    go('quiz');
  }
  function widokQuiz() {
    if (!T || !D) {
      app.innerHTML = `<div class="card yellow"><h2>Test został przerwany</h2><p>Strona została odświeżona w trakcie testu. Odpowiedzi do tego momentu są zapisane.</p>
        <div class="row"><button class="btn-small" onclick="location.hash='#/dzis'">Wróć do planu</button></div></div>`;
      return;
    }
    const q = T.pyt, o = T.odp;
    const nazwa = { diagnoza: T.opcje.pelna ? 'Diagnoza pełna' : 'Test diagnostyczny', jednostka: T.opcje.sprawdzenie ? 'Szybkie sprawdzenie' : 'Quiz zaliczeniowy', powtorka: 'Powtórka 5 min' }[T.typ];
    const baner = q.powod === 'cofniecie' ? '<div class="adapt dol">↓ Schodzimy poziom niżej: sprawdzamy, czy problem nie leży w podstawach</div>'
      : q.powod === 'wyzej' ? '<div class="adapt gora">↑ Dobrze idzie, wchodzimy poziom wyżej</div>' : '';
    let kom = '';
    if (o) {
      const r = o.r;
      kom = r.poprawna ? `<div class="kom ok"><b class="t">Dobrze! ✓</b>${T.typ === 'diagnoza' ? '<span class="muted small">Zapisujemy: ta umiejętność wygląda na opanowaną.</span>' : ''}</div>`
        : r.nieWiem ? `<div class="kom nw"><b class="t">Spoko, zapisaliśmy.</b><span>Poprawna odpowiedź: <b>${esc(r.poprawnaOdpowiedz)}</b>. Właśnie po to jest test: plan to uwzględni.</span></div>`
        : `<div class="kom nie"><b class="t">Nie tym razem.</b><span>Poprawna odpowiedź: <b>${esc(r.poprawnaOdpowiedz)}</b>.</span>
            ${r.przyczyna ? `<span>🔎 Ten wybór zwykle oznacza: <b>${esc(r.przyczyna)}</b>.</span>` : ''}
            ${r.podstawa ? `<span class="muted small">Sprawdzimy też podstawę: ${esc(r.podstawa)}.</span>` : ''}</div>`;
    }
    app.innerHTML = `${krokiHtml(q.numer, q.z, 'Pytanie')}
      <div class="row" style="justify-content:center"><span class="badge blue">${nazwa}</span><span class="badge">${esc(q.dzial)}</span>
        <span class="badge ${q.poziom === 1 ? 'green' : q.poziom === 2 ? 'yellow' : 'red'}">${q.poziomNazwa}</span></div>
      ${baner}
      <h1 class="quiz-pyt" id="qt">${esc(q.tresc)}</h1>
      <div class="odpowiedzi" role="group" aria-labelledby="qt">${q.odpowiedzi.map((a, n) => {
        const cls = !o ? '' : a.idx === 0 ? 'dobra' : a.idx === o.idx ? 'zla' : 'wygaszona';
        return `<button class="odp ${cls}" data-idx="${a.idx}" ${o ? 'disabled' : ''}><span class="lit">${'ABCD'[n]}</span>${esc(a.tekst)}</button>`;
      }).join('')}</div>
      ${o ? kom + `<div class="cta"><button class="btn-main xl arrow" id="dalej">${q.numer >= q.z ? 'Zobacz wynik' : 'Dalej'}</button></div>`
          : '<div class="center"><button class="btn-ghost" id="nw">Nie wiem 🤷</button></div><p class="hint">Na komputerze: klawisze 1-4, a potem Enter.</p>'}`;
    app.querySelectorAll('.odp:not([disabled])').forEach(b => b.onclick = () => odpowiedzQuiz(+b.dataset.idx));
    if ($('nw')) $('nw').onclick = () => odpowiedzQuiz(-1);
    if ($('dalej')) { $('dalej').onclick = dalejQuiz; $('dalej').focus({ preventScroll: true }); }
  }
  function odpowiedzQuiz(idx) {
    if (!T || T.odp) return;
    T.odp = { idx: idx, r: S.odpowiedz(D.stan, T.sesja, T.pyt.id, idx, dzis()) };
    zapisz();
    const y = window.scrollY; render(); window.scrollTo(0, y);
  }
  function dalejQuiz() {
    if (!T || !T.odp) return;
    T.pyt = S.nastepnePytanie(D.stan, T.sesja); T.odp = null;
    if (!T.pyt) zakonczTestUI(); else { render(); window.scrollTo(0, 0); }
  }
  function zakonczTestUI() {
    const przed = seria().dni;
    W = S.zakonczTest(D.stan, T.sesja, dzis());
    W.opcje = T.opcje;
    const po = seria().dni;
    if (po > przed) W.seriaWzrosla = po;
    zapisz();
    const cel = T.po; T = null;
    go(cel);
  }
  document.addEventListener('keydown', e => {
    if (trasa()[0] !== 'quiz' || !T || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target && (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT')) return;
    if (!T.odp && /^[1-4]$/.test(e.key)) { const a = T.pyt.odpowiedzi[+e.key - 1]; if (a) { e.preventDefault(); odpowiedzQuiz(a.idx); } }
    else if (T.odp && e.key === 'Enter') { e.preventDefault(); dalejQuiz(); }
  });

  // ═════════════ WYNIK DIAGNOZY ═════════════
  function widokWynik() {
    if (!D) return brakDanych();
    const p = S.prognoza(D.stan), wiedza = S.podsumujWiedze(D.stan);
    const r = planTeraz();
    const poPlanie = r.plan ? r.plan.podsumowanie.prognozaPoPlanie : null;
    let przyczyny = W && W.typ === 'diagnoza' && W.przyczyny ? W.przyczyny : null;
    if (!przyczyny) {
      const widz = {};
      przyczyny = D.stan.przyczyny.slice().reverse().filter(x => x.opis && x.opis !== 'nie wiem' && x.opis !== 'nieznana' && !widz[x.komp + x.opis] && (widz[x.komp + x.opis] = 1))
        .slice(0, 6).map(x => ({ komp: x.komp, nazwa: S.kompetencja(x.komp).nazwa, przyczyna: x.opis, podstawa: x.pre ? S.kompetencja(x.pre).nazwa : null }));
    }
    const szybka = D.profil && D.profil.szybka;
    const pelna = W && W.opcje && W.opcje.pelna;
    const poprzednia = D.stan.prognozy.length > 1 ? D.stan.prognozy[D.stan.prognozy.length - 2] : null;
    app.innerHTML = `
      <div class="q-head"><span class="eyebrow">${pelna ? 'Diagnoza pełna' : szybka ? 'Wynik testu' : 'Wynik diagnozy'}</span>
        <h1>Na dziś masz ok. <span class="hl">${p.wynik}%</span> z matury z matematyki</h1>
        <p class="sub">${p.cel ? (p.wynik >= p.cel ? 'Jesteś na poziomie swojego celu. Pilnujemy, żeby tak zostało.' : `Twój cel to ${p.cel}%. Brakuje ok. ${p.cel - p.wynik} pkt proc. i wiemy dokładnie, gdzie ich szukać.`) : ''}
        ${pelna && poprzednia ? `<br><b style="color:${p.wynik >= poprzednia.wynik ? 'var(--green-ink)' : 'var(--red-ink)'}">${p.wynik >= poprzednia.wynik ? '▲ +' : '▼ '}${p.wynik - poprzednia.wynik} pkt proc. od poprzedniej diagnozy</b>` : ''}</p></div>
      <div class="card">
        ${progBar(p, poPlanie)}
        <div class="row"><span class="badge ${p.pewnosc === 'wysoka' ? 'green' : p.pewnosc === 'średnia' ? 'blue' : 'yellow'}">Pewność prognozy: ${p.pewnosc}</span>
          <span class="badge">Sprawdzone: ${p.pokrycie}% materiału</span><span class="badge">Przedział: ${p.min}-${p.max}%</span>
          <span class="badge ${p.zdawalnosc === 'bezpieczna' ? 'green' : p.zdawalnosc === 'zagrożona' ? 'red' : 'yellow'}">Zdanie matury: ${p.zdawalnosc}</span></div>
        <p class="muted small">Prognoza to suma Twojego poziomu w ${S.kompetencje().length} mikrokompetencjach, ważona tym, ile punktów dają na maturze. Przedział jest szeroki, bo test sprawdził część materiału. Każda kolejna diagnoza go zawęża.</p>
      </div>
      <div class="grid2">
        <div class="card"><h3>Gdzie tracisz najwięcej punktów</h3>
          <div class="lista">${p.najwiekszeZyski.map(z => `<div class="poz"><span style="font-size:1.2rem">📍</span><span><span class="t">${esc(z.nazwa)}</span><br><span class="m">${esc(z.dzial)}</span></span><b style="color:var(--green-ink)">+${String(z.zysk).replace('.', ',')} pkt</b></div>`).join('')}</div>
          <p class="muted small">Tyle punktów procentowych możesz zyskać, opanowując temat. Plan zaczyna od tematów, które dają najwięcej punktów za minutę nauki.</p></div>
        <div class="card"><div class="row between"><h3>Dlaczego popełniasz błędy</h3><span class="tag-new">Nowość</span></div>
          ${przyczyny.length ? `<div class="lista">${przyczyny.slice(0, 5).map(x => `<div class="poz"><span style="font-size:1.2rem">🔎</span><span><span class="t">${esc(x.przyczyna)}</span><br><span class="m">w temacie: ${esc(x.nazwa)}${x.podstawa ? ' · brakuje podstawy: ' + esc(x.podstawa) : ''}</span></span><span></span></div>`).join('')}</div>`
            : '<p class="muted">Brak błędów do analizy. Świetnie!</p>'}
          <p class="muted small">Zwykły test mówi „źle”. My mówimy, jaki to błąd i której podstawy brakuje. Plan zaczyna od niej.</p></div>
      </div>
      <div class="card"><div class="row between"><h3>Twoja mapa mikrokompetencji</h3>${LEGENDA}</div>${mapaHtml(wiedza)}
        <p class="muted small">Kliknij dział, żeby zobaczyć umiejętności. Kółka z obwódką to szacunek: plan sprawdzi je krótkim quizem zamiast uczyć od zera.</p></div>
      <div class="cta"><button class="btn-main xl arrow" id="plan">${D.planPokazany ? 'Wracam do planu' : 'Robimy plan!'}</button><a class="btn-link" href="#/jak-to-dziala">Jak liczymy wynik?</a></div>`;
    $('plan').onclick = () => {
      const pierwszy = !D.planPokazany;
      D.planPokazany = true; zapisz();
      if (pierwszy && r.plan) toast(`Plan gotowy! ${tematySl(r.plan.podsumowanie.jednostek)} do ${fData(r.plan.podsumowanie.koniecPlanu || D.org.dataMatury)}. Zaczynamy dziś.`);
      go('dzis');
    };
  }

  // ═════════════ DZIŚ ═════════════
  let sesjeEkranu = [];
  function widokDzis() {
    if (!D) return brakDanych();
    const t = dzis(), r = planTeraz();
    if (r.blad) return bladPlanu(r.blad);
    const plan = r.plan, ser = seria(), pg = S.prognoza(D.stan), ps = plan.podsumowanie;
    const sesjeDzis = plan.sesje.filter(s => s.data === t && s.typ !== 'bufor');
    sesjeEkranu = sesjeDzis;
    const bufor = plan.sesje.some(s => s.data === t && s.typ === 'bufor');
    const zrobione = D.stan.historiaSesji.filter(h => h.data === t && h.zrobiona);
    const nastepna = plan.sesje.find(s => s.data > t && (s.typ === 'nauka' || s.typ === 'quiz'));
    const suma = sesjeDzis.reduce((a, s) => a + s.minuty, 0);
    let msg;
    if (ser.dzisTyp === 'blokada') msg = `Hej${imie()}! Dziś wolne: <b>${esc(ser.dzisNazwa)}</b>. Seria 🔥 ${ser.dni} się nie przerywa. Odpocznij!`;
    else if (bufor) msg = `Hej${imie()}! Dziś <b>dzień buforowy</b>. Nadrób zaległości albo odpocznij 😌 Seria się nie przerywa.`;
    else if (ser.dzisTyp === 'wolne' && !sesjeDzis.length) msg = `Hej${imie()}! Dziś nie masz nauki w planie.${nastepna ? ' Widzimy się ' + fKrotko(nastepna.data) + '!' : ''}`;
    else if (sesjeDzis.length) {
      const glowna = sesjeDzis.find(s => s.typ !== 'powtorka');
      msg = sesjeDzis[0].typ === 'powtorka' && glowna
        ? `Hej${imie()}! Na rozgrzewkę <b>5 min powtórki</b>, a potem robimy: <b>${esc(nazwaSesji(glowna))}</b>. ${suma} min i masz to z głowy.`
        : `Hej${imie()}! Dzisiaj robimy: <b>${esc(nazwaSesji(sesjeDzis[0]))}</b>. ${suma} min i masz to z głowy.`;
      if (sesjeDzis.some(s => s.dostosowane)) msg += '<br><span class="small muted">Ostatnio ten temat nie wyszedł, więc przygotowaliśmy prostszy materiał.</span>';
    } else if (zrobione.length) msg = `Brawo${imie()}! Na dziś wszystko 🎉 Seria: <b>${dniSl(ser.dni)}</b>.${nastepna ? ' Następnie: ' + esc(nazwaSesji(nastepna)) + ' (' + fKrotko(nastepna.data) + ').' : ''}`;
    else msg = `Hej${imie()}! Na dziś nic nie zostało w planie.`;

    const zad = zrobione.map(h => `<div class="zad zrobione"><div class="wezel">✓</div><div><div class="tyt">${esc(h.tytul || { quiz: 'Quiz', powtorka: 'Powtórka 5 min', diagnoza: 'Diagnoza pełna', nauka: 'Sesja nauki' }[h.typ])}</div><div class="meta">${h.minuty} min · zrobione</div></div><span></span></div>`)
      .concat(sesjeDzis.map((s, i) => `<div class="zad ${i === 0 ? 'teraz' : ''}"><div class="wezel">${IKONA[s.typ]}</div>
        <div><div class="tyt">${esc(nazwaSesji(s))}</div><div class="meta">${s.minuty} min · ${s.start}${s.czesci && s.czesci.length ? ' · ' + s.czesci.map(c => (root.Kurs ? root.Kurs.IK[c.typ] : '') + ' ' + esc(root.Kurs ? root.Kurs.TYP[c.typ] : c.typ)).join(' + ') : s.powod ? ' · ' + esc(s.powod) : ''}${s.dostosowane ? ' · <b style="color:var(--yellow-ink)">materiał dostosowany</b>' : ''}</div></div>
        <button class="btn-small ${i === 0 ? '' : 'alt'}" data-s="${i}">${i === 0 ? 'Start' : 'Zrób'}</button></div>`)).join('');

    // tydzień
    const pon = M.dodajDni(t, -((M.dzienTygodnia(t) + 6) % 7));
    const mapa = S.mapaDni(D.stan, D.org, M.dodajDni(pon, 6));
    const tydzien = [0, 1, 2, 3, 4, 5, 6].map(i => {
      const d = M.dodajDni(pon, i), info = mapa[d], akt = D.stan.aktywneDni[d];
      const typ = info ? info.typ : 'przed';
      let cls = '', ik = '·';
      if (akt) { cls = 'akt'; ik = '🔥'; }
      else if (typ === 'blokada') { cls = 'blok'; ik = '🌴'; }
      else if (typ === 'bufor') { cls = 'buf'; ik = '⏸'; }
      else if (typ === 'nauka' && d < t) { cls = 'minal'; ik = '✕'; }
      else if (typ === 'nauka') { const m = plan.sesje.filter(s => s.data === d).reduce((a, s) => a + s.minuty, 0); ik = m ? m + '′' : '·'; }
      return `<div class="tdz ${cls} ${d === t ? 'dzis' : ''}" title="${fData(d)}${info && info.nazwa ? ': ' + esc(info.nazwa) : ''}"><span class="k">${ik}</span>${DNI[M.dzienTygodnia(d)]}</div>`;
    }).join('');

    const wolnyWTygodniu = (D.org.blokady || []).some(b => b.zamrozenie && b.od <= t && M.roznicaDni(b.od, t) < 7);
    const kolejne = [];
    for (let i = 1; i <= 14 && kolejne.length < 3; i++) {
      const d = M.dodajDni(t, i), ss = plan.sesje.filter(s => s.data === d && s.typ !== 'bufor');
      if (ss.length) kolejne.push({ d: d, ss: ss });
    }
    app.innerHTML = `
      <div class="cols">
        <div class="stack" style="gap:22px">
          <div class="dymek"><div class="awatar">M</div><div class="chmurka">${msg}</div></div>
          <div class="card"><div class="row between"><h2>Twoja ścieżka na dziś</h2><span class="badge">${fData(t, true)}</span></div>
            ${zad ? `<div class="sciezka">${zad}</div>` : '<p class="muted">Brak zadań na dziś.</p>'}
            ${sesjeDzis.length ? '' : `<button class="btn-ghost" id="ekstra">Mam ochotę na więcej: zrób następną sesję wcześniej</button>`}
          </div>
          <div class="card"><div class="row between"><h3>Ten tydzień</h3><span class="muted small">🔥 nauka · 🌴 wolne · ⏸ bufor · liczba = minuty w planie</span></div><div class="tydzien">${tydzien}</div></div>
          ${kolejne.length ? `<div class="card flat"><h3>Najbliższe dni</h3><div class="lista">${kolejne.map(k => `<div class="poz"><span>${IKONA[k.ss.find(s => s.typ !== 'powtorka') ? k.ss.find(s => s.typ !== 'powtorka').typ : 'powtorka']}</span><span><span class="t">${esc(k.ss.map(nazwaSesji).join(' + '))}</span><br><span class="m">${fKrotko(k.d)} · ${k.ss.reduce((a, s) => a + s.minuty, 0)} min</span></span><span></span></div>`).join('')}</div></div>` : ''}
        </div>
        <div class="stack" style="gap:16px">
          <div class="card"><div class="seria-big"><span class="ogien">🔥</span><div><div class="n">${ser.dni}</div><div class="muted small">${odmiana(ser.dni, 'dzień', 'dni', 'dni')} z rzędu · rekord ${ser.rekord}</div></div></div>
            <p class="small muted">${ser.dzisZrobione ? (sesjeDzis.length ? 'Seria na dziś podtrzymana. Dokończ resztę, jeśli masz chwilę.' : 'Dzisiaj zaliczone. Wracaj jutro!') : ser.dzisTyp === 'nauka' && sesjeDzis.length ? 'Zrób dziś choć jedną sesję, żeby utrzymać serię.' : 'Dni wolne, święta i dni buforowe nie przerywają serii.'}</p></div>
          <div class="card"><div class="row between"><h3>Prognoza matury</h3><a class="small" href="#/postepy">Postępy →</a></div>
            <div class="row" style="align-items:flex-end;gap:12px"><span class="liczba">${pg.wynik}%</span><span class="muted">teraz</span><span style="font-weight:800;color:var(--green-ink);font-size:1.4rem">→ ${ps.prognozaPoPlanie}%</span><span class="muted">po planie</span></div>
            <div class="mini-bar"><i class="po" style="width:${ps.prognozaPoPlanie}%"></i><i style="width:${pg.wynik}%"></i></div>
            <p class="small muted">Cel: ${pg.cel || '-'}% · pewność: ${pg.pewnosc}${plan.terminyDiagnoz[0] ? ' · następna diagnoza pełna: ' + fKrotko(plan.terminyDiagnoz[0]) : ''}</p></div>
          <div class="card"><h3>Plan do matury</h3>
            <div class="grid2 zawsze" style="gap:10px"><div class="stat"><b>${ps.dniDoMatury}</b><span>dni do matury</span></div><div class="stat"><b>${ps.jednostek}</b><span>${odmiana(ps.jednostek, 'temat', 'tematy', 'tematów')} w planie</span></div>
              <div class="stat"><b>${String(ps.godzinNauki).replace('.', ',')} h</b><span>nauki łącznie</span></div><div class="stat"><b>${ps.sprawdzen}</b><span>szybkich sprawdzeń</span></div></div>
            <p class="small">${esc(ladneDaty(ps.komunikat))}</p>
            <div class="stack" style="gap:8px">
              <button class="btn-ghost" id="wolne" ${wolnyWTygodniu || ser.dzisTyp !== 'nauka' ? 'disabled' : ''}>😮‍💨 Nie dam rady dzisiaj</button>
              ${wolnyWTygodniu ? '<span class="tiny muted">Dzień wolny na żądanie: 1 w tygodniu, już wykorzystany.</span>' : ''}
              <button class="btn-ghost" id="wypadlo">📅 Coś mi wypadło (choroba, wyjazd, impreza)</button>
              <div id="formWyp" hidden></div>
              <a class="btn-ghost" href="#/kalendarz">🗓️ Dodaj plan do Google Calendar</a>
            </div></div>
        </div>
      </div>`;
    app.querySelectorAll('[data-s]').forEach(b => b.onclick = () => startSesji(sesjeEkranu[+b.dataset.s]));
    if ($('ekstra')) $('ekstra').onclick = () => { const s = plan.sesje.find(x => x.data > t && x.typ !== 'bufor'); if (s) startSesji(s); };
    $('wolne').onclick = () => {
      D.org.blokady.push({ od: t, do: t, nazwa: 'Dzień wolny', zamrozenie: true }); zapisz();
      toast('Przełożyliśmy dzisiejsze sesje na kolejne dni. Seria zostaje 🧊'); render();
    };
    $('wypadlo').onclick = () => { const f = $('formWyp'); f.hidden = !f.hidden; if (!f.hidden) formularzWydarzenia(f, plan); };
  }
  function formularzWydarzenia(el, plan) {
    const t = dzis();
    el.innerHTML = `<div class="stack" style="gap:10px;border:1.5px dashed var(--line-2);border-radius:14px;padding:12px">
      <label class="pole">Od<input type="date" id="wOd" value="${t}" min="${t}"></label>
      <label class="pole">Do<input type="date" id="wDo" value="${M.dodajDni(t, 2)}" min="${t}"></label>
      <div class="chipy left">${['Choroba', 'Wyjazd', 'Impreza', 'Sprawdziany w szkole', 'Inne'].map((n, i) => `<button class="chip-sel" data-n="${n}" aria-pressed="${i === 0}">${n}</button>`).join('')}</div>
      <button class="btn-small" id="wDodaj">Przelicz plan</button></div>`;
    let nazwa = 'Choroba';
    el.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { nazwa = b.dataset.n; el.querySelectorAll('[data-n]').forEach(x => x.setAttribute('aria-pressed', x === b)); });
    $('wDodaj').onclick = () => {
      const od = $('wOd').value, doo = $('wDo').value || od;
      if (!od || doo < od) return toast('Sprawdź daty: „do” nie może być przed „od”.');
      const ile = plan.sesje.filter(s => s.data >= od && s.data <= doo && s.minuty).length;
      D.org.blokady.push({ od: od, do: doo, nazwa: nazwa }); zapisz();
      toast(`Plan przeliczony. Przesunęliśmy ${ile} ${odmiana(ile, 'sesję', 'sesje', 'sesji')} z dni ${fKrotko(od)}${doo !== od ? ' - ' + fKrotko(doo) : ''}.`);
      render();
    };
  }
  function startSesji(s) {
    if (!s) return;
    if (s.typ === 'nauka') go('lekcja', s.komp);
    else if (s.typ === 'quiz') startTest('jednostka', { komp: s.komp, sprawdzenie: !!s.sprawdzenie }, 'quiz-wynik');
    else if (s.typ === 'powtorka') startTest('powtorka', {}, 'quiz-wynik');
    else if (s.typ === 'diagnoza') startTest('diagnoza', { pelna: true }, 'wynik');
  }

  // ═════════════ LEKCJA ═════════════
  function widokLekcja(komp) {
    if (!D) return brakDanych();
    const k = S.kompetencja(komp);
    if (!k) { app.innerHTML = '<div class="card"><h2>Nie ma takiego tematu</h2><a href="#/dzis">Wróć do planu</a></div>'; return; }
    const r = planTeraz();
    if (r.blad) return bladPlanu(r.blad);
    const plan = r.plan, t = dzis();
    const u = plan.jednostki.find(x => x.komp === komp);
    const sesja = plan.sesje.find(s => s.typ === 'nauka' && s.komp === komp && s.data === t) || plan.sesje.find(s => s.typ === 'nauka' && s.komp === komp);
    const dost = u && u.dostosowanie;
    const zaliczona = D.stan.zaliczone[komp];
    const st = S.status(D.stan, komp);
    const czesci = sesja ? root.Kurs.czesciSesji(sesja, dost) : root.Kurs.czesciKomp(komp);
    const wszystkie = root.Kurs.czesciKomp(komp);
    const minCz = czesci.reduce((a, c) => a + (c.minutySesji || c.minuty), 0);
    app.innerHTML = `
      <button class="wstecz" onclick="location.hash='#/dzis'" style="align-self:flex-start">← Dziś</button>
      <div class="stack" style="gap:10px">
        <div class="row"><span class="badge">${esc(S.dzial(k.dzial).nazwa)}</span><span class="badge ${k.poziom === 1 ? 'green' : k.poziom === 2 ? 'yellow' : 'red'}">${POZIOM[k.poziom]}</span>
          <span class="badge">wymaganie CKE ${esc(k.cke)}</span>${sesja ? `<span class="badge blue">sesja ${sesja.czesc}/${sesja.z} · ${sesja.minuty} min</span>` : ''}${zaliczona ? '<span class="badge green">zaliczone</span>' : ''}</div>
        <h1>${esc(k.nazwa)}</h1>
        <p class="muted">Twój poziom: <b>${Math.round(st.p * 100)}%</b>${st.pewny ? '' : ' (szacunek)'}${u ? ' · ' + esc(u.powod) : ''}</p>
      </div>
      ${dost ? `<div class="callout"><span class="ico">🛠️</span><div class="stack" style="gap:6px"><b class="t">Dostosowaliśmy materiał do Ciebie</b>
        <span>${dost.proby ? `Quiz z tego tematu nie wyszedł ${dost.proby === 1 ? 'raz' : dost.proby + ' razy'}.` : 'Wracamy do tematu po wzmocnieniu podstaw.'}${dost.przyczyna ? ` Najczęstszy błąd: <b>${esc(dost.przyczyna)}</b>.` : ''}</span>
        <ul style="margin:0;padding-left:18px">${dost.zmiany.map(z => `<li>${esc(z)}</li>`).join('')}</ul></div></div>` : ''}
      <div class="callout blue"><span class="ico">🎬</span><span><b>Dziś: ${czesci.length} ${odmiana(czesci.length, 'część', 'części', 'części')}, ok. ${minCz} min.</b> To fragmenty materiałów Maturalnych dobrane do tej umiejętności, a nie cały kurs.
        Cały temat (${wszystkie.length} części) znajdziesz w <a href="#/materialy/${komp}">Materiałach</a>.</span></div>
      <div id="panelLekcji"></div>
      <div class="cta">${sesja ? `<button class="btn-main xl" id="odhacz">Zrobione! Odhaczam sesję ✓</button>${sesja.data !== t ? `<span class="muted small">Ta sesja jest zaplanowana na ${fKrotko(sesja.data)}. Możesz ją zrobić wcześniej.</span>` : ''}${sesja.czesc === sesja.z ? '<span class="muted small">To ostatnia część. Potem quiz zaliczeniowy (5 min, próg 70%).</span>' : ''}`
        : zaliczona ? '<span class="muted">Ten temat jest zaliczony. Wróci w powtórce.</span>' : '<span class="muted">Tego tematu nie ma teraz w planie nauki.</span>'}</div>`;
    root.Kurs.panel($('panelLekcji'), { komp: komp, czesci: czesci, aktywna: Math.max(0, czesci.findIndex(c => !root.Kurs.zrobione(c.id))), tytulListy: 'Na dziś' });
    if ($('odhacz')) $('odhacz').onclick = () => {
      const przed = seria().dni;
      czesci.forEach(c => { if (!c.kontynuacja) root.Kurs.oznacz(c.id, true); });
      S.oznaczSesje(D.stan, sesja, true, t); zapisz();
      const po = seria().dni;
      toast((po > przed ? `🔥 Seria: ${dniSl(po)}! ` : 'Sesja odhaczona ✓ ') + (sesja.czesc === sesja.z ? 'Teraz quiz zaliczeniowy.' : 'Kolejna część jest już w planie.'));
      go('dzis');
    };
  }

  // ═════════════ WYNIK QUIZU / POWTÓRKI ═════════════
  function widokQuizWynik() {
    if (!W || W.typ === 'diagnoza') { go(D ? 'dzis' : ''); return; }
    let ik, tyt, tresc = '', zmiany = '';
    if (W.typ === 'jednostka') {
      if (W.zaliczona) {
        ik = '🎉'; tyt = W.sprawdzenie ? 'Umiesz to!' : 'Zaliczone!';
        tresc = `<p class="lead">${esc(W.komunikat)} <b>${W.procent}%</b> (próg 70%).</p>
          <div class="callout green"><span class="ico">🔁</span><span>Następna powtórka za <b>${dniSl(W.powtorkaZa)}</b>. ${W.procent >= 90 ? 'Poszło świetnie, więc odstęp jest dłuższy.' : W.procent < 80 ? 'Było blisko progu, więc powtórzymy szybciej.' : 'Im lepiej Ci idzie, tym rzadziej powtarzamy.'}</span></div>
          ${W.sprawdzenie ? '<p class="muted">Temat odhaczony bez nauki. Ten czas plan przeznaczy na Twoje luki.</p>' : ''}`;
      } else if (W.sprawdzenie) {
        ik = '📘'; tyt = 'Dobrze, że sprawdziliśmy';
        tresc = `<p class="lead">${esc(W.komunikat)}</p><p class="muted">To nie porażka. Właśnie po to są szybkie sprawdzenia: nie uczysz się tego, co umiesz, i nie pomijasz tego, czego nie umiesz.</p>`;
      } else if (W.cofniecieDo) {
        ik = '🧱'; tyt = 'Wracamy do podstaw';
        tresc = `<p class="lead">${esc(W.komunikat)}</p>
          ${W.cofniecieDo.length ? `<div class="card flat"><h3>Najpierw te podstawy</h3><div class="lista">${W.cofniecieDo.map(c => `<div class="poz"><span>🧩</span><span class="t">${esc(c.nazwa)}</span><span class="badge yellow">w planie od jutra</span></div>`).join('')}</div></div>` : ''}
          <div class="callout"><span class="ico">🛠️</span><div class="stack" style="gap:4px"><b class="t">Materiał automatycznie dostosowany</b><span>Najpierw wyjaśnienie krok po kroku, potem zadania. Na start rozgrzewka z podstawy. Quiz z nowym zestawem pytań.</span></div></div>
          ${W.doAnalizyAI ? '<p class="muted small">Twoje odpowiedzi trafiły do analizy przyczyn (w kolejnej wersji zrobi to AI i dobierze wskazówkę).</p>' : ''}`;
      } else {
        ik = '💪'; tyt = 'Jeszcze nie tym razem';
        tresc = `<p class="lead">${esc(W.komunikat)}</p>
          <div class="card flat"><h3>Co zmieniamy</h3><ul style="margin:0;padding-left:18px"><li>Temat wraca na najbliższy wolny termin</li><li>Najpierw wyjaśnienie (schemat), dopiero potem zadania</li><li>Quiz z innym zestawem pytań</li><li>Jeśli znowu nie wyjdzie, cofniemy się do podstaw</li></ul></div>`;
      }
      zmiany = W.komp ? `<button class="btn-ghost" id="lek">Zobacz ${W.zaliczona ? 'temat' : 'dostosowaną lekcję'}: ${esc(W.nazwa)}</button>` : '';
    } else if (W.typ === 'powtorka') {
      ik = '🔁'; tyt = 'Powtórka zrobiona';
      tresc = `<p class="lead">${esc(W.komunikat)}</p>
        <div class="lista">${(W.zmiany || []).map(z => `<div class="poz ${z.dobrze ? 'ok' : ''}"><span class="box">${z.dobrze ? '✓' : z.wraca ? '↩' : '!'}</span><span class="t">${esc(z.nazwa)}</span>
          <span class="badge ${z.dobrze ? 'green' : z.wraca ? 'red' : 'yellow'}">${z.dobrze ? 'następna za ' + dniSl(z.za) : z.wraca ? 'wraca do planu' : 'jutro jeszcze raz'}</span></div>`).join('') || '<p class="muted">Brak tematów do powtórki.</p>'}</div>
        <p class="muted small">Powtórki są adaptacyjne: pamiętasz, to odstęp rośnie (2 > 5 > 12 > 30 dni). Zapominasz, to wracamy szybciej.</p>`;
    }
    app.innerHTML = `<div class="q-head"><span style="font-size:4rem;line-height:1">${ik}</span><h1>${tyt}</h1>${W.seriaWzrosla ? `<span class="pill-fire" style="font-size:1.1rem">🔥 Seria: ${dniSl(W.seriaWzrosla)}!</span>` : ''}</div>
      <div class="stack">${tresc}</div>
      <div class="cta"><button class="btn-main xl arrow" id="dalej">Wracam do planu</button>${zmiany}</div>`;
    $('dalej').onclick = () => go('dzis');
    if ($('lek')) $('lek').onclick = () => go('lekcja', W.komp);
  }

  // ═════════════ PLAN (LISTA DO MATURY) ═════════════
  let pokazWszystkie = false;
  function widokPlan() {
    if (!D) return brakDanych();
    const r = planTeraz();
    if (r.blad) return bladPlanu(r.blad);
    const plan = r.plan, ps = plan.podsumowanie, t = dzis();
    const wlasne = (D.org.blokady || []).map((b, i) => ({ b: b, i: i })).filter(x => x.b.do >= t || x.b.od >= t);
    const tygodnie = S.grupujTygodnie(plan).slice(0, 5);
    app.innerHTML = `
      <div class="stack" style="gap:6px"><h1>Lista do matury</h1><p class="muted">Wszystko, co dzieli Cię od celu. Temat odhacza się dopiero po zaliczonym quizie (min. 70%), a potem wraca w powtórkach.</p></div>
      <div class="staty"><div class="stat"><b>${ps.dniDoMatury}</b><span>dni do matury</span></div><div class="stat"><b>${plan.zaliczone.length}</b><span>zaliczone tematy</span></div>
        <div class="stat"><b>${ps.jednostek}</b><span>w planie</span></div><div class="stat"><b>${String(ps.godzinNauki).replace('.', ',')} h</b><span>nauki w planie</span></div></div>
      <div class="cols">
        <div class="card"><h3>Tematy</h3>
          <div class="lista">
            ${plan.zaliczone.map(z => `<div class="poz ok"><span class="box">✓</span><span><span class="t">${esc(z.nazwa)}</span><br><span class="m">zaliczone ${fKrotko(z.data)}${z.powtorka ? ' · powtórka ' + fKrotko(z.powtorka) : ''}</span></span><span class="badge green">zaliczone</span></div>`).join('')}
            ${plan.jednostki.map((u, i) => `<div class="poz" ${i >= 15 && !pokazWszystkie ? 'hidden' : ''}><span class="box"></span><span><a class="t" href="#/lekcja/${u.komp}" style="color:inherit;text-decoration:none">${esc(u.nazwa)}</a><br><span class="m">${esc(u.dzial)} · ${fKrotko(u.start)}${u.koniec !== u.start ? ' - ' + fKrotko(u.koniec) : ''} · ${esc(u.powod)}</span></span>
              <span class="badge ${u.typ === 'sprawdzenie' ? 'blue' : u.dostosowanie ? 'yellow' : ''}">${u.typ === 'sprawdzenie' ? 'sprawdzenie 5 min' : u.minuty + ' min'}</span></div>`).join('')}
            ${plan.jednostki.length > 15 && !pokazWszystkie ? `<button class="btn-ghost" id="wszystkie" style="margin:10px 0">Pokaż wszystkie tematy w planie (${plan.jednostki.length})</button>` : ''}
            ${plan.pominiete.map(u => `<div class="poz poza"><span class="box"></span><span><span class="t">${esc(u.nazwa)}</span><br><span class="m">poza planem: brak czasu</span></span><span class="badge">${u.minuty} min</span></div>`).join('')}
          </div></div>
        <div class="stack" style="gap:16px">
          <div class="card"><h3>Ile minut dziennie?</h3>
            <div class="chipy left">${[10, 15, 20, 30, 45, 60].map(m => `<button class="chip-sel" data-m="${m}" aria-pressed="${D.org.minutDziennie === m}">${m}</button>`).join('')}</div>
            <p class="small">${esc(ladneDaty(ps.komunikat))}</p>
            ${ps.pominietych ? `<button class="btn-small alt" data-m="${ps.minutDziennieNaCalosc}">Ustaw ${ps.minutDziennieNaCalosc} min i zmieść wszystko</button>` : ''}</div>
          <div class="card"><h3>Dni nauki</h3><div class="dni-tyg" style="justify-content:flex-start">${KOLEJNOSC_DNI.map(d => `<button class="dzien" data-dz="${d}" aria-pressed="${D.org.dniTygodnia.includes(d)}">${DNI[d]}</button>`).join('')}</div></div>
          <div class="card"><h3>Dni bez nauki</h3>
            <p class="small muted">Święta, Sylwester i Wielkanoc są wolne automatycznie. Co 5. dzień nauki jest buforowy.</p>
            <div class="lista">${wlasne.map(x => `<div class="poz"><span>🌴</span><span><span class="t">${esc(x.b.nazwa)}</span><br><span class="m">${fKrotko(x.b.od)}${x.b.do !== x.b.od ? ' - ' + fKrotko(x.b.do) : ''}</span></span><button class="btn-small alt" data-usun="${x.i}" aria-label="Usuń">✕</button></div>`).join('') || '<p class="muted small">Brak własnych dni wolnych.</p>'}</div>
            <button class="btn-ghost" id="dodaj">+ Dodaj dni bez nauki</button><div id="formWyp" hidden></div></div>
        </div>
      </div>
      <div class="card"><h3>Najbliższe tygodnie</h3>
        ${tygodnie.map(w => `<div class="stack" style="gap:6px"><div class="row between"><b>od ${fKrotko(w.tydzienOd)}</b><span class="muted small">${w.minut} min</span></div>
          <div class="row" style="gap:6px">${w.sesje.map(s => `<span class="badge ${s.typ === 'nauka' ? 'blue' : s.typ === 'quiz' ? 'green' : s.typ === 'powtorka' ? 'yellow' : s.typ === 'diagnoza' ? 'red' : ''}" title="${esc(nazwaSesji(s))}">${fKrotko(s.data)} ${IKONA[s.typ]} ${s.typ === 'bufor' ? 'bufor' : esc((s.tytul || '').replace(/^(Quiz|Sprawdzenie): /, '').slice(0, 26))}</span>`).join('')}</div></div>`).join('<hr style="border:0;border-top:1px solid var(--line);margin:4px 0">')}
      </div>`;
    app.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { D.org.minutDziennie = +b.dataset.m; zapisz(); toast('Plan przeliczony dla ' + b.dataset.m + ' min dziennie.'); render(); });
    app.querySelectorAll('[data-dz]').forEach(b => b.onclick = () => {
      const d = +b.dataset.dz, nowe = D.org.dniTygodnia.includes(d) ? D.org.dniTygodnia.filter(x => x !== d) : D.org.dniTygodnia.concat(d);
      if (!nowe.length) return toast('Zostaw co najmniej jeden dzień nauki.');
      D.org.dniTygodnia = nowe; zapisz(); render();
    });
    app.querySelectorAll('[data-usun]').forEach(b => b.onclick = () => { D.org.blokady.splice(+b.dataset.usun, 1); zapisz(); toast('Usunięto. Plan przeliczony.'); render(); });
    if ($('wszystkie')) $('wszystkie').onclick = () => { pokazWszystkie = true; const y = window.scrollY; render(); window.scrollTo(0, y); };
    $('dodaj').onclick = () => { const f = $('formWyp'); f.hidden = !f.hidden; if (!f.hidden) formularzWydarzenia(f, plan); };
  }

  // ═════════════ POSTĘPY ═════════════
  function wykresProg(prognozy, cel) {
    if (!prognozy.length) return '<p class="muted">Brak diagnoz.</p>';
    const w = 640, h = 220, pl = 36, pr = 16, pt = 16, pb = 30;
    const n = prognozy.length, x = i => pl + (n === 1 ? (w - pl - pr) / 2 : i * (w - pl - pr) / (n - 1)), y = v => pt + (100 - v) * (h - pt - pb) / 100;
    const linie = [0, 30, 50, 70, 100].map(v => `<line x1="${pl}" x2="${w - pr}" y1="${y(v)}" y2="${y(v)}" stroke="#E5E7EB"/><text x="${pl - 6}" y="${y(v) + 4}" font-size="11" text-anchor="end" fill="#6B7280">${v}%</text>`).join('');
    const pas = prognozy.map((p, i) => `${x(i)},${y(p.max)}`).join(' ') + ' ' + prognozy.slice().reverse().map((p, i) => `${x(n - 1 - i)},${y(p.min)}`).join(' ');
    return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" aria-label="Prognoza wyniku w czasie">${linie}
      ${cel ? `<line x1="${pl}" x2="${w - pr}" y1="${y(cel)}" y2="${y(cel)}" stroke="#D19A00" stroke-dasharray="6 5" stroke-width="2"/><text x="${w - pr}" y="${y(cel) - 6}" font-size="12" text-anchor="end" fill="#8A6A00" font-weight="700">cel ${cel}%</text>` : ''}
      <polygon points="${pas}" fill="rgba(37,99,235,.12)"/>
      <polyline points="${prognozy.map((p, i) => x(i) + ',' + y(p.wynik)).join(' ')}" fill="none" stroke="#2563EB" stroke-width="3" stroke-linejoin="round"/>
      ${prognozy.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.wynik)}" r="6" fill="#2563EB" stroke="#fff" stroke-width="2"/><text x="${x(i)}" y="${y(p.wynik) - 12}" font-size="12" font-weight="800" text-anchor="middle" fill="#0B1220">${p.wynik}%</text><text x="${x(i)}" y="${h - 8}" font-size="11" text-anchor="middle" fill="#6B7280">${fKrotko(p.data).slice(3)}</text>`).join('')}</svg>`;
  }
  function widokPostepy() {
    if (!D) return brakDanych();
    const ser = seria(), st = D.stan;
    const minut = st.historiaSesji.filter(h => h.zrobiona).reduce((a, h) => a + (h.minuty || 0), 0);
    const r = planTeraz(), plan = r.plan;
    const grupy = {};
    st.przyczyny.filter(x => x.opis && x.opis !== 'nie wiem' && x.opis !== 'nieznana').forEach(x => {
      const g = grupy[x.opis] || (grupy[x.opis] = { opis: x.opis, n: 0, tematy: new Set() });
      g.n++; g.tematy.add(S.kompetencja(x.komp).nazwa);
    });
    const top = Object.values(grupy).sort((a, b) => b.n - a.n).slice(0, 6);
    const pg = S.prognoza(st);
    app.innerHTML = `
      <div class="stack" style="gap:6px"><h1>Twoje postępy</h1><p class="muted">Monitorujemy realizację planu, poziom każdej umiejętności i przyczyny błędów. Wszystko to od razu zmienia plan.</p></div>
      <div class="staty"><div class="stat"><b style="color:var(--fire)">🔥 ${ser.dni}</b><span>seria (rekord ${ser.rekord})</span></div><div class="stat"><b>${Object.keys(st.zaliczone).length}</b><span>zaliczone tematy</span></div>
        <div class="stat"><b>${minut}</b><span>minut nauki</span></div><div class="stat"><b>${pg.wynik}%</b><span>prognoza matury</span></div></div>
      <div class="cols">
        <div class="card"><div class="row between"><h3>Prognoza matury w czasie</h3><button class="btn-small" id="pelna">Diagnoza pełna teraz</button></div>
          ${wykresProg(st.prognozy, pg.cel)}
          <p class="small muted">Kropka to prognoza z diagnozy, niebieskie pole to przedział niepewności. ${plan && plan.terminyDiagnoz[0] ? 'Następna diagnoza pełna w planie: ' + fData(plan.terminyDiagnoz[0], true) + ' (co ok. ' + plan.podsumowanie.coIleDniDiagnoza + ' dni).' : ''}</p></div>
        <div class="card"><div class="row between"><h3>Najczęstsze przyczyny błędów</h3><span class="tag-new">Nowość</span></div>
          ${top.length ? `<div class="lista">${top.map(g => `<div class="poz"><span>🔎</span><span><span class="t">${esc(g.opis)}</span><br><span class="m">${esc(Array.from(g.tematy).slice(0, 2).join(', '))}</span></span><span class="badge red">${g.n}×</span></div>`).join('')}</div>` : '<p class="muted">Jeszcze brak danych.</p>'}
          ${st.doAnalizyAI.length ? `<p class="small muted">Do pogłębionej analizy (AI, kolejna iteracja): ${tematySl(st.doAnalizyAI.length)}.</p>` : ''}</div>
      </div>
      <div class="card"><div class="row between"><h3>Mapa mikrokompetencji</h3>${LEGENDA}</div>${mapaHtml(S.podsumujWiedze(st))}</div>`;
    $('pelna').onclick = () => startTest('diagnoza', { pelna: true }, 'wynik');
  }

  // ═════════════ POWIADOMIENIA ═════════════
  function listaPowiadomien() {
    const r = planTeraz();
    if (!r.plan) return [];
    const plan = r.plan, t = dzis(), ser = seria(), godz = D.org.godzina, pw = D.profil.powiadomienia || {};
    const dz = plan.sesje.filter(s => s.data === t && s.typ !== 'bufor');
    const nauka = dz.find(s => s.typ === 'nauka' || s.typ === 'quiz') || plan.sesje.find(s => s.data > t && (s.typ === 'nauka' || s.typ === 'quiz'));
    const L = [];
    if (pw.codzienne !== false) L.push({ kiedy: godz, tyt: `Hej${imie()}! 👋`, tekst: nauka ? ` Dzisiaj robimy: ${esc(nazwaSesji(nauka))}. ${dz.reduce((a, s) => a + s.minuty, 0) || nauka.minuty} min i masz to z głowy.` : ' Dziś luz. Jutro wracamy do nauki!' });
    const pow = plan.sesje.find(s => s.typ === 'powtorka' && s.data >= t);
    if (pw.powtorki !== false && pow) L.push({ kiedy: pow.data === t ? godz : fKrotko(pow.data), tyt: '🔁 5 minut powtórki', tekst: ` ${esc(pow.komps.map(id => S.kompetencja(id).nazwa).join(', '))}. Sprawdźmy, czy jeszcze pamiętasz!` });
    if (pw.seria !== false) L.push({ kiedy: '21:00', tyt: `🔥 Seria ${dniSl(Math.max(ser.dni, 1))} w niebezpieczeństwie`, tekst: ' Zostały 3 godziny. Wystarczy jedna sesja, żeby ją utrzymać.' });
    const tr = plan.jednostki.find(u => u.dostosowanie);
    if (tr) L.push({ kiedy: fKrotko(tr.start), tyt: '💪 Nie poddajemy się', tekst: ` ${esc(tr.nazwa)} wraca z prostszym materiałem. Najpierw wyjaśnienie, potem zadania.` });
    if (pw.diagnozy !== false && plan.terminyDiagnoz[0]) L.push({ kiedy: fKrotko(M.dodajDni(plan.terminyDiagnoz[0], -1)), tyt: '🎯 Jutro diagnoza pełna', tekst: ' 30 minut i zobaczysz, ile masz dziś na maturze.' });
    const z = Object.keys(D.stan.zaliczone).sort((a, b) => D.stan.zaliczone[b] < D.stan.zaliczone[a] ? -1 : 1)[0];
    if (z) { const p = D.stan.powtorki.find(x => x.komp === z); L.push({ kiedy: fKrotko(D.stan.zaliczone[z]), tyt: '🎉 Zaliczone!', tekst: ` ${esc(S.kompetencja(z).nazwa)}.${p ? ' Kolejna powtórka ' + fKrotko(p.data) + '.' : ''}` }); }
    else L.push({ kiedy: 'po quizie', tyt: '🎉 Zaliczone!', tekst: ' Tak będzie wyglądać gratulacja po pierwszym zaliczonym temacie.' });
    return L;
  }
  function widokPowiadomienia() {
    if (!D) return brakDanych();
    const pw = D.profil.powiadomienia || (D.profil.powiadomienia = { codzienne: true, powtorki: true, seria: true, diagnozy: true });
    const L = listaPowiadomien();
    const t = dzis(), c = t.split('-');
    app.innerHTML = `
      <div class="stack" style="gap:6px"><h1>Powiadomienia</h1><p class="muted">Jak w aplikacjach do nauki języków: jedno konkretne przypomnienie dziennie, pilnowanie serii i gratulacje. Treść bierze się z Twojego planu.</p></div>
      <div class="cols">
        <div class="telefon" aria-label="Podgląd ekranu blokady telefonu"><div class="ekran">
          <div class="godz">${esc(D.org.godzina)}</div><div class="data">${DNI[M.dzienTygodnia(t)]}, ${Number(c[2])} ${MIESIACE[Number(c[1]) - 1]}</div>
          ${L.map(n => pushHtml(n.tyt, n.tekst, n.kiedy)).join('')}</div></div>
        <div class="stack" style="gap:16px">
          <div class="card"><h3>O której przypominać?</h3>
            <div class="chipy left">${['07:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map(g => `<button class="chip-sel" data-g="${g}" aria-pressed="${D.org.godzina === g}">${g}</button>`).join('')}</div>
            <p class="small muted">Ta sama godzina ustawia sesje w kalendarzu.</p></div>
          <div class="card"><h3>Co wysyłać</h3>
            <div class="opcje">${[['codzienne', 'Codzienne przypomnienie', '„Hej! Dzisiaj robimy…”'], ['powtorki', 'Powtórki', 'gdy przypada powtórka 5 min'], ['seria', 'Seria w niebezpieczeństwie', 'wieczorem, jeśli nie było nauki'], ['diagnozy', 'Diagnozy pełne', 'dzień przed symulacją matury']].map(([k, a, b]) => `<button class="opcja" data-p="${k}" aria-pressed="${pw[k] !== false}" style="padding:14px 16px;min-height:0"><span><b>${a}</b><br><span class="small muted">${b}</span></span><span class="ok">✓</span></button>`).join('')}</div></div>
          <div class="card soft"><h3>Sprawdź na tym urządzeniu</h3><p class="small">Wyślemy jedno prawdziwe powiadomienie z przeglądarki.</p><button class="btn-small" id="test">Wyślij testowe powiadomienie</button>
            <p class="tiny muted">Powiadomienia push na telefon, gdy aplikacja jest zamknięta, wymagają serwera. To kolejna iteracja (razem z API).</p></div>
        </div>
      </div>`;
    app.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { D.org.godzina = b.dataset.g; zapisz(); render(); });
    app.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { pw[b.dataset.p] = pw[b.dataset.p] === false; zapisz(); render(); });
    $('test').onclick = async () => {
      if (!('Notification' in window)) return toast('Ta przeglądarka nie obsługuje powiadomień.');
      let zgoda = Notification.permission;
      if (zgoda === 'default') { try { zgoda = await Notification.requestPermission(); } catch (e) { zgoda = 'denied'; } }
      if (zgoda !== 'granted') return toast('Powiadomienia są zablokowane w przeglądarce. Podgląd obok pokazuje, jak wyglądają.');
      const n = L[0] || { tyt: 'Maturalni', tekst: 'Test powiadomienia' };
      try { new Notification('Maturalni: ' + n.tyt.replace(/<[^>]+>/g, ''), { body: n.tekst.replace(/<[^>]+>/g, '').replace(/&#39;/g, "'").trim() }); toast('Wysłano. Sprawdź powiadomienia systemu.'); }
      catch (e) { toast('Na tym urządzeniu przeglądarka wymaga zainstalowania aplikacji, żeby pokazać powiadomienie.'); }
    };
  }

  // ═════════════ KALENDARZ ═════════════
  function adresAplikacji() { return location.origin + location.pathname.replace(/index\.html$/, ''); }
  function pobierzIcs() {
    const r = planTeraz();
    if (!r.plan) return toast('Najpierw potrzebny jest plan.');
    const blob = new Blob([S.doIcs(r.plan, { adres: adresAplikacji() })], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'plan-matura-maturalni.ics';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    toast('Pobrano plik plan-matura-maturalni.ics');
  }
  function widokKalendarz() {
    if (!D) return brakDanych();
    const r = planTeraz();
    if (r.blad) return bladPlanu(r.blad);
    const sesje = r.plan.sesje.filter(s => s.minuty && s.data >= dzis()).slice(0, 8);
    const ile = r.plan.sesje.filter(s => s.minuty).length;
    app.innerHTML = `
      <div class="stack" style="gap:6px"><h1>Twój plan w Google Calendar</h1><p class="muted">Google Calendar to Twój główny kalendarz: widzisz w nim, <b>co</b> i <b>kiedy</b> robisz. Uczysz się w aplikacji, bo tu plan sam się przelicza po każdym quizie.</p></div>
      <div class="grid3">
        <div class="card flat"><span style="font-size:1.6rem">🗓️</span><h3>Co i kiedy</h3><p class="small muted">Wydarzenie: temat, część, minuty i lista dzisiejszych części (wideo, notatka, zadania).</p></div>
        <div class="card flat"><span style="font-size:1.6rem">🔗</span><h3>Link do lekcji</h3><p class="small muted">Jedno kliknięcie w wydarzeniu otwiera dzisiejszą lekcję w aplikacji, z materiałami Maturalnych w środku.</p></div>
        <div class="card flat"><span style="font-size:1.6rem">🛟</span><h3>Link zapasowy</h3><p class="small muted">W opisie jest też bezpośredni link do materiału na platformie Maturalnych, gdyby aplikacja była niedostępna.</p></div>
      </div>
      <div class="cols">
        <div class="card"><h3>1. Cały plan naraz (${ile} sesji)</h3>
          <button class="btn-main" id="ics">⬇ Pobierz plan (.ics)</button>
          <div class="lista">${[
            ['Utwórz osobny kalendarz', 'Google Calendar na komputerze: przy „Inne kalendarze” kliknij <b>+</b>, potem <b>Utwórz nowy kalendarz</b>, nazwij go „Matura”.'],
            ['Otwórz import', 'Ustawienia (ikona koła zębatego) > <b>Importowanie i eksportowanie</b>.'],
            ['Wybierz plik', '<b>Wybierz plik z komputera</b> i wskaż pobrany plik plan-matura-maturalni.ics.'],
            ['Wskaż kalendarz „Matura”', 'W polu „Dodaj do kalendarza” wybierz „Matura” i kliknij <b>Importuj</b>.'],
            ['Gdy plan się zmieni', 'Usuń kalendarz „Matura” i zaimportuj nowy plik. Dzięki osobnemu kalendarzowi nie zostaną duplikaty.']
          ].map((x, i) => `<div class="poz"><span class="box">${i + 1}</span><span><span class="t">${x[0]}</span><br><span class="m">${x[1]}</span></span><span></span></div>`).join('')}</div></div>
        <div class="card"><h3>2. Pojedyncza sesja jednym kliknięciem</h3><p class="small muted">Otwiera Google Calendar z gotowym wydarzeniem. Bez importu.</p>
          <div class="lista">${sesje.map(s => `<div class="poz"><span>${IKONA[s.typ]}</span><span><span class="t">${esc(nazwaSesji(s))}</span><br><span class="m">${fKrotko(s.data)} · ${s.start}-${s.koniec}</span></span><a class="btn-small alt" href="${S.linkGoogle(s, { adres: adresAplikacji() })}" target="_blank" rel="noopener">Dodaj ↗</a></div>`).join('')}</div></div>
      </div>
      <div class="callout blue"><span class="ico">🔄</span><span><b>W kolejnej iteracji:</b> połączenie z kontem Google (Google Calendar API), żeby plan sam aktualizował się w kalendarzu po każdej zmianie.</span></div>`;
    $('ics').onclick = pobierzIcs;
  }

  // ═════════════ MATRYCA ═════════════
  function widokMatryca() {
    const wiedza = D ? S.podsumujWiedze(D.stan) : null;
    app.innerHTML = `
      <div class="stack" style="gap:6px"><h1>Matryca mikrokompetencji</h1><p class="muted">${S.kompetencje().length} umiejętności z wymagań CKE do matury z matematyki (poziom podstawowy). Każda ma poziom trudności, punkt wymagań CKE i podstawy, od których zależy. Na tej matrycy test „schodzi niżej”, a plan ustawia kolejność.</p></div>
      ${S.dzialy().map(d => {
        const ks = S.kompetencje().filter(k => k.dzial === d.id);
        const w = wiedza && wiedza.find(x => x.dzial === d.id);
        return `<div class="card"><div class="row between"><h3>${d.id}. ${esc(d.nazwa)}</h3><span class="badge">waga w maturze ok. ${d.waga}%</span></div>
          <div class="lista">${ks.map(k => {
            const s = w && w.kompetencje.find(x => x.id === k.id);
            return `<div class="poz"><span class="badge ${k.poziom === 1 ? 'green' : k.poziom === 2 ? 'yellow' : 'red'}" style="padding:2px 6px">${k.poziom}</span>
              <span><a class="t" href="#/materialy/${k.id}" style="color:inherit">${esc(k.nazwa)}</a><br><span class="m">${k.id} · CKE ${esc(k.cke)} · pytań: ${S.pytaniaDla(k.id).length} · materiałów: ${(M.MATERIALY[k.id] || []).length}${k.wymaga.length ? ' · wymaga: ' + esc(k.wymaga.map(x => S.kompetencja(x).nazwa).join(', ')) : ''}</span></span>
              ${s ? `<span class="row" style="gap:6px"><i class="kr ${s.status} ${s.pewny ? '' : 'szac'}"></i><b class="small">${s.opanowanie}%</b></span>` : '<span></span>'}</div>`;
          }).join('')}</div></div>`;
      }).join('')}
      <p class="note">Wagi działów to szacunek udziału w punktach matury podstawowej. Do weryfikacji na arkuszach CKE 2023-2026.</p>`;
  }

  // ═════════════ JAK TO DZIAŁA ═════════════
  function widokJak() {
    app.innerHTML = `
      <div class="stack" style="gap:6px"><span class="eyebrow">Dla Maturalnych i jury</span><h1>Co wyróżnia ten plan</h1>
        <p class="muted">Diagnoza już istnieje. Problem w tym, że jej wynik niewiele mówi uczniowi. Tu wynik jest punktem wyjścia do planu, który wie, czego brakuje, dlaczego i ile to zajmie.</p></div>
      <div class="card"><table class="porownanie"><thead><tr><th></th><th>Typowa diagnoza i kurs</th><th>Plan Maturalni</th></tr></thead><tbody>
        ${[
          ['Wynik', 'Procent z testu, ewentualnie z działu', 'Poziom każdej z 67 mikrokompetencji z wymagań CKE'],
          ['Błąd', '„Źle”', 'Przyczyna (np. pomylone sin i cos) i brakująca podstawa'],
          ['Pytania', 'Stały zestaw dla wszystkich', 'Adaptacyjne: źle > schodzimy po matrycy niżej, dobrze > wyżej'],
          ['Prognoza', 'Brak', 'Wynik matury na dziś z przedziałem niepewności, aktualizowany co ok. miesiąc'],
          ['Plan', 'Kurs na X godzin, ten sam dla każdego', 'Tylko to, czego brakuje, od tematów dających najwięcej punktów na minutę'],
          ['Przewidywalność', 'Nie wiadomo, ile zostało', 'Każdy temat ma minuty, uczeń wie, kiedy skończy i ile potrzebuje dziennie'],
          ['Postęp', 'Obejrzane lekcje', 'Zaliczenie quizem (70%), powtórki co 2 > 5 > 12 > 30 dni'],
          ['Gdy nie idzie', 'Uczeń zostaje sam', 'Zmiana materiału na wyjaśnienie, rozgrzewka z podstawy, cofnięcie w matrycy'],
          ['Życie', 'Plan stały', 'Bufor 20%, święta, studniówka, choroba: plan się przelicza, seria trwa'],
          ['Materiały', 'Cały kurs albo arkusz do przejrzenia', 'W aplikacji: fragment wideo (od-do), notatka, trening i zadania Maturalnych dla jednej umiejętności, w kolejności dopasowanej do stylu nauki'],
          ['Kalendarz', 'Ręczne wpisywanie', 'Google Calendar pokazuje co i kiedy, z linkiem do lekcji i zapasowym linkiem do materiału']
        ].map(r => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table></div>
      <div class="card"><h3>Przepływ ucznia</h3>
        <div class="flow"><span>Kompas (opcjonalnie)</span><i>→</i><span>Kalibracja: 9 pytań</span><i>→</i><span>Test adaptacyjny</span><i>→</i><span>Wynik + mapa</span><i>→</i><span>Plan dnia</span><i>→</i><span>Lekcja z materiałem</span><i>→</i><span>Quiz 70%</span><i>→</i><span>Powtórki</span><i>→</i><span>Diagnoza pełna</span></div>
        <p class="small muted">Szybka ścieżka: „wiem, że chcę poprawić trygonometrię” pomija kalibrację celów, robi test tylko z działu i sięga po brakujące podstawy z innych działów (maks. 2 poziomy w dół).</p></div>
      <div class="grid2">
        <div class="card"><h3>Jak liczymy</h3><ul style="margin:0;padding-left:18px" class="stack small">
          <li><b>Poziom umiejętności</b> to udział trafień z uwzględnieniem pewności. Kalibracja daje słaby szacunek startowy, test go weryfikuje. Od 70% opanowane, poniżej 40% luka.</li>
          <li><b>Test</b> pyta tam, gdzie spodziewana luka kosztuje najwięcej punktów, a wiemy najmniej. Każdy dział dostaje min. jedno pytanie.</li>
          <li><b>Przyczyna błędu</b> wynika z tego, którą złą odpowiedź wybrano. Każda zła odpowiedź w banku pytań jest opisana.</li>
          <li><b>Prognoza</b> to suma poziomów ważona udziałem w punktach matury. Przedział zwęża się z każdą odpowiedzią.</li>
          <li><b>Plan</b> sortuje tematy według punktów na minutę, wstawia podstawy przed tematy zależne i rozkłada je na dni z 20% buforem.</li>
        </ul></div>
        <div class="card"><h3>Co z tego mają Maturalni</h3><ul style="margin:0;padding-left:18px" class="stack small">
          <li>Dane o mikrokompetencjach tysięcy uczniów: które umiejętności sprawiają najwięcej problemów i gdzie brakuje materiałów.</li>
          <li>Każda sesja prowadzi do konkretnego produktu Maturalnych, więc plan naturalnie pokazuje, co warto dokupić.</li>
          <li>Seria, powiadomienia i widoczna prognoza zwiększają regularność, a więc retencję.</li>
          <li>Obietnica liczona w wyniku i czasie, a nie w godzinach kursu.</li>
        </ul></div>
      </div>
      <div class="row"><a class="btn-ghost" href="#/matryca">Zobacz matrycę 67 mikrokompetencji</a><a class="btn-ghost" href="#/mapa">Mapa strony i narzędzia demo</a></div>`;
  }

  // ═════════════ MAPA STRONY ═════════════
  function widokMapa() {
    const lk = (h, ik, t, o, cls) => `<a class="lk ${cls || ''}" href="${h}"><b>${ik} ${t}</b><span>${o}</span></a>`;
    const ma = !!D;
    app.innerHTML = `
      <div class="stack" style="gap:6px"><h1>Mapa strony</h1><p class="muted">Wszystkie ekrany w jednym miejscu. ${ma ? '' : 'Ekrany planu wymagają kalibracji albo wczytania ucznia demo (na dole).'}</p></div>
      <div class="card"><h3>Ścieżka ucznia</h3><div class="linki">
        ${lk('#/', '🏠', 'Start', 'Strona główna i wyróżniki')}
        ${lk('#/kalibracja/1', '🎚️', 'Kalibracja', '9 pytań w stylu Maturalnych')}
        ${lk('#/szybka', '⚡', 'Szybka ścieżka', 'Wiem, co chcę poprawić')}
        ${lk('#/test', '🧭', 'Test diagnostyczny', 'Adaptacyjny, ok. 15 min')}
        <button class="lk" id="calosc"><b>🎯 Diagnoza całościowa</b><span>Symulacja matury: cała matematyka, 20 pytań</span></button>
        ${lk('#/wynik', '📊', 'Wynik diagnozy', 'Prognoza, przyczyny błędów, mapa')}
        ${lk('#/dzis', '🔥', 'Dziś', 'Komunikat dnia, seria, ścieżka na dziś')}
        ${lk('#/plan', '✅', 'Lista do matury', 'Wszystkie tematy, minuty, dni wolne')}
        ${lk('#/materialy', '🎬', 'Materiały', 'Wideo, notatki i zadania Maturalnych per umiejętność')}
        ${lk('#/postepy', '📈', 'Postępy', 'Prognoza w czasie, przyczyny błędów')}
        ${lk('#/powiadomienia', '🔔', 'Powiadomienia', 'Ekran push i ustawienia')}
        ${lk('#/kalendarz', '🗓️', 'Kalendarz', 'Plik .ics i Google Calendar')}
      </div></div>
      <div class="card"><h3>Doradztwo i informacje</h3><div class="linki">
        ${lk('#/kompas', '🧑‍🎓', 'Kompas', 'Diagnoza osobowości i predyspozycji')}
        ${lk('#/przedmioty', '📚', 'Przedmioty maturalne', 'Wybór przedmiotu do diagnozy')}
        ${lk('#/jak-to-dziala', '💡', 'Jak to działa', 'Wyróżniki, algorytm, wartość dla Maturalnych')}
        ${lk('#/matryca', '🧩', 'Matryca mikrokompetencji', '67 umiejętności z wymagań CKE')}
        ${lk('#/import', '🔄', 'Import materiałów', 'Lekcje z API Maturalnych > mikrokompetencje')}
      </div></div>
      <div class="card yellow"><div class="row between"><h3>Narzędzia demo (dla jury)</h3><span class="badge">data w aplikacji: ${fData(dzis(), true)}</span></div>
        <div class="linki">
          <button class="lk demo" id="d1"><b>👩 Wczytaj ucznia demo</b><span>Ola: cel 80%, słaba z trygonometrii, 15 min dziennie. Diagnoza zrobi się sama.</span></button>
          <button class="lk demo" id="d2" ${ma ? '' : 'disabled'}><b>📆 Symuluj 7 dni nauki</b><span>Uczeń robi codziennie plan: seria, zaliczenia, powtórki, czasem porażka.</span></button>
          <button class="lk demo" id="d3" ${ma ? '' : 'disabled'}><b>😓 Scenariusz: temat nie idzie</b><span>2 nieudane quizy: cofnięcie w matrycy i automatycznie dostosowany materiał.</span></button>
          <button class="lk demo" id="d4" ${ma ? '' : 'disabled'}><b>⏭️ Przewiń o 1 dzień bez nauki</b><span>Zobacz, jak plan przelicza zaległość, a seria się przerywa.</span></button>
          <button class="lk demo" id="d5" ${ma && D.demoDzis ? '' : 'disabled'}><b>↩️ Wróć do dzisiejszej daty</b><span>Wyłącza przewijanie czasu.</span></button>
          <button class="lk demo" id="d6"><b>🗑️ Wyczyść dane</b><span>Usuwa plan i odpowiedzi z tej przeglądarki.</span></button>
        </div></div>`;
    $('calosc').onclick = () => { if (D) startTest('diagnoza', { pelna: true }, 'wynik'); else startKalibracji(false); };
    $('d1').onclick = demoUczen;
    $('d2').onclick = () => symulujDni(7);
    $('d3').onclick = scenariuszKiepsko;
    $('d4').onclick = () => { D.demoDzis = M.dodajDni(dzis(), 1); zapisz(); toast('Przewinięto do ' + fData(dzis(), true) + '. Wczorajsze sesje przeszły na kolejne dni.'); go('dzis'); };
    $('d5').onclick = () => { D.demoDzis = null; zapisz(); toast('Wróciliśmy do dzisiejszej daty.'); render(); };
    $('d6').onclick = () => {
      if (!confirm('Usunąć plan i wszystkie odpowiedzi z tej przeglądarki?')) return;
      try { localStorage.removeItem(KLUCZ); localStorage.removeItem(KLUCZ_KAL); } catch (e) { }
      D = null; kal = null; T = null; W = null; toast('Dane usunięte.'); go('');
    };
  }

  // ═════════════ DEMO ═════════════
  let ziarno = 42;
  function los() { ziarno = (ziarno * 1664525 + 1013904223) % 4294967296; return ziarno / 4294967296; }
  function prawdaUcznia(id) {
    if (D.stan.zaliczone[id] || (D.stan.czesciZrobione[id] || 0) > 0) return 0.88;
    if (id.indexOf('TR') === 0) return 0.15;
    if (id === 'PL-01') return 0.3;
    if (id.indexOf('PL') === 0 || id.indexOf('ST') === 0) return 0.5;
    return { 1: 0.92, 2: 0.75, 3: 0.45 }[S.kompetencja(id).poziom];
  }
  function odpowiedzSym(q, p) {
    if (los() < p) return 0;
    const bl = S.pytanie(q.id).bledy || {};
    const klucze = Object.keys(bl);
    const pre = klucze.find(i => bl[i].indexOf('PRE:') === 0);
    return pre ? +pre : klucze.length ? +klucze[0] : 1;
  }
  function testAuto(typ, opcje, pFn) {
    const ses = S.utworzTest(D.stan, typ, opcje, dzis());
    let q;
    while ((q = S.nastepnePytanie(D.stan, ses))) S.odpowiedz(D.stan, ses, q.id, odpowiedzSym(q, pFn(q.komp)), dzis());
    const w = S.zakonczTest(D.stan, ses, dzis());
    w.opcje = opcje;
    return w;
  }
  function przygotujUczniaDemo() {
    ziarno = 42;
    const rok = lataMatury()[0];
    kal = Object.assign(nowaKal(false), { imie: 'Ola', rok: rok, skala: 62, poMaturze: 1, cel: 80, celRuszony: true, klopot: ['VII'], styl: 'wideo', minut: 15, dni: [1, 2, 3, 4, 5, 6, 0], godzina: '18:00' });
    const st = rok + '-01-23';
    if (st > dzis()) kal.studniowka = st;
    zapiszKal();
    D = null;
    zbudujProfil();
    D.demo = true;
    W = testAuto('diagnoza', {}, prawdaUcznia);
    zapisz();
  }
  function demoUczen() {
    przygotujUczniaDemo();
    toast('Wczytano ucznia demo: Ola, cel 80%, słaba z trygonometrii. Diagnoza wykonana.');
    go('wynik');
  }
  function symulujDni(n) {
    if (!D) return;
    for (let d = 0; d < n; d++) {
      for (let k = 0; k < 8; k++) {
        const r = planTeraz();
        if (!r.plan) break;
        const s = r.plan.sesje.find(x => x.data === dzis() && x.typ !== 'bufor');
        if (!s) break;
        if (s.typ === 'nauka') S.oznaczSesje(D.stan, s, true, dzis());
        else if (s.typ === 'quiz') testAuto('jednostka', { komp: s.komp, sprawdzenie: !!s.sprawdzenie }, s.sprawdzenie ? prawdaUcznia : () => 0.85);
        else if (s.typ === 'powtorka') testAuto('powtorka', {}, () => 0.85);
        else if (s.typ === 'diagnoza') testAuto('diagnoza', { pelna: true }, prawdaUcznia);
      }
      D.demoDzis = M.dodajDni(dzis(), 1);
    }
    zapisz();
    toast(`Przewinięto ${n} dni sumiennej nauki. Zobacz serię, postępy i powtórki.`);
    go('dzis');
  }
  function scenariuszKiepsko() {
    if (!D) przygotujUczniaDemo();
    const r = planTeraz();
    if (!r.plan) return toast(r.blad);
    const kandydaci = r.plan.jednostki.filter(x => x.typ === 'nauka' && (S.kompetencja(x.komp).wymaga || []).length && !x.dostosowanie);
    const u = kandydaci.find(x => x.komp.indexOf('TR') === 0) || kandydaci[0] || r.plan.jednostki[0];
    if (!u) return toast('Brak tematu do symulacji.');
    S.oznaczSesje(D.stan, { id: 'demo', typ: 'nauka', komp: u.komp, minuty: u.pozostalo || u.minuty || 15, tytul: u.nazwa }, true, dzis());
    let w = null;
    for (let i = 0; i < 2; i++) w = testAuto('jednostka', { komp: u.komp }, () => 0);
    W = w;
    zapisz();
    toast(`Symulacja: 2 nieudane quizy z tematu „${u.nazwa}”.`);
    go('quiz-wynik');
  }

  // ───────────── rejestracja widoków ─────────────
  rejestruj({
    '': widokStart, kalibracja: widokKalibracja, szybka: widokSzybka, test: widokTestIntro, quiz: widokQuiz,
    wynik: widokWynik, dzis: widokDzis, lekcja: widokLekcja, 'quiz-wynik': widokQuizWynik, plan: widokPlan,
    postepy: widokPostepy, powiadomienia: widokPowiadomienia, kalendarz: widokKalendarz, matryca: widokMatryca,
    'jak-to-dziala': widokJak, mapa: widokMapa
  });

  root.Nauka = {
    rejestruj: rejestruj, render: render, go: go, trasa: trasa, start: render, startPrzedmiot: startPrzedmiot, zacheta: zacheta, silnik: S,
    pomoc: { S: S, esc: esc, dane: () => D, zapisz: zapisz, dzis: dzis, planTeraz: planTeraz, toast: toast, go: go, render: render, fData: fData, fKrotko: fKrotko, odmiana: odmiana, startTest: startTest }
  };
})(window);

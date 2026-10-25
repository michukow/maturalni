/*
 * app/kompas-ai.js: AI w Kompasie. Logika i prompty na serwerze: functions/api/ai/kompas.js
 *
 * 1. Po 22 pytaniach zamkniętych: AI układa 2 pytania otwarte (prompt 1), uczeń odpowiada swoimi słowami.
 * 2. AI łączy wynik algorytmu z odpowiedziami (prompt 2): opis, niuanse, rola, następny krok, kolejność planów.
 * AI proponuje, aplikacja decyduje: kolejność planów zmienia się tylko przy pewności >= 0,6
 * (ścieżka spoza planu A i B: >= 0,7). Bez AI: zapasowe pytania i wynik z algorytmu.
 */
(function (root) {
  'use strict';
  const N = root.Nauka, P = N.pomoc, esc = P.esc;
  const $ = id => document.getElementById(id);
  const app = document.getElementById('app');
  const ADRES = '/api/ai/kompas';
  const KLUCZ = 'maturalni-kompas-ai-v1';
  const PROG = { zmiana: 0.6, nowa: 0.7 };
  const proc = x => Math.round((Number(x) || 0) * 100);

  function wczytaj() { try { return JSON.parse(localStorage.getItem(KLUCZ)) || null; } catch (e) { return null; } }
  function zapisz(s) { try { localStorage.setItem(KLUCZ, JSON.stringify(s)); } catch (e) { /* bez zapisu */ } }
  function stan(klucz) { const s = wczytaj(); return s && s.klucz === klucz ? s : null; }

  async function wyslij(dane) {
    const t0 = performance.now();
    try {
      const r = await fetch(ADRES, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(dane) });
      let j;
      try { j = await r.json(); } catch (e) { j = { ok: false, blad: r.status === 404 || r.status === 405 || r.status === 501 ? 'Brak bramki AI (działa na stronie wdrożonej przez Cloudflare)' : 'Błąd ' + r.status }; }
      j.msKlient = Math.round(performance.now() - t0);
      return j;
    } catch (e) { return { ok: false, blad: 'Brak połączenia' }; }
  }

  function zapasowe(profil) {
    const [a, b] = profil.plany;
    return [
      { tresc: 'Opisz sytuację, w której coś naprawdę dobrze Ci wyszło albo dało Ci dużo satysfakcji. Co dokładnie wtedy robiłeś(-aś)?', przyklad: 'np. zorganizowałem wyjazd klasowy i pilnowałem budżetu', cel: 'konkretne doświadczenie' },
      { tresc: `Test wskazał dwie ścieżki: ${a.nazwa.toLowerCase()} i ${b.nazwa.toLowerCase()}. Co Cię w każdej z nich przyciąga, a co zniechęca?`, przyklad: 'np. liczby lubię, ale nie wyobrażam sobie pracy w banku', cel: 'rozstrzygnięcie planu A i B' }
    ];
  }

  // Czy przyjąć propozycję AI dotyczącą kolejności planów
  function przyjmij(w, profil) {
    if (!w || !Array.isArray(w.sciezki) || w.sciezki.length < 2) return false;
    if (w.wniosek === 'potwierdza') return false;
    const alg = profil.plany.map(p => p.id);
    const nowa = w.sciezki.some(s => alg.indexOf(s.id) === -1);
    return w.pewnosc >= (nowa ? PROG.nowa : PROG.zmiana);
  }

  // ───────────── ekran: 2 pytania otwarte ─────────────
  function widok() {
    const profil = N.kompasProfil ? N.kompasProfil() : null;
    if (!profil) { N.go('kompas'); return; }
    let s = stan(profil.klucz);
    if (!s) { s = { klucz: profil.klucz, pytania: null, zrodlo: null, odpowiedzi: ['', ''] }; zapisz(s); }
    if (!s.pytania) {
      app.innerHTML = `<span class="eyebrow">Krok 1 · Jeszcze 2 pytania</span><h1>Układam pytania specjalnie dla Ciebie</h1>
        <div class="ai-box"><div class="ai-glowa"><span class="ai-ik"></span><b>Analizujemy Twoje odpowiedzi z testu</b><span class="ai-kropki"><i></i><i></i><i></i></span></div>
        <p class="small muted">Szuka tego, czego test zamknięty nie rozstrzygnął.</p></div>`;
      wyslij({ etap: 'pytania', profil: profil }).then(odp => {
        const x = stan(profil.klucz) || s;
        if (odp.ok) { x.pytania = odp.wynik.pytania; x.zrodlo = 'ai'; x.model = odp.model; }
        else { x.pytania = zapasowe(profil); x.zrodlo = 'zapas'; x.bladPytan = odp.blad; }
        zapisz(x);
        if (N.trasa()[0] === 'kompas-ai') N.render();
      });
      return;
    }
    app.innerHTML = `<span class="eyebrow">01 / Diagnoza · jeszcze 2 pytania</span>
      <h1>Opowiedz swoimi słowami</h1>
      <div class="mentor bez-foto"><span class="ai-ik"></span><div class="stack" style="gap:2px"><span class="mono">Twój mentor</span><b>Dwa pytania tylko dla Ciebie</b><span>Ułożone na podstawie Twoich odpowiedzi z testu.</span></div></div>
      <p class="lead">Test zamknięty nie wszystko wyłapie. Odpowiedz w 1-3 zdaniach: co robisz, co lubisz, co Cię zniechęca. Możesz pominąć.</p>
      ${s.pytania.map((p, i) => `<div class="card otwarte"><label for="o${i}"><span class="eyebrow">Pytanie ${i + 1} z 2</span><b class="q">${esc(p.tresc)}</b></label>
        <textarea id="o${i}" rows="4" maxlength="800" placeholder="${esc(p.przyklad ? (p.przyklad.indexOf('np.') === 0 ? p.przyklad : 'np. ' + p.przyklad) : 'Napisz kilka zdań…')}">${esc(s.odpowiedzi[i] || '')}</textarea>
        <span class="tiny muted licznik" id="l${i}"></span></div>`).join('')}
      ${N.duo('dalejK', 'Pokaż mój wynik', 'pominK', 'Pomiń, pokaż wynik z testu')}
      <button class="btn link" id="odNowaK" style="align-self:center">↺ Zacznij test od nowa</button>`;
    [0, 1].forEach(i => {
      const t = $('o' + i), l = $('l' + i);
      const upd = () => { l.textContent = t.value.length ? t.value.length + '/800' : ''; const x = stan(profil.klucz); if (x) { x.odpowiedzi[i] = t.value; zapisz(x); } };
      t.oninput = upd; upd();
    });
    $('odNowaK').onclick = () => N.kompasOdNowa && N.kompasOdNowa();
    $('pominK').onclick = () => { const x = stan(profil.klucz); if (x) { x.pominiete = true; x.wynik = null; zapisz(x); } N.go('kompas-wynik'); };
    $('dalejK').onclick = () => {
      const x = stan(profil.klucz);
      const odp = [0, 1].map(i => $('o' + i).value.trim());
      if (!odp.some(v => v.length >= 3)) { P.toast('Napisz choć kilka słów albo kliknij „Pomiń”.'); return; }
      x.odpowiedzi = odp; x.pominiete = false; zapisz(x);
      app.innerHTML = `<span class="eyebrow">Krok 1 · Twój wynik</span><h1>Łączę test z Twoimi odpowiedziami</h1>
        <div class="ai-box"><div class="ai-glowa"><span class="ai-ik"></span><b>AI pogłębia wynik testu</b><span class="ai-kropki"><i></i><i></i><i></i></span></div></div>`;
      wyslij({
        etap: 'wynik', profil: profil, sciezkiDostepne: N.kompasSciezki(),
        pytaniaOtwarte: x.pytania.map((p, i) => ({ pytanie: p.tresc, odpowiedz: odp[i] }))
      }).then(r => {
        const y = stan(profil.klucz) || x;
        if (r.ok) { y.wynik = r.wynik; y.model = r.model; y.przyjete = przyjmij(r.wynik, profil); y.alg = profil.plany.map(p => p.id); y.bladWyniku = null; }
        else { y.wynik = null; y.bladWyniku = r.blad; P.toast('AI teraz niedostępna. Pokazujemy wynik z testu.'); }
        zapisz(y);
        N.go('kompas-wynik');
      });
    };
  }

  // ───────────── na ekranie wyniku Kompasu ─────────────
  function wynik(klucz) {
    const s = stan(klucz);
    if (!s || !s.wynik) return null;
    return Object.assign({}, s.wynik, { przyjete: !!s.przyjete, pytania: s.pytania, odpowiedzi: s.odpowiedzi, alg: s.alg, model: s.model });
  }
  function kartaHtml(ai, nazwa) {
    const zmiana = ai.przyjete;
    return `<section class="ai-box ai-kompas">
      <div class="ai-glowa"><span class="ai-ik"></span><b>Wynik pogłębiony przez AI</b></div>
      ${ai.podsumowanie ? `<p>${esc(ai.podsumowanie)}</p>` : ''}
      ${ai.niuanse && ai.niuanse.length ? `<div class="stack" style="gap:4px"><b class="small">Czego nie pokazał sam test:</b><ul class="small" style="margin:0;padding-left:18px">${ai.niuanse.map(n => `<li>${esc(n)}</li>`).join('')}</ul></div>` : ''}
      ${zmiana ? `<p class="small">Na podstawie Twoich odpowiedzi ${ai.wniosek === 'nowa_sciezka' ? 'AI dodała ścieżkę, której nie wskazał test' : 'AI zamieniła kolejność planów'}. Sam test wskazał: A ${esc(nazwa(ai.alg[0]))}, B ${esc(nazwa(ai.alg[1]))}.</p>`
        : ''}
      ${ai.nastepny_krok ? `<div class="ai-rada">W tym tygodniu: ${esc(ai.nastepny_krok)}</div>` : ''}
      <details class="ai-dopisz"><summary>Twoje odpowiedzi</summary>${(ai.pytania || []).map((p, i) => `<p class="small"><b>${esc(p.tresc)}</b><br>${esc((ai.odpowiedzi || [])[i] || '(bez odpowiedzi)')}</p>`).join('')}
        <a class="small" href="#/kompas-ai">Zmień odpowiedzi</a></details>
    </section>`;
  }
  function zachetaHtml(klucz) {
    const s = stan(klucz);
    const blad = s && s.bladWyniku;
    return `<div class="ai-box"><div class="ai-glowa"><span class="ai-ik"></span><b>${blad ? 'AI była niedostępna' : 'Pogłęb wynik: 2 pytania swoimi słowami'}</b></div>
      <p class="small">${blad ? 'Pokazujemy wynik z testu. Możesz spróbować jeszcze raz.' : 'AI zada 2 pytania o to, czego test nie rozstrzygnął, i dopasuje wynik do Ciebie. Ok. 2 minuty.'}</p>
      <a class="btn-small alt" href="#/kompas-ai" style="align-self:flex-start">${blad ? 'Spróbuj jeszcze raz' : 'Odpowiedz na 2 pytania'}</a></div>`;
  }
  // Dla karty planu: dlaczego ta ścieżka (od AI) i rola wskazana przez AI
  function dlaPlanu(ai, id, i) {
    if (!ai) return null;
    const s = (ai.sciezki || []).find(x => x.id === id);
    return { dlaczego: s ? s.dlaczego : '', rola: i === 0 && ai.sciezki[0] && ai.sciezki[0].id === id ? ai.rola : null };
  }

  N.rejestruj({ 'kompas-ai': widok }, ['kompas-ai']);
  root.KompasAI = { wynik: wynik, kartaHtml: kartaHtml, zachetaHtml: zachetaHtml, dlaPlanu: dlaPlanu, przyjmij: przyjmij, wyslij: wyslij, PROG: PROG };
})(window);

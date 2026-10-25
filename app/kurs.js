/*
 * app/kurs.js: platforma kursowa w aplikacji.
 * - Materiały: działy > mikrokompetencje > krótkie części (wideo, notatka, trening, zadania z arkusza)
 * - Odtwarzacz części (wspólny dla ekranu Materiały i lekcji dnia)
 * - Import materiałów z API Maturalnych (przez /api/maturalni/...) albo z wklejonego JSON-a,
 *   z automatycznym przypisaniem lekcji do mikrokompetencji
 */
(function (root) {
  'use strict';
  const M = root.Mikro, N = root.Nauka, P = N.pomoc;
  const S = P.S, esc = P.esc, $ = id => document.getElementById(id);
  const KLUCZ_CZ = 'maturalni-czesci-v1';
  const IK = { wideo: P.ik('wideo'), tekst: P.ik('tekst'), trening: P.ik('trening'), arkusz: P.ik('arkusz') };
  const TYP = { wideo: 'wideo', tekst: 'notatka', trening: 'trening', arkusz: 'zadania z arkusza' };
  const POZIOM = ['', 'łatwe', 'średnie', 'trudne'];
  const czas = s => M.czasWideo ? M.czasWideo(Math.max(0, Math.round(s))) : Math.round(s / 60) + ' min';

  // ───────────── postęp części ─────────────
  let postep = {};
  try { postep = JSON.parse(localStorage.getItem(KLUCZ_CZ)) || {}; } catch (e) { postep = {}; }
  const zapiszPostep = () => { try { localStorage.setItem(KLUCZ_CZ, JSON.stringify(postep)); } catch (e) { } };
  const zrobione = id => !!postep[id];
  function oznacz(id, tak) { if (tak) postep[id] = P.dzis(); else delete postep[id]; zapiszPostep(); }
  const czesciKomp = komp => M.MATERIALY[komp] || [];

  // ───────────── odtwarzacz ─────────────
  let timer = null;
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  window.addEventListener('hashchange', stop);

  function punktyTablicy(komp) {
    const bloki = ((czesciKomp(komp).find(c => c.typ === 'tekst') || {}).notatka) || [];
    const L = [];
    bloki.forEach(b => {
      if (b.t === 'wzor') L.push(b.x);
      else if (b.t === 'przyklad') b.x.forEach(x => L.push(x));
      else if (b.t === 'lista') b.x.forEach(x => L.push(x));
      else if (b.t === 'tabela') b.x.wiersze.forEach(w => L.push(b.x.naglowki.map((h, i) => h + ' ' + w[i]).join('   ')));
      else if (b.t === 'p') L.push(b.x.length > 110 ? b.x.slice(0, 107) + '…' : b.x);
    });
    return L.length ? L : [S.kompetencja(komp).nazwa];
  }
  function lekcjaKursu(c) {
    if (!c.wideo || !M.KURS_DEMO) return null;
    for (const r of M.KURS_DEMO.chapters) for (const l of r.lessons) if (l.id === c.wideo.lekcjaId) return l;
    return null;
  }
  // Stan katalogu produktów (app/produkty-api.js): na żywo z API, z pamięci albo zapis
  function statusKatalogu() {
    const i = M.produktyInfo || {};
    const kiedy = i.czas ? new Date(i.czas).toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
    const czesc = i.wszystkichWApi && i.liczba < i.wszystkichWApi ? ` z ${i.wszystkichWApi}` : '';
    const n = i.wszystkichWApi && i.liczba < i.wszystkichWApi ? i.wszystkichWApi : i.liczba;
    const pr = n === 1 ? 'produkt' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 'produkty' : 'produktów';
    if (i.stan === 'na-zywo') return { kl: 'green', ico: '●', t: `Katalog Maturalnych na żywo z API: ${i.liczba}${czesc} ${pr}, ${kiedy}` };
    if (i.stan === 'pamiec') return { kl: 'green', ico: '●', t: `Katalog Maturalnych z API, pobrany ${kiedy}: ${i.liczba}${czesc} ${pr}` };
    return { kl: '', ico: '○', t: `Katalog Maturalnych: zapis z API z ${kiedy}${i.blad ? ' (API teraz nie odpowiada)' : ''}` };
  }
  function zrodloHtml(c, tekstLinku) {
    if (!c.produkt) return '';
    const okl = c.okladka ? `<img class="okl" src="${esc(c.okladka)}" alt="" onerror="this.outerHTML='<span class=&quot;okl&quot;></span>'">` : `<span class="okl">${IK[c.typ] || ''}</span>`;
    const st = statusKatalogu();
    const znaczki = c.produktId ? (c.niedostepny ? '<span class="badge red">brak w katalogu Maturalnych</span>'
      : `<span class="badge ${st.kl}" title="${esc(st.t)}">${st.ico} z API Maturalnych</span>${c.premium ? `<span class="badge yellow" title="Wymagany poziom Premium: ${esc(c.premium)}">w Premium</span>` : ''}${c.cena ? `<span class="badge">${esc(M.cenaZl(c.cena))}</span>` : ''}`) : '';
    return `<div class="zrodlo">${okl}<div class="stack" style="gap:4px"><span class="tiny muted">Materiał Maturalnych</span><b>${esc(c.produkt)}</b><span class="small">${esc(c.fragment || '')}</span>
      ${znaczki ? `<div class="row" style="gap:6px">${znaczki}</div>` : ''}
      ${c.url ? `<a class="small" href="${esc(c.url)}" target="_blank" rel="noopener">${tekstLinku || 'Otwórz oryginał w nowej karcie (zapas)'} ↗</a>` : ''}</div></div>`;
  }
  function notatkaHtml(bloki) {
    return `<div class="notatka">${bloki.map(b => {
      if (b.t === 'p') return `<p>${esc(b.x)}</p>`;
      if (b.t === 'wzor') return `<div class="wz">${esc(b.x)}</div>`;
      if (b.t === 'lista') return `<ul>${b.x.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
      if (b.t === 'przyklad') return `<div class="prz"><b>Przykład</b><ol>${b.x.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>`;
      if (b.t === 'uwaga') return `<div class="uw"><b>Uważaj:</b> ${esc(b.x)}</div>`;
      if (b.t === 'tabela') return `<table><thead><tr>${b.x.naglowki.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.x.wiersze.map(w => `<tr>${w.map(x => `<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      return '';
    }).join('')}</div>`;
  }

  function cialoHtml(c, komp) {
    if (c.typ === 'wideo') {
      const w = c.wideo || {};
      if (w.vimeo) {
        return `<div class="wideo-box"><iframe src="https://player.vimeo.com/video/${esc(w.vimeo)}?title=0&byline=0#t=${Math.round(w.od || 0)}s" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="${esc(c.nazwa)}"></iframe></div>
          <p class="small muted">Fragment ${czas(w.od || 0)}-${czas(w.do || 0)} lekcji „${esc(w.lekcja || c.nazwa)}”.</p>`;
      }
      if (c.zaimportowane && c.url) {
        return `<div class="callout blue"><span class="ico">▶</span><div class="stack" style="gap:6px"><b class="t">${esc(c.nazwa)}</b><span>Lekcja z platformy Maturalnych. Ten odtwarzacz nie pozwala na osadzenie, więc otwiera się w nowej karcie.</span><a class="btn-small" href="${esc(c.url)}" target="_blank" rel="noopener">Otwórz lekcję wideo ↗</a></div></div>`;
      }
      const l = lekcjaKursu(c), dl = w.dlugosc || (w.do - w.od) || 600;
      const seg = l ? l.fragmenty.map(f => `<span class="seg ${f.od === w.od ? 'ten' : ''}" style="left:${f.od / dl * 100}%;width:${(f.do - f.od) / dl * 100}%" title="${esc(S.kompetencja(f.komp).nazwa)}"></span>`).join('') : `<span class="seg ten" style="left:${w.od / dl * 100}%;width:${(w.do - w.od) / dl * 100}%"></span>`;
      return `<div class="wideo-box" id="wb"><div class="plakat"><div class="gora"><span>Maturalni · ${esc(c.produkt || 'Kurs')}</span><b>${czas(w.od)}-${czas(w.do)}</b></div>
          <div class="tyt">${esc(c.nazwa)}</div><div class="tablica" id="tab">${esc(punktyTablicy(komp)[0])}</div></div>
          <button class="play" id="play" aria-label="Odtwórz">▶</button></div>
        <div class="sterowanie"><button id="pp" aria-label="Odtwórz lub wstrzymaj">▶</button><span class="czas" id="cz">${czas(w.od)} / ${czas(w.do)}</span><div class="pasek" id="pas"><i></i></div><span class="badge">podgląd ×10</span></div>
        <div class="os-lekcji"><div class="tor">${seg}</div>
          <span class="opis">Ten fragment to ${Math.round((w.do - w.od) / 60)} min z ${Math.round(dl / 60)}-minutowej lekcji „${esc(w.lekcja || '')}”. Uczysz się tylko tego, czego potrzebujesz.</span></div>
        ${c.przyklad ? '<p class="tiny muted">Podgląd demo: w wersji produkcyjnej odtwarza się tu fragment lekcji z serwera wideo Maturalnych (Vimeo) od wskazanej sekundy. Po imporcie lekcji z API pojawi się prawdziwy odtwarzacz.</p>' : ''}`;
    }
    if (c.typ === 'tekst') {
      const osadzone = c.osadz && c.url && !c.niedostepny ? `<div class="stack"><button class="btn-small alt" id="pokaz">Otwórz ${c.zaimportowane ? 'materiał' : 'Bank schematów'} tutaj</button><div id="ramka"></div></div>` : '';
      return `${c.notatka ? notatkaHtml(c.notatka) : ''}${zrodloHtml(c)}${osadzone}
        ${c.przyklad ? '<p class="tiny muted">Notatka powyżej to skrót aplikacji (z wymagań CKE i banku pytań). Pełny schemat jest w Banku schematów Maturalnych.</p>' : ''}`;
    }
    if (c.typ === 'trening') return '<div id="tr"></div>';
    if (c.typ === 'arkusz') {
      return `${zrodloHtml(c, 'Otwórz arkusz w nowej karcie')}
        <div class="callout"><span class="ico"></span><span>Rozwiąż zadania na kartce, potem sprawdź odpowiedzi w kluczu na końcu arkusza. Zaznacz „Zrobione”, gdy skończysz.</span></div>
        ${c.url && !c.niedostepny ? '<div class="stack"><button class="btn-small" id="pokaz">Otwórz arkusz tutaj</button><div id="ramka"></div></div>' : ''}`;
    }
    return '';
  }

  function podepnijCialo(box, c, komp, poKoncu) {
    stop();
    if (c.typ === 'wideo' && $('play')) {
      const w = c.wideo, dl = w.do - w.od, pkt = punktyTablicy(komp);
      let t = 0;
      const rysuj = () => {
        $('cz').textContent = czas(w.od + t) + ' / ' + czas(w.do);
        $('pas').firstElementChild.style.width = (t / dl * 100) + '%';
        $('tab').textContent = pkt[Math.min(pkt.length - 1, Math.floor(t / dl * pkt.length))];
      };
      const graj = () => {
        if (timer) { stop(); $('pp').textContent = '▶'; $('play').hidden = false; return; }
        $('play').hidden = true; $('pp').textContent = '❚❚';
        timer = setInterval(() => {
          t = Math.min(dl, t + 10); rysuj();
          if (t >= dl) { stop(); $('pp').textContent = '↺'; poKoncu && poKoncu('Fragment obejrzany ✓'); t = 0; }
        }, 1000);
      };
      $('play').onclick = graj; $('pp').onclick = graj;
      $('pas').onclick = e => { const r = e.currentTarget.getBoundingClientRect(); t = Math.round((e.clientX - r.left) / r.width * dl); rysuj(); };
    }
    if ($('pokaz')) $('pokaz').onclick = () => {
      $('ramka').innerHTML = `<iframe class="ramka-arkusz" src="${esc(c.url)}" title="${esc(c.produkt || c.nazwa)}" loading="lazy"></iframe>
        <p class="tiny muted">Jeśli podgląd jest pusty, materiał wymaga logowania na platformie Maturalnych. Użyj linku „Otwórz w nowej karcie”.</p>`;
      $('pokaz').hidden = true;
    };
    if (c.typ === 'trening') trening($('tr'), c.pytania || [], poKoncu);
  }

  function trening(el, ids, poKoncu) {
    let i = 0, ok = 0;
    el.className = 'stack';
    const rysuj = () => {
      if (i >= ids.length) {
        el.innerHTML = `<div class="kom ${ok === ids.length ? 'ok' : 'nw'}"><b class="t">Wynik: ${ok}/${ids.length}</b><span>${ok === ids.length ? 'Świetnie! Możesz iść dalej.' : 'Wróć do notatki i wideo, a potem spróbuj jeszcze raz.'}</span></div>
          <button class="btn-small alt" id="trJeszcze">Jeszcze raz</button>`;
        $('trJeszcze').onclick = () => { i = 0; ok = 0; rysuj(); };
        if (ok === ids.length) poKoncu && poKoncu('Trening zaliczony ✓');
        return;
      }
      const q = S.pytanie(ids[i]);
      const kol = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
      el.innerHTML = `<span class="eyebrow">Pytanie ${i + 1} z ${ids.length}</span><b style="font-size:1.08rem">${esc(q.tresc)}</b>
        <div class="odpowiedzi">${kol.map((k, n) => `<button class="odp" data-i="${k}"><span class="lit">${'ABCD'[n]}</span>${esc(q.odp[k])}</button>`).join('')}</div><div id="trWp"></div>`;
      el.querySelectorAll('.odp').forEach(b => b.onclick = () => {
        const k = +b.dataset.i;
        if (k === 0) ok++;
        el.querySelectorAll('.odp').forEach(x => { x.disabled = true; const j = +x.dataset.i; x.classList.add(j === 0 ? 'dobra' : j === k ? 'zla' : 'wygaszona'); });
        const tag = q.bledy && q.bledy[k], opis = tag ? tag.replace(/^PRE:\S+\s*/, '') : '';
        $('trWp').innerHTML = (k === 0 ? '<div class="kom ok"><b class="t">Dobrze! ✓</b></div>' : `<div class="kom nie"><b class="t">Prawie.</b><span>Poprawnie: <b>${esc(q.odp[0])}</b>.${opis ? ' Uważaj: ' + esc(opis) + '.' : ''}</span></div>`) +
          `<button class="btn-small" id="trDalej" style="margin-top:10px">${i + 1 < ids.length ? 'Następne pytanie' : 'Zobacz wynik'}</button>`;
        $('trDalej').onclick = () => { i++; rysuj(); };
      });
    };
    rysuj();
  }

  // Panel: odtwarzacz + lista części. Wspólny dla Materiałów i lekcji dnia.
  function panel(el, o) {
    const czesci = o.czesci;
    let a = Math.min(Math.max(0, o.aktywna || 0), czesci.length - 1);
    const rysuj = () => {
      stop();
      const c = czesci[a];
      if (!c) { el.innerHTML = '<p class="muted">Brak materiałów do tego tematu.</p>'; return; }
      const zr = zrobione(c.id);
      el.innerHTML = `<div class="stack" style="gap:16px">
        <div class="odtw"><div class="glowa"><div class="stack" style="gap:2px"><span class="eyebrow">${IK[c.typ]} ${TYP[c.typ]} · część ${a + 1} z ${czesci.length} · ${c.minutySesji || c.minuty} min${c.kontynuacja ? ' · dokończ' : ''}</span><b style="font-size:1.1rem">${esc(c.nazwa)}</b></div>
          ${c.zaimportowane ? '<span class="badge green">z API Maturalnych</span>' : c.produktId && !c.niedostepny ? '<span class="badge green">materiał Maturalnych</span>' : c.typ === 'wideo' && c.przyklad ? '<span class="badge">wideo demo</span>' : ''}</div>
          <div class="cialo" id="cialo">${cialoHtml(c, c.kompZrodlo || o.komp)}</div>
          <div class="stopka-odtw"><button class="btn-small ${zr ? 'alt' : ''}" id="zr">${zr ? '✓ Zrobione (cofnij)' : 'Oznacz jako zrobione ✓'}</button>
            <div class="row"><button class="btn-ghost" id="wst" ${a === 0 ? 'disabled' : ''}>← Poprzednia</button><button class="btn-ghost" id="nast" ${a >= czesci.length - 1 ? 'disabled' : ''}>Następna →</button></div></div></div>
        <div class="stack" style="gap:8px"><b>${esc(o.tytulListy || 'Części tematu')}</b><div class="lista-czesci">${czesci.map((x, i) => `<button class="lc ${x.typ} ${zrobione(x.id) ? 'zrobione' : ''}" data-i="${i}" aria-current="${i === a}">
          <span class="ik">${zrobione(x.id) ? '✓' : IK[x.typ]}</span><span><span class="n">${esc(x.nazwa)}</span><br><span class="s">${TYP[x.typ]}${x.produkt ? ' · ' + esc(x.produkt) : ''}${x.kontynuacja ? ' · dokończ' : ''}</span></span><span class="mn">${x.minutySesji || x.minuty} min</span></button>`).join('')}</div></div></div>`;
      podepnijCialo(el, c, c.kompZrodlo || o.komp, msg => { if (!zrobione(c.id)) { oznacz(c.id, true); P.toast(msg); odswiezListe(); o.poZmianie && o.poZmianie(); } });
      $('zr').onclick = () => { oznacz(c.id, !zr); if (!zr && a < czesci.length - 1) a++; rysuj(); o.poZmianie && o.poZmianie(); };
      $('wst').onclick = () => { a--; rysuj(); el.scrollIntoView({ block: 'start', behavior: 'smooth' }); };
      $('nast').onclick = () => { a++; rysuj(); el.scrollIntoView({ block: 'start', behavior: 'smooth' }); };
      el.querySelectorAll('.lc').forEach(b => b.onclick = () => { a = +b.dataset.i; rysuj(); el.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
      if (o.naZmianeAktywnej) o.naZmianeAktywnej(a);
    };
    const odswiezListe = () => {
      el.querySelectorAll('.lc').forEach(b => { const x = czesci[+b.dataset.i]; b.classList.toggle('zrobione', zrobione(x.id)); b.querySelector('.ik').innerHTML = zrobione(x.id) ? '✓' : IK[x.typ]; });
      const z = $('zr'); if (z) { z.textContent = '✓ Zrobione (cofnij)'; z.classList.add('alt'); }
    };
    rysuj();
  }

  // ═════════════ EKRAN: MATERIAŁY ═════════════
  function domyslnyTemat() {
    const D = P.dane();
    if (D) {
      const r = P.planTeraz();
      if (r.plan) {
        const s = r.plan.sesje.find(x => x.data >= P.dzis() && x.typ === 'nauka');
        if (s) return s.komp;
        if (r.plan.jednostki[0]) return r.plan.jednostki[0].komp;
      }
    }
    return 'TR-01';
  }
  function widokMaterialy(p) {
    const czesciP = String(p || '').split('/');
    const komp = S.kompetencja(czesciP[0]) ? czesciP[0] : domyslnyTemat();
    const k = S.kompetencja(komp), D = P.dane();
    const wiedza = D ? S.podsumujWiedze(D.stan) : null;
    const st = {};
    if (wiedza) wiedza.forEach(d => d.kompetencje.forEach(x => { st[x.id] = x; }));
    const r = D ? P.planTeraz() : {};
    const plan = r.plan;
    const u = plan && plan.jednostki.find(x => x.komp === komp);
    const dzisKomp = plan ? (plan.sesje.find(x => x.data === P.dzis() && x.typ === 'nauka') || {}).komp : null;
    const czesci = (u && u.materialy && u.materialy.length ? u.materialy : czesciKomp(komp));
    const wszystkie = czesciKomp(komp);
    const ile = id => { const cz = czesciKomp(id); return cz.filter(c => zrobione(c.id)).length + '/' + cz.length; };
    const info = M.importInfo;
    app.innerHTML = `
      <div class="row between"><div class="stack" style="gap:4px"><h1>Materiały</h1><p class="muted">Lekcje Maturalnych pocięte na krótkie części: osobno dla każdej z ${S.kompetencje().length} umiejętności. Wideo, notatka, trening i zadania w jednym miejscu.</p></div>
        <a class="btn-ghost" href="#/import">${info ? 'Import: ' + info.lekcji + ' lekcji' : 'Integracja z API Maturalnych'}</a></div>
      <a href="#/import" class="small" id="katalogStatus" style="margin-top:-8px">${statusKatalogu().ico} ${esc(statusKatalogu().t)}</a>
      <div class="kurs">
        <nav class="kurs-menu" aria-label="Działy i umiejętności"><input type="search" id="szukaj" placeholder="Szukaj tematu…" aria-label="Szukaj tematu">
          ${S.dzialy().map(d => {
            const ks = S.kompetencje().filter(x => x.dzial === d.id);
            return `<details ${d.id === k.dzial ? 'open' : ''}><summary>${esc(d.nazwa)}<span>${ks.length}</span></summary>${ks.map(x => `<a href="#/materialy/${x.id}" ${x.id === komp ? 'aria-current="page"' : ''} data-n="${esc(x.nazwa.toLowerCase())}">
              <i class="kr ${st[x.id] ? st[x.id].status + (st[x.id].pewny ? '' : ' szac') : ''}"></i><span>${esc(x.nazwa)}${x.id === dzisKomp ? ' <span class="dzis-tag">DZIŚ</span>' : ''}</span><small>${ile(x.id)}</small></a>`).join('')}</details>`;
          }).join('')}</nav>
        <div class="stack" style="gap:16px">
          <div class="okruszki"><a href="#/materialy">Materiały</a><span>›</span><span>${esc(S.dzial(k.dzial).nazwa)}</span><span>›</span><span>${esc(k.nazwa)}</span></div>
          <div class="stack" style="gap:8px"><h2 style="font-size:1.7rem">${esc(k.nazwa)}</h2>
            <div class="row"><span class="badge ${k.poziom === 1 ? 'green' : k.poziom === 2 ? 'yellow' : 'red'}">${POZIOM[k.poziom]}</span><span class="badge">wymaganie CKE ${esc(k.cke)}</span>
              <span class="badge blue">${wszystkie.length} części · ${wszystkie.reduce((s, c) => s + c.minuty, 0)} min</span>
              ${st[komp] ? `<span class="badge">Twój poziom: ${st[komp].opanowanie}%${st[komp].pewny ? '' : ' (szac.)'}</span>` : ''}
              ${D && D.stan.zaliczone[komp] ? '<span class="badge green">zaliczone</span>' : u ? `<span class="badge blue">w planie: ${P.fKrotko(u.start)}${u.koniec !== u.start ? ' - ' + P.fKrotko(u.koniec) : ''}</span>` : ''}</div>
            ${k.wymaga.length ? `<p class="small muted">Podstawy: ${k.wymaga.map(x => `<a href="#/materialy/${x}">${esc(S.kompetencja(x).nazwa)}</a>`).join(', ')}</p>` : ''}</div>
          ${u && u.dostosowanie ? `<div class="callout"><span class="ico"></span><div class="stack" style="gap:4px"><b class="t">Kolejność części dostosowana do Ciebie</b><span>${esc(u.dostosowanie.zmiany.join(' · '))}</span></div></div>`
            : u && czesci !== wszystkie ? `<div class="callout blue"><span class="ico"></span><span>Pokazujemy części w kolejności dopasowanej do Twojego stylu nauki${czesci.length < wszystkie.length ? ' i poziomu (utrwalenie: bez wideo)' : ''}.</span></div>` : ''}
          <div id="panel"></div>
          <div class="row">${D ? `<button class="btn-small" id="quiz">Quiz zaliczeniowy (5 min, próg 70%)</button>` : `<button class="btn-small" id="kal">Zrób kalibrację, żeby dostać plan</button>`}
            <a class="btn-ghost" href="#/matryca">Cała matryca umiejętności</a></div>
        </div>
      </div>`;
    const ai = Math.min(parseInt(czesciP[1], 10) || 0, czesci.length - 1);
    panel($('panel'), { komp: komp, czesci: czesci, aktywna: ai, tytulListy: 'Części tematu (' + czesci.length + ')',
      poZmianie: () => { const m = app.querySelector('.kurs-menu a[aria-current="page"] small'); if (m) m.textContent = ile(komp); } });
    $('szukaj').oninput = e => {
      const q = e.target.value.trim().toLowerCase();
      app.querySelectorAll('.kurs-menu a').forEach(a => { a.hidden = q && a.dataset.n.indexOf(q) === -1; });
      app.querySelectorAll('.kurs-menu details').forEach(d => { if (q) d.open = !!d.querySelector('a:not([hidden])'); });
    };
    if ($('quiz')) $('quiz').onclick = () => P.startTest('jednostka', { komp: komp }, 'quiz-wynik');
    if ($('kal')) $('kal').onclick = () => P.go('kalibracja', 1);
  }
  const app = document.getElementById('app');

  // Części na dzisiejszą sesję (dla ekranu lekcji)
  function czesciSesji(s, dost) {
    const pelne = czesciKomp(s.komp);
    const L = (s.czesci || []).map(x => {
      const c = pelne.find(y => y.id === x.id) || x;
      return Object.assign({}, c, { minutySesji: x.minuty, kontynuacja: x.kontynuacja, nazwa: x.nazwa || c.nazwa });
    });
    if (dost && dost.rozgrzewka) {
      const q = S.pytaniaDla(dost.rozgrzewka)[0];
      if (q) L.unshift({ id: s.komp + '-rozg-' + dost.rozgrzewka, typ: 'trening', nazwa: 'Rozgrzewka z podstawy: ' + dost.rozgrzewkaNazwa, minuty: 2, pytania: [q.id], kompZrodlo: dost.rozgrzewka });
    }
    return L.length ? L : pelne.slice(0, 2);
  }

  // ═════════════ IMPORT Z API MATURALNYCH ═════════════
  const PRZYKLAD_PRODUCTS = {
    items: [
      { id: '699469ba54b96332e2c6117b', title: 'Arkusz od egzaminatora CKE (matematyka)', examType: 'matura', subject: 'Math', coursePlans: [],
        learningResources: [{ id: '6994689854b96332e2c60c04', title: 'Arkusz od egzaminatora CKE (matematyka)', type: 'Url', url: 'https://online.flippingbook.com/view/890985666/', examType: 'matura', subject: 'Math', paid: true }] },
      { id: '69a6c66163651df533c164eb', title: 'Bank schematów i gotowców maturalnych', examType: 'matura', subject: 'Other', coursePlans: [],
        learningResources: [{ id: '69a6bbeacf2171a0b3c7edb4', title: 'Bank schematów i gotowców maturalnych', type: 'Url', url: 'https://online.flippingbook.com/view/999105973/', examType: 'matura', subject: 'Other', paid: true }] },
      { id: '6a6dc1036da4a4f653ec9812', title: 'Korepetycje na żywo (Biologia)', examType: 'matura', subject: 'Biology', learningResources: [],
        coursePlans: [{ id: '68b47f97a5123fd3e4203913', title: 'Turbo Korki 25 - Biologia', type: 'TurboSchool', introductionVideoUrl: 'https://vimeo.com/1221491744', totalCourseTime: '1h 25m', chapters: ['68b599f284952f36037812bc', '68c84b1f135f647da87fbaee'], numberOfChapters: 2, numberOfLessons: 26 }] }
    ],
    meta: { page: 1, perPage: 10, total: 78, totalPages: 8 }
  };
  const PRZYKLAD_LESSON_PLAN = {
    id: 'przyklad-struktury', title: 'Kurs maturalny: matematyka podstawowa (PRZYKŁAD STRUKTURY, dane zmyślone)',
    chapters: [
      { id: 'r-tryg', title: 'Trygonometria', lessons: [
        { id: 'l1', title: 'Sinus, cosinus i tangens w trójkącie prostokątnym: definicje', videoUrl: '', durationSeconds: 540 },
        { id: 'l2', title: 'Wartości funkcji trygonometrycznych kątów 30°, 45° i 60°', videoUrl: '', durationSeconds: 420 },
        { id: 'l3', title: 'Funkcje trygonometryczne kątów rozwartych', videoUrl: '', durationSeconds: 480 },
        { id: 'l4', title: 'Jedynka trygonometryczna i związki między funkcjami', videoUrl: '', durationSeconds: 450 },
        { id: 'l5', title: 'Rozwiązywanie trójkątów prostokątnych: zadania z treścią', videoUrl: '', durationSeconds: 720 },
        { id: 'l6', title: 'Twierdzenie cosinusów', videoUrl: '', durationSeconds: 600 },
        { id: 'l7', title: 'Pole trójkąta ze wzorem z sinusem', videoUrl: '', durationSeconds: 390 }] },
      { id: 'r-plan', title: 'Planimetria', lessons: [
        { id: 'l8', title: 'Twierdzenie Pitagorasa w zadaniach maturalnych', videoUrl: '', durationSeconds: 660 },
        { id: 'l9', title: 'Kąty wpisane i środkowe w okręgu', videoUrl: '', durationSeconds: 510 },
        { id: 'l10', title: 'Powtórka przed maturą: arkusz próbny', videoUrl: '', durationSeconds: 2700 }] }
    ]
  };

  function naMinuty(v) {
    if (v == null || v === '') return null;
    if (typeof v === 'number') return v > 180 ? v / 60 : v;
    const s = String(v);
    let m = /(\d+)\s*h/i.exec(s), x = /(\d+)\s*m/i.exec(s);
    if (m || x) return (m ? +m[1] * 60 : 0) + (x ? +x[1] : 0);
    const c = s.split(':').map(Number);
    if (c.length === 3) return c[0] * 60 + c[1] + c[2] / 60;
    if (c.length === 2) return c[0] + c[1] / 60;
    return isNaN(+s) ? null : naMinuty(+s);
  }
  function znajdzLekcje(json) {
    const lekcje = [], kontenery = [], tylkoId = [];
    const tyt = o => o.title || o.name || o.nazwa || o.tytul;
    const media = o => o.videoUrl || o.vimeoUrl || o.video || o.fileUrl || o.url || o.link || o.introductionVideoUrl;
    const dl = o => o.durationSeconds || o.duration || o.length || o.lessonTime || o.time || o.totalCourseTime;
    const widziane = new Set();
    (function chodz(x, kontekst, g) {
      if (x == null || g > 9) return;
      if (Array.isArray(x)) { x.forEach(e => chodz(e, kontekst, g + 1)); return; }
      if (typeof x !== 'object') return;
      const t = tyt(x);
      const maDzieci = ['chapters', 'lessons', 'items', 'learningResources', 'coursePlans', 'modules', 'sections'].some(k => Array.isArray(x[k]) && x[k].length);
      ['chapters', 'lessons'].forEach(k => { if (Array.isArray(x[k]) && x[k].length && x[k].every(e => typeof e === 'string')) tylkoId.push({ w: t || '(bez nazwy)', klucz: k, ile: x[k].length, lekcji: x.numberOfLessons || null }); });
      const czyLekcja = t && !maDzieci && (media(x) !== undefined || dl(x) !== undefined);
      if (czyLekcja) {
        const id = String(x.id || x._id || x.slug || t);
        if (!widziane.has(id)) {
          widziane.add(id);
          lekcje.push({ id: id, tytul: String(t), kontekst: kontekst.join(' > '), url: media(x) || '', minuty: naMinuty(dl(x)), typRaw: x.type || '' });
        }
      } else if (t && maDzieci) kontenery.push(t);
      const nowy = t && !czyLekcja ? kontekst.concat(String(t)) : kontekst;
      Object.keys(x).forEach(k => { if (x[k] && typeof x[k] === 'object' && ['modifiedBy', 'createdBy', 'presenters', 'categories', 'tags', 'metadata', 'meta'].indexOf(k) === -1) chodz(x[k], nowy, g + 1); });
    })(json, [], 0);
    return { lekcje: lekcje, kontenery: kontenery, tylkoId: tylkoId };
  }

  // Dopasowanie lekcji do mikrokompetencji po słowach kluczowych z nazw (z wagą rzadkości słowa).
  const STOP = new Set(['i', 'w', 'z', 'na', 'do', 'od', 'dla', 'oraz', 'jej', 'ich', 'typu', 'jak', 'po', 'przed', 'się', 'sie', 'czy', 'co', 'ze', 'lub', 'zadania', 'zadaniach', 'lekcja', 'kurs', 'cz', 'maturalnych', 'matura', 'praktycznych', 'także', 'takze']);
  const SYN = { sin: 'sinu', cos: 'cosi', tg: 'tang', tangens: 'tang' };
  const bezPl = s => s.toLowerCase().replace(/[ąćęłńóśźż]/g, c => ({ 'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z' }[c]));
  function rdzenie(tekst) {
    return Array.from(new Set(bezPl(tekst).split(/[^a-z0-9]+/).filter(w => w && !STOP.has(w) && (w.length >= 2 || /\d/.test(w)))
      .map(w => SYN[w] || (/^\d+$/.test(w) ? w : w.length >= 5 ? w.slice(0, 4) : w))));
  }
  let indeks = null;
  function zbudujIndeks() {
    const ks = S.kompetencje();
    const r = {}, df = {};
    ks.forEach(k => { r[k.id] = rdzenie(k.nazwa); r[k.id].forEach(x => { df[x] = (df[x] || 0) + 1; }); });
    const wagi = {};
    Object.keys(df).forEach(x => { wagi[x] = Math.log(1 + ks.length / df[x]); });
    const dz = {};
    S.dzialy().forEach(d => { dz[d.id] = rdzenie(d.nazwa); });
    indeks = { r: r, wagi: wagi, dz: dz };
  }
  function dopasuj(l) {
    if (!indeks) zbudujIndeks();
    const zl = new Set(rdzenie(l.tytul)), zk = new Set(rdzenie(l.kontekst || ''));
    let naj = null, wynik = 0;
    S.kompetencje().forEach(k => {
      const rz = indeks.r[k.id];
      const suma = rz.reduce((s, x) => s + indeks.wagi[x], 0) || 1;
      let traf = rz.filter(x => zl.has(x)).reduce((s, x) => s + indeks.wagi[x], 0) / suma;
      if (indeks.dz[k.dzial].some(x => zl.has(x) || zk.has(x))) traf += 0.12;
      if (traf > wynik) { wynik = traf; naj = k.id; }
    });
    return wynik >= 0.4 ? { komp: naj, pewnosc: wynik >= 0.65 ? 'wysoka' : 'niska' } : { komp: null, pewnosc: 'brak' };
  }

  let analiza = null;
  function analizuj(json, zrodlo) {
    const w = znajdzLekcje(json);
    w.lekcje.forEach(l => { const d = dopasuj(l); l.komp = d.komp; l.pewnosc = d.pewnosc; });
    analiza = Object.assign(w, { zrodlo: zrodlo });
  }
  function plikRepo(imp) {
    return '/*\n * materialy-maturalni.js: lekcje z API Maturalnych przypisane do mikrokompetencji.\n * Wygenerowano ' + imp.data + ' na ekranie "Import materiałów". Źródło: ' + imp.zrodlo + '.\n */\n' +
      '(function (root) {\n  const IMPORT_MATURALNI = ' + JSON.stringify(imp, null, 2).replace(/\n/g, '\n  ') + ';\n' +
      '  const eksport = { IMPORT_MATURALNI: IMPORT_MATURALNI };\n  if (typeof module !== \'undefined\' && module.exports) module.exports = eksport;\n' +
      '  else root.Mikro = Object.assign(root.Mikro || {}, eksport);\n})(typeof window !== \'undefined\' ? window : globalThis);\n';
  }

  function widokImport() {
    const info = M.importInfo;
    const opcjeKomp = sel => '<option value="">(nie przypisuj)</option>' + S.dzialy().map(d => `<optgroup label="${esc(d.nazwa)}">${S.kompetencje().filter(k => k.dzial === d.id).map(k => `<option value="${k.id}" ${k.id === sel ? 'selected' : ''}>${esc(k.nazwa)}</option>`).join('')}</optgroup>`).join('');
    app.innerHTML = `
      <div class="stack" style="gap:6px"><span class="eyebrow">Integracja z platformą Maturalnych</span><h1>Import materiałów</h1>
        <p class="muted">Pobieramy lekcje z API Maturalnych, przypisujemy je do mikrokompetencji i od razu pokazujemy uczniom w Materiałach i w lekcji dnia.</p></div>
      <div id="katalog"></div>
      <h2 style="margin-top:8px">Lekcje wideo (lesson-plans)</h2>
      <div class="callout ${info ? 'green' : 'blue'}"><span class="ico">${info ? '' : ''}</span><span>${info ? `Aktywny import (${esc(info.zrodlo)}, ${esc(info.data)}): ${info.lekcji} lekcji, ${info.przypisanych} przypisanych do ${info.tematow} tematów.` : 'Endpoint products nie zawiera lekcji wideo z matematyki, więc wideo w Materiałach to kurs demo (struktura jak w API). Gdy dostaniecie dostęp do lekcji (lesson-plans / chapters), zaimportujcie je tutaj: aplikacja sama przypisze je do mikrokompetencji.'}</span></div>
      <div class="grid3">
        <div class="card"><h3>1. Pobierz z API</h3><p class="small muted">Przez bramkę na serwerze Cloudflare (bez CORS, token nie trafia do przeglądarki).</p>
          <label class="pole">Ścieżka<input id="sc" value="lesson-plans/"></label><label class="pole">Parametry<input id="pa" value="perPage=100"></label>
          <button class="btn-small" id="api">Pobierz</button><span class="small" id="apiStatus" role="status"></span></div>
        <div class="card"><h3>2. Wklej JSON</h3><p class="small muted">Otwórz adres API w przeglądarce, zaznacz wszystko (Ctrl+A), skopiuj i wklej tutaj.</p>
          <textarea class="json" id="js" placeholder='{"items": [...]}'></textarea><button class="btn-small" id="anal">Analizuj</button></div>
        <div class="card"><h3>3. Przykłady</h3><p class="small muted">Sprawdź, jak działa rozpoznawanie, bez dostępu do API.</p>
          <button class="btn-small alt" id="p1">Zrzut „products” z projektu</button><button class="btn-small alt" id="p2">Przykładowa struktura lekcji</button></div>
      </div>
      <div id="wynikImportu"></div>
      <details class="more"><summary>Jak to podłączyć (dla zespołu)</summary><div class="body">
        <p>1. Bramka jest w repozytorium: <span class="kod">functions/api/maturalni/[[sciezka]].js</span>. Cloudflare wdraża ją razem ze stroną.</p>
        <p>2. Jeśli API wymaga tokenu: Cloudflare > Workers & Pages > maturalni > Settings > Variables and Secrets > Add: <span class="kod">MATURALNI_TOKEN</span> (Secret). Token dostaniecie od kontaktów technicznych Maturalnych.</p>
        <p>3. Rozdziały podane tylko jako identyfikatory wymagają drugiego zapytania o treść rozdziału (np. <span class="kod">chapters/ID</span>). Ścieżkę wpiszcie w polu „Ścieżka”.</p>
        <p>4. Po zapisaniu importu kliknij „Pobierz plik do repo” i podmień <span class="kod">silnik/materialy-maturalni.js</span>, żeby każdy uczeń widział te lekcje.</p></div></details>`;
    const rysujKatalog = () => {
      const k = $('katalog'); if (!k) return;
      const st = statusKatalogu();
      const uzycie = {};
      Object.keys(M.MATERIALY || {}).forEach(komp => M.MATERIALY[komp].forEach(c => { if (c.produktId) (uzycie[c.produktId] = uzycie[c.produktId] || {})[komp] = 1; }));
      const lista = M.produktyMatematyka ? M.produktyMatematyka() : [];
      k.innerHTML = `<div class="card"><div class="row between"><div class="stack" style="gap:4px"><h3>Katalog Maturalnych: endpoint products</h3>
          <span class="small">${st.ico} ${esc(st.t)}${(M.produktyInfo || {}).param === null && (M.produktyInfo || {}).stron > 1 && (M.produktyInfo || {}).stan === 'na-zywo' ? '. API zwraca tylko 1. stronę, ale są na niej wszystkie produkty do matematyki.' : ''}</span></div>
          <button class="btn-small alt" id="odswiez">Odśwież z API</button></div>
        <p class="small muted">Publiczny endpoint, bez tokenu. Aplikacja pobiera go przy starcie (przez bramkę Cloudflare), a gdy API nie odpowiada, używa ostatniego zapisu. Stąd biorą się tytuły, okładki, linki do materiałów, cena i poziom Premium.</p>
        <div class="produkty">${lista.map(p => {
          const r = p.learningResources[0] || {}, ile = Object.keys(uzycie[p.id] || {}).length;
          const okl = r.thumbnailUrl || p.thumbnailUrl;
          return `<div class="produkt ${ile ? 'uzyty' : ''}">${okl ? `<img src="${esc(okl)}" alt="" loading="lazy" onerror="this.outerHTML='<span class=&quot;okl&quot;></span>'">` : '<span class="okl"></span>'}
            <div class="stack" style="gap:4px"><b>${esc(p.title)}</b><span class="tiny muted">${p.examType === 'matura' ? 'Matura' : 'Egzamin ósmoklasisty'} · ${esc(M.cenaZl(p.grossPrice))}${r.minimumRequiredPremiumStatus ? ' · Premium' : ''}</span>
              ${ile ? `<span class="badge green">używany w ${ile} mikrokompetencjach</span>` : '<span class="badge">nie dotyczy matury z matematyki</span>'}
              ${r.url ? `<a class="tiny" href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.url.replace('https://', ''))} ↗</a>` : ''}</div></div>`;
        }).join('')}</div></div>`;
      $('odswiez').onclick = () => { $('odswiez').disabled = true; $('odswiez').textContent = 'Pobieram…'; M.odswiezProdukty(true).then(ok => { P.toast(ok ? 'Katalog pobrany z API Maturalnych ✓' : 'API nie odpowiada. Zostaje ostatni zapis.'); rysujKatalog(); }); };
    };
    rysujKatalog();
    const pokaz = () => {
      const w = $('wynikImportu');
      if (!analiza) { w.innerHTML = ''; return; }
      const a = analiza;
      const przyp = a.lekcje.filter(l => l.komp).length;
      w.innerHTML = `<div class="card"><div class="row between"><h3>Wynik analizy: ${esc(a.zrodlo)}</h3><span class="badge blue">${a.lekcje.length} lekcji/materiałów · ${przyp} przypisanych</span></div>
        ${a.tylkoId.length ? `<div class="callout"><span class="ico"></span><span>${a.tylkoId.map(t => `„${esc(t.w)}”: ${t.ile} ${t.klucz === 'chapters' ? 'rozdziałów' : 'lekcji'} tylko jako identyfikatory${t.lekcji ? ' (' + t.lekcji + ' lekcji w kursie)' : ''}`).join('; ')}. Treść trzeba pobrać osobnym zapytaniem (np. <span class="kod">chapters/ID</span>).</span></div>` : ''}
        ${a.lekcje.length ? `<div style="overflow-x:auto"><table class="import-tab"><thead><tr><th>Lekcja / materiał</th><th>Typ</th><th>Min</th><th>Mikrokompetencja</th><th>Dopasowanie</th></tr></thead><tbody>
          ${a.lekcje.map((l, i) => `<tr><td><b>${esc(l.tytul)}</b><br><span class="tiny muted">${esc(l.kontekst || '')}</span></td><td>${/vimeo|youtu|video/i.test(l.url) ? 'wideo' : l.url ? 'tekst' : 'wideo'}</td><td>${l.minuty ? Math.round(l.minuty) : '-'}</td>
            <td><select data-i="${i}">${opcjeKomp(l.komp)}</select></td><td><span class="badge ${l.pewnosc === 'wysoka' ? 'green' : l.pewnosc === 'niska' ? 'yellow' : ''}">${l.pewnosc === 'brak' ? 'do przypisania' : l.pewnosc}</span></td></tr>`).join('')}</tbody></table></div>
          <div class="row"><button class="btn-small" id="zapisz">Zapisz i użyj w aplikacji</button><button class="btn-small alt" id="plik">Pobierz plik do repo</button>${info ? '<button class="btn-small alt" id="czysc">Usuń import z tej przeglądarki</button>' : ''}</div>`
          : '<p class="muted">Nie znaleziono lekcji ani materiałów z linkiem lub czasem trwania.</p>'}</div>`;
      w.querySelectorAll('select[data-i]').forEach(s => s.onchange = () => { const l = a.lekcje[+s.dataset.i]; l.komp = s.value || null; l.pewnosc = s.value ? 'ręcznie' : 'brak'; });
      const imp = () => ({ data: P.dzis(), zrodlo: a.zrodlo, lekcje: a.lekcje.map(l => ({ id: l.id, tytul: l.tytul, kontekst: l.kontekst, url: l.url, minuty: l.minuty ? Math.round(l.minuty) : null, komp: l.komp || null })) });
      if ($('zapisz')) $('zapisz').onclick = () => {
        try { localStorage.setItem(M.IMPORT_KLUCZ, JSON.stringify(imp())); } catch (e) { return P.toast('Nie udało się zapisać w przeglądarce.'); }
        location.hash = '#/materialy'; location.reload();
      };
      if ($('plik')) $('plik').onclick = () => {
        const blob = new Blob([plikRepo(imp())], { type: 'text/javascript;charset=utf-8' });
        const l = document.createElement('a'); l.href = URL.createObjectURL(blob); l.download = 'materialy-maturalni.js';
        document.body.appendChild(l); l.click(); setTimeout(() => { URL.revokeObjectURL(l.href); l.remove(); }, 800);
        P.toast('Pobrano materialy-maturalni.js. Podmień nim plik w folderze silnik/ w repozytorium.');
      };
      if ($('czysc')) $('czysc').onclick = () => { try { localStorage.removeItem(M.IMPORT_KLUCZ); } catch (e) { } location.reload(); };
    };
    $('api').onclick = async () => {
      const st = $('apiStatus');
      const sc = $('sc').value.trim().replace(/^\/+/, ''), pa = $('pa').value.trim();
      st.textContent = 'Pobieram…';
      try {
        const odp = await fetch('/api/maturalni/' + sc + (pa ? '?' + pa : ''), { headers: { accept: 'application/json' } });
        const tekst = await odp.text();
        if (!odp.ok) {
          st.innerHTML = `<b style="color:var(--red-ink)">Błąd ${odp.status}.</b> ` + (odp.status === 401 || odp.status === 403 ? 'API wymaga tokenu: ustaw MATURALNI_TOKEN w Cloudflare.' : odp.status === 404 ? 'Brak takiej ścieżki albo bramka nie jest wdrożona (działa tylko na stronie z Cloudflare).' : 'Szczegóły: ' + esc(tekst.slice(0, 120)));
          return;
        }
        let json;
        try { json = JSON.parse(tekst); } catch (e) { st.innerHTML = '<b style="color:var(--red-ink)">Odpowiedź nie jest JSON-em</b> (bramka działa tylko na wdrożonej stronie).'; return; }
        st.textContent = 'Pobrano ' + Math.round(tekst.length / 1024) + ' KB.';
        analizuj(json, 'API: ' + sc); pokaz();
      } catch (e) { st.innerHTML = '<b style="color:var(--red-ink)">Brak połączenia.</b> Bramka działa na stronie wdrożonej przez Cloudflare.'; }
    };
    $('anal').onclick = () => {
      try { analizuj(JSON.parse($('js').value), 'wklejony JSON'); pokaz(); }
      catch (e) { P.toast('To nie jest poprawny JSON. Skopiuj całą odpowiedź API.'); }
    };
    $('p1').onclick = () => { analizuj(PRZYKLAD_PRODUCTS, 'zrzut products (projekt)'); pokaz(); };
    $('p2').onclick = () => { analizuj(PRZYKLAD_LESSON_PLAN, 'przykładowa struktura lekcji'); pokaz(); };
    pokaz();
  }

  N.rejestruj({ materialy: widokMaterialy, import: widokImport });
  // gdy katalog dojdzie z API: odśwież znaczek stanu (bez przerysowania lekcji)
  root.addEventListener('maturalni-produkty', () => {
    const b = $('katalogStatus'); if (b) { const st = statusKatalogu(); b.textContent = st.ico + ' ' + st.t; }
  });
  root.Kurs = { panel: panel, czesciSesji: czesciSesji, czesciKomp: czesciKomp, zrobione: zrobione, oznacz: oznacz, stop: stop, IK: IK, TYP: TYP, _test: { znajdzLekcje: znajdzLekcje, dopasuj: dopasuj, naMinuty: naMinuty } };
})(window);

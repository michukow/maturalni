/*
 * sprawdz.js: test silnika na scenariuszu demo (bez przeglądarki)
 * Uruchomienie w terminalu, w folderze silnik:   node sprawdz.js
 *
 * Persona z tablicy: cel 80%+, uczy się codziennie po 15 minut,
 * słaba z trygonometrii, studniówka w styczniu.
 */
const fs = require('fs');
const { utworzSilnik, wielkanoc } = require('./silnik');

// powtarzalne losowanie, żeby wynik testu był zawsze taki sam
function rng(ziarno) { let s = ziarno; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
const los = rng(42), losUcznia = rng(7);
const silnik = utworzSilnik(null, { losowa: los });
const linia = t => console.log('\n' + '='.repeat(70) + '\n' + t + '\n' + '='.repeat(70));

// 0. Kontrola danych
linia('0. KONTROLA DANYCH');
const kontrola = silnik.walidujDane();
console.log('Kompetencji:', kontrola.kompetencji, '| pytań:', kontrola.pytan, '| błędy:', kontrola.bledy.length);
kontrola.bledy.forEach(b => console.log('  BŁĄD:', b));
kontrola.ostrzezenia.forEach(o => console.log('  uwaga:', o));
console.log('Wielkanoc 2027:', wielkanoc(2027));
if (!kontrola.ok) process.exit(1);

// 1. Ankieta
const DZIS = '2026-10-25';
const ankieta = { cel: 80, ocena: 4, samoocena: { VII: 'slabo', V: 'srednio' } };
const stan = silnik.nowyStan(ankieta, DZIS);

// "Prawdziwa" wiedza symulowanego ucznia: słaby z trygonometrii i Pitagorasa
const prawda = id => {
  if (id.startsWith('TR')) return 0.15;
  if (id === 'PL-01') return 0.3;
  if (id.startsWith('PL') || id.startsWith('ST')) return 0.5;
  const k = silnik.kompetencja(id);
  return { 1: 0.92, 2: 0.75, 3: 0.45 }[k.poziom];
};
// uczeń, który się myli, wybiera odpowiedź pasującą do swojej słabości (tag PRE), jeśli taka jest
const { PYTANIA } = require('./pytania');
const PYT = Object.fromEntries(PYTANIA.map(q => [q.id, q]));
function odpowiedzUcznia(q) {
  if (losUcznia() < prawda(q.komp)) return 0;
  const bl = PYT[q.id].bledy || {};
  const pre = Object.keys(bl).find(i => bl[i].startsWith('PRE:') && prawda(bl[i].slice(4).split(' ')[0]) < 0.5);
  return pre ? Number(pre) : (Object.keys(bl)[0] ? Number(Object.keys(bl)[0]) : 1);
}

// 2. Diagnoza całościowa (adaptacyjna)
linia('1. DIAGNOZA CAŁOŚCIOWA (adaptacyjna)');
const test = silnik.utworzTest(stan, 'diagnoza', {}, DZIS);
let q;
while ((q = silnik.nastepnePytanie(stan, test))) {
  const r = silnik.odpowiedz(stan, test, q.id, odpowiedzUcznia(q), DZIS);
  console.log(String(q.numer).padStart(2) + '. [' + q.komp + '] ' + q.kompNazwa.padEnd(52).slice(0, 52) + (r.poprawna ? ' OK' : ' ŹLE' + (r.przyczyna ? ' -> ' + r.przyczyna : '')));
}
const wynikDiagnozy = silnik.zakonczTest(stan, test, DZIS);
console.log('\nWynik testu:', wynikDiagnozy.poprawne + '/' + wynikDiagnozy.wszystkie);
console.log(wynikDiagnozy.komunikat);
console.log('\nPoziom w działach:');
wynikDiagnozy.wiedza.forEach(d => console.log('  ' + d.nazwa.padEnd(34) + String(d.poziom).padStart(3) + '%   luki: ' + d.kompetencje.filter(k => k.status === 'luka').map(k => k.id).join(', ')));

// 3. Plan
linia('2. PLAN NAUKI');
const org = {
  dataMatury: '2027-05-06', // PRZYKŁAD: wpisać datę z harmonogramu CKE
  minutDziennie: 15, dniTygodnia: [0, 1, 2, 3, 4, 5, 6], godzina: '18:00',
  blokady: [{ od: '2027-01-23', do: '2027-01-24', nazwa: 'Studniówka' }]
};
let plan = silnik.zaplanuj(stan, org, DZIS);
const planStartowy = plan;
console.log(plan.podsumowanie);
console.log('\nPierwsze 8 tematów:');
plan.jednostki.slice(0, 8).forEach((u, i) => console.log('  ' + (i + 1) + '. ' + u.komp + ' ' + u.nazwa.padEnd(44).slice(0, 44) + (u.typ === 'sprawdzenie' ? ' quiz 5' : String(u.minuty).padStart(3) + ' min') + '  ' + u.start + ' > ' + u.koniec + '  | ' + u.powod));
console.log('\nPierwsze 2 tygodnie:');
silnik.grupujTygodnie(plan).slice(0, 2).forEach(t => {
  console.log('  Tydzień od ' + t.tydzienOd + ' (' + t.minut + ' min)');
  t.sesje.forEach(s => console.log('    ' + s.data + ' ' + (s.start || '     ') + ' ' + String(s.minuty).padStart(2) + ' min  ' + s.typ.padEnd(9) + s.tytul));
});
console.log('\nTerminy diagnoz pełnych:', plan.terminyDiagnoz.join(', '));
console.log('Blokady w planie: studniówka 2027-01-23 ma sesje?', plan.sesje.some(s => s.data === '2027-01-23'));
console.log('Wigilia 2026-12-24 ma sesje?', plan.sesje.some(s => s.data === '2026-12-24'));

// 4. Uczeń robi pierwszy temat, ale dwa razy oblewa quiz
linia('3. QUIZ ZALICZENIOWY: 2 porażki = cofnięcie do podstaw');
const pierwszy = plan.jednostki.find(u => u.komp.startsWith('TR')) || plan.jednostki[0];
plan.sesje.filter(s => s.typ === 'nauka' && s.komp === pierwszy.komp).forEach(s => silnik.oznaczSesje(stan, s, true, s.data));
for (let proba = 1; proba <= 2; proba++) {
  const quiz = silnik.utworzTest(stan, 'jednostka', { komp: pierwszy.komp }, pierwszy.koniec);
  let p;
  while ((p = silnik.nastepnePytanie(stan, quiz))) silnik.odpowiedz(stan, quiz, p.id, 1, pierwszy.koniec);
  const w = silnik.zakonczTest(stan, quiz, pierwszy.koniec);
  console.log('Próba ' + proba + ' (' + pierwszy.komp + '): ' + w.procent + '% -> ' + w.komunikat);
}
console.log('Do analizy AI:', JSON.stringify(stan.doAnalizyAI[0], null, 1).slice(0, 400) + '...');

// 5. Przeplanowanie (A7)
linia('4. PRZEPLANOWANIE od ' + pierwszy.koniec + ' (+ choroba)');
org.blokady.push({ od: '2026-11-10', do: '2026-11-14', nazwa: 'Choroba' });
plan = silnik.przeplanuj(stan, org, pierwszy.koniec);
console.log('Pierwsze 5 tematów po zmianie:');
plan.jednostki.slice(0, 5).forEach((u, i) => console.log('  ' + (i + 1) + '. ' + u.komp + ' ' + u.nazwa.padEnd(44).slice(0, 44) + ' ' + u.start + ' | ' + u.powod));
console.log('Choroba 2026-11-12 ma sesje?', plan.sesje.some(s => s.data === '2026-11-12'));

// 6. Uczeń zalicza temat, potem powtórka po 2 dniach z błędem
linia('5. ZALICZENIE + POWTÓRKA 5 MIN');
const temat = plan.jednostki[0];
const quiz2 = silnik.utworzTest(stan, 'jednostka', { komp: temat.komp }, temat.koniec);
let p2;
while ((p2 = silnik.nastepnePytanie(stan, quiz2))) silnik.odpowiedz(stan, quiz2, p2.id, 0, temat.koniec);
console.log(silnik.zakonczTest(stan, quiz2, temat.koniec).komunikat);
const dzienPowtorki = require('./silnik').dodajDni(temat.koniec, 2);
const powt = silnik.utworzTest(stan, 'powtorka', {}, dzienPowtorki);
console.log('Powtórka ' + dzienPowtorki + ', pytań: ' + powt.lista.length + ', tematy: ' + powt.komps.join(', '));
let p3;
while ((p3 = silnik.nastepnePytanie(stan, powt))) silnik.odpowiedz(stan, powt, p3.id, 1, dzienPowtorki);
console.log(silnik.zakonczTest(stan, powt, dzienPowtorki).komunikat);

// 7. Kalendarz
linia('6. KALENDARZ');
const ics = silnik.doIcs(planStartowy);
fs.writeFileSync(require('path').join(require('os').tmpdir(), 'plan-demo.ics'), ics);
console.log('Zapisano plan-demo.ics (plan startowy), wydarzeń:', (ics.match(/BEGIN:VEVENT/g) || []).length);
const pierwszaNauka = planStartowy.sesje.find(s => s.typ === 'nauka');
console.log('Link Google (1. sesja):', silnik.linkGoogle(pierwszaNauka).slice(0, 160) + '...');

// 8. Szybka ścieżka: tylko trygonometria
linia('7. SZYBKA ŚCIEŻKA: "chcę poprawić tylko trygonometrię"');
const stan2 = silnik.nowyStan({ cel: 70, dzialyPriorytetowe: ['VII'], tylkoPriorytetowe: true }, DZIS);
const t2 = silnik.utworzTest(stan2, 'diagnoza', { dzialy: ['VII'], max: 8 }, DZIS);
let q2; const komps = [];
while ((q2 = silnik.nastepnePytanie(stan2, t2))) { komps.push(q2.komp); silnik.odpowiedz(stan2, t2, q2.id, odpowiedzUcznia(q2), DZIS); }
console.log('Pytania z:', komps.join(', '));
const w2 = silnik.zakonczTest(stan2, t2, DZIS);
const plan2 = silnik.zaplanuj(stan2, { dataMatury: '2027-05-06', minutDziennie: 20, dniTygodnia: [1, 3, 5] }, DZIS);
console.log('Plan:', plan2.jednostki.map(u => u.komp).join(', '), '|', plan2.podsumowanie.komunikat);
console.log('\nGOTOWE: silnik działa end-to-end.');

// 9. Nowe w wersji 2: powtórki adaptacyjne, seria, "Nie wiem", dzisiejsza pojemność, dostosowanie
linia('8. POWTÓRKI ADAPTACYJNE, SERIA, DOSTOSOWANIE');
const { dodajDni } = require('./silnik');
const st3 = silnik.nowyStan({ cel: 80 }, '2026-10-26');
const org3 = { dataMatury: '2027-05-05', minutDziennie: 15, dniTygodnia: [0, 1, 2, 3, 4, 5, 6] };
// "Nie wiem" w diagnozie
const d3 = silnik.utworzTest(st3, 'diagnoza', { max: 3 }, '2026-10-26');
const pierwsze = silnik.nastepnePytanie(st3, d3);
console.log('Nie wiem ->', JSON.stringify(silnik.odpowiedz(st3, d3, pierwsze.id, -1, '2026-10-26')));
// zaliczenie na 100% i łańcuch powtórek
const zq = silnik.utworzTest(st3, 'jednostka', { komp: 'TR-01' }, '2026-10-26');
let zp; while ((zp = silnik.nastepnePytanie(st3, zq))) silnik.odpowiedz(st3, zq, zp.id, 0, '2026-10-26');
const zw = silnik.zakonczTest(st3, zq, '2026-10-26');
console.log('Zaliczenie 100%: następna powtórka za', zw.powtorkaZa, 'dni');
let dzien = dodajDni('2026-10-26', zw.powtorkaZa);
for (let i = 0; i < 3; i++) {
  const pq = silnik.utworzTest(st3, 'powtorka', {}, dzien);
  let x; while ((x = silnik.nastepnePytanie(st3, pq))) silnik.odpowiedz(st3, pq, x.id, 0, dzien);
  const w = silnik.zakonczTest(st3, pq, dzien);
  console.log('  powtórka', dzien, '->', w.zmiany.map(z => z.nazwa + ': za ' + z.za + ' dni').join(', '));
  dzien = st3.powtorki.find(p => p.komp === 'TR-01').data;
}
// seria
console.log('Seria:', JSON.stringify(silnik.seria(st3, org3, dzien)));
// dzisiejsza pojemność: po zrobieniu sesji plan nie dokłada nic na dziś
const plan3 = silnik.zaplanuj(st3, org3, '2026-10-27');
const s3 = plan3.sesje.filter(s => s.data === '2026-10-27');
s3.filter(s => s.typ === 'nauka').forEach(s => silnik.oznaczSesje(st3, s, true, '2026-10-27'));
const p3b = silnik.zaplanuj(st3, org3, '2026-10-27');
console.log('Dziś przed:', s3.map(s => s.typ + ' ' + s.minuty).join(', '), '| po odhaczeniu:', p3b.sesje.filter(s => s.data === '2026-10-27').map(s => s.typ + ' ' + s.minuty).join(', ') || 'nic, dzień zrobiony');
// dostosowanie po porażce
['FN-03', 'FN-03'].forEach(() => { const f = silnik.utworzTest(st3, 'jednostka', { komp: 'FN-03' }, '2026-10-28'); let y; while ((y = silnik.nastepnePytanie(st3, f))) silnik.odpowiedz(st3, f, y.id, 1, '2026-10-28'); silnik.zakonczTest(st3, f, '2026-10-28'); });
const p4 = silnik.zaplanuj(st3, org3, '2026-10-28');
const fn = p4.jednostki.find(u => u.komp === 'FN-03');
console.log('Dostosowanie FN-03:', JSON.stringify(fn.dostosowanie), '| materiał 1:', fn.materialy[0].typ);

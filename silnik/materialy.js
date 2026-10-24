/*
 * materialy.js: mapowanie mikrokompetencji na produkty Maturalnych (warstwa mikrojednostek)
 *
 * Produkty Maturalnych są za długie, żeby wskazać cały kurs. Tu przypisujemy
 * do każdej mikrokompetencji KONKRETNY FRAGMENT (np. lekcje 3-4, zadania 5-8).
 *
 * MATERIALY[komp]          = materiały dla jednej mikrokompetencji (najdokładniejsze)
 * MATERIALY_DZIALU[dzial]  = materiał domyślny dla działu
 * MATERIALY_DZIALU['*']    = materiał domyślny dla wszystkich
 *
 * Pola: produktId i externalId z API Maturalnych, tytul, fragment, url,
 *       typ (wideo / cwiczenia / teoria / arkusz), minuty, cenaBrutto (w groszach),
 *       doWeryfikacji: true = fragment jeszcze nie sprawdzony przez zespół.
 *
 * DO ZROBIENIA (Milena): uzupełnić fragmenty dla zakresu demo (trygonometria + prerekwizyty).
 */
(function (root) {
  const ARKUSZ_CKE = {
    produktId: '699469ba54b96332e2c6117b',
    externalId: 586068,
    tytul: 'Arkusz od egzaminatora CKE (matematyka)',
    url: 'https://online.flippingbook.com/view/890985666/',
    typ: 'arkusz',
    cenaBrutto: 7900
  };
  const BANK_SCHEMATOW = {
    produktId: '69a6c66163651df533c164eb',
    externalId: 588601,
    tytul: 'Bank schematów i gotowców maturalnych',
    url: 'https://online.flippingbook.com/view/999105973/',
    typ: 'teoria',
    cenaBrutto: 14900
  };

  const MATERIALY = {
    // Przykład docelowego, dokładnego mapowania. Fragmenty do uzupełnienia po przejrzeniu produktów.
    'TR-01': [Object.assign({}, BANK_SCHEMATOW, { fragment: 'Schemat: definicje sin, cos, tg (strony do uzupełnienia)', minuty: 20, doWeryfikacji: true })],
    'TR-02': [Object.assign({}, BANK_SCHEMATOW, { fragment: 'Tabela wartości dla 30°, 45°, 60° (strony do uzupełnienia)', minuty: 15, doWeryfikacji: true })],
    'TR-05': [Object.assign({}, ARKUSZ_CKE, { fragment: 'Zadania z trójkątem prostokątnym (numery do uzupełnienia)', minuty: 30, doWeryfikacji: true })]
  };

  const MATERIALY_DZIALU = {
    '*': [
      Object.assign({}, BANK_SCHEMATOW, { fragment: 'Schemat z tego tematu (strony do uzupełnienia)', minuty: 20, doWeryfikacji: true }),
      Object.assign({}, ARKUSZ_CKE, { fragment: 'Zadania z tego tematu (numery do uzupełnienia)', minuty: 30, doWeryfikacji: true })
    ]
  };

  const eksport = { MATERIALY: MATERIALY, MATERIALY_DZIALU: MATERIALY_DZIALU };
  if (typeof module !== 'undefined' && module.exports) module.exports = eksport;
  else root.Mikro = Object.assign(root.Mikro || {}, eksport);
})(typeof window !== 'undefined' ? window : globalThis);

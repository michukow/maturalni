/*
 * materialy-maturalni.js: lekcje zaimportowane z API Maturalnych i przypisane do mikrokompetencji.
 *
 * Ten plik generuje ekran "Import materiałów" w aplikacji (przycisk "Pobierz plik do repo").
 * Podmień go w repozytorium, a każdy uczeń zobaczy prawdziwe lekcje zamiast danych przykładowych.
 * null = brak importu, aplikacja używa danych przykładowych z materialy.js.
 */
(function (root) {
  const IMPORT_MATURALNI = null;
  const eksport = { IMPORT_MATURALNI: IMPORT_MATURALNI };
  if (typeof module !== 'undefined' && module.exports) module.exports = eksport;
  else root.Mikro = Object.assign(root.Mikro || {}, eksport);
})(typeof window !== 'undefined' ? window : globalThis);

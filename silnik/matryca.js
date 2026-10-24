/*
 * matryca.js: matryca mikrokompetencji, matematyka, poziom podstawowy
 * Źródło: wymagania CKE do matury 2026 (zakres podstawowy).
 *
 * DZIALY.waga      = szacowany udział działu w punktach matury podstawowej (suma 100).
 *                    SZACUNEK DO WERYFIKACJI na arkuszach CKE 2023-2026.
 * KOMPETENCJE:
 *   id       = kod mikrokompetencji (prefiks działu + numer)
 *   dzial    = numer działu CKE (I-XIII)
 *   nazwa    = opis językiem ucznia
 *   poziom   = 1 łatwy, 2 średni, 3 trudny
 *   wymaga   = prerekwizyty (id), używane przy cofaniu w matrycy
 *   waga     = ważność w obrębie działu (1-3)
 *   cke      = punkt wymagań CKE, z którego wynika kompetencja
 *   czas     = (opcjonalnie) minuty nauki; domyślnie 45 / 60 / 75 wg poziomu
 */
(function (root) {
  const DZIALY = [
    { id: 'I', nazwa: 'Liczby rzeczywiste', waga: 12 },
    { id: 'II', nazwa: 'Wyrażenia algebraiczne', waga: 5 },
    { id: 'III', nazwa: 'Równania i nierówności', waga: 10 },
    { id: 'IV', nazwa: 'Układy równań', waga: 4 },
    { id: 'V', nazwa: 'Funkcje', waga: 16 },
    { id: 'VI', nazwa: 'Ciągi', waga: 8 },
    { id: 'VII', nazwa: 'Trygonometria', waga: 6 },
    { id: 'VIII', nazwa: 'Planimetria', waga: 12 },
    { id: 'IX', nazwa: 'Geometria analityczna', waga: 8 },
    { id: 'X', nazwa: 'Stereometria', waga: 7 },
    { id: 'XI', nazwa: 'Kombinatoryka', waga: 3 },
    { id: 'XII', nazwa: 'Prawdopodobieństwo i statystyka', waga: 5 },
    { id: 'XIII', nazwa: 'Optymalizacja', waga: 4 }
  ];

  const KOMPETENCJE = [
    // I. Liczby rzeczywiste
    { id: 'LR-01', dzial: 'I', poziom: 1, waga: 3, wymaga: [], cke: 'I.1', nazwa: 'Działania na liczbach i ułamkach, kolejność działań' },
    { id: 'LR-02', dzial: 'I', poziom: 1, waga: 3, wymaga: ['LR-01'], cke: 'I.4', nazwa: 'Potęgi i pierwiastki: prawa działań' },
    { id: 'LR-03', dzial: 'I', poziom: 2, waga: 1, wymaga: ['LR-02'], cke: 'I.3', nazwa: 'Pierwiastki dowolnego stopnia, także z liczb ujemnych' },
    { id: 'LR-04', dzial: 'I', poziom: 2, waga: 1, wymaga: ['LR-02'], cke: 'I.5', nazwa: 'Porównywanie potęg (monotoniczność potęgowania)' },
    { id: 'LR-05', dzial: 'I', poziom: 1, waga: 2, wymaga: [], cke: 'I.6', nazwa: 'Przedziały liczbowe na osi' },
    { id: 'LR-06', dzial: 'I', poziom: 2, waga: 2, wymaga: ['LR-05'], cke: 'I.7', nazwa: 'Wartość bezwzględna i równania typu |x + a| = b' },
    { id: 'LR-07', dzial: 'I', poziom: 2, waga: 3, wymaga: ['LR-02'], cke: 'I.8', nazwa: 'Procenty, procent składany, lokaty i kredyty' },
    { id: 'LR-08', dzial: 'I', poziom: 2, waga: 2, wymaga: ['LR-02'], cke: 'I.9', nazwa: 'Logarytmy: definicja i wzory' },
    { id: 'LR-09', dzial: 'I', poziom: 3, waga: 2, wymaga: ['LR-01', 'AL-01'], cke: 'I.2', nazwa: 'Proste dowody: podzielność i reszty z dzielenia' },

    // II. Wyrażenia algebraiczne
    { id: 'AL-01', dzial: 'II', poziom: 1, waga: 3, wymaga: ['LR-01'], cke: 'II.1', nazwa: 'Wzory skróconego mnożenia' },
    { id: 'AL-02', dzial: 'II', poziom: 1, waga: 2, wymaga: ['LR-01'], cke: 'II.2', nazwa: 'Dodawanie i mnożenie wielomianów' },
    { id: 'AL-03', dzial: 'II', poziom: 1, waga: 2, wymaga: ['AL-02'], cke: 'II.3', nazwa: 'Wyłączanie wspólnego czynnika przed nawias' },
    { id: 'AL-04', dzial: 'II', poziom: 2, waga: 2, wymaga: ['AL-01', 'AL-03'], cke: 'II.4', nazwa: 'Mnożenie i dzielenie wyrażeń wymiernych' },

    // III. Równania i nierówności
    { id: 'RN-01', dzial: 'III', poziom: 1, waga: 3, wymaga: ['AL-02'], cke: 'III.1', nazwa: 'Równania liniowe i przekształcenia równoważne' },
    { id: 'RN-02', dzial: 'III', poziom: 2, waga: 1, wymaga: ['RN-01'], cke: 'III.2', nazwa: 'Równania sprzeczne i tożsamościowe' },
    { id: 'RN-03', dzial: 'III', poziom: 1, waga: 2, wymaga: ['RN-01', 'LR-05'], cke: 'III.3', nazwa: 'Nierówności liniowe' },
    { id: 'RN-04', dzial: 'III', poziom: 2, waga: 3, wymaga: ['RN-01', 'AL-01'], cke: 'III.4', nazwa: 'Równania kwadratowe' },
    { id: 'RN-05', dzial: 'III', poziom: 2, waga: 3, wymaga: ['RN-04', 'LR-05'], cke: 'III.4', nazwa: 'Nierówności kwadratowe' },
    { id: 'RN-06', dzial: 'III', poziom: 2, waga: 2, wymaga: ['RN-04', 'AL-03'], cke: 'III.5', nazwa: 'Równania wielomianowe w postaci iloczynowej' },
    { id: 'RN-07', dzial: 'III', poziom: 3, waga: 1, wymaga: ['RN-04', 'AL-04'], cke: 'III.1', nazwa: 'Proste równania wymierne (proporcje, dziedzina)' },

    // IV. Układy równań
    { id: 'UK-01', dzial: 'IV', poziom: 1, waga: 2, wymaga: ['RN-01'], cke: 'IV.1', nazwa: 'Układy równań liniowych i ich interpretacja' },
    { id: 'UK-02', dzial: 'IV', poziom: 2, waga: 2, wymaga: ['UK-01'], cke: 'IV.2', nazwa: 'Zadania tekstowe z układami równań' },

    // V. Funkcje
    { id: 'FN-01', dzial: 'V', poziom: 1, waga: 2, wymaga: ['LR-01'], cke: 'V.1-2', nazwa: 'Pojęcie funkcji i obliczanie jej wartości ze wzoru' },
    { id: 'FN-02', dzial: 'V', poziom: 1, waga: 3, wymaga: ['FN-01', 'LR-05'], cke: 'V.3-4', nazwa: 'Odczytywanie własności funkcji z wykresu' },
    { id: 'FN-03', dzial: 'V', poziom: 2, waga: 3, wymaga: ['FN-01', 'RN-01'], cke: 'V.5-6', nazwa: 'Funkcja liniowa: współczynniki i wzór' },
    { id: 'FN-04', dzial: 'V', poziom: 2, waga: 3, wymaga: ['FN-03', 'RN-04'], cke: 'V.7-9', nazwa: 'Funkcja kwadratowa: postaci wzoru, wierzchołek, wykres' },
    { id: 'FN-05', dzial: 'V', poziom: 3, waga: 2, wymaga: ['FN-04'], cke: 'V.10', nazwa: 'Największa i najmniejsza wartość funkcji kwadratowej w przedziale' },
    { id: 'FN-06', dzial: 'V', poziom: 2, waga: 1, wymaga: ['FN-02'], cke: 'V.12', nazwa: 'Przesuwanie wykresu funkcji' },
    { id: 'FN-07', dzial: 'V', poziom: 2, waga: 1, wymaga: ['FN-01'], cke: 'V.13', nazwa: 'Proporcjonalność odwrotna, funkcja y = a/x' },
    { id: 'FN-08', dzial: 'V', poziom: 3, waga: 1, wymaga: ['LR-04', 'LR-08', 'FN-02'], cke: 'V.14', nazwa: 'Funkcja wykładnicza i logarytmiczna w zastosowaniach' },
    { id: 'FN-09', dzial: 'V', poziom: 2, waga: 2, wymaga: ['FN-03', 'FN-04'], cke: 'V.11', nazwa: 'Funkcja liniowa i kwadratowa w zadaniach praktycznych' },

    // VI. Ciągi
    { id: 'CI-01', dzial: 'VI', poziom: 1, waga: 2, wymaga: ['FN-01'], cke: 'VI.1-2', nazwa: 'Wyrazy ciągu ze wzoru ogólnego i rekurencyjnego' },
    { id: 'CI-02', dzial: 'VI', poziom: 2, waga: 1, wymaga: ['CI-01', 'RN-03'], cke: 'VI.3', nazwa: 'Czy ciąg rośnie, czy maleje' },
    { id: 'CI-03', dzial: 'VI', poziom: 2, waga: 3, wymaga: ['CI-01', 'RN-01'], cke: 'VI.4-5', nazwa: 'Ciąg arytmetyczny: n-ty wyraz i suma' },
    { id: 'CI-04', dzial: 'VI', poziom: 2, waga: 3, wymaga: ['CI-01', 'LR-02'], cke: 'VI.4,6', nazwa: 'Ciąg geometryczny: n-ty wyraz i suma' },
    { id: 'CI-05', dzial: 'VI', poziom: 3, waga: 2, wymaga: ['CI-03', 'CI-04'], cke: 'VI.7', nazwa: 'Ciągi w zadaniach praktycznych' },

    // VII. Trygonometria
    { id: 'TR-01', dzial: 'VII', poziom: 1, waga: 3, wymaga: ['PL-01'], cke: 'VII.1', nazwa: 'Sinus, cosinus i tangens w trójkącie prostokątnym' },
    { id: 'TR-02', dzial: 'VII', poziom: 1, waga: 2, wymaga: ['TR-01'], cke: 'VII.1', nazwa: 'Wartości dla kątów 30°, 45°, 60°' },
    { id: 'TR-03', dzial: 'VII', poziom: 2, waga: 1, wymaga: ['TR-02'], cke: 'VII.1', nazwa: 'Funkcje trygonometryczne kątów od 0° do 180°' },
    { id: 'TR-04', dzial: 'VII', poziom: 2, waga: 2, wymaga: ['TR-01', 'LR-02'], cke: 'VII.2', nazwa: 'Jedynka trygonometryczna i tg = sin/cos' },
    { id: 'TR-05', dzial: 'VII', poziom: 2, waga: 3, wymaga: ['TR-02'], cke: 'VII.4', nazwa: 'Rozwiązywanie trójkątów prostokątnych' },
    { id: 'TR-06', dzial: 'VII', poziom: 3, waga: 2, wymaga: ['TR-03', 'PL-01'], cke: 'VII.3', nazwa: 'Twierdzenie cosinusów' },
    { id: 'TR-07', dzial: 'VII', poziom: 2, waga: 2, wymaga: ['TR-02'], cke: 'VII.3', nazwa: 'Pole trójkąta: P = ½·a·b·sin γ' },

    // VIII. Planimetria
    { id: 'PL-01', dzial: 'VIII', poziom: 1, waga: 3, wymaga: ['LR-02'], cke: 'VIII.2', nazwa: 'Twierdzenie Pitagorasa i rodzaje trójkątów' },
    { id: 'PL-02', dzial: 'VIII', poziom: 1, waga: 2, wymaga: [], cke: 'VIII.4', nazwa: 'Własności czworokątów: kąty i przekątne' },
    { id: 'PL-03', dzial: 'VIII', poziom: 2, waga: 2, wymaga: [], cke: 'VIII.5', nazwa: 'Kąty wpisane i środkowe' },
    { id: 'PL-04', dzial: 'VIII', poziom: 2, waga: 2, wymaga: ['PL-01'], cke: 'VIII.1', nazwa: 'Okręgi: promienie, cięciwy, styczne' },
    { id: 'PL-05', dzial: 'VIII', poziom: 2, waga: 1, wymaga: ['LR-01'], cke: 'VIII.6', nazwa: 'Długość łuku i pole wycinka koła' },
    { id: 'PL-06', dzial: 'VIII', poziom: 2, waga: 3, wymaga: ['RN-01'], cke: 'VIII.7-8', nazwa: 'Twierdzenie Talesa i podobieństwo trójkątów' },
    { id: 'PL-07', dzial: 'VIII', poziom: 2, waga: 2, wymaga: ['PL-06'], cke: 'VIII.9', nazwa: 'Pola i obwody figur podobnych' },
    { id: 'PL-08', dzial: 'VIII', poziom: 2, waga: 1, wymaga: ['PL-01'], cke: 'VIII.3,10', nazwa: 'Punkty szczególne trójkąta i wielokąty foremne' },
    { id: 'PL-09', dzial: 'VIII', poziom: 3, waga: 2, wymaga: ['TR-05', 'TR-07', 'PL-02'], cke: 'VIII.12', nazwa: 'Trygonometria w figurach płaskich: długości i pola' },
    { id: 'PL-10', dzial: 'VIII', poziom: 3, waga: 2, wymaga: ['PL-03', 'PL-06'], cke: 'VIII.11', nazwa: 'Dowody geometryczne' },

    // IX. Geometria analityczna
    { id: 'GA-01', dzial: 'IX', poziom: 1, waga: 2, wymaga: ['PL-01'], cke: 'IX.3', nazwa: 'Odległość dwóch punktów w układzie współrzędnych' },
    { id: 'GA-02', dzial: 'IX', poziom: 2, waga: 3, wymaga: ['FN-03'], cke: 'IX.2', nazwa: 'Równanie prostej w postaci kierunkowej' },
    { id: 'GA-03', dzial: 'IX', poziom: 2, waga: 2, wymaga: ['GA-02', 'UK-01'], cke: 'IX.1', nazwa: 'Położenie prostych i ich punkt przecięcia' },
    { id: 'GA-04', dzial: 'IX', poziom: 2, waga: 2, wymaga: ['GA-01', 'AL-01'], cke: 'IX.4', nazwa: 'Równanie okręgu' },
    { id: 'GA-05', dzial: 'IX', poziom: 1, waga: 1, wymaga: [], cke: 'IX.5', nazwa: 'Symetrie względem osi i początku układu' },

    // X. Stereometria
    { id: 'ST-01', dzial: 'X', poziom: 2, waga: 1, wymaga: ['PL-01'], cke: 'X.1-2', nazwa: 'Proste i płaszczyzny w przestrzeni, kąt prostej z płaszczyzną' },
    { id: 'ST-02', dzial: 'X', poziom: 2, waga: 3, wymaga: ['PL-01'], cke: 'X.5', nazwa: 'Objętość i pole powierzchni brył' },
    { id: 'ST-03', dzial: 'X', poziom: 3, waga: 2, wymaga: ['ST-01', 'TR-05'], cke: 'X.3-4', nazwa: 'Kąty w bryłach: graniastosłupy, ostrosłupy, walec, stożek' },
    { id: 'ST-04', dzial: 'X', poziom: 2, waga: 1, wymaga: ['ST-02', 'PL-07'], cke: 'X.6', nazwa: 'Bryły podobne' },

    // XI. Kombinatoryka
    { id: 'KO-01', dzial: 'XI', poziom: 1, waga: 1, wymaga: [], cke: 'XI.1', nazwa: 'Zliczanie w prostych sytuacjach' },
    { id: 'KO-02', dzial: 'XI', poziom: 2, waga: 2, wymaga: ['KO-01'], cke: 'XI.2', nazwa: 'Reguła mnożenia i dodawania' },

    // XII. Prawdopodobieństwo i statystyka
    { id: 'PS-01', dzial: 'XII', poziom: 1, waga: 2, wymaga: ['LR-01'], cke: 'XII.2', nazwa: 'Średnia, średnia ważona, mediana, dominanta' },
    { id: 'PS-02', dzial: 'XII', poziom: 2, waga: 2, wymaga: ['KO-02'], cke: 'XII.1', nazwa: 'Prawdopodobieństwo klasyczne' },

    // XIII. Optymalizacja
    { id: 'OP-01', dzial: 'XIII', poziom: 3, waga: 1, wymaga: ['FN-05'], cke: 'XIII.1', nazwa: 'Optymalizacja z funkcją kwadratową' }
  ];

  const eksport = { DZIALY: DZIALY, KOMPETENCJE: KOMPETENCJE };
  if (typeof module !== 'undefined' && module.exports) module.exports = eksport;
  else root.Mikro = Object.assign(root.Mikro || {}, eksport);
})(typeof window !== 'undefined' ? window : globalThis);

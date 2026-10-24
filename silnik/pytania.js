/*
 * pytania.js: bank pytań startowych (matematyka, poziom podstawowy)
 *
 * ZASADY DLA AUTORA PYTAŃ:
 * 1. Poprawna odpowiedź ZAWSZE jako pierwsza w tablicy odp. Silnik sam miesza kolejność.
 * 2. Zawsze 4 odpowiedzi.
 * 3. bledy: numer błędnej odpowiedzi (1, 2 lub 3) -> przyczyna błędu.
 *    "PRE:XX-00 opis" oznacza, że błąd wynika z braków w prerekwizycie XX-00.
 *    Silnik wtedy obniża poziom tego prerekwizytu i może o niego dopytać (cofanie w matrycy).
 * 4. id: kod kompetencji + litera (a, b, c...).
 */
(function (root) {
  const PYTANIA = [
    // I. Liczby rzeczywiste
    { id: 'LR-01-a', komp: 'LR-01', tresc: 'Wartość wyrażenia 2/3 + 1/6 · 4 jest równa:', odp: ['4/3', '10/3', '2', '5/6'], bledy: { 1: 'zła kolejność działań: dodawanie przed mnożeniem', 3: 'pominięte mnożenie' } },
    { id: 'LR-02-a', komp: 'LR-02', tresc: 'Liczba 2⁵ · 4³ jest równa:', odp: ['2¹¹', '2¹⁵', '8⁸', '2³⁰'], bledy: { 1: 'pomnożone wykładniki zamiast zamiany 4 na 2² i dodania', 2: 'pomnożone podstawy', 3: 'pomnożone wykładniki' } },
    { id: 'LR-02-b', komp: 'LR-02', tresc: 'Wartość wyrażenia √50 − √8 jest równa:', odp: ['3√2', '√42', '2√3', '7√2'], bledy: { 1: 'odejmowanie liczb pod pierwiastkiem', 3: 'dodane zamiast odjęte' } },
    { id: 'LR-03-a', komp: 'LR-03', tresc: 'Wartość wyrażenia ∛(−27) + √16 jest równa:', odp: ['1', '7', '−7', 'nie da się jej obliczyć'], bledy: { 1: 'pominięty minus w pierwiastku nieparzystego stopnia', 3: 'pierwiastek nieparzystego stopnia z liczby ujemnej istnieje' } },
    { id: 'LR-04-a', komp: 'LR-04', tresc: 'Która nierówność jest prawdziwa?', odp: ['(1/2)³ > (1/2)⁵', '2³ > 2⁵', '(1/3)² < (1/3)⁴', '3⁻¹ > 3⁰'], bledy: { 2: 'odwrócona monotoniczność dla podstawy z przedziału (0, 1)' } },
    { id: 'LR-05-a', komp: 'LR-05', tresc: 'Zbiór liczb x spełniających warunek −2 < x ≤ 3 to przedział:', odp: ['(−2, 3]', '[−2, 3)', '(−2, 3)', '[−2, 3]'], bledy: { 1: 'zamienione rodzaje nawiasów' } },
    { id: 'LR-06-a', komp: 'LR-06', tresc: 'Równanie |x + 4| = 5 ma rozwiązania:', odp: ['x = 1 lub x = −9', 'tylko x = 1', 'x = −1 lub x = 9', 'równanie nie ma rozwiązań'], bledy: { 1: 'pominięty drugi przypadek wartości bezwzględnej', 2: 'błąd znaku' } },
    { id: 'LR-07-a', komp: 'LR-07', tresc: 'Cenę 200 zł podniesiono o 10%, a potem nową cenę obniżono o 10%. Ostateczna cena to:', odp: ['198 zł', '200 zł', '180 zł', '220 zł'], bledy: { 1: 'procenty liczone od tej samej kwoty' } },
    { id: 'LR-07-b', komp: 'LR-07', tresc: 'Wpłacono 1000 zł na lokatę 5% w skali roku z roczną kapitalizacją. Po 2 latach na lokacie jest:', odp: ['1102,50 zł', '1100 zł', '1105 zł', '1050 zł'], bledy: { 1: 'odsetki proste zamiast składanych', 3: 'odsetki tylko za jeden rok' } },
    { id: 'LR-08-a', komp: 'LR-08', tresc: 'Wartość wyrażenia log₂ 8 + log₂ 4 jest równa:', odp: ['5', 'log₂ 12', '6', '32'], bledy: { 1: 'logarytm sumy zamiast logarytmu iloczynu', 3: 'pominięty logarytm, pomnożone liczby' } },
    { id: 'LR-09-a', komp: 'LR-09', tresc: 'Iloczyn trzech kolejnych liczb naturalnych dodatnich jest zawsze podzielny przez:', odp: ['6', '9', '4', '5'], bledy: { 2: 'uogólnienie z jednego przykładu' } },

    // II. Wyrażenia algebraiczne
    { id: 'AL-01-a', komp: 'AL-01', tresc: 'Wyrażenie (x − 3)² jest równe:', odp: ['x² − 6x + 9', 'x² − 9', 'x² + 9', 'x² − 3x + 9'], bledy: { 1: 'pominięty podwojony iloczyn', 2: 'pominięty podwojony iloczyn', 3: 'iloczyn nie pomnożony przez 2' } },
    { id: 'AL-02-a', komp: 'AL-02', tresc: 'Iloczyn (2x + 1)(x − 3) jest równy:', odp: ['2x² − 5x − 3', '2x² − 3', '2x² − 6x − 3', '2x² + 5x − 3'], bledy: { 1: 'pominięte wyrazy środkowe', 2: 'pominięty jeden iloczyn', 3: 'błąd znaku' } },
    { id: 'AL-03-a', komp: 'AL-03', tresc: 'Po wyłączeniu wspólnego czynnika przed nawias wyrażenie 6x³ − 9x² ma postać:', odp: ['3x²(2x − 3)', '3x(2x² − 3)', '3x²(2x − 9)', 'x²(6x − 3)'], bledy: { 1: 'źle podzielony drugi wyraz', 2: 'drugi wyraz nie podzielony przez czynnik' } },
    { id: 'AL-04-a', komp: 'AL-04', tresc: 'Dla x ≠ −2 wyrażenie (x² − 4)/(x + 2) jest równe:', odp: ['x − 2', 'x + 2', 'x − 4', 'x² − 2'], bledy: { 1: 'PRE:AL-01 źle rozłożona różnica kwadratów', 2: 'skracanie składników zamiast czynników', 3: 'skracanie składników zamiast czynników' } },

    // III. Równania i nierówności
    { id: 'RN-01-a', komp: 'RN-01', tresc: 'Rozwiązaniem równania 3(x − 2) = x + 4 jest:', odp: ['x = 5', 'x = 3', 'x = 1', 'x = −5'], bledy: { 1: 'nie wymnożono całego nawiasu', 3: 'błąd znaku przy przenoszeniu' } },
    { id: 'RN-02-a', komp: 'RN-02', tresc: 'Równanie 2(x + 1) = 2x + 2:', odp: ['ma nieskończenie wiele rozwiązań', 'nie ma rozwiązań', 'ma jedno rozwiązanie x = 0', 'ma jedno rozwiązanie x = 1'], bledy: { 1: 'pomylone równanie tożsamościowe ze sprzecznym' } },
    { id: 'RN-03-a', komp: 'RN-03', tresc: 'Rozwiązaniem nierówności −2x + 4 > 0 jest:', odp: ['x < 2', 'x > 2', 'x < −2', 'x > −2'], bledy: { 1: 'nie zmieniony znak nierówności przy dzieleniu przez liczbę ujemną', 2: 'błąd znaku przy przenoszeniu' } },
    { id: 'RN-04-a', komp: 'RN-04', tresc: 'Rozwiązaniami równania x² − 5x + 6 = 0 są:', odp: ['x = 2 lub x = 3', 'x = −2 lub x = −3', 'x = 1 lub x = 6', 'x = −1 lub x = 6'], bledy: { 1: 'błąd znaku we wzorach na pierwiastki', 2: 'zgadywanie zamiast obliczenia delty' } },
    { id: 'RN-05-a', komp: 'RN-05', tresc: 'Zbiorem rozwiązań nierówności x² − 4 < 0 jest:', odp: ['(−2, 2)', '(−∞, −2) ∪ (2, +∞)', '(−∞, 2)', '(−4, 4)'], bledy: { 1: 'odwrócony zbiór: zła interpretacja paraboli', 2: 'potraktowana jak nierówność liniowa', 3: 'brak pierwiastka z 4' } },
    { id: 'RN-06-a', komp: 'RN-06', tresc: 'Równanie (x − 1)(x + 3)(2x − 4) = 0 ma rozwiązania:', odp: ['1, −3, 2', '−1, 3, −2', '1, −3, 4', '1, 3, 2'], bledy: { 1: 'zły znak wszystkich rozwiązań', 2: 'z czynnika 2x − 4 odczytano 4 zamiast 2', 3: 'błąd znaku przy x + 3' } },
    { id: 'RN-07-a', komp: 'RN-07', tresc: 'Rozwiązaniem równania (x + 3)/(x − 1) = 2 jest:', odp: ['x = 5', 'x = 1', 'x = −5', 'x = 2'], bledy: { 1: 'liczba spoza dziedziny: mianownik równy 0', 2: 'błąd znaku przy przenoszeniu' } },

    // IV. Układy równań
    { id: 'UK-01-a', komp: 'UK-01', tresc: 'Układ równań x + y = 5 i x − y = 1 ma rozwiązanie:', odp: ['x = 3, y = 2', 'x = 2, y = 3', 'x = 4, y = 1', 'x = 3, y = −2'], bledy: { 1: 'zamienione niewiadome', 2: 'sprawdzone tylko pierwsze równanie' } },
    { id: 'UK-02-a', komp: 'UK-02', tresc: '2 bilety ulgowe i 1 normalny kosztują 50 zł, a 1 ulgowy i 2 normalne kosztują 61 zł. Ile kosztuje bilet normalny?', odp: ['24 zł', '13 zł', '18 zł', '26 zł'], bledy: { 1: 'podana cena biletu ulgowego zamiast normalnego' } },

    // V. Funkcje
    { id: 'FN-01-a', komp: 'FN-01', tresc: 'Dla funkcji f(x) = 2x² − 3 wartość f(−2) jest równa:', odp: ['5', '−11', '13', '−7'], bledy: { 1: 'błąd przy podnoszeniu liczby ujemnej do kwadratu', 2: 'do kwadratu podniesiono 2x zamiast x', 3: 'pominięty kwadrat' } },
    { id: 'FN-02-a', komp: 'FN-02', tresc: 'Funkcja f jest określona dla x ∈ [−3, 5]. Rośnie na [−3, 1], maleje na [1, 5], f(−3) = −2, f(1) = 4, f(5) = 0. Zbiór wartości funkcji to:', odp: ['[−2, 4]', '[−3, 5]', '[0, 4]', '[−2, 0]'], bledy: { 1: 'pomylona dziedzina ze zbiorem wartości', 2: 'pominięta wartość na początku dziedziny' } },
    { id: 'FN-03-a', komp: 'FN-03', tresc: 'Wykres funkcji y = −2x + 6 przecina oś OX w punkcie:', odp: ['(3, 0)', '(0, 6)', '(−3, 0)', '(6, 0)'], bledy: { 1: 'pomylone osie OX i OY', 2: 'błąd znaku przy rozwiązywaniu równania', 3: 'odczytany wyraz wolny' } },
    { id: 'FN-03-b', komp: 'FN-03', tresc: 'Wykres funkcji liniowej przechodzi przez punkty (0, 1) i (2, 5). Wzór tej funkcji to:', odp: ['y = 2x + 1', 'y = 3x + 1', 'y = 2x + 5', 'y = x + 1'], bledy: { 1: 'źle obliczony współczynnik kierunkowy', 2: 'zły wyraz wolny', 3: 'źle obliczony współczynnik kierunkowy' } },
    { id: 'FN-04-a', komp: 'FN-04', tresc: 'Wierzchołek paraboli y = (x − 2)² + 3 ma współrzędne:', odp: ['(2, 3)', '(−2, 3)', '(2, −3)', '(3, 2)'], bledy: { 1: 'zły znak w postaci kanonicznej', 2: 'zły znak drugiej współrzędnej', 3: 'zamienione współrzędne' } },
    { id: 'FN-05-a', komp: 'FN-05', tresc: 'Największa wartość funkcji f(x) = −x² + 4x w przedziale [0, 3] jest równa:', odp: ['4', '3', '0', '2'], bledy: { 1: 'sprawdzony tylko koniec przedziału', 2: 'sprawdzony tylko początek przedziału', 3: 'podany argument wierzchołka zamiast wartości' } },
    { id: 'FN-06-a', komp: 'FN-06', tresc: 'Wykres funkcji y = (x − 3)² powstaje z wykresu y = x² przez przesunięcie:', odp: ['o 3 jednostki w prawo', 'o 3 jednostki w lewo', 'o 3 jednostki w górę', 'o 3 jednostki w dół'], bledy: { 1: 'zły kierunek przesunięcia poziomego', 2: 'pomylone przesunięcie poziome z pionowym', 3: 'pomylone przesunięcie poziome z pionowym' } },
    { id: 'FN-07-a', komp: 'FN-07', tresc: '6 pracowników wykonuje pracę w 10 dni. Ilu pracowników o tej samej wydajności wykona ją w 4 dni?', odp: ['15', '24', '12', '2,4'], bledy: { 3: 'proporcjonalność prosta zamiast odwrotnej' } },
    { id: 'FN-08-a', komp: 'FN-08', tresc: 'Liczba bakterii podwaja się co godzinę. Na początku było 100 bakterii. Po 5 godzinach będzie ich:', odp: ['3200', '500', '1600', '6400'], bledy: { 1: 'wzrost liniowy zamiast wykładniczego', 2: 'o jedno podwojenie za mało', 3: 'o jedno podwojenie za dużo' } },
    { id: 'FN-09-a', komp: 'FN-09', tresc: 'Taksówka pobiera 8 zł opłaty początkowej i 3 zł za każdy kilometr. Ile kosztuje kurs na 12 km?', odp: ['44 zł', '36 zł', '96 zł', '132 zł'], bledy: { 1: 'pominięta opłata początkowa', 2: 'opłata początkowa pomnożona przez kilometry', 3: 'obie stawki pomnożone przez kilometry' } },

    // VI. Ciągi
    { id: 'CI-01-a', komp: 'CI-01', tresc: 'Ciąg jest określony wzorem aₙ = n² − 2n. Wyraz a₅ jest równy:', odp: ['15', '5', '35', '13'], bledy: { 2: 'błąd znaku przy podstawianiu' } },
    { id: 'CI-02-a', komp: 'CI-02', tresc: 'Ciąg określony wzorem aₙ = 3 − 2n jest:', odp: ['malejący', 'rosnący', 'stały', 'ani rosnący, ani malejący'], bledy: { 1: 'zła interpretacja współczynnika przy n' } },
    { id: 'CI-03-a', komp: 'CI-03', tresc: 'W ciągu arytmetycznym a₁ = 3 i r = 4. Wyraz a₁₀ jest równy:', odp: ['39', '43', '40', '12'], bledy: { 1: 'użyte n zamiast n − 1 we wzorze', 3: 'pomnożone a₁ i r' } },
    { id: 'CI-03-b', komp: 'CI-03', tresc: 'W ciągu arytmetycznym a₁ = 2 i a₁₀ = 20. Suma dziesięciu początkowych wyrazów jest równa:', odp: ['110', '220', '22', '200'], bledy: { 1: 'pominięte dzielenie przez 2', 2: 'pominięte mnożenie przez liczbę wyrazów' } },
    { id: 'CI-04-a', komp: 'CI-04', tresc: 'W ciągu geometrycznym a₁ = 2 i q = 3. Wyraz a₄ jest równy:', odp: ['54', '162', '24', '11'], bledy: { 1: 'użyte n zamiast n − 1 we wzorze', 3: 'PRE:CI-03 pomylony ciąg geometryczny z arytmetycznym' } },
    { id: 'CI-05-a', komp: 'CI-05', tresc: 'Pensja w pierwszym roku pracy wynosi 4000 zł miesięcznie i co roku rośnie o 200 zł. Ile wynosi w piątym roku?', odp: ['4800 zł', '5000 zł', '4200 zł', '4860 zł'], bledy: { 1: 'policzone 5 podwyżek zamiast 4', 2: 'uwzględniona tylko jedna podwyżka' } },

    // VII. Trygonometria (po 2 pytania na kluczowe kompetencje: zakres demo)
    { id: 'TR-01-a', komp: 'TR-01', tresc: 'Przyprostokątne trójkąta prostokątnego mają długości 3 i 4. Sinus kąta leżącego naprzeciw boku 3 jest równy:', odp: ['3/5', '4/5', '3/4', '4/3'], bledy: { 1: 'pomylone sin i cos', 2: 'pomylony sinus z tangensem', 3: 'odwrócony stosunek boków' } },
    { id: 'TR-01-b', komp: 'TR-01', tresc: 'W trójkącie prostokątnym przyprostokątna przyległa do kąta α ma długość 12, a przeciwprostokątna 13. cos α jest równy:', odp: ['12/13', '5/13', '12/5', '13/12'], bledy: { 1: 'pomylone sin i cos', 2: 'pomylony cosinus z tangensem', 3: 'odwrócony stosunek boków' } },
    { id: 'TR-02-a', komp: 'TR-02', tresc: 'Wartość wyrażenia sin 30° + cos 60° jest równa:', odp: ['1', '√3', '√3/2', '1/2'], bledy: { 1: 'pomylone wartości dla 30° i 60°', 2: 'pomylone wartości dla 30° i 60°' } },
    { id: 'TR-02-b', komp: 'TR-02', tresc: 'tg 45° jest równy:', odp: ['1', '√2/2', '√3', '0'], bledy: { 1: 'pomylony tangens z sinusem', 2: 'wartość dla kąta 60°' } },
    { id: 'TR-03-a', komp: 'TR-03', tresc: 'Kąt α jest rozwarty i sin α = 3/5. Wtedy cos α jest równy:', odp: ['−4/5', '4/5', '−3/5', '3/4'], bledy: { 1: 'pominięty znak: cos kąta rozwartego jest ujemny', 2: 'pomylone sin i cos', 3: 'PRE:TR-04 błąd w jedynce trygonometrycznej' } },
    { id: 'TR-04-a', komp: 'TR-04', tresc: 'Kąt α jest ostry i cos α = 0,6. Wtedy sin α jest równy:', odp: ['0,8', '0,4', '0,64', '1,6'], bledy: { 1: 'pominięte kwadraty w jedynce trygonometrycznej', 2: 'brak pierwiastka na końcu', 3: 'dodano zamiast odjąć' } },
    { id: 'TR-04-b', komp: 'TR-04', tresc: 'Jeśli sin α = 0,6 i cos α = 0,8, to tg α jest równy:', odp: ['0,75', '1,33', '0,48', '1,4'], bledy: { 1: 'odwrócony iloraz: cos/sin', 2: 'pomnożono zamiast podzielić', 3: 'dodano zamiast podzielić' } },
    { id: 'TR-05-a', komp: 'TR-05', tresc: 'Przeciwprostokątna trójkąta prostokątnego ma długość 10, a jeden z kątów ostrych 30°. Przyprostokątna naprzeciw tego kąta ma długość:', odp: ['5', '5√3', '10√3', '20'], bledy: { 1: 'pomylone sin i cos', 2: 'PRE:TR-02 błędna wartość funkcji dla 30°', 3: 'podzielono zamiast pomnożyć' } },
    { id: 'TR-05-b', komp: 'TR-05', tresc: 'Drabina o długości 4 m oparta o ścianę tworzy z ziemią kąt 60°. Na jakiej wysokości dotyka ściany?', odp: ['2√3 m', '2 m', '4√3 m', '√3 m'], bledy: { 1: 'pomylone sin i cos', 2: 'PRE:TR-02 błędna wartość sin 60°' } },
    { id: 'TR-06-a', komp: 'TR-06', tresc: 'Dwa boki trójkąta mają długości 5 i 8, a kąt między nimi 60°. Trzeci bok ma długość:', odp: ['7', '√89', '√129', '13'], bledy: { 1: 'PRE:PL-01 użyte twierdzenie Pitagorasa zamiast twierdzenia cosinusów', 2: 'błąd znaku we wzorze cosinusów', 3: 'dodane długości boków' } },
    { id: 'TR-07-a', komp: 'TR-07', tresc: 'Pole trójkąta o bokach 6 i 8 i kącie 30° między nimi jest równe:', odp: ['12', '24', '12√3', '48'], bledy: { 1: 'pominięty czynnik ½', 2: 'PRE:TR-02 sin 60° zamiast sin 30°', 3: 'pominięte ½ i sinus' } },

    // VIII. Planimetria
    { id: 'PL-01-a', komp: 'PL-01', tresc: 'Przyprostokątne trójkąta prostokątnego mają długości 6 i 8. Przeciwprostokątna ma długość:', odp: ['10', '14', '√28', '100'], bledy: { 1: 'dodane długości zamiast kwadratów', 2: 'odjęte kwadraty zamiast dodane', 3: 'brak pierwiastka na końcu' } },
    { id: 'PL-01-b', komp: 'PL-01', tresc: 'Trójkąt o bokach 5, 12 i 13 jest:', odp: ['prostokątny', 'ostrokątny', 'rozwartokątny', 'taki trójkąt nie istnieje'], bledy: { 1: 'nieznane twierdzenie odwrotne do twierdzenia Pitagorasa' } },
    { id: 'PL-02-a', komp: 'PL-02', tresc: 'Jeden z kątów rombu ma miarę 70°. Kąt sąsiedni ma miarę:', odp: ['110°', '70°', '20°', '290°'], bledy: { 1: 'kąty sąsiednie potraktowane jak równe', 2: 'odjęto od 90° zamiast od 180°' } },
    { id: 'PL-03-a', komp: 'PL-03', tresc: 'Kąt środkowy oparty na łuku ma miarę 100°. Kąt wpisany oparty na tym samym łuku ma miarę:', odp: ['50°', '100°', '200°', '80°'], bledy: { 1: 'kąt wpisany równy środkowemu', 2: 'podwojono zamiast podzielić przez 2' } },
    { id: 'PL-04-a', komp: 'PL-04', tresc: 'Okrąg ma promień 5. Cięciwa jest odległa od środka okręgu o 3. Długość cięciwy jest równa:', odp: ['8', '4', '√34', '2√34'], bledy: { 1: 'obliczona tylko połowa cięciwy', 2: 'PRE:PL-01 dodane kwadraty zamiast odjęte', 3: 'PRE:PL-01 dodane kwadraty zamiast odjęte' } },
    { id: 'PL-05-a', komp: 'PL-05', tresc: 'Długość łuku okręgu o promieniu 6, odpowiadającego kątowi środkowemu 60°, jest równa:', odp: ['2π', '6π', 'π', '12π'], bledy: { 3: 'policzony obwód całego okręgu' } },
    { id: 'PL-06-a', komp: 'PL-06', tresc: 'Ramiona kąta przecięto dwiema prostymi równoległymi. Na jednym ramieniu powstały odcinki 2 i 3, a na drugim odpowiadające im odcinki 4 i x. Wtedy x jest równe:', odp: ['6', '5', '8/3', '12'], bledy: { 1: 'dodana różnica zamiast zachowania proporcji', 2: 'odwrócona proporcja' } },
    { id: 'PL-07-a', komp: 'PL-07', tresc: 'Dwa trójkąty są podobne w skali 2. Pole mniejszego jest równe 5. Pole większego jest równe:', odp: ['20', '10', '40', '25'], bledy: { 1: 'stosunek pól równy skali zamiast jej kwadratu', 2: 'sześcian skali zamiast kwadratu' } },
    { id: 'PL-08-a', komp: 'PL-08', tresc: 'Środek okręgu opisanego na trójkącie to punkt przecięcia:', odp: ['symetralnych boków', 'dwusiecznych kątów', 'wysokości', 'środkowych'], bledy: { 1: 'pomylony okrąg opisany z wpisanym' } },
    { id: 'PL-09-a', komp: 'PL-09', tresc: 'Romb ma bok długości 6 i kąt ostry 30°. Jego pole jest równe:', odp: ['18', '36', '18√3', '9'], bledy: { 1: 'pominięty sinus kąta', 2: 'PRE:TR-02 sin 60° zamiast sin 30°', 3: 'policzone pole trójkąta zamiast rombu' } },

    // IX. Geometria analityczna
    { id: 'GA-01-a', komp: 'GA-01', tresc: 'Odległość punktów A = (1, 2) i B = (4, 6) jest równa:', odp: ['5', '7', '√7', '25'], bledy: { 1: 'dodane różnice zamiast ich kwadratów', 2: 'PRE:PL-01 błąd w twierdzeniu Pitagorasa', 3: 'brak pierwiastka' } },
    { id: 'GA-02-a', komp: 'GA-02', tresc: 'Prosta przechodzi przez punkty (0, −1) i (2, 3). Jej równanie to:', odp: ['y = 2x − 1', 'y = 2x + 3', 'y = ½x − 1', 'y = −2x − 1'], bledy: { 1: 'zły wyraz wolny', 2: 'odwrócony iloraz przy współczynniku kierunkowym', 3: 'błąd znaku współczynnika' } },
    { id: 'GA-03-a', komp: 'GA-03', tresc: 'Proste y = 2x + 1 i y = 2x − 3 są:', odp: ['równoległe', 'prostopadłe', 'przecinają się w punkcie (0, 1)', 'pokrywają się'], bledy: { 1: 'pomylony warunek równoległości z prostopadłością' } },
    { id: 'GA-04-a', komp: 'GA-04', tresc: 'Okrąg (x − 2)² + (y + 1)² = 9 ma środek S i promień r:', odp: ['S = (2, −1), r = 3', 'S = (−2, 1), r = 3', 'S = (2, −1), r = 9', 'S = (2, 1), r = 3'], bledy: { 1: 'zły znak współrzędnych środka', 2: 'promień bez pierwiastka', 3: 'zły znak jednej współrzędnej' } },
    { id: 'GA-05-a', komp: 'GA-05', tresc: 'Obrazem punktu (3, −2) w symetrii względem osi OX jest punkt:', odp: ['(3, 2)', '(−3, −2)', '(−3, 2)', '(2, 3)'], bledy: { 1: 'symetria względem osi OY zamiast OX', 2: 'symetria środkowa zamiast osiowej' } },

    // X. Stereometria
    { id: 'ST-01-a', komp: 'ST-01', tresc: 'W sześcianie kąt między przekątną ściany a krawędzią tej ściany wychodzącą z tego samego wierzchołka ma miarę:', odp: ['45°', '90°', '60°', '30°'], bledy: { 1: 'pomylona przekątna z krawędzią' } },
    { id: 'ST-02-a', komp: 'ST-02', tresc: 'Objętość walca o promieniu podstawy 3 i wysokości 5 jest równa:', odp: ['45π', '15π', '30π', '75π'], bledy: { 1: 'promień nie podniesiony do kwadratu', 2: 'policzone pole boczne zamiast objętości', 3: 'zamieniony promień z wysokością' } },
    { id: 'ST-03-a', komp: 'ST-03', tresc: 'Tworząca stożka ma długość 10 i tworzy z podstawą kąt 60°. Wysokość stożka jest równa:', odp: ['5√3', '5', '10√3', '20'], bledy: { 1: 'PRE:TR-05 cos zamiast sin', 2: 'PRE:TR-02 błędna wartość funkcji trygonometrycznej' } },
    { id: 'ST-04-a', komp: 'ST-04', tresc: 'Dwa sześciany są podobne w skali 2. Objętość mniejszego jest równa 3. Objętość większego jest równa:', odp: ['24', '6', '12', '9'], bledy: { 1: 'stosunek objętości równy skali', 2: 'kwadrat skali zamiast sześcianu' } },

    // XI. Kombinatoryka
    { id: 'KO-01-a', komp: 'KO-01', tresc: 'Ile jest liczb naturalnych od 15 do 40 włącznie?', odp: ['26', '25', '27', '40'], bledy: { 1: 'pominięty jeden koniec przedziału' } },
    { id: 'KO-02-a', komp: 'KO-02', tresc: 'Ile jest liczb trzycyfrowych, w których wszystkie cyfry są nieparzyste?', odp: ['125', '60', '100', '15'], bledy: { 1: 'założono, że cyfry muszą być różne', 3: 'dodawanie zamiast mnożenia' } },

    // XII. Prawdopodobieństwo i statystyka
    { id: 'PS-01-a', komp: 'PS-01', tresc: 'Mediana liczb 9, 2, 1, 10, 4 jest równa:', odp: ['4', '5,2', '1', '10'], bledy: { 1: 'pomylona mediana ze średnią', 2: 'dane nie uporządkowane przed wyborem środkowej' } },
    { id: 'PS-02-a', komp: 'PS-02', tresc: 'Rzucamy dwa razy symetryczną monetą. Prawdopodobieństwo wyrzucenia dokładnie jednego orła jest równe:', odp: ['1/2', '1/4', '1/3', '3/4'], bledy: { 1: 'pominięty jeden z dwóch sprzyjających wyników', 2: 'wyniki 0, 1, 2 orły potraktowane jako jednakowo prawdopodobne' } },
    { id: 'PS-02-b', komp: 'PS-02', tresc: 'Rzucamy raz symetryczną kostką do gry. Prawdopodobieństwo wyrzucenia liczby większej od 4 jest równe:', odp: ['1/3', '1/2', '2/3', '1/6'], bledy: { 1: 'uwzględniona liczba 4', 3: 'policzony tylko jeden wynik' } },

    // XIII. Optymalizacja
    { id: 'OP-01-a', komp: 'OP-01', tresc: 'Suma dwóch liczb nieujemnych jest równa 10. Ich iloczyn jest największy, gdy te liczby są równe:', odp: ['5 i 5', '0 i 10', '1 i 9', '4 i 6'], bledy: { 3: 'nie sprawdzono wierzchołka paraboli' } }
  ];

  const eksport = { PYTANIA: PYTANIA };
  if (typeof module !== 'undefined' && module.exports) module.exports = eksport;
  else root.Mikro = Object.assign(root.Mikro || {}, eksport);
})(typeof window !== 'undefined' ? window : globalThis);

# Dokumentacja techniczna: Maturalny Mentor (Kompas + plan matury z matematyki)

Aplikacja webowa dla maturzystów. Diagnozuje wiedzę z matematyki na poziomie **67 mikrokompetencji z wymagań CKE**, szuka **przyczyny błędów**, prognozuje **wynik matury** i układa **plan nauki**, który sam się przelicza. Do tego Kompas: test predyspozycji, który podpowiada kierunek studiów i przedmioty maturalne.

Strona: **https://maturalni-4l1.pages.dev** (Cloudflare Pages, wdrożenie po pushu na `main`).

## Przepływ ucznia: 4 kroki

Uczeń widzi jedną ścieżkę i ma dwa paski nawigacji:
- **Pasek kroków u góry**: gdzie uczeń jest, co już zrobił (✓) i co jest jeszcze zablokowane (🔒). Kroki 3 i 4 otwierają się po teście.
- **Dolny pasek pod kciukiem** do codziennego używania. Przed testem: Start, Diagnoza, Test, Materiały. Po teście: Dziś, Plan, Materiały, Postępy, Kompas. W trakcie testu, Kompasu i kalibracji pasek się chowa, żeby nic nie rozpraszało.

| Krok | Co robi uczeń | Co dostaje | Ekrany |
|---|---|---|---|
| **1. Diagnoza** | 22 pytania o osobowość i zainteresowania (można pominąć) | ścieżkę A i B, kierunki, uczelnie, przedmioty maturalne | `#/kompas`, `#/kompas-test`, `#/kompas-wynik` |
| **2. Test** (z przedmiotu maturalnego; dostępna matematyka, kolejne przedmioty w przygotowaniu) | 2 pytania (cel z rokiem matury, czas dziennie), potem test adaptacyjny 20 pytań, ok. 15 min | prognozę wyniku matury, przyczyny błędów, mapę mikrokompetencji | `#/kalibracja`, `#/test`, `#/quiz`, `#/wynik` |
| **3. Plan** | przegląda plan, może zmienić minuty, dni, dni wolne, dodać „więcej czasu” (dysleksja/dyskalkulia) | listę tematów z datami, od tych dających najwięcej punktów | `#/plan`, `#/postepy`, `#/kalendarz` |
| **4. Nauka** | codziennie: materiał (części tematu i fragmenty materiałów Maturalnych), zadanie „Sprawdź się”, quiz zaliczeniowy (70%), powtórki | serię dni nauki, zaliczone tematy, aktualizowaną prognozę | `#/dzis`, `#/lekcja`, `#/quiz-wynik`, `#/materialy` |

**Zasada dwóch przycisków (jak w Duolingo):** na każdym ekranie jeden duży przycisk główny i najwyżej jeden drugi (`duo()` w `app/nauka.js`, style `.btn-duo`). Ekran powitalny nowego ucznia nie ma pasków nawigacji, tylko „Zaczynamy” i „Wiem, co zdaję: od razu test”.

| Ekran | Przycisk główny | Drugi przycisk |
|---|---|---|
| Powitanie | Rozpocznij diagnozę | Wiem już, co zdaję: przejdź do testów |
| Kompas (start) | Zaczynamy / Kontynuuj | Pomiń / Zacznij od nowa |
| Wynik Kompasu | Dalej: test diagnozujący z matematyki | Kopiuj wynik |
| Wynik testu | Dalej: Twój plan do matury | - |
| Plan | Dalej: zacznij naukę | Dodaj plan do kalendarza |
| Dziś | Zaczynamy · N min | Nie dam rady dzisiaj |
| Powrót ucznia | Kontynuuj naukę | Zacznij od nowa |

Rzadziej używane opcje (dni wolne, minuty dziennie, „więcej czasu”) są zwinięte w Planie w „Dopasuj plan”.

Szczegóły kroku 4: quiz zaliczeniowy (próg 70%), powtórki adaptacyjne (2 > 5 > 12 > 30 dni, po błędzie wcześniej), diagnoza pełna co ok. miesiąc (nowa prognoza). Gdy temat nie idzie: materiał dostosowany automatycznie (najpierw wyjaśnienie, rozgrzewka z podstawy, nowe pytania).

**Dla jury** (link w stopce, `#/mapa`): wszystkie ekrany, opis (`#/jak-to-dziala`), matryca, AI, powiadomienia, szybka ścieżka i narzędzia demo. Uczeń tych ekranów nie widzi w nawigacji.

## Materiały i integracja z API Maturalnych

- **Materiały** (`#/materialy`): platforma kursowa w aplikacji. Każda z 67 mikrokompetencji ma krótkie części: wideo (fragment lekcji od-do), notatka, szybki trening i zadania z arkusza CKE. Kolejność zależy od stylu nauki z kalibracji, po porażce najpierw wyjaśnienie, przy utrwalaniu bez wideo.
- **Lekcja dnia** pokazuje tylko części przypadające na dzisiejszą sesję (silnik dzieli części tematu na sesje).
- **Katalog na żywo** (`app/produkty-api.js`): przy starcie aplikacja pobiera publiczny endpoint `products/` (przez bramkę, bez tokenu). Z niego biorą się tytuły, okładki, linki FlippingBook, cena i poziom Premium dla notatek (Bank schematów) i zadań (Arkusz CKE). Gdy API nie odpowiada: ostatnie pobranie z przeglądarki, a gdy go brak: zapis z 24.10.2026 w tym pliku. Stan widać na ekranie Materiały i w `#/import`.
- **Materiały w aplikacji**: Bank schematów i Arkusz CKE otwierają się w ramce wewnątrz aplikacji (przycisk „Otwórz … tutaj”), link do oryginału jest zapasowy. Numer strony we FlippingBooku dla tematu: `STRONY` w `silnik/materialy.js`.
- **Wideo**: `products/` nie zawiera lekcji wideo z matematyki, więc wideo to kurs demo. Lekcje z `lesson-plans` / `chapters` wejdą przez ekran Import.
- **Dane przykładowe**: `silnik/materialy.js` buduje kurs w kształcie API (kurs > rozdział > lekcja z fragmentami czasu). Notatki do trygonometrii i jej podstaw są pisane ręcznie (`NOTATKI`), pozostałe generowane z wymagań CKE i banku pytań.
- **Bramka do API**: `functions/api/maturalni/[[sciezka]].js` (Cloudflare Pages Function). Adresy `/api/maturalni/products/` i `/api/maturalni/lesson-plans/` przekazują zapytanie do `https://backend.maturalni.com/lesson-plans/`. Token (jeśli potrzebny): zmienna `MATURALNI_TOKEN` w ustawieniach projektu w Cloudflare.
- **Import** (`#/import`): pobiera JSON z bramki albo z wklejenia, znajduje lekcje, przypisuje je do mikrokompetencji (słowa kluczowe z nazw), pozwala poprawić przypisanie i zapisuje w przeglądarce albo jako plik `silnik/materialy-maturalni.js` do repozytorium.
- **Kalendarz**: Google Calendar pokazuje co i kiedy. Opis wydarzenia zawiera dzisiejsze części, link do lekcji w aplikacji i zapasowy link do materiału Maturalnych.

## AI i jakość

**3 prompty systemowe, OpenRouter w dwóch miejscach:**

| # | Gdzie | AI dostaje | AI zwraca | Kto decyduje | Plik |
|---|---|---|---|---|---|
| 1 | Kompas, po 22 pytaniach zamkniętych | wynik algorytmu (cechy, zainteresowania, plan A i B, odpowiedzi) | 2 pytania otwarte o to, czego test nie rozstrzygnął | AI (bez AI: 2 pytania standardowe) | `functions/api/ai/kompas.js` |
| 2 | Kompas, po odpowiedziach swoimi słowami | wynik algorytmu, lista ścieżek i ról, odpowiedzi ucznia | opis, niuanse, rola, następny krok, kolejność planów z pewnością | aplikacja: zmiana planów od 60% pewności, nowa ścieżka od 70% (`KompasAI.przyjmij`) | `functions/api/ai/kompas.js` |
| 3 | Matematyka, po złej odpowiedzi i po 2 nieudanych quizach | zadanie, odpowiedź, opis ucznia, temat i podstawy | brakująca mikrokompetencja z pewnością, opis, wskazówka | silnik: tylko id z listy, od 70% (`silnik.zastosujAI`) | `functions/api/ai/analiza.js` |

- **Kompas**: test zamknięty liczy algorytm (RIASEC i Wielka Piątka). Po ostatnim pytaniu ekran `#/kompas-ai` pokazuje 2 pytania od AI, potem wynik Kompasu ma kartę „Wynik pogłębiony przez AI”, powód przy każdym planie i rolę wskazaną przez AI. Uczeń zawsze widzi, co wskazał sam test. Kod ekranu: `app/kompas-ai.js`, dane dla AI: `Nauka.kompasProfil()` w `index.html`.
- **Testy Kompasu** (`#/testy-ai`, narzędzie zespołu, niepodlinkowane w aplikacji): 7 przypadków z kryteriami (prompt 1: 2 pytania, bez tak/nie i żargonu; prompt 2: zgodne odpowiedzi nie zmieniają planu, mocny dowód zmienia, puste odpowiedzi i manipulacja nic nie zmieniają).

**Matematyka (prompt 3):**

- **Rola AI**: szuka przyczyny błędu ucznia. Po złej odpowiedzi w teście lub quizie wskazuje brakującą mikrokompetencję i daje wskazówkę. W teście adaptacyjnym następne pytanie od razu sprawdza wskazaną podstawę. Po 2 nieudanych quizach AI czyta wszystkie błędy z tematu i wskazuje podstawę do powtórki, a plan i lekcja (rozgrzewka, wskazówka) zmieniają się automatycznie. Uczeń może dopisać, jak liczył.
- **Czego AI nie robi**: plan, daty, powtórki, prognoza i próg zaliczenia liczy algorytm (dokładnie, szybko, bez kosztów).
- **AI proponuje, silnik decyduje**: AI może wskazać tylko temat albo jego podstawę (do 2 poziomów w dół, `silnik.kandydaciAI`). Silnik przyjmuje propozycję od pewności 70% (`KONFIG.progPewnosciAI`). Niżej, przy błędzie albo braku odpowiedzi decyduje klucz odpowiedzi z banku pytań.
- **Przepływ danych**: `silnik.daneDoAI` (treść zadania, odpowiedź, opis ucznia, kandydaci; bez danych osobowych) > `POST /api/ai/analiza` (Cloudflare) > OpenRouter > kontrola JSON na serwerze > `silnik.zastosujAI` / `silnik.zastosujAIPoPorazce`.
- **Model**: domyślnie `google/gemini-3.6-flash`, temperatura 0,1, odpowiedź JSON. Zmiana: zmienna `AI_MODEL` w Cloudflare.
- **Logika i prompt**: `functions/api/ai/analiza.js` (serwer). Ekrany i testy: `app/ai.js`.
- **Klucz**: Cloudflare > Workers & Pages > maturalni > Settings > Variables and Secrets > Add > `OPENROUTER_API_KEY`, typ **Secret**. Nigdy w kodzie, README, na Discordzie ani w formularzu.
- **Testy jakości** (`#/testy-ai`, narzędzie zespołu, niepodlinkowane w aplikacji): 27 przypadków o znanej przyczynie. A: typowe, klucz wystarcza (10). B: opis ucznia zmienia przyczynę (7). C: nietypowe, np. „Nie wiem”, manipulacja, tekst bez sensu, zgadywanie, zły klik, angielski (8). T: analiza tematu po 2 porażkach (2). Mierzymy trafność reguł, samej AI i systemu (AI, gdy pewna, inaczej reguły), liczbę „pewnych, ale błędnych” odpowiedzi AI, wstrzymania, czas i koszt. Wyniki można pobrać jako JSON.
- **Ograniczenia**: zestaw testowy przygotował zespół (to nie są odpowiedzi prawdziwych uczniów), próba jest mała, AI nie wskaże przyczyny spoza tematu i jego podstaw, bez opisu ucznia AI wie niewiele więcej niż klucz odpowiedzi.

## Uruchomienie

Otwórz `index.html` w przeglądarce albo wejdź na stronę. Bez serwera i instalacji. Dane ucznia są tylko w jego przeglądarce (localStorage).

**Pokaz dla jury:** `Mapa` > `Narzędzia demo`:
- **Wczytaj ucznia demo** (Ola, cel 80%, słaba z trygonometrii, diagnoza robi się sama),
- **Symuluj 7 dni nauki** (seria, zaliczenia, powtórki),
- **Scenariusz: temat nie idzie** (2 nieudane quizy > cofnięcie w matrycy > dostosowany materiał),
- **Przewiń o 1 dzień** (plan przelicza zaległości), **Wróć do dzisiejszej daty**, **Wyczyść dane**.

Test silnika bez przeglądarki: `cd silnik && node sprawdz.js` (na końcu ma być „GOTOWE”).

## Struktura

| Plik | Co zawiera | Kto edytuje |
|---|---|---|
| `index.html` | szkielet strony i Kompas (pytania, ścieżki, uczelnie) | zespół |
| `style.css` | wygląd zgodny z kalibracją Maturalnych | zespół |
| `app/nauka.js` | wszystkie ekrany modułu matematyki i router (`#/dzis`, `#/plan`…) | dev |
| `silnik/silnik.js` | algorytmy: diagnoza, prognoza, plan, powtórki, seria, .ics | dev |
| `silnik/matryca.js` | 13 działów CKE z wagami i 67 mikrokompetencji z prerekwizytami | merytoryka |
| `silnik/pytania.js` | bank pytań, błędne odpowiedzi opisane przyczyną | merytoryka |
| `silnik/materialy.js` | części materiałów per umiejętność (wideo, notatka, trening, arkusz), notatki ręczne | merytoryka |
| `silnik/materialy-maturalni.js` | lekcje zaimportowane z API (generuje ekran Import) | merytoryka |
| `app/kurs.js` | ekran Materiały, odtwarzacz części, Import z API | dev |
| `app/produkty-api.js` | katalog produktów na żywo z `products/`, zapis zapasowy | dev |
| `functions/api/maturalni/` | bramka do API Maturalnych na Cloudflare | dev |
| `functions/api/ai/analiza.js` | AI: prompt, wywołanie OpenRouter, kontrola odpowiedzi | dev |
| `app/ai.js` | AI w quizie i po porażkach, ekran „AI i jakość” z testami | dev |
| `silnik/README.md` | opis API silnika | dev |

## Gdzie co zmieniać

- **Nowe pytanie**: `silnik/pytania.js`. Poprawna odpowiedź zawsze pierwsza (silnik miesza kolejność). Błędne odpowiedzi opisz w `bledy`, a jeśli błąd wynika z braku podstawy, zacznij od `PRE:ID-podstawy`.
- **Materiał do tematu**: `silnik/materialy.js`, klucz = id mikrokompetencji (np. `TR-05`), pola `fragment` i `minuty`.
- **Strona w Banku schematów / Arkuszu**: `STRONY` w `silnik/materialy.js`, np. `bank: { 'TR-01': 41 }`. Link otworzy się od tej strony.
- **Wagi działów**: `silnik/matryca.js`, pole `waga` w `DZIALY` (suma 100). To szacunek do weryfikacji na arkuszach CKE.
- **Progi i odstępy** (70%, 2-5-12-30 dni, bufor co 5. dzień): `KONFIG` na górze `silnik/silnik.js`.
- **Kompas**: w `index.html` stałe `Q`, `PATHS`, `PAIRS`, `SUBJECTS` (`active: true` włącza przedmiot). Status danych uczelni (`s`): `v` zasady 2027/28 z uchwały, `p` projekt 2027/28, `o` zasady 2026/27, `x` do sprawdzenia.

## Kolejna iteracja

- Prawdziwe lekcje z `lesson-plans` (bramka i import są gotowe, potrzebny dostęp/token).
- Google Calendar API (automatyczna synchronizacja zamiast importu .ics).
- AI: zestaw testowy z prawdziwych rozwiązań uczniów Maturalnych (200+) ocenionych przez egzaminatora.
- **AI jako opiekun ucznia** (planowane, nie jest częścią tej wersji):
  - **Nadzór nad wynikiem:** gdy prognoza spadnie poniżej 30% (próg zdania matury), AI ostrzega ucznia i wskazuje, czego nauczyć się najpierw, na podstawie mapy mikrokompetencji i przyczyn błędów z silnika.
  - **Pogłębiona diagnoza osobowości:** po teście RIASEC AI zadaje kilka pytań otwartych i łączy odpowiedzi z wynikiem Kompasu i testu z matematyki w jeden opis: osobowość, plany, talenty. Algorytm Kompasu nadal wyznacza ścieżkę, AI ją uzasadnia i uzupełnia.
- Powiadomienia push na telefon (service worker + serwer).

## Podgląd zmian dla zespołu

- **Push na `main`**: zmiana na stronie głównej po ok. minucie.
- **Push na inną gałąź**: własny adres podglądu (`nazwa-galezi.maturalni-4l1.pages.dev`), link pojawia się w pull requeście.

Jeśli zmiana nie jest widoczna, odśwież stronę z pominięciem pamięci podręcznej (Ctrl+Shift+R).

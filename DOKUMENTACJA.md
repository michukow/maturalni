# Dokumentacja techniczna: plan matury z matematyki + Kompas

Aplikacja webowa dla maturzystów. Diagnozuje wiedzę z matematyki na poziomie **67 mikrokompetencji z wymagań CKE**, szuka **przyczyny błędów**, prognozuje **wynik matury** i układa **plan nauki**, który sam się przelicza. Do tego Kompas: test predyspozycji, który podpowiada kierunek studiów i przedmioty maturalne.

Strona: **https://maturalni-4l1.pages.dev** (Cloudflare Pages, wdrożenie po pushu na `main`).

## Przepływ ucznia

1. **Kompas** (opcjonalnie): 22 pytania o osobowość i zainteresowania > ścieżka, kierunki, przedmioty.
2. **Kalibracja** (9 kroków w stylu Maturalnych): rok matury, szkolna skala, cel po maturze, wymarzony wynik, trudne działy, styl nauki, czas dziennie, dysleksja/dyskalkulia i studniówka, godzina przypomnień.
3. **Test diagnostyczny** (20 pytań, ok. 15 min): adaptacyjny. Źle > schodzi po matrycy do podstaw, dobrze > wyżej. „Nie wiem” jest dozwolone.
4. **Wynik**: prognoza matury z przedziałem niepewności, gdzie tracisz najwięcej punktów, przyczyny błędów, mapa mikrokompetencji.
5. **Dziś**: komunikat dnia („Hej! Dzisiaj robimy…”), ścieżka zadań, seria 🔥, tydzień, prognoza teraz i po planie.
6. **Lekcja**: konkretny fragment materiału Maturalnych + zadanie „Sprawdź się”. Gdy temat nie idzie: materiał automatycznie dostosowany (najpierw wyjaśnienie, rozgrzewka z podstawy, nowe pytania).
7. **Quiz zaliczeniowy** (próg 70%) i **powtórki adaptacyjne** (2 > 5 > 12 > 30 dni, po błędzie wcześniej).
8. **Diagnoza pełna** co ok. miesiąc (zależnie od czasu do matury): nowa prognoza.
9. **Postępy, Powiadomienia (ekran push), Kalendarz (.ics i Google Calendar), Lista do matury, Mapa strony**.

**Szybka ścieżka**: „wiem, że chcę poprawić trygonometrię” > krótka kalibracja > test tylko z działu > plan.

## Materiały i integracja z API Maturalnych

- **Materiały** (`#/materialy`): platforma kursowa w aplikacji. Każda z 67 mikrokompetencji ma krótkie części: wideo (fragment lekcji od-do), notatka, szybki trening i zadania z arkusza CKE. Kolejność zależy od stylu nauki z kalibracji, po porażce najpierw wyjaśnienie, przy utrwalaniu bez wideo.
- **Lekcja dnia** pokazuje tylko części przypadające na dzisiejszą sesję (silnik dzieli części tematu na sesje).
- **Dane przykładowe**: `silnik/materialy.js` buduje kurs w kształcie API (kurs > rozdział > lekcja z fragmentami czasu). Notatki do trygonometrii i jej podstaw są pisane ręcznie (`NOTATKI`), pozostałe generowane z wymagań CKE i banku pytań.
- **Bramka do API**: `functions/api/maturalni/[[sciezka]].js` (Cloudflare Pages Function). Adres `/api/maturalni/lesson-plans/` przekazuje zapytanie do `https://backend.maturalni.com/lesson-plans/`. Token (jeśli potrzebny): zmienna `MATURALNI_TOKEN` w ustawieniach projektu w Cloudflare.
- **Import** (`#/import`): pobiera JSON z bramki albo z wklejenia, znajduje lekcje, przypisuje je do mikrokompetencji (słowa kluczowe z nazw), pozwala poprawić przypisanie i zapisuje w przeglądarce albo jako plik `silnik/materialy-maturalni.js` do repozytorium.
- **Kalendarz**: Google Calendar pokazuje co i kiedy. Opis wydarzenia zawiera dzisiejsze części, link do lekcji w aplikacji i zapasowy link do materiału Maturalnych.

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
| `functions/api/maturalni/` | bramka do API Maturalnych na Cloudflare | dev |
| `silnik/README.md` | opis API silnika | dev |

## Gdzie co zmieniać

- **Nowe pytanie**: `silnik/pytania.js`. Poprawna odpowiedź zawsze pierwsza (silnik miesza kolejność). Błędne odpowiedzi opisz w `bledy`, a jeśli błąd wynika z braku podstawy, zacznij od `PRE:ID-podstawy`.
- **Materiał do tematu**: `silnik/materialy.js`, klucz = id mikrokompetencji (np. `TR-05`), pola `fragment` i `minuty`.
- **Wagi działów**: `silnik/matryca.js`, pole `waga` w `DZIALY` (suma 100). To szacunek do weryfikacji na arkuszach CKE.
- **Progi i odstępy** (70%, 2-5-12-30 dni, bufor co 5. dzień): `KONFIG` na górze `silnik/silnik.js`.
- **Kompas**: w `index.html` stałe `Q`, `PATHS`, `PAIRS`, `SUBJECTS` (`active: true` włącza przedmiot). Status danych uczelni (`s`): `v` zasady 2027/28 z uchwały, `p` projekt 2027/28, `o` zasady 2026/27, `x` do sprawdzenia.

## Kolejna iteracja

- Prawdziwe lekcje z `lesson-plans` (bramka i import są gotowe, potrzebny dostęp/token).
- Google Calendar API (automatyczna synchronizacja zamiast importu .ics).
- AI (OpenRouter, po stronie serwera): analiza odpowiedzi z `stan.doAnalizyAI` i wskazówka do błędu.
- Powiadomienia push na telefon (service worker + serwer).

## Podgląd zmian dla zespołu

- **Push na `main`**: zmiana na stronie głównej po ok. minucie.
- **Push na inną gałąź**: własny adres podglądu (`nazwa-galezi.maturalni-4l1.pages.dev`), link pojawia się w pull requeście.

Jeśli zmiana nie jest widoczna, odśwież stronę z pominięciem pamięci podręcznej (Ctrl+Shift+R).

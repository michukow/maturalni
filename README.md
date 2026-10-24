# Kompas Maturalni

Test dla maturzystów w jednym pliku HTML. W 5 minut podpowiada ścieżkę zawodową, kierunki studiów, uczelnie i przedmioty maturalne.

## Jak działa

1. **Test predyspozycji (22 pytania)** – 10 pytań o osobowość (Wielka Piątka) i 12 o zainteresowania (RIASEC).
2. **Wynik** – Plan A i Plan B (dwie ścieżki), rola dopasowana do osobowości, kierunki, przedmioty maturalne i zasady rekrutacji na uczelniach.
3. **Diagnoza przedmiotowa** – wybór przedmiotu maturalnego. Dostępna jest matematyka. Moduł testu wiedzy jest do zbudowania (`#subject-module` w funkcji `viewSubject`).

Test można pominąć i przejść od razu do przedmiotów.

## Uruchomienie

Otwórz `index.html` w przeglądarce. Nie potrzeba serwera ani instalacji. Strona działa też na GitHub Pages.

## Gdzie co zmieniać

Wszystko jest w `index.html`, w sekcji `<script>`:

- `Q` – pytania testu,
- `PATHS` – ścieżki: kierunki, przedmioty, uczelnie (`oferty`) i wagi ról (`roles`),
- `PAIRS` – która para zainteresowań prowadzi do której ścieżki,
- `SUBJECTS` – przedmioty maturalne; `active: true` włącza przedmiot.

Status danych rekrutacyjnych przy uczelni (`s`): `v` – zasady 2027/28 z uchwały, `p` – projekt 2027/28, `o` – zasady 2026/27, `x` – do sprawdzenia.

Odpowiedzi ucznia zapisują się tylko w jego przeglądarce (localStorage).

## Podgląd zmian dla zespołu

Strona wdraża się automatycznie przez GitHub Actions, niezależnie od tego, kto zrobił commit.

- **Wersja główna** (gałąź `main`): https://michukow.github.io/maturalni/ – aktualizuje się ok. minutę po każdym pushu.
- **Podgląd pull requesta**: https://michukow.github.io/maturalni/pr-preview/pr-NUMER/ – link pojawia się sam w komentarzu w PR i odświeża przy każdym nowym commicie. Po zamknięciu PR podgląd znika.

Jak pracować:

1. Utwórz gałąź w tym repozytorium (nie w forku), np. `diagnoza-matematyka`.
2. Wypchnij zmiany i otwórz pull request.
3. Otwórz link z komentarza bota i przetestuj zmianę.
4. Po akceptacji scal PR do `main`.

Postęp wdrożeń widać w zakładce **Actions**. Jeśli zmiana nie jest widoczna, odśwież stronę z pominięciem pamięci podręcznej (Ctrl+Shift+R).

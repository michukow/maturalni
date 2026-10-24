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

Strona: **https://maturalni-4l1.pages.dev** – wdrażana przez Cloudflare Pages, połączone z tym repozytorium. Działa to niezależnie od tego, który współpracownik zrobił commit.

- **Push na `main`** – zmiana pojawia się na stronie głównej po ok. minucie.
- **Push na inną gałąź** – gałąź dostaje własny adres podglądu (`nazwa-galezi.maturalni-4l1.pages.dev`), a w pull requeście pojawia się link.

Postęp wdrożeń widać w panelu Cloudflare (Workers & Pages) oraz przy commitach na GitHubie. Jeśli zmiana nie jest widoczna, odśwież stronę z pominięciem pamięci podręcznej (Ctrl+Shift+R).

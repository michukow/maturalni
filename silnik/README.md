# Silnik mikrokompetencji (API)

Czysty JavaScript, bez bibliotek. Działa w przeglądarce (`<script src>`) i w Node (`require`). Daty jako tekst `RRRR-MM-DD`.

```html
<script src="silnik/matryca.js"></script>
<script src="silnik/pytania.js"></script>
<script src="silnik/materialy.js"></script>
<script src="silnik/silnik.js"></script>
<script> const S = Mikro.utworzSilnik(); </script>
```

## Jeden model wiedzy

Dla każdej mikrokompetencji: szacowany poziom (0-100%) i pewność. Kalibracja daje słaby szacunek, test go weryfikuje, quizy i powtórki aktualizują. Plan, prognoza i seria czytają ten sam `stan` (zwykły JSON, kilka KB, do localStorage).

## Funkcje

| Funkcja | Co robi |
|---|---|
| `nowyStan(ankieta, dzis)` | stan startowy. `ankieta = { cel, ocena, samoocena: { VII: 'slabo' }, dzialyPriorytetowe, tylkoPriorytetowe }` |
| `utworzTest(stan, typ, opcje, dzis)` | `typ`: `'diagnoza'` (`{ max, dzialy, pelna }`), `'jednostka'` (`{ komp, sprawdzenie }`), `'powtorka'` |
| `nastepnePytanie(stan, sesja)` | pytanie z pomieszanymi odpowiedziami, `powod`: `przeglad`/`cofniecie`/`wyzej` |
| `odpowiedz(stan, sesja, id, idx, dzis)` | `idx` z odpowiedzi (0 = poprawna), `-1` = „Nie wiem”. Zwraca przyczynę błędu |
| `zakonczTest(stan, sesja, dzis)` | diagnoza: prognoza i mapa; quiz: zaliczenie, odstęp powtórki, cofnięcie; powtórka: nowe odstępy |
| `zaplanuj(stan, org, dzis)` | plan od dziś. `org = { dataMatury, minutDziennie, dniTygodnia, godzina, blokady, dysleksja, dyskalkulia, preferencja }` |
| `oznaczSesje(stan, sesja, true, dzis)` | uczeń odhacza sesję nauki |
| `seria(stan, org, dzis)` | dni nauki z rzędu; wolne, święta i bufor nie przerywają |
| `prognoza(stan)`, `podsumujWiedze(stan)` | wynik matury z przedziałem; poziom w działach i umiejętnościach |
| `doIcs(plan)`, `linkGoogle(sesja)` | plik kalendarza; link do Google Calendar dla jednej sesji |
| `walidujDane()` | kontrola matrycy i banku pytań (błędy, brakujące pytania, cykle) |

## Algorytmy

| Kod | Zasada |
|---|---|
| A1 | od 70% opanowane, 40-69% do utrwalenia, poniżej 40% luka |
| A2 | test adaptacyjny: najpierw działy zgłoszone jako trudne, start od pytania średniego; źle > prerekwizyt (wskazany w tagu błędu), dobrze > trudniej; każdy dział min. 1 pytanie |
| A3 | prerekwizyt zawsze przed tematem zależnym; poza zakresem planu maks. 2 poziomy w dół |
| A4 | priorytet = punkty na maturze do zyskania na minutę nauki; dział wskazany przez ucznia pierwszy; cel < 50% pomija tematy trudne |
| A5 | co 5. dzień nauki buforowy (80% czasu), święta + własne blokady, niesprawdzone tematy = 5-minutowe sprawdzenie, diagnoza pełna ok. 5 razy do matury |
| A6 | zaliczenie od 70%; porażka > temat wraca na najbliższy termin z materiałem „najpierw wyjaśnienie”; 2 porażki > cofnięcie do podstaw + wpis do `stan.doAnalizyAI` |
| A7 | przeplanowanie = ponowne `zaplanuj()` od dziś |
| Powtórki | po zaliczeniu 2 dni (krócej przy wyniku < 80%, dłużej przy ≥ 90%), potem 5, 12, 30; błąd > jutro albo powrót do planu |

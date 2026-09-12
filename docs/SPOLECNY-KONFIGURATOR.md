# Společný konfigurátor TORO — plán a ověření

Zadání schválené 12. 9. 2026: dokončit první verzi pro předvedení, autonomně, bez publikace a bez odesílání poptávek. Výchozí revize `b6f3ba1ae50d28d06ebb60c4617bc06ac750ae9a` odpovídá ověřenému `origin/main`. Kořenové historické HTML není zdrojem implementace.

## Proveditelný postup

1. [x] Ověřit základnu, předání, katalog, ukládání a současné testy. Výchozí kontrola prošla: 61 doménových kontrol, normalizační audit, lint, TypeScript a build.
2. [x] Oddělit parametry kusu od identity a polohy; sdílet katalog, normalizaci a geometrii.
3. [x] Zavést společný stav: nezávislý koncept, volitelný pokoj a rozpracovaná editace konkrétní položky; bezpečný import, migrace, automatické ukládání a 40 kroků historie.
4. [x] Dokončit cestu skříně od samostatného náhledu přes vložení a úpravu v pokoji po export a import.
5. [x] Zpřístupnit všech 15 typů ve stejném editoru; ověřit relevantní pole a krajní rozměry.
6. [x] Ověřit nový/existující pokoj, limit 30 kusů, nedostatek místa, opakované vložení, zrušení editace, identitu, polohu, sítě a zneplatnění potvrzení.
7. [x] Dokončit poptávku skutečně samostatného kusu, pokojovou poptávku a převod původní skříně; stáhnout a znovu načíst výsledné soubory.
8. [x] Sjednotit vzhled a ovládání TORO, desktop a úzký mobil, klávesnici a náhradní náhled bez WebGL.
9. [x] Spustit konečné kontroly, browser scénáře a audit závislostí; vytvořit a ověřit offline ZIP, aktualizovat dokumentaci a předat zdroje.

## Přijímací scénáře

- Čistý vstup začíná jedním kusem bez místnosti; všechny katalogové typy mají vlastní meze a příslušná nastavení.
- Přepnutí režimů ani obnova stránky nezničí koncept, pokoj nebo rozpracovanou editaci. Poškozená či nedostupná data blokují automatické přepsání; obnova nejprve zálohuje původní záznam.
- Vložení kopíruje všechny parametry do nového ID, další vložení je vědomá další položka. Pokoj, otvory a sítě zůstávají zachované. Nemožné vložení nic nezmění.
- Editace z pokoje mění jen určenou položku; identita, vazby, stávající nábytek, poloha a natočení zůstanou. Rozměry se nesmrští podle pokoje, kolize zůstanou viditelné. Zrušení pokoj nezmění a samostatný koncept je stále dostupný.
- Samostatný export i poptávka neobsahují vymyšlený pokoj ani polohu. Staré pokojové verze 1–4 a skříň `forma-design-v1` lze otevřít; staré klíče se nemění.
- Pokoj zachová půdorysy L/U, otvory, technické sítě, historii, kontroly a oba poptávkové náhledy.
- Offline HTML používá pouze vložené prostředky; ověření musí odlišit soubor `file://` od místního serveru a emulovaný mobil od fyzického zařízení.

## Odložená roadmapa

Kapitola 27 architektury zůstává mimo první verzi: kuchyňský modul, detailnější vestavěné skříně, automatické návrhy, cenové odhady, účty/cloud, sdílení, komentáře, zakázkový systém a další výrobní pravidla. Cenotvorba, skutečný příjemce a doručování poptávek zůstávají nenapojené. Používají se označené ukázkové údaje.

## Výsledky

Všech devět etap je dokončených v místních zdrojích. Přesné výsledky, identifikace distribuce a hranice ověření jsou v [implementační zprávě](SPOLECNY-KONFIGURATOR-OVERENI.md). Balíček: `/Users/jenda/.codex/worktrees/683d/ToroWeb/zdrojove-soubory/outputs/TORO-prototyp-2026-09-12.zip`.

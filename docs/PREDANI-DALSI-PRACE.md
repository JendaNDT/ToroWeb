# ToroWeb — předání pro další práci

Stav k 11. 9. 2026. Pracovní složka: `/Users/jenda/Documents/ChatGPT/ToroWeb`, aplikace v `zdrojove-soubory/`.

## Co je uložené

Dosavadní prototyp zahrnuje 28 technických typů, 15 typů nábytku, šest sestav, pravoúhlé půdorysy L/U, výklenky a výstupky, více otvorů na stěně, potvrzování upozornění, úplný půdorys a 3D náhled v poptávce. Formát návrhu je 4; starší návrhy se převádějí. Podrobný rozsah a omezení uvádí [dokončení prototypu](DOKONCENI-PROTOTYPU.md).

Tato etapa navazuje na `a78cbaf`; zdrojové soubory a dokumentace jsou součástí verzované změny. Zadavatel schválil uložení dokončené etapy přímo do `main` na GitHubu. Při navázání načíst aktuální stav repozitáře a ověřit přítomnost tohoto předání a schválené architektury; původní commit `a78cbaf` je ještě neobsahuje.

## Schválená změna pro první verzi

Aktuální zadání je v [architektonickém plánu](../TORO-ARCHITEKTURA.md), především v úvodním rozhodnutí a kapitolách 3, 23, 25 a 28:

- Výchozí záložka **Jeden kus nábytku** pro všechny podporované typy, samostatný náhled a relevantní vlastnosti.
- Druhá záložka **Celý pokoj** s dosavadními nástroji prostoru a sítí.
- Akce **Vložit do pokoje** zachová parametry kusu i existující návrh místnosti.
- Z pokoje lze znovu upravit konkrétní kus stejným konfigurátorem, bez nechtěných kopií.
- Poptávka jednoho kusu může vzniknout bez modelování místnosti.
- Společný režim nahradí starý konfigurátor jedné skříně a zachová dřívější uložené návrhy.

Tato změna je schválená a zapsaná, ale její implementace zatím nezačala. Posledním požadavkem bylo uložit dokončenou etapu i dohodu na GitHub a připravit navázání v novém chatu. Současná volba „Jeden kus“ v nabídce sestav pouze vytvoří pokoj s jedním kusem; samostatný nový režim tím hotový není.

Hlavní plánovač již používá barvy a písma TORO. Ve starém konfigurátoru `/skrin` byly při porovnání s živým webem ověřeny odlišné nadpisy a hlavní tlačítka. Celé vizuální sjednocení proto dosud není dokončené; společný režim má tyto rozdíly odstranit.

## Platná rozhodnutí a hranice

První verze slouží k předvedení kamarádovi. Cenotvorba, příjemce a doručování poptávek zůstávají na výslovné přání zadavatele nenapojené. Ukázkové údaje jsou označené; skutečné podklady přijdou později. Budoucí rozšíření z kapitoly 27 nejsou automaticky součástí této přestavby.

## Ověření a balíček

- Poslední `npm run check` prošlo: 61 kontrol, audit 5 250 normalizačních případů, TypeScript a produkční sestavení. ESLint: žádné chyby, pět upozornění na běžné obrázky. Audit závislostí: nula známých zranitelností.
- Ověřené jsou ovládání myší, více otvorů, potvrzení a jeho zneplatnění, oba náhledy, mobilní rozložení a skutečné stažení i opětovný import v Chrome. Podrobnosti a limity ověření jsou v implementační zprávě.
- Balíček: `zdrojove-soubory/outputs/TORO-prototyp-2026-09-11.zip`, 3 650 433 bajtů, SHA-256 `73f80d4621c23c8f6348e0f775bc5aecfcd822ff74e078a0d2b1848829585871`.
- ZIP má ověřenou integritu a obsah. Samotné otevření HTML dvojklikem nebylo ověřeno, automatizovaný prohlížeč místní adresu nepovolil. Funkční průchod je ověřen přes místní server.
- Původní HTML v kořenu a dřívější balíček sítí jsou starší verze. Balíčky a výsledky testů v `outputs/` a `.sites-runtime/` jsou místní ignorované soubory.

Při předání byl produkční náhled na `http://127.0.0.1:8787/`; dostupnost je potřeba v novém chatu znovu ověřit. Po novém produkčním sestavení bylo nutné restartovat vlastní náhled, aby Wrangler načetl aktuální prostředky. Původní rozpracované návrhy v prohlížeči se při ověřování nepřepisují.

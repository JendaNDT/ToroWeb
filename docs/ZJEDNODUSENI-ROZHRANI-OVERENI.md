# TORO — jednodušší ovládání, výsledek a ověření

Dokončeno místně 12. 9. 2026 v `/Users/jenda/.codex/worktrees/683d/ToroWeb`. Navazuje na společný konfigurátor v revizi `1d31b87643ef5468377f6fe3d6370800c672eaa7`. [Plán zákaznické cesty](ZJEDNODUSENI-ROZHRANI.md) je provedený. Tato zpráva dokládá místní implementaci a skutečné browserové ověření; přenos do GitHubu a vzdálené CI se ověřují zvlášť v závěrečném předání.

## Co se pro zákazníka změnilo

| Dříve | Nyní |
| --- | --- |
| Velký úvod, opakovaný název kusu a několik doprovodných nadpisů. | Kompaktní název a výběr kusu, větší podíl pracovní plochy. |
| Název kusu, provedení i úchytky stále mezi hlavními volbami. | Tři základní rozměry; tematické detaily ukazují aktuální název, lamino/masiv nebo úchytky i zavřené. |
| Rozptýlené ukládání, načtení, exporty a zálohy. | Jedna nabídka **Návrh** v obou režimech; obsahuje i původní skříň a zálohu kusu, pokoje a rozpracované editace. |
| Úplný editor kusu také uvnitř pokojového panelu. | Přehled a umístění; **Upravit rozměry a provedení** otevře společný editor konkrétní položky. |
| Rozměry, tvar, vzhled a otvory v jednom dlouhém panelu. | Čtyři přímé záložky: Rozměry, Tvar, Dveře a okna, Vzhled. |
| Katalog nábytku před seznamem pokoje. | Nejprve vlastní kusy, nabídka 15 typů přes **Přidat nábytek**. |
| Další měření a poznámky sítí zabírají panel. | Rozměry, přístup/přiřazení a označení/poznámka mají samostatné detaily se skutečnými hodnotami. |
| Nejednoznačné „Zpět“ mezi kroky. | **Předchozí** krok je oddělený od historie změn v hlavičce. Dialogy a mobilní panely vracejí fokus. |

Materiály, uspořádání a čela zůstávají přímými kroky podle typu. Vnitřek se při uspořádání automaticky odkryje. Poptávka má stručnější přehled, rozbalovací soupis sítí a údaje termínu/montáže se shrnutím. Výsledek se stále ukládá pouze do souboru.

Číselné umístění kusu nyní zobrazuje vzdálenost od levého a zadního okraje ke středu kusu. Uložené souřadnice a prostorová pravidla zůstávají stejné. Název, výška zavěšení, natočení, vlastnictví, přisunutí ke stěně, kopie a odstranění jsou zachované.

## Nalezené a opravené vady

- Indikátor uložení porovnával dvě různě seřazené serializace téhož pokoje, takže mohl trvale ukazovat „Ukládám změny…“ i po úspěšném uložení. Nyní porovnává shodně normalizovaný stav. Automatické uložení importovaného pokoje a hlášení „Uloženo v tomto prohlížeči“ ověřuje browserový scénář.
- Volba nástroje na desktopu nastavovala skrytý příznak otevřeného mobilního panelu. Zúžení okna pak nečekaně otevřelo panel. Panel se nyní otevírá jen při akci na mobilním rozložení.
- Dialogy otevřené bez přímého Radix triggeru neměly spolehlivý cíl pro návrat fokusu. Uchovávají původní ovládací prvek; mobilní panel vrací fokus na svůj spouštěč. Přechod do společného editoru a návrat do pokoje zaměřuje příslušný pracovní kontext.
- Načtení souboru přes společnou nabídku Návrh zruší rozpracované umísťování a výběr z předchozího pokoje. Obnovení původního chování ověřuje import během aktivního umísťování technického prvku včetně přesné shody načteného návrhu.

Změny se netýkají datových schémat, migrací, katalogu, geometrie nebo obchodních pravidel. Ochrana poškozených a souběžně měněných uložených dat zůstává zachovaná.

## Aktuální ověření

| Kontrola | Výsledek |
| --- | --- |
| `npm run check` | Prošlo: 81 doménových kontrol, geometrické regrese, audit 5 250 normalizačních případů, lint, TypeScript a produkční build. |
| Geometrické pokrytí | 1 080 obálek nábytku, 708 technických variant, 14 vnitřních stěn a 120 krajních variant samostatného kusu včetně obou orientací kamery. |
| Konečný lint | 0 chyb; 7 dosavadních upozornění na běžné obrázky pro logo, náhledy a fotografie. |
| Hlavní browserová sada na rozbaleném HTML | **16 skupin prošlo**. Všech 15 typů, koncept/pokoj, vložení, editace/zrušení/obnova, poptávky, skutečné soubory a zpětné importy, mobilní rozložení, poškozená data a chybějící WebGL. |
| Mezní sada na místním serveru | **8 skupin prošlo**. Nedostatek místa, 30 kusů, zachování přípojek a polohy, kolize/potvrzení, klávesnice, konflikt a odmítnutí úložiště, automatické migrace, `/skrin`, pokoj bez WebGL. |
| Rozšířená zákaznická cesta na rozbaleném HTML | **7 skupin prošlo**. Skutečné úpravy parametrů všech 15 druhů a 28 technických typů, všechny povrchy, konstrukce, rozložení, čela/úchytky, zamčení, přiřazení, kopie/odstranění, filtry, sestavy přípojek, L/U/výklenek, otvory, vzhled, šest sestav pokoje, soubory, poptávka s fotografií a nepovinnými údaji. |
| Klávesnice a mobil | Nabídka Návrh přes Enter/šipky/Escape, nativní rozbalení, návrat z dialogů, kroky bez vracení dat, šířky 320/390/768 px, návrat fokusu z panelu a editace. Navíc samostatný emulovaný dotykový průchod skutečnými tap akcemi. |
| Offline síť a konzole | Obě konečné offline sady: **0 HTTP požadavků, 0 neošetřených chyb, 0 chyb/varování konzole**. Použito skutečné `file://` a kontext s vypnutou sítí. |
| ZIP | Čtyři položky, kontrola CRC a přesné shody rozbalených souborů; původní ZIP zachovává původní SHA-256. |
| Srovnání před/po | Čtyři přepínatelné pohledy, načtení všech snímků a odkazy na plnou velikost ověřené při 1 440 a 390 px, bez vodorovného přetečení, chyb nebo síťových požadavků. |

Logy a opakovatelné důkazy jsou v `zdrojove-soubory/.sites-runtime/ux-tests/`: `check.log`, `final-lint.log`, `edges/results.json`, `offline-browser/results.json`, `offline-journey/results.json`, `package.log`. Browserové scénáře jsou ve zdrojích `scripts/test-browser.mjs`, `test-browser-edges.mjs` a `test-browser-ux.mjs`. Test importu čeká na skutečné dokončení čtení souboru; nespoléhá na pouhé přiřazení souboru vstupnímu prvku.

## Balíček a snímky

- **Nový ZIP:** `/Users/jenda/.codex/worktrees/683d/ToroWeb/zdrojove-soubory/outputs/TORO-jednoduche-ovladani-2026-09-12.zip`
- Velikost: **3 675 775 B**.
- SHA-256: `c4bd0a645de4b0a3432755663026bcdfb692ce23e651b2e0f25e994ffbb60e8b`.
- Otisk sestavených prostředků: `b55dd9b6a85534ad3794bdbbd552904f22332083b418e7b6e46483b2bcac6c82`.
- HTML: 6 874 787 B, vložené prostředky a licence 116 balíčků; rozbalit a otevřít `TORO-ukazka/TORO-otevrit.html`.
- Manifest přesně uvádí základ `1d31b87` a pracovní kopii s místními změnami; balíček vznikl před uložením konečného commitu. Obsah identifikuje uvedený otisk.
- **Snímky po úpravě:** `/Users/jenda/.codex/worktrees/683d/ToroWeb/zdrojove-soubory/outputs/TORO-UX-po/` — `jeden-kus-desktop.png`, `pokoj-desktop.png`, `jeden-kus-mobil.png`, `pokoj-mobil.png`, `pokoj-nastroje-mobil.png`, `navrh-menu-mobil.png`, `materialy-desktop.png`.
- **Srovnávací snímky před úpravou:** stejná základní cesta, složka `TORO-UX-pred/`. Snímky pocházejí z původního zachovaného HTML a nové rozbalené ukázky; čeká se na skutečný náhled a dokončení animací.
- **Přehled před/po:** `/Users/jenda/.codex/worktrees/683d/ToroWeb/zdrojove-soubory/outputs/TORO-UX-porovnani.html`.

Původní `TORO-prototyp-2026-09-12.zip` má nadále SHA-256 `7a24f9138c2e944146f97545abc5266636a94638f2b26512e8ca89490abc5136`. Dřívější snímky `TORO-nahled-*.png` a historické kořenové HTML zůstávají zachované. Distribuce, snímky a logy jsou ignorované místní artefakty, nikoli součást zdrojového commitu.

## Hranice ověření

Chrome 152.0.7977.83 na macOS, automatické browserové scénáře a emulované mobilní šířky/dotyk. Nejde o test fyzického telefonu, Windows, Safari ani úplný audit přístupnosti nebo uživatelskou studii. Výrobní proveditelnost a zaměření musí ověřit TORO. Cena, skutečný příjemce/doručení poptávek, cloud/účty a budoucí roadmapa zůstávají odložené. Veřejný web TORO nebyl nasazen a žádná poptávka ani kontakt nebyly odeslány.

# TORO — společný konfigurátor: implementace a ověření

Dokončeno místně 12. 9. 2026 v `/Users/jenda/.codex/worktrees/683d/ToroWeb`. [Schválený devítietapový plán](SPOLECNY-KONFIGURATOR.md) je splněný v rozsahu předváděcí první verze. Zdrojová základna `b6f3ba1ae50d28d06ebb60c4617bc06ac750ae9a` byla při zahájení ověřena proti hlavní větvi GitHubu. Nové změny jsou na místní větvi `codex/spolecny-konfigurator-v1`; tato práce je neodesílala na GitHub a nic nenasazovala na web TORO.

## Co je implementované

Výchozí záložka **Jeden kus nábytku** nabízí všech 15 podporovaných typů. Samostatný náhled používá stejnou skutečnou geometrii jako pokoj. Editor obsahuje pouze vlastnosti daného typu; umístění, výška zavěšení vůči podlaze, stěny a technické sítě patří do pokoje. Samostatný kus, jeho soubor i poptávka existují bez místnosti.

| Typy | Typová nastavení nad společnými rozměry, názvem a materiálem |
| --- | --- |
| Šatní a vestavěná skříň | Sekce, ramínka/police/zásuvky, otevřená/otočná/posuvná čela, dekor čel a úchytky. |
| Botník, komoda, knihovna, TV skříňka | Počet sekcí, police nebo zásuvky, příslušná čela. |
| Police, lavice, věšákový panel, zrcadlo, stůl | Tloušťka police, povrch/rám, kovová podnož tam, kde je použitá, počet háčků u panelu. |
| Umyvadlová a prádelní skříňka | Jedno/dvě umyvadla a zásuvky; spotřebiče nad sebou/vedle sebe, odpovídající minimální šířka. |
| Postel, atypický kus | Vnější rozměry a materiál; rám/čelo/matrace u postele, vlastní textové zadání atypu. |

**Celý pokoj** zachovává dosavadní nástroje: pravoúhlé L/U půdorysy a jejich úpravy, více otvorů, 28 technických typů, šest sestav, rozmístění, výšku zavěšení, natočení, kontroly a poptávku s oběma náhledy. Samostatný kus se vloží do existujícího pokoje bez změny parametrů a ostatních dat. Hledá se volná poloha včetně otočení; neurčená výška zavěšení se při vložení přizpůsobí dostupné stěně. Příliš vysoký/velký kus se nezmenšuje. Pokud místo chybí nebo pokoj již má 30 kusů, vložení nic nezmění. Při chybějícím pokoji se nabídne jeho vytvoření a kus zůstane zachovaný.

Úprava konkrétní položky z pokoje pracuje s konceptem. Potvrzení mění stejnou položku, zrušení pokoj nemění. ID, přesné souřadnice, natočení, označení stávajícího kusu a vazby technických bodů zůstávají zachované. Rozšíření do kolize se neřeší skrytým přesunem nebo zmenšením: Kontrola jej ukáže a otisk starého potvrzení se zneplatní. Původní samostatný koncept zůstává nezávislý. Změna či odstranění původního kusu během rozpracované editace zabrání přepsání zastaralou úpravou.

## Stav, formáty a migrace

- `FurnitureConfiguration` odděluje parametry produktu od identity, umístění a označení stávajícího nábytku. `normalizeFurniture` nečte místnost. Původní pokojová normalizace nad tímto sdíleným základem zachovává své prostorové chování.
- `toro-workspace-v1` ukládá společně samostatný koncept, volitelný pokoj, režim a rozpracovanou editaci. Obnova se dokončí před povolením automatického ukládání. Historie během relace obsahuje posledních 40 změn; přepínání režimu komponenty bezpečně uvolní a data zůstanou ve společném stavu.
- Samostatný export `toro-furniture` v1 neobsahuje pokoj, souřadnice, identitu pokojové položky ani sítě. Pokoj zůstává ve formátu 4. Celé prostředí lze stáhnout jako samostatnou zálohu; poptávková obálka `toro-inquiry` v1 obsahuje příslušný druh návrhu.
- Automatická migrace čte `toro-room-v4`, starší pokojové klíče a `forma-design-v1`. Podporované pokojové verze 1–4 zachovávají zaměřené hodnoty. Staré klíče se nepřepisují.
- Původní skříňové soubory i staré poptávky se známým výslovným označením pomocné místnosti se převádějí na samostatný kus. Běžný pokoj s jednou skříní se za samostatnou skříň neodhaduje. `/skrin` nyní používá stejné prostředí; původní duplicitní editor a jeho samostatná scéna jsou nahrazené.
- Poškozený současný záznam se automaticky nenahrazuje výchozím nebo starším návrhem. Selhání čtení/zápisu i souběžná změna v jiném okně zastaví ukládání. Výslovná obnova nejprve zálohuje původní současný záznam; selhání zálohy nepovolí přepsání. Soubor lze stáhnout i při úplně nedostupném localStorage.

## Vzhled a chybové stavy

Obě záložky používají TORO oranžovou `#F1980B`, tmavou `#1B130C`, teplé světlé plochy, lokální Poppins/Inter a jednotné hlavní akce. Na telefonu je u samostatného kusu náhled před formulářem; pokoj zachovává své vysouvací nástroje. Klávesnice ovládá číselná pole, dialogy, historii a posun/natočení vybraného kusu v pokoji.

Kamera zohledňuje šířku, výšku, hloubku, přesah čel i rozměrové popisky. Ověřená je geometrie všech typů na minimech a maximech v portrétním i širokém náhledu. Při nedostupném WebGL zůstává samostatné rozměrové schéma nebo úplný půdorys pokoje; pokojová poptávka zachová půdorys a výslovně uvede nedostupný 3D náhled. Uvolňování scény při přepínání ukončuje i WebGL kontext.

Skutečný offline test odhalil překrytí mobilního panelu tmavou vrstvou. Panel nyní dostává vyšší vrstvu než jeho pozadí. Oprava byla znovu ověřena běžným kliknutím na zavření panelu v celé offline sadě.

## Ověření

| Kontrola | Aktuální výsledek |
| --- | --- |
| Výchozí stav před změnami | 61 doménových kontrol, normalizační audit, lint, TypeScript a produkční build prošly. |
| Konečné `npm run check` | Prošlo: 33 kontrol pokoje + 16 sítí + 12 architektury + 20 společného prostředí, celkem **81**. |
| Geometrické regrese | Zachováno 1 080 obálek nábytku, 708 technických variant, 14 vnitřních stěn; navíc 120 krajních variant samostatného nábytku a obě orientace kamer. |
| Normalizace | Audit 5 250 případů bez selhání. |
| ESLint a TypeScript | Žádné chyby. Sedm upozornění ESLintu na běžné obrázky používané pro logo, lokální/data náhledy a fotografie; TypeScript prošel. |
| Produkční build | Úspěšný. Vinext uvádí obecné informativní omezení statického rozpoznání druhu rout, sestavení dokončí. |
| Závislosti | `npm audit --audit-level=moderate`: nula známých zranitelností. |
| Hlavní browserový průchod | 15 skupin scénářů na místním serveru, všech 15 typů, skutečná stažení/importy, oba režimy i poptávky. Žádné chyby ani varování konzole. |
| Mezní browserové scénáře | Osm skupin: nedostatek místa, limit 30, zachování přípojek/polohy, zneplatnění potvrzení a klávesnice, konflikt úložiště, odmítnuté úložiště, automatické migrace a `/skrin`, pokojový fallback bez WebGL. Bez neošetřených browserových chyb. |
| Mobilní rozložení | Šířky 320, 390 a 768 px v Chrome; ověřen samostatný kus, pokoj, panel i kontaktní formulář bez vodorovného přetékání v testovaných stavech. |
| Skutečné soubory | Stažen a načten `TORO-kus.json`, samostatná poptávka a pokojová poptávka. Ověřené parametry, kontakt, PNG náhled, pokojový SVG půdorys a sítě. Stažen i textový soupis samostatného atypu bez pokojových údajů. |
| Konečný offline běh | Celý hlavní průchod přes `file://` v Chrome na macOS s vypnutou sítí, včetně mobilního panelu, stahování, importů, migrací a fallbacku. **Nula HTTP požadavků, chyb i varování konzole.** |
| Doplňkový offline průchod | Skutečně vykreslen atyp 500 × 400 × 400 cm a postel 240 × 140 × 240 cm; skříň široká 300 cm se vložila otočená o 90° do pokoje širokého 120 cm bez změny rozměrů. Chrome 152.0.7977.83. |

Opakovatelné sady jsou `scripts/test-workspace.mjs`, `scripts/test-browser.mjs` a `scripts/test-browser-edges.mjs`. Doménová sada je součástí `npm run check`; browserové sady mají popsané parametry v README aplikace. Používaly izolované kontexty Chrome a pouze vlastní ukázková data.

Důkazy jsou v `/Users/jenda/.codex/worktrees/683d/ToroWeb/zdrojove-soubory/.sites-runtime/single-tests/`: `final-check.log`, `dependency-audit.json`, `browser/results.json`, `edges/results.json`, `offline-browser/results.json`, `artifacts.log`, snímky a skutečně stažené JSON/TXT soubory. Tato složka je lokální a ignorovaná Gitem.

## Balíček pro předvedení

- ZIP: `/Users/jenda/.codex/worktrees/683d/ToroWeb/zdrojove-soubory/outputs/TORO-prototyp-2026-09-12.zip`
- Velikost: **3 654 533 bajtů**.
- SHA-256: `7a24f9138c2e944146f97545abc5266636a94638f2b26512e8ca89490abc5136`.
- Otisk sestavených prostředků: `d2a96727e1e98ecbfe2839a910faa1eb597aa7fe7bf104da9f8ded32ee99250d`.
- HTML: 6 807 328 bajtů, samostatný dokument se všemi prostředky.
- Obsah archivu: `TORO-ukazka/TORO-otevrit.html`, `ZACNI-TADY.txt`, `VERZE.txt`, `LICENCE-KNIHOVEN.txt`; licence 116 použitých knihoven a součástí.
- ZIP má ověřené CRC, obsah a shodu každého souboru se sestavením; skript navíc kontroluje syntaxi vloženého JavaScriptu, CSS prostředky a licence. Neobsahuje uživatelské návrhy ani fotografie.
- Distribuce vznikla z dokončených místních zdrojů před jejich místním commitem. Pole „Výchozí commit“ proto správně uvádí `b6f3ba1…`; konkrétní obsah identifikuje uvedený otisk prostředků. Kořenové historické HTML se neměnilo.

Rozbalte ZIP a otevřete `TORO-ukazka/TORO-otevrit.html`. Pro samotného příjemce nejsou potřeba Node.js, server, instalace ani internet. Pro zachování a přenos návrhu použijte stažený JSON; chování localStorage pro místní soubory závisí na prohlížeči a umístění HTML.

Čisté finální snímky:

- `/Users/jenda/.codex/worktrees/683d/ToroWeb/zdrojove-soubory/outputs/TORO-nahled-desktop.png`
- `/Users/jenda/.codex/worktrees/683d/ToroWeb/zdrojove-soubory/outputs/TORO-nahled-mobil.png`
- `/Users/jenda/.codex/worktrees/683d/ToroWeb/zdrojove-soubory/outputs/TORO-nahled-atyp-maximum.png`

## Hranice předání

Jde o dokončenou místní předváděcí verzi a ověřený offline balíček. GitHub CI pro tuto změnu neběželo, protože změna nebyla pushnutá; neproběhlo nasazení na veřejný web. Ověření proběhlo v Chrome na macOS a s emulovanými šířkami, nikoli na fyzickém telefonu nebo Windows. Nejde o úplný audit přístupnosti ani výrobní validaci nábytku.

Ceny, skutečný příjemce a doručování poptávek zůstávají podle zadání nenapojené. Nic se samo neodesílá. Kuchyňský modul, detailnější vestavby, automatiky, účty/cloud, sdílení, komentáře, zakázkový systém a další pravidla kapitoly 27 zůstávají odložené. Atyp je prostorová obálka se zadáním, nikoli editor libovolné geometrie. Půdorysy jsou pravoúhlé; konstrukci, kotvení, přípojky a montážní podmínky musí upřesnit TORO.

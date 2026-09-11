# Opravy auditu ToroWeb — 11. září 2026

Všech sedm podstatných nálezů A01–A07 je opraveno v místním pracovním stromu. Produkční sestavení i rozšířené kontroly prošly. Zpráva zachycuje místní ověření před odesláním na GitHub; není potvrzením veřejného nasazení. Běžný náhled používá `http://localhost:5173/`.

## Opravy

| Nález | Změna | Ověření |
| --- | --- | --- |
| A01: desetinná zásuvka po importu nejde znovu načíst | Souřadnice se zaokrouhlí před konečným omezením na stěnu. Výstup převodu návrhu se znovu validuje. Stejné pořadí zaokrouhlení a omezení se používá při umisťování nábytku. | Regrese konců všech čtyř stěn, desetinné šířky/výšky a opakované uložení/načtení. Původní auditní soubor se v produkčním náhledu importoval, automaticky uložil a obnovil bez chyby. |
| A02: zranitelné závislosti | Aktualizován framework a jeho kompatibilní závislosti, opraveny nepřímé závislosti. Podrobnosti níže. | `npm audit --json`: **0 zranitelností** v celém stromu. `npm ls --all`: úspěch bez konfliktů. Build a obě routy fungují. |
| A03: kolize ignorují přesah čel a kování | Rozměry korpusu zůstávají zachované. Sdílený půdorysný obal připočítává čela, úchytky a další přední přesahy, včetně posunu středu obalu po otočení. Používá se pro kolize, hranice místnosti, přichycení ke stěně/sousedovi a výběrový obrys scény. Vlastnosti a textový soupis vysvětlují celkovou hloubku. | Porovnání obalu s `THREE.Box3` skutečného modelu v **936 variantách**: 13 typů, 3 velikosti, 3 provedení dveří, 4 rotace, čela zobrazená/skrytá. Dále kontrola skutečného přesahu do stěny a sousedního kusu. |
| A04: zavření poptávky zahodí koncept | Identita formuláře samostatné skříně už nezávisí na pořadovém čísle pořizovaného náhledu. Opětovné otevření nepřipojí novou prázdnou instanci formuláře. | V produkčním náhledu vyplněno jméno a poznámka, přidán PNG, dialog zavřen a znovu otevřen. Všechny tři položky zůstaly zachované. |
| A05: ukládání po chybě nelze obnovit | Chybové hlášení nabízí „Obnovit ukládání“ s vysvětlením účinku. Původní záznam se před zápisem aktuálního návrhu uloží pod jedinečným záložním klíčem. Chyba zálohy přepis zablokuje. Úspěšná obnova zruší chybový stav a zapne automatické ukládání. | Testy neplatného záznamu, selhání zálohy a selhání hlavního zápisu. V prohlížeči: simulovaná chyba → platný import → obnova → kontrola původních bajtů v záloze → reload → další změna → automatické uložení a reload. |
| A06: lint selhává na generovaných souborech | ESLint ignoruje `.sites-runtime` a `.wrangler`. Odstraněn nepoužitý import v testu. Přidán společný příkaz `npm run check` a GitHub Actions workflow pro PR a push na main. | Celý lint končí kódem 0. Zůstávají tři dosavadní varování pro běžné obrázky; nejde o chyby. Zde je doloženo místní ověření; výsledek vzdáleného běhu uvádí kontrola připojená k pull requestu. |
| A07: textový soupis neobsahuje kolize | Textový generátor přidává část „KONTROLA NÁVRHU“ včetně závažnosti upozornění nebo informace o nenalezených kolizích. Dialog předává stejný aktuální seznam do textu i JSON. | Regrese návrhu s překrytím a bez kolizí, shoda upozornění v souhrnu a JSON. |

## Závislosti

Hlavní aktualizace:

- Next a ESLint konfigurace Next: 16.3.5.
- React, React DOM a React Server Components: 19.2.8.
- vinext: 1.0.0-beta.9; Vite: 8.3.0.
- React plugin: 6.1.1; RSC plugin: 0.5.34.
- Cloudflare Vite plugin: 1.54.8; Wrangler: 4.131.1; odpovídající Workers types: 5.20260911.1.

Zamykací soubor byl aktualizován společně s manifestem. Nepoužilo se `--force` ani `--legacy-peer-deps`.

Drizzle Kit 0.31.10 stále přiváděl starý esbuild přes `@esbuild-kit/core-utils`. Proto je v `overrides` **pouze pro tento balíček** nastaven esbuild 0.25.12. Kompatibilita byla ověřena synchronním i asynchronním překladem TypeScriptu přes tento loader a skutečným vygenerováním SQLite migrace z testovacího schématu. Test zapisoval pouze do ignorované složky `.sites-runtime/audit`; nepracoval s databází aplikace. Omezení lze odstranit, až jej nahradí opravená vlastní závislost Drizzle.

Bezpečnostní výsledek je stav databáze npm v okamžiku kontroly, nikoli trvalá záruka. Nový workflow spouští audit se selháním při střední nebo vyšší závažnosti.

## Výsledky kontrol

- `npm run check`: **úspěch**, zahrnuje následující kontroly i produkční build.
- **33 doménových testů**, včetně původních 78 variant modelů a nových 936 kontrol fyzického obalu.
- Původní auditní reprodukční skript: **4 550 validních normalizací, prázdný seznam selhání**.
- TypeScript: úspěch.
- Celoprojektový ESLint: 0 chyb, 3 varování pro `<img>`.
- `npm audit --json`: **0 kritických, 0 vysokých, 0 středních, 0 nízkých nálezů**.
- `npm ls --all`: úspěch.
- `git diff --check`: úspěch.
- Oddělený místní produkční běh: funkční `/` a `/skrin`, WebGL a průchod poptávkou.
- Ovládání: otočení skříně tlačítkem, posun klávesou, vrácení obou změn samostatně, skutečné tažení skříně za čelo ve 3D a vrácení celého tahu jedním krokem historie.
- Při šířce **320 px** se nabídka obnovy ukládání vešla do dokumentu bez vodorovného přesahu a tlačítko fungovalo.

Pro kontrolu chybového startu bylo pozměněno pouze úložiště samostatného testovacího náhledu na `127.0.0.1:8787`. Testovací přerušení zápisu skončilo obnovením stránky; záloha původního testovacího záznamu byla následně ověřena. Návrh uživatele na `localhost:5173` nebyl nahrazován testovacími daty.

## Hranice a další práce

Opravy uzavírají A01–A07. Další doporučení původního auditu, zejména rozmisťování překrývajících se popisků, optimalizace velké textury/fontů a rozšíření technických bodů, zůstávají další prací. Build nadále upozorňuje na větší sdílený 3D soubor.

Zachování konceptu poptávky je ověřené při zavření a opětovném otevření dialogu; kontaktní údaje a fotografie se tím nezačaly ukládat do místnosti ani do cloudu. Plné obnovení stránky je nadále ztratí podle dosavadního režimu prototypu.

Oprava obsahu textového exportu je ověřená společným generátorem a regresí. Skutečné uložení staženého souboru na disk není v tomto prostředí potvrzené. Nebyl proveden test na fyzickém telefonu, Safari/Firefox/Windows ani veřejné nasazení. Výsledek workflow pro odeslaný commit je dostupný u příslušného pull requestu na GitHubu.

## Opakování

V adresáři `zdrojove-soubory`:

```sh
npm run check
npm audit --audit-level=moderate
```

Místní protokoly jsou v `.sites-runtime/audit/repair-check.log`, `npm-audit-fixed.json` a `dependency-tree.txt`. Tato složka se nepublikuje. Workflow pro automatické opakování je v `.github/workflows/check.yml`.

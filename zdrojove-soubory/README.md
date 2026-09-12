# TORO Interiors — prototyp plánovače nábytku

Český prototyp přizpůsobený sortimentu TORO Interiors (in-toro.com). React 19, TypeScript, vinext a Three.js.

## Jeden kus a celý pokoj

Výchozí **Jeden kus nábytku** nabízí všech 15 typů ve společném editoru a samostatném 3D náhledu. **Celý pokoj** zachovává půdorysy, otvory, sítě, kontroly a poptávku. Přepnutí zachová oba koncepty; z pokoje se konkrétní položka upravuje s potvrzením nebo zrušením, při zachování identity, přesné polohy a technických vazeb. Samostatná poptávka nepotřebuje místnost. Podrobný [plán společného prostředí](../docs/SPOLECNY-KONFIGURATOR.md). Novou cestu zákazníka popisuje [zjednodušení ovládání](../docs/ZJEDNODUSENI-ROZHRANI.md) a [aktuální ověření](../docs/ZJEDNODUSENI-ROZHRANI-OVERENI.md).

Rozměry, materiály, uspořádání a čela mají přímé kroky. Detaily ukazují současné provedení i v zavřeném stavu. Soubory a zálohy jsou v nabídce **Návrh**, historie změn zůstává v hlavičce. Prostor má čtyři skupiny: Rozměry, Tvar, Dveře a okna, Vzhled.

## Technické prvky a sítě

Plánovač používá pět sekcí Prostor, Nábytek, Technické prvky, Kontrola a Poptávka. Katalog obsahuje 28 typů v osmi kategoriích: elektřina, voda, odpad, plyn, topení, větrání, data a pevné překážky / servis. Podporované plochy závisí na typu prvku; zahrnují stěnu, podlahu, strop i volný prostor. K dispozici jsou přesné rozměry, tažení, zámek polohy, vazby na nábytek, skupiny přípojek a samostatná kontrola fyzického objemu a přístupu.

Pokoj používá **verzi 4**; jeho import přijímá i verze 1, 2 a 3. Nový klíč `toro-workspace-v1` ukládá koncept samostatného kusu, volitelný pokoj, aktivní režim a rozpracovanou editaci. Export samostatného kusu má formát `toro-furniture` v1. Staré uložené klíče zůstávají zachované. Rozsah a ověření popisuje [dokončení prototypu](../docs/DOKONCENI-PROTOTYPU.md) a [implementace sítí](../docs/TECHNICKE-PRVKY-IMPLEMENTACE.md), předchozí stav [první etapa](../docs/PRVNI-ETAPA.md).

## Spuštění

Node.js 22.13 nebo novější, závislosti podle přiloženého zámku:

```sh
npm ci
node scripts/run-framework.mjs dev
```

- `http://localhost:5173/` — společné prostředí, ve výchozím stavu jeden kus bez pokoje.
- `http://localhost:5173/skrin` — stejný společný konfigurátor, včetně převodu původních uložených skříní.

## Plánovač pokoje

- Pravoúhlý půdorys: obdélník, L, U, úpravy stěn a přidávání výklenků či výstupků. Až 32 vrcholů; šířka a délka 120–1000 cm, výška 220–400 cm. Podlaha, stěny, umístění a kolize používají skutečný polygon.
- Barvy stěn, tři podlahy, skutečné otvory pro dveře a okna. Až 40 otvorů, včetně více otvorů na stejné stěně nebo nad sebou; překrytí a přesahy hlásí Kontrola.
- 15 druhů: šatní a vestavěné skříně, botníky, komody, knihovny, nástěnné police, lavice, věšákové panely, zrcadla, umyvadlové a prádelní skříně, pracovní stoly, TV skříňky, postele a atypické kusy se zadáním. Nejvýše 30 kusů v návrhu.
- Šest sestav: předsíň, koupelna, šatna, pracovna, obývací pokoj a ložnice do L. Lze začít i jedním kusem nebo prázdným pokojem. Výměnu sestavy lze vrátit.
- Každý kus má vlastní rozměry, materiály, vnitřní uspořádání, polohu a otočení po 90 stupních.
- Panel vybraného kusu ukazuje stručný přehled a umístění. Akce „Upravit rozměry a provedení“ otevře společný editor tohoto konkrétního kusu, nezakládá kopii. Vlastnictví, přisunutí ke stěně a další akce mají samostatné rozbalení.
- Rozměry se mění posuvníkem nebo přesným číslem. Dekory mají pojmenované vzorky; jednotlivé sekce skříní se vybírají obrázkovými kartami. U komod, botníků a knihoven lze nastavit počet sekcí a zásuvek či polic v každé sekci.
- Krok Uspořádání odkryje vnitřek, krok Dvířka / Čela zobrazí čela. Pozice a natočení se upravují v pokoji. Číselná pole ukazují vzdálenost od levého a zadního okraje ke středu kusu; uložené souřadnice X/Z se tím nemění.
- Vestavěná skříň má posuvná čela a obvodové lišty; její výšku lze přizpůsobit stropu s 2cm rezervou.
- Výška zavěšení u polic, panelů, zrcadel, umyvadlových a TV skříněk. Jedno/dvě umyvadla, počet háčků, pračka/sušička nad sebou či vedle sebe. Lamino nebo olejovaný masiv; pro masiv pouze dřevěné povrchy.
- Přetahování nábytku v 3D i půdorysu, přichycení k rastru 5 cm a ke stěnám i navazujícím kusům, přesné číselné umístění.
- Přisunutí k vybrané stěně automaticky natočí čelo do pokoje.
- Při zaměření pracovní plochy šipky posouvají kus o 10 cm, se Shiftem o 1 cm.
- Vrácení a obnovení posledních 40 změn, duplikování a odstranění kusů.
- Kontrola překrývání se zohledněním výšky, přesahu mimo pokoj a prostoru u dveří a oken.
- Cenotvorba není napojená. Zástupné obchodní údaje jsou označené; pro předvedení kontaktu slouží tlačítko „Doplnit ukázkové údaje“.
- Upozornění lze vzít na vědomí. Ukládá se datum a otisk souvisejících údajů; změna vyžaduje nové potvrzení. Problémy zůstávají viditelné a jsou součástí podkladů.
- Označení stávajícího nábytku: zůstává ve scéně, vynechá se z poptávky výroby.
- Přehled s úplným půdorysem a samostatným 3D náhledem nezávislým na kameře a filtrech, stažení soupisu, export/import upravitelného návrhu jako JSON.
- Poptávkový průvodce: kontakt, město, termín, montáž, poznámka a až tři obrázky do 2 MB. Výsledkem je pouze místní soubor TORO-poptavka.json včetně návrhu, obou náhledů, potvrzení upozornění a příloh; data se nikam neodesílají. Návrh lze z tohoto souboru znovu načíst.
- Samostatné zadání montáže, kuchyně, schodiště, dveří, atypu či celého interiéru bez 3D konfigurace.
- Migrace dřívějšího uložení `toro-room-v4` v localStorage s převzetím `toro-room-v3`, `toro-room-v2`, `toro-room-v1` či `forma-room-v1`, pokud aktuální klíč chybí. Data se validují při načítání; poškozený aktuální návrh vyvolá obnovovací postup. Nové prostředí tyto klíče pouze čte pro migraci. Původní `forma-design-v1` a výslovně označené staré poptávky jedné skříně se převedou na samostatný kus. Normální pokoj s jednou skříní zůstává pokojem.

## Souřadnice a chování

Rozměry a uložené pozice jsou v centimetrech. Počátek X/Z leží uprostřed ohraničujícího obdélníku pokoje, záporné Z je zadní stěna. Výška Y je od podlahy k dolní hraně kusu. Při otočení 0° míří čelo směrem ke kladnému Z. Otvory se měří od levého kraje u přední/zadní stěny a od zadního kraje u bočních stěn.

Přetahování je omezené hranicemi pokoje. Kolize mezi kusy jsou označené, ale nebrání zkoušení návrhů. Při zmenšení pokoje se nábytek přesune dovnitř, jeho rozměry se samy nezmenšují; příliš velký kus se označí upozorněním. Okno nebrání nízké komodě, pokud je komoda pod parapetem. Dveře mají konzervativní obdélníkový prostor pro přístup, nejde o fyzikální simulaci pohybu dveřního křídla.

U technických prvků změna rozměrů pokoje zachová měření od příslušných stěn i výšku. Souřadnice od středu pokoje se podle potřeby přepočtou; prvek se automaticky nepřemístí na jiné zaměřené místo. Přesah se zobrazí jako problém a návrh lze dále uložit a načíst. Podrobnosti společné geometrie jsou v dokumentaci sítí.

## Ověření

```sh
npm run check
npm audit --audit-level=moderate
```

Doménové testy obsahují 33 kontrol plánovače, 16 kontrol technických sítí, 12 kontrol geometrie a podkladů a 20 kontrol společného prostředí. Nové kontroly navíc ověřují 120 krajních rozměrových variant všech 15 typů a kameru v obou orientacích. Zahrnují 708 variant technické geometrie, 1 080 variant obálky nábytku, 14 variant vnitřních stěn a audit 5 250 normalizačních případů. Výstupy jsou v ignorované `.sites-runtime/`. Konkrétní ověření aktuálního rozšíření popisuje [implementační zpráva](../docs/DOKONCENI-PROTOTYPU.md); následující odstavce zachycují starší etapy.

## Vytvoření přenosné ukázky

```sh
TORO_DEMO_NAME=TORO-jednoduche-ovladani npm run package:demo
```

Příkaz nejprve sestaví aktuální aplikaci a následně zabalí HTML se všemi prostředky, český návod, informace o verzi a licence do `outputs/TORO-jednoduche-ovladani-RRRR-MM-DD.zip` (bez proměnné `TORO_DEMO_NAME` používá původní název `TORO-prototyp`). Vytvoření ZIPu vyžaduje Python 3. Skript ověřuje syntaxi vloženého JavaScriptu, vložení CSS prostředků, licence a integritu archivu. Zdrojovou pracovní kopii identifikuje výchozí commit a SHA-256 otisk sestavených prostředků. Samotné vytvoření balíčku není runtime test; aktuální balíček navíc prošel browserovou sadou přes `file://` s vypnutou sítí. Výsledky jsou v implementační zprávě.

## Historické vizuální ověření

Původní verze: vizuálně byly ověřeny oba konfigurátory, kroky nastavení, katalog, místnost s otvory, 3D, půdorys, přehledy, nápovědy a upozornění. Kontrola zahrnovala šířky 320, 390, 768 a 1440 px, vodorovné přetékání a výpočet kontrastu běžných HTML textů vůči pozadí. V prověřených stavech mají tyto texty kontrast alespoň 4,5 : 1; nejde o úplný audit WCAG. Popisky rozměrů ve scéně drží velikost 14 px nezávisle na přiblížení a nepodléhají barevnému mapování osvětlení.

Verze TORO: 17 doménových kontrol zahrnuje také všechny sestavy, nové parametry, import/export a přichycení sousedních kusů. Ručně ověřeny výběr sestavy, přehled s náhledem, povinná kontaktní pole, příloha, stávající nábytek a mobilní rozložení 320/390 px. TypeScript i produkční build procházejí.

## Integrace do in-toro.com

Doporučený první krok je odkaz „Navrhněte si nábytek“ z hlavní navigace a příslušných realizací na samostatný plánovač. Samostatná stránka poskytne dost místa pro 3D i na telefonu. Pro WordPress lze později připravit vložení do stránky nebo samostatnou subdoménu. Současný web tímto lokálním prototypem nebyl změněn.

Před nasazením je potřeba ověřit katalog a meze s truhlářem, doplnit přijímací endpoint poptávky s validací a omezením příloh a propojit skutečný způsob doručení. Kontaktní údaje nyní nikam neodcházejí.

Z dokumentovaného postupu [IKEA METOD](https://www.ikea.com/cz/cs/customer-service/knowledge/articles/c124603f-cb6a-4093-b756-ac322a8f0eee.html) je převzata obecná myšlenka: začít připravenou sestavou nebo prázdným prostorem, zadat rozměry, upravovat prvky a návrh doladit s odborníkem. Kód ani rozhraní IKEA nebyly kopírovány.

## Hranice prototypu

Podporovány jsou pravoúhlé polygonové půdorysy; šikmé stěny, šikmé stropy a vícepatrové místnosti nejsou součástí této verze. Atypický kus používá prostorovou obálku s poznámkou, nikoli editor libovolné geometrie. Kontroly nezohledňují všechny montážní a provozní odstupy, nosnost, způsob kotvení, rozvody ani skutečné kování.

Historické pomocné cenové funkce v `lib/room.ts` a `lib/configuration.ts` jsou demonstrační; nové rozhraní je nepoužívá. Návrh není výrobní dokumentace. Truhlář musí ověřit konstrukci, kotvení, bezpečné délky polic, zaměření, montážní rezervy a cenu.

Kuchyně zatím nemají vlastní 3D modulový systém, pracovní desku, spotřebičové niky ani kontrolu rozvodů. Pračka, sušička a umyvadla jsou ilustrační geometrie; zrcadla nesimulují odraz.

Není připojen objednávkový systém, platba, e-mail ani databáze zákazníků. Uložené návrhy zůstávají v daném prohlížeči nebo ve staženém souboru. Aktualizace místního projektu sama nemění dříve publikovanou verzi.

Dubová textura `public/textures/oak.png` byla vytvořena pomocí imagegen pro tento projekt. Logo TORO v `public/brand/toro-logo.png` pochází z webu truhláře, který zadavatel výslovně určil jako podklad: https://www.in-toro.com/wp-content/uploads/2025/09/cropped-cropped-StampstarTORO-1.png. Ilustrace sestav jsou vlastní SVG. Zdrojový kód referenčních webů nebyl kopírován.

## Kontrola oprav auditu

`npm run check` spustí doménové regrese, auditní reprodukce, ESLint, TypeScript a produkční sestavení. Bezpečnost závislostí ověřuje `npm audit --audit-level=moderate`. Stejné kontroly jsou připravené v GitHub Actions pro PR a změny na main.

Podrobnosti a hranice ověření: [opravy auditu](../docs/OPRAVY-AUDITU-2026-09-11.md).

## Opakovatelné browserové ověření

Skripty `scripts/test-browser.mjs`, `scripts/test-browser-edges.mjs` a `scripts/test-browser-ux.mjs` používají izolované kontexty Playwrightu v testovacím Chrome. Nezasahují do osobního profilu. Před spuštěním sestavte čisté doménové moduly pomocí `npm run test:room`. Zadejte `TORO_PLAYWRIGHT_MODULE` (cesta k instalaci Playwrightu), `TORO_BROWSER_CDP` (adresa samostatného testovacího Chrome) a `TORO_QA_URL`. Pro celý offline průchod nastavte u první sady URL na vytvořené HTML `file://...`, `TORO_QA_OFFLINE=1` a volitelně `TORO_QA_OUT` pro výstupy. Mezní sada používá místní server, protože ověřuje i adresu `/skrin`.

```sh
node scripts/test-browser.mjs
node scripts/test-browser-edges.mjs
node scripts/test-browser-ux.mjs
```

Sady skutečně stahují a znovu načítají soubory. První zahrnuje všech 15 typů a šířky 320, 390 a 768 px; druhá limity vložení, zachování technických vazeb, kolize, klávesnici, automatické migrace, chybové úložiště a pokoj bez WebGL. Výsledky a snímky se ukládají do ignorované `.sites-runtime/single-tests/`.

Sada `test-browser-ux.mjs` prochází skutečné úpravy parametrů všech 15 druhů a 28 technických typů, rozbalené detaily, menu, pokojové nástroje, zálohy, poptávkové přílohy, klávesnici a emulovaný dotyk. Podporuje i `TORO_QA_OFFLINE=1` a `file://` URL. Pro vizuální kontrolu používejte jinou relaci Chrome než pro právě běžící automatické scénáře.

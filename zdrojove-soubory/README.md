# TORO Interiors — prototyp plánovače nábytku

Český prototyp přizpůsobený sortimentu TORO Interiors (in-toro.com). React 19, TypeScript, vinext a Three.js.

## Změny první etapy

Aktuální rozhraní a datový formát verze 2 popisuje [první etapa](../docs/PRVNI-ETAPA.md). Nově zahrnuje zásuvky, kontextové panely a automatické ukládání pod klíčem `toro-room-v2` s importem starších verzí. Popis původního prototypu níže zůstává jako výchozí reference; jeho údaje o navigaci a verzi úložiště jsou tímto nahrazeny.

## Spuštění

Node.js 22.13 nebo novější, závislosti podle přiloženého zámku:

```sh
npm ci
node scripts/run-framework.mjs dev
```

- `http://localhost:5173/` — plánovač celého pokoje.
- `http://localhost:5173/skrin` — původní konfigurátor samostatné skříně včetně jeho lokálně uložených návrhů.

## Plánovač pokoje

- Pravoúhlý pokoj: šířka a délka 120–1000 cm, výška 220–400 cm.
- Barvy stěn, tři podlahy, skutečné otvory pro dveře a okna. Nejvýše jeden otvor na každé ze čtyř stěn.
- 13 druhů: šatní a vestavěné skříně, botníky, komody, knihovny, nástěnné police, lavice, věšákové panely, zrcadla, umyvadlové a prádelní skříně, pracovní stoly a TV skříňky. Nejvýše 30 kusů v návrhu.
- Pět sestav: předsíň, koupelna, šatna, pracovna a obývací pokoj. Lze začít i jedním kusem nebo prázdným pokojem. Výměnu sestavy lze vrátit.
- Každý kus má vlastní rozměry, materiály, vnitřní uspořádání, polohu a otočení po 90 stupních.
- Nastavení používá stejné kroky a ovládací prvky jako původní skříň: Rozměry → Materiály → Uspořádání → Dvířka. Police má dva kroky, knihovna tři a komoda místo dvířek čela zásuvek.
- Rozměry se mění posuvníkem nebo přesným číslem. Dekory mají pojmenované vzorky; jednotlivé sekce skříní se vybírají obrázkovými kartami. U komod, botníků a knihoven lze nastavit počet sekcí a zásuvek či polic v každé sekci.
- Krok Uspořádání odkryje vnitřek, krok Dvířka / Čela zobrazí čela. Pozice a natočení jsou dostupné v rozbalovací části Umístění v pokoji v každém kroku.
- Vestavěná skříň má posuvná čela a obvodové lišty; její výšku lze přizpůsobit stropu s 2cm rezervou.
- Výška zavěšení u polic, panelů, zrcadel, umyvadlových a TV skříněk. Jedno/dvě umyvadla, počet háčků, pračka/sušička nad sebou či vedle sebe. Lamino nebo olejovaný masiv; pro masiv pouze dřevěné povrchy.
- Přetahování nábytku v 3D i půdorysu, přichycení k rastru 5 cm a ke stěnám i navazujícím kusům, přesné číselné umístění.
- Přisunutí k vybrané stěně automaticky natočí čelo do pokoje.
- Při zaměření pracovní plochy šipky posouvají kus o 10 cm, se Shiftem o 1 cm.
- Vrácení a obnovení posledních 40 změn, duplikování a odstranění kusů.
- Kontrola překrývání se zohledněním výšky, přesahu mimo pokoj a prostoru u dveří a oken.
- Individuální nacenění truhlářem; rozhraní nezobrazuje demonstrační ceny.
- Označení stávajícího nábytku: zůstává ve scéně, vynechá se z poptávky výroby.
- Přehled s aktuálním náhledem, stažení soupisu, export/import upravitelného návrhu jako JSON.
- Poptávkový průvodce: kontakt, město, termín, montáž, poznámka a až tři obrázky do 2 MB. Výsledkem je pouze místní soubor TORO-poptavka.json včetně návrhu, náhledu a příloh; data se nikam neodesílají. Návrh lze z tohoto souboru znovu načíst.
- Samostatné zadání montáže, kuchyně, schodiště, dveří, atypu či celého interiéru bez 3D konfigurace.
- Uložení v `toro-room-v1` v localStorage s převzetím dřívějšího `forma-room-v1`, pokud nový klíč chybí. Data se validují při načítání. Verze návrhu zůstává 1 a importuje i starší návrhy. Samostatná skříň zachovává klíč `forma-design-v1`.

## Souřadnice a chování

Rozměry a uložené pozice jsou v centimetrech. Počátek X/Z leží uprostřed pokoje, záporné Z je zadní stěna. Výška Y je od podlahy k dolní hraně kusu. Při otočení 0° míří čelo směrem ke kladnému Z. Otvory se měří od levého kraje u přední/zadní stěny a od zadního kraje u bočních stěn.

Přetahování je omezené hranicemi pokoje. Kolize mezi kusy jsou označené, ale nebrání zkoušení návrhů. Při zmenšení pokoje se nábytek přesune dovnitř, jeho rozměry se samy nezmenšují; příliš velký kus se označí upozorněním. Okno nebrání nízké komodě, pokud je komoda pod parapetem. Dveře mají konzervativní obdélníkový prostor pro přístup, nejde o fyzikální simulaci pohybu dveřního křídla.

## Ověření

```sh
node scripts/test-room.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js components/room-planner.tsx components/room-controls.tsx components/room-scene.tsx lib/room.ts lib/room-model.ts
node scripts/run-framework.mjs build
```

Doménové testy ověřují výchozí návrh, všechny natočené půdorysy, přichycení, kolize podle výšky, všechny čtyři stěny s otvory, umístění nových kusů, zmenšení místnosti, neplatné importy a 78 variant geometrie. Výstupy testů jsou v ignorované `.sites-runtime/room-tests`.

Původní verze: vizuálně byly ověřeny oba konfigurátory, kroky nastavení, katalog, místnost s otvory, 3D, půdorys, přehledy, nápovědy a upozornění. Kontrola zahrnovala šířky 320, 390, 768 a 1440 px, vodorovné přetékání a výpočet kontrastu běžných HTML textů vůči pozadí. V prověřených stavech mají tyto texty kontrast alespoň 4,5 : 1; nejde o úplný audit WCAG. Popisky rozměrů ve scéně drží velikost 14 px nezávisle na přiblížení a nepodléhají barevnému mapování osvětlení.

Verze TORO: 17 doménových kontrol zahrnuje také všechny sestavy, nové parametry, import/export a přichycení sousedních kusů. Ručně ověřeny výběr sestavy, přehled s náhledem, povinná kontaktní pole, příloha, stávající nábytek a mobilní rozložení 320/390 px. TypeScript i produkční build procházejí.

## Integrace do in-toro.com

Doporučený první krok je odkaz „Navrhněte si nábytek“ z hlavní navigace a příslušných realizací na samostatný plánovač. Samostatná stránka poskytne dost místa pro 3D i na telefonu. Pro WordPress lze později připravit vložení do stránky nebo samostatnou subdoménu. Současný web tímto lokálním prototypem nebyl změněn.

Před nasazením je potřeba ověřit katalog a meze s truhlářem, doplnit přijímací endpoint poptávky s validací a omezením příloh a propojit skutečný způsob doručení. Kontaktní údaje nyní nikam neodcházejí.

Z dokumentovaného postupu [IKEA METOD](https://www.ikea.com/cz/cs/customer-service/knowledge/articles/c124603f-cb6a-4093-b756-ac322a8f0eee.html) je převzata obecná myšlenka: začít připravenou sestavou nebo prázdným prostorem, zadat rozměry, upravovat prvky a návrh doladit s odborníkem. Kód ani rozhraní IKEA nebyly kopírovány.

## Hranice prototypu

Místnost zatím nepodporuje polygonový půdorys, šikminy, výklenky a více otvorů na jedné stěně. Kontroly nezohledňují všechny montážní a provozní odstupy, nosnost, způsob kotvení, rozvody ani skutečné kování.

Historické pomocné cenové funkce v `lib/room.ts` a `lib/configuration.ts` jsou demonstrační; nové rozhraní je nepoužívá. Návrh není výrobní dokumentace. Truhlář musí ověřit konstrukci, kotvení, bezpečné délky polic, zaměření, montážní rezervy a cenu.

Kuchyně zatím nemají vlastní 3D modulový systém, pracovní desku, spotřebičové niky ani kontrolu rozvodů. Pračka, sušička a umyvadla jsou ilustrační geometrie; zrcadla nesimulují odraz.

Není připojen objednávkový systém, platba, e-mail ani databáze zákazníků. Uložené návrhy zůstávají v daném prohlížeči nebo ve staženém souboru. Aktualizace místního projektu sama nemění dříve publikovanou verzi.

Dubová textura `public/textures/oak.png` byla vytvořena pomocí imagegen pro tento projekt. Logo TORO v `public/brand/toro-logo.png` pochází z webu truhláře, který zadavatel výslovně určil jako podklad: https://www.in-toro.com/wp-content/uploads/2025/09/cropped-cropped-StampstarTORO-1.png. Ilustrace sestav jsou vlastní SVG. Zdrojový kód referenčních webů nebyl kopírován.

## Kontrola oprav auditu

`npm run check` spustí doménové regrese, auditní reprodukce, ESLint, TypeScript a produkční sestavení. Bezpečnost závislostí ověřuje `npm audit --audit-level=moderate`. Stejné kontroly jsou připravené v GitHub Actions pro PR a změny na main.

Podrobnosti a hranice ověření: [opravy auditu](../docs/OPRAVY-AUDITU-2026-09-11.md).

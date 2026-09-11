# Technické prvky a sítě — stav implementace

**Datum:** 11. 9. 2026

**Stav:** implementováno a ověřeno v místní větvi `codex/technical-networks`, navazující na `a78cbaf8147ff1ba7b8f43b4ea2338fac4cb3c41`. Tato zpráva nepotvrzuje odeslání změn na GitHub, sloučení ani nasazení.

Tato zpráva zachycuje samostatnou etapu sítí a tehdejší formát 3. Navazující místní verzi s formátem 4 popisuje [dokončení prototypu](DOKONCENI-PROTOTYPU.md).

Rozšíření pokrývá etapy A–C [schváleného návrhu](TECHNICKE-PRVKY-DALSI-ETAPA.md). Neuzavírá všechny zbývající části [původní architektury](../TORO-ARCHITEKTURA.md).

## Co lze zadat

| Kategorie | Implementované typy |
| --- | --- |
| Elektřina | Zásuvka, vícezásuvka, silový přívod, vypínač, světelný vývod |
| Voda | Studená voda, teplá voda, vodní uzávěr |
| Odpad | Odpadní vývod |
| Plyn | Plynová přípojka, plynový uzávěr |
| Topení | Radiátor, koupelnový žebřík, topný ventil, potrubí |
| Větrání | Větrací otvor, vývod digestoře, vzduchotechnika |
| Data | Datová zásuvka, TV / anténní zásuvka |
| Pevné překážky a servis | Rozvaděč, revizní otvor, vodoměr, plynoměr, elektroměr, šachta, komínové těleso, jiná překážka |

Katalog obsahuje 28 typů. Každý má podporované plochy a výchozí rozměry; uživatel je upravuje ve společném panelu. Poloha může být na stěně, podlaze, stropu nebo volně v prostoru podle typu prvku. Bodové přípojky a otvory připouštějí nulové vyčnívání, pevné objemy a potrubí vyžadují nenulovou hloubku.

Prvek má stabilní označení, vlastní název, stav stávající/navrhovaný, přesnost zaměřeno/orientační/k doplnění, poznámku, zámek polohy a volitelnou vazbu na nábytek či skupinu. Rozměry a měření se zadávají v centimetrech. Výchozí rozměry nového prvku a ukázkové sestavy jsou orientační.

## Práce v editoru

Kategorie otevírají příslušné typy a zároveň mohou filtrovat seznam i scénu. Skryté prvky zůstávají součástí kontrol a exportu. Prvek lze přidat zadáním rozměrů nebo umístit kliknutím do scény. Výběr zobrazí měřicí čáry a kontextové vlastnosti.

V 2D i 3D funguje tažení těla nebo značky. Jeden dokončený tah tvoří jeden krok historie; Escape ho zruší. Vodorovný posun nezmění výšku, kterou lze zadat přesně v panelu. Podlahové, stropní a volné prvky lze otáčet po 90°. Zámek chrání polohu, rozměry a odebrání; poznámku nebo stav lze doplnit i u zamknutého bodu. Popisky technických prvků se rozmisťují s odkazovými čarami, aby se blízké vývody daly vybrat.

Na stěně se zadává vzdálenost od uvedeného rohu a výška. Podlahové, stropní a volné prvky používají vzdálenosti od levé a zadní stěny. Změna velikosti místnosti tyto měřené vzdálenosti zachová, včetně desetinných hodnot. Pokud se prvek ocitne mimo pokoj, editor jej označí; uložené měření se automaticky neopravuje.

Rychlá skupina pro umyvadlo vytvoří studenou vodu, teplou vodu a odpad; skupina pro pračku vodu, odpad a zásuvku. Body zůstávají jednotlivě upravitelné. Vazbu na nábytek lze vytvořit z vlastností prvku i z detailu kusu. Koupelnová sestava obsahuje obě skupiny a topný žebřík: čtyři kusy nábytku a sedm technických prvků.

## Geometrie a kontroly

Katalog, validátor, společný výpočet umístění a kontroly jsou v `lib/technical.ts`. `lib/technical-model.ts` používá stejný prostorový rámec při vykreslení. Zvětšená výběrová značka a popisek nemění fyzickou obálku prvku.

- Pevné objemy a potrubí se kontrolují proti nábytku, otvorům a ostatním technickým prvkům se zohledněním výšky. Automatické hledání místa pro nový nábytek respektuje fyzické překážky.
- U přípojek a otvorů se možné zakrytí hlásí odděleně. Nulově vyčnívající otvor má pro tuto kontrolu drobnou pomocnou toleranci; nedostává tím fyzickou hloubku ani instalační odstup.
- Uživatel může zadat samostatnou hloubku prostoru potřebného pro přístup. Ten má vlastní obálku i zobrazení a není zaměněn za tělo prvku. Bez zadaného přístupu jej kontrola nepotvrzuje.
- Přiřazená přípojka uvnitř vhodné skříňky vyvolá informaci o ověření výřezu, rozvodů a přístupu. Vazba nepotlačuje fyzické kolize objemů ani obsazený přístup k uzávěru.
- Chybějící nebo nepřiřazené přípojky jsou informace k doplnění. Neblokují přidání umyvadlové či prádelní skříně. Po odstranění vazby se znovu přepočítají.
- Pro vzdálenou přiřazenou přípojku se uvádí geometrická vzdálenost. Nejde o výpočet trasy ani potvrzení připojitelnosti konkrétního spotřebiče.

Panel Kontrola odděluje problémy a upozornění od rozbalovacího seznamu informací. U výchozí koupelny nejsou nalezené fyzické kolize, ale zbývá 14 informací o orientačním zaměření, výřezech a nezadaném přístupu. Rozhraní proto neoznačuje celý návrh za úplně posouzený.

## Uložení, migrace a export

Aktuální formát `RoomDesign` je verze 3, klíč `toro-room-v3`. Verze 1 a 2 se převádějí při načtení bez ztráty nábytku, otvorů, identifikátorů a původních poloh zásuvek. Převod nezaokrouhluje dříve uložené desetinné souřadnice a nemění zdrojový objekt. Staré klíče úložiště zůstávají zachované.

Při chybě aktuálního uloženého návrhu se nezvolí tiše starší verze. Obnovovací postup nejprve chrání původní obsah zálohou. Neznámé typy, budoucí verze, duplicitní identifikátory a neplatné číselné údaje validátor odmítne. Strukturálně platný návrh s technickým prvkem mimo místnost se naopak uloží a znovu otevře, aby se neztratilo měření.

Upravitelný JSON, soupis i poptávkový soubor obsahují stejné technické body, označení, měřicí reference, rozměry, přesnost, vazby, přístup, poznámky a aktuální hlášení. Poptávka připojuje náhled a zadané přílohy. Nadále se pouze stahuje do počítače; neodesílá se na server.

## Ověření

Následující kontroly proběhly nad touto místní implementací:

| Kontrola | Výsledek |
| --- | --- |
| `npm run test:audit` | 33 kontrol plánovače a 16 kontrol sítí prošlo; audit bez selhání |
| Technická geometrie | 708 variant typů, podporovaných ploch, natočení a rozměrů; samostatně ověřena geometrie přístupu |
| Regrese nábytku a normalizace | 936 variant fyzické obálky, 78 modelových variant, 4 550 normalizačních případů |
| `npm run typecheck` | Bez chyb |
| `npm run lint` | Bez chyb; tři existující upozornění pravidla Next.js na použití `<img>` |
| `npm audit --audit-level=moderate` | Žádné nalezené zranitelnosti |
| `npm ls --all` | Strom závislostí bez chyby |
| `npm run package:demo` | Produkční sestavení i vytvoření a ověření archivu prošlo |

V prohlížeči byla ověřena běžící produkční aplikace na localhostu: načtení koupelny, kategorie, vlastnosti a vazby, přesné desetinné zadání, posun vody myší v 2D i 3D se zachováním výšky a vrácením jediným krokem historie, podlahový odpad, otočení a zámek polí. Při změně šířky pokoje z 360 na 300 cm zůstaly u podlahového odpadu vzdálenosti 180 a 120 cm i nulové vyčnívání. Bylo ověřeno rozbalení informací v kontrole a čistý konzolový záznam finálního náhledu.

Rozhraní bylo zkontrolováno při emulované šířce 320 px: osm kategorií a vlastnosti bez vodorovného přetékání. Jde o kontrolu rozložení v desktopovém prohlížeči, nikoli o ověření na fyzickém telefonu.

Skutečně stažené soubory návrhu a poptávky byly přečteny z disku: obsah návrhu se přesně shodoval s koupelnovou sestavou, poptávka zahrnovala sedm technických prvků, 14 hlášení, kontakt a PNG náhled. Textový soupis obsahoval všechna označení. Stažený JSON byl přes dialog importu úspěšně znovu načten do editoru. Použity byly syntetické kontaktní údaje a nic nebylo odesláno třetí straně.

## Balíček k předání

`npm run package:demo` vytváří aktuální samostatnou distribuci do `zdrojove-soubory/outputs/`. JavaScript, CSS, logo, textura i šest písem jsou vložené v HTML. Archiv obsahuje HTML, český návod, označení sestavení a licence. Skript kontroluje syntaxi JavaScriptu, CSS prostředky a integritu ZIPu. Pro vytvoření potřebuje Node.js a Python 3; pro příjemce je určeno otevření rozbaleného HTML v prohlížeči.

Ověřený archiv této etapy: `TORO-ukazka-site-2026-09-11.zip`, 3 630 574 bajtů, SHA-256 `76076c54faa1a6afe86321def6c0a2aeeec2961988c4385edc9370e3c15c3fdc`.

**Omezení ověření:** automatizovaný prohlížeč v tomto prostředí zablokoval otevření adresy `file://`. Otevření výsledného HTML dvojklikem a chování jeho lokálního úložiště proto nebylo ověřeno. Ověření živého editoru na localhostu, obsahu archivu a syntaxe vloženého kódu není náhradou tohoto testu. Původní HTML v kořenu repozitáře není touto distribucí přepsané.

## Co zůstává mimo toto rozšíření

Místnost má stále obdélníkový půdorys a nejvýše jeden otvor na každé stěně. Samostatný čelní pohled na vybranou stěnu zatím není přidaný; přesná výška se zadává v panelu.

Potrubí je přímý geometrický úsek, nikoli editor propojených tras. Plánovač nepočítá dimenzování sítí, spád odpadu, instalační pravidla, výkon topení ani vhodnost konkrétního zapojení. Obálka nábytku neobsahuje přesný model servisních výřezů. Zadaná oblast přístupu je jednoduchý prostor před zvolenou plochou. Tyto hranice se promítají do konkrétních informací k ověření, nikoli do nepravdivého potvrzení proveditelnosti.

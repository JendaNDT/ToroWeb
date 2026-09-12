# ToroWeb — plánovač interiéru TORO

Český prototyp pro návrh jednoho kusu nábytku nebo celého pokoje ve 2D a 3D. Repozitář obsahuje původní samostatnou HTML ukázku, aktuální zdrojový projekt a návrh dalšího vývoje.

## Aktuální vývoj

Ovládání nyní ukazuje vždy aktuální krok nebo skupinu vlastností. Pokročilé volby mají přehledy nastavených hodnot, soubory jsou v nabídce **Návrh** a pokoj používá stejný editor kusu přes akci **Upravit rozměry a provedení**. [Plán úpravy](docs/ZJEDNODUSENI-ROZHRANI.md) a [aktuální zpráva s ověřením](docs/ZJEDNODUSENI-ROZHRANI-OVERENI.md).

Aktuální zdroje podporují **28 typů technických prvků v osmi kategoriích**: elektřina, voda, odpad, plyn, topení, větrání, data a pevné překážky / servis. Prvky lze umístit na podporované plochy, přetahovat, přesně zaměřit, zamknout a přiřadit k nábytku. Kontroly rozlišují fyzické kolize, prostor pro přístup a chybějící údaje. Ukázková koupelna obsahuje přípojky pro umyvadlo i prádelní sestavu a topný žebřík.

Nově jsou k dispozici pravoúhlé půdorysy do L a U, výklenky a výstupky, více dveří a oken na stejné stěně, postele a atypické kusy, potvrzování upozornění a půdorys i 3D náhled v poptávce. Katalog má 15 druhů nábytku a šest ukázkových sestav.

Aktuální stav a hranice formátu 4 popisuje [dokončení místního prototypu](docs/DOKONCENI-PROTOTYPU.md), předchozí rozšíření [implementace technických prvků](docs/TECHNICKE-PRVKY-IMPLEMENTACE.md). Předchozí stav zachycuje [první etapa](docs/PRVNI-ETAPA.md). Samostatný soubor `TORO-otevrit.html` v kořenu nadále obsahuje původní ukázku; aktuální distribuci vytvoří příkaz níže.

## Aktuální balíček k předání

Schválený další postup a stav pro navazující práci obsahuje [předání pro nový chat](docs/PREDANI-DALSI-PRACE.md). Společný konfigurátor všech 15 druhů je implementovaný jako výchozí záložka **Jeden kus nábytku**. Druhá záložka **Celý pokoj** zachovává prostorové nástroje a sítě. Oba koncepty i rozpracovaná úprava konkrétního kusu se ukládají společně. Podrobný [plán a výsledky](docs/SPOLECNY-KONFIGURATOR.md) doplňuje [implementační zpráva](docs/SPOLECNY-KONFIGURATOR-OVERENI.md).

Ve složce `zdrojove-soubory/` po instalaci závislostí spusťte:

```sh
TORO_DEMO_NAME=TORO-jednoduche-ovladani npm run package:demo
```

Příkaz provede produkční sestavení a vytvoří `outputs/TORO-jednoduche-ovladani-RRRR-MM-DD.zip` se samostatným HTML, českým návodem, označením verze a licencemi. Pro vytvoření archivu je vedle Node.js potřeba Python 3. Příjemce dostává soubor určený k rozbalení a otevření bez instalace; knihovny, obrázky a písma jsou vložené v HTML. Obsah a integrita archivu jsou ověřené. Nová distribuce byla také skutečně otevřená přes `file://` v izolovaném Chrome na macOS s vypnutou sítí; proběhly úpravy, přechody, obě poptávky, skutečná stažení a opětovné importy. Nejde o ověření na fyzickém telefonu nebo Windows.

## Původní ukázka v kořenu

1. Stáhněte repozitář přes **Code → Download ZIP** a rozbalte jej.
2. Otevřete `TORO-otevrit.html` v prohlížeči Chrome, Edge nebo Firefox.

Ukázka obsahuje obrázky, styly i potřebné knihovny a funguje bez instalace a internetu. Pro 3D zobrazení je potřeba podpora WebGL. Podrobnosti jsou v [ZACNI-TADY.txt](ZACNI-TADY.txt).

## Obsah repozitáře

| Soubor nebo složka | Obsah |
| --- | --- |
| `TORO-otevrit.html` | Samostatná aplikace připravená k otevření v prohlížeči. |
| `zdrojove-soubory/` | Upravitelný projekt v Reactu a TypeScriptu, obrázky, konfigurace, skripty a testy. |
| `TORO-ARCHITEKTURA.md` | Návrh dalšího vývoje z 11. 9. 2026; popisuje také dosud neimplementované funkce. |
| `ZACNI-TADY.txt` | Návod k použití, předání a ukládání návrhů. |
| `VERZE.txt` | Datum sestavení a označení původní zdrojové revize. |
| `LICENCE-KNIHOVEN.txt` | Licenční oznámení použitých knihoven. |

## Spuštění zdrojového projektu

Podle přiloženého projektu je potřeba **Node.js 22.13 nebo novější**. Z kořenové složky repozitáře spusťte:

```sh
cd zdrojove-soubory
npm ci
npm run dev
```

Otevřete `http://localhost:5173/`. Adresa `http://localhost:5173/skrin` otevírá stejné společné prostředí a umožňuje převod původní uložené skříně.

Podrobný popis funkcí, postup ověření a omezení prototypu obsahuje [README zdrojového projektu](zdrojove-soubory/README.md).

## Ukládání a poptávky

Návrhy se ukládají do `toro-workspace-v1` v prohlížeči. Samostatný kus (`toro-furniture` v1), pokoj (v4) nebo celé prostředí lze stáhnout a znovu načíst. Staré pokojové klíče i `forma-design-v1` se převezmou bez přepsání originálů. Poškozené úložiště blokuje automatické přepsání; výslovná obnova nejprve vytvoří zálohu. Poptávkový průvodce připravuje soubor s návrhem a přílohami; současná verze jej sama nikam neodesílá. Podle rozhodnutí zadavatele zůstává cenotvorba i příjemce poptávek nenapojený. Pro předvedení lze doplnit označený ukázkový kontakt. Skutečné obchodní údaje a výrobní proveditelnost se upřesní s TORO.

## Původ této verze

První import zachovává všech 131 souborů z archivu `TORO-konfigurator-2026-09-11.zip` a doplňuje dokument architektury. Zdrojová revize uvedená v původním balíčku je `c5fec1f0a28e7d5598b51228d65c7258ad8a8b6f`.

# ToroWeb — plánovač interiéru TORO

Český prototyp pro návrh pokoje, technických prvků a nábytku ve 2D a 3D. Repozitář obsahuje původní samostatnou HTML ukázku, aktuální zdrojový projekt a návrh dalšího vývoje.

## Aktuální vývoj

Aktuální zdroje podporují **28 typů technických prvků v osmi kategoriích**: elektřina, voda, odpad, plyn, topení, větrání, data a pevné překážky / servis. Prvky lze umístit na podporované plochy, přetahovat, přesně zaměřit, zamknout a přiřadit k nábytku. Kontroly rozlišují fyzické kolize, prostor pro přístup a chybějící údaje. Ukázková koupelna obsahuje přípojky pro umyvadlo i prádelní sestavu a topný žebřík.

Nově jsou k dispozici pravoúhlé půdorysy do L a U, výklenky a výstupky, více dveří a oken na stejné stěně, postele a atypické kusy, potvrzování upozornění a půdorys i 3D náhled v poptávce. Katalog má 15 druhů nábytku a šest ukázkových sestav.

Aktuální stav a hranice formátu 4 popisuje [dokončení místního prototypu](docs/DOKONCENI-PROTOTYPU.md), předchozí rozšíření [implementace technických prvků](docs/TECHNICKE-PRVKY-IMPLEMENTACE.md). Předchozí stav zachycuje [první etapa](docs/PRVNI-ETAPA.md). Samostatný soubor `TORO-otevrit.html` v kořenu nadále obsahuje původní ukázku; aktuální distribuci vytvoří příkaz níže.

## Aktuální balíček k předání

Schválený další postup a stav pro navazující práci obsahuje [předání pro nový chat](docs/PREDANI-DALSI-PRACE.md). Konfigurátor všech jednotlivých kusů jako hlavní vstup je nově zapsaný v architektuře; jeho přestavba zatím není implementovaná.

Ve složce `zdrojove-soubory/` po instalaci závislostí spusťte:

```sh
npm run package:demo
```

Příkaz provede produkční sestavení a vytvoří `outputs/TORO-prototyp-RRRR-MM-DD.zip` se samostatným HTML, českým návodem, označením verze a licencemi. Pro vytvoření archivu je vedle Node.js potřeba Python 3. Příjemce dostává soubor určený k rozbalení a otevření bez instalace; knihovny, obrázky a písma jsou vložené v HTML. Automaticky je ověřen obsah a integrita archivu; otevření výsledného místního souboru dvojklikem nebylo v tomto prostředí ověřeno.

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

Otevřete `http://localhost:5173/`. Původní konfigurátor jedné skříně je na adrese `http://localhost:5173/skrin`.

Podrobný popis funkcí, postup ověření a omezení prototypu obsahuje [README zdrojového projektu](zdrojove-soubory/README.md).

## Ukládání a poptávky

Návrhy se ukládají v prohlížeči nebo se přenášejí pomocí exportovaného souboru. Poptávkový průvodce připravuje soubor s návrhem a přílohami; současná verze jej sama nikam neodesílá. Podle rozhodnutí zadavatele zůstává cenotvorba i příjemce poptávek nenapojený. Pro předvedení lze doplnit označený ukázkový kontakt. Skutečné obchodní údaje a výrobní proveditelnost se upřesní s TORO.

## Původ této verze

První import zachovává všech 131 souborů z archivu `TORO-konfigurator-2026-09-11.zip` a doplňuje dokument architektury. Zdrojová revize uvedená v původním balíčku je `c5fec1f0a28e7d5598b51228d65c7258ad8a8b6f`.

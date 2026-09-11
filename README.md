# ToroWeb — plánovač interiéru TORO

Český prototyp pro návrh pokoje a nábytku ve 2D a 3D. Repozitář obsahuje hotovou samostatnou HTML ukázku, zdrojový projekt pro další vývoj a návrh jeho budoucí architektury.

## Rychlé spuštění ukázky

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

Návrhy se ukládají v prohlížeči nebo se přenášejí pomocí exportovaného souboru. Poptávkový průvodce připravuje soubor s návrhem a přílohami; současná verze jej sama nikam neodesílá. Cena a výrobní proveditelnost se ověřují s truhlářem.

## Původ této verze

První import zachovává všech 131 souborů z archivu `TORO-konfigurator-2026-09-11.zip` a doplňuje dokument architektury. Zdrojová revize uvedená v původním balíčku je `c5fec1f0a28e7d5598b51228d65c7258ad8a8b6f`.

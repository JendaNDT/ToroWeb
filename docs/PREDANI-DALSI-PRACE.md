# ToroWeb — předání aktuální verze

Stav k 12. 9. 2026. **Novější předání:** zjednodušené ovládání obou režimů je hotové, viz [plán zákaznické cesty](ZJEDNODUSENI-ROZHRANI.md) a [aktuální ověření, balíček a snímky](ZJEDNODUSENI-ROZHRANI-OVERENI.md). Nabídka Návrh soustřeďuje soubory, detaily mají shrnutí a pokojové nástroje jsou kontextové. Aktuální distribuce je `zdrojove-soubory/outputs/TORO-jednoduche-ovladani-2026-09-12.zip`; původní balíček níže zůstává pro porovnání. Publikace do GitHubu byla nově vyžádaná samostatně a její skutečný výsledek je v závěrečném předání úlohy.

Následující přehled zachycuje dokončenou základní verzi před zjednodušením ovládání. Stav k 12. 9. 2026. Implementace je v `/Users/jenda/.codex/worktrees/683d/ToroWeb`, aplikace v `zdrojove-soubory/`. Výchozí revize `b6f3ba1ae50d28d06ebb60c4617bc06ac750ae9a` byla při začátku ověřena proti `origin/main` a obsahovala schválené předání. Tato práce nepublikuje na GitHub ani na web TORO.

## Hotový rozsah

- Výchozí **Jeden kus nábytku** pro všech 15 typů, velký samostatný náhled a společný typový editor. Parametry jsou nezávislé na místnosti; export kusu neobsahuje pokoj, umístění ani technické body.
- **Celý pokoj** zachovává půdorysy L/U, výklenky a výstupky, více otvorů, 28 technických typů, šest sestav, nábytek, kontrolu a poptávku s půdorysem i 3D náhledem.
- Vložení zachová všechny parametry a ostatní data pokoje. Chybějící pokoj lze vytvořit; nedostatek místa nebo 30 existujících kusů nic nepřepíše. Každé vědomé další vložení vytvoří samostatné ID.
- Úprava z pokoje používá stejný editor. Potvrzení mění konkrétní kus; zrušení nemění pokoj. Identita, přesná poloha, natočení, stav stávajícího nábytku a vazby sítí zůstávají zachované. Rozměry se neomezují pokojem; případná kolize a neplatnost dřívějšího potvrzení se znovu vyhodnotí.
- Koncept samostatného kusu, pokoj a rozpracovaná editace se obnovují společně. Historie 40 změn funguje během relace napříč oběma režimy; soubory lze načíst se zachováním nesouvisejícího konceptu. Záloha celého prostředí obsahuje oba návrhy i rozpracovanou editaci.
- Samostatná poptávka obsahuje skutečný kus a jeho náhled; místnost nevyžaduje. Starý vstup `/skrin` otevírá společné prostředí. Podporované uložené skříně i výslovně označené staré skříňové poptávky se převádějí bez pomocné místnosti.
- Jednotné barvy a ovládání TORO, lokální Poppins/Inter, mobilní rozložení. Při nedostupném WebGL zůstává rozměrové schéma kusu nebo úplný půdorys pokoje; nastavení, soubory a poptávka fungují dále.

## Formáty a ochrana dat

Nový klíč `toro-workspace-v1` je jediným automaticky zapisovaným návrhem. Obsahuje `format: toro-workspace`, `version: 1`, `single`, volitelný `room`, `mode` a volitelný `edit`. Samostatné soubory mají `format: toro-furniture`, `version: 1`; pokoj zůstává ve formátu 4. Poptávková obálka `toro-inquiry` v1 obsahuje jeden z obou formátů.

Chybí-li nový klíč, načtou se podporované staré pokojové klíče a `forma-design-v1`. Originály se nemění. Poškozený současný záznam se nenahrazuje starším nebo výchozím návrhem. Chyba čtení, zápisu či souběžná změna v jiném okně zastaví automatické ukládání. Výslovná obnova nejprve zálohuje existující nový záznam; selhání zálohy nepovolí přepsání. Při nedostupném úložišti lze soubory dále stahovat.

## Dokumentace a ověření

- [Devítietapový plán a přijímací scénáře](SPOLECNY-KONFIGURATOR.md).
- [Implementační zpráva, výsledky a balíček](SPOLECNY-KONFIGURATOR-OVERENI.md).
- [README aplikace](../zdrojove-soubory/README.md) s příkazy a opakovatelnými browserovými sadami.

Aktuální `npm run check` zahrnuje 81 doménových kontrol, původní geometrické regrese, 120 nových krajních variant nábytku a audit 5 250 normalizačních případů. Navíc proběhly skutečné browserové průchody oběma cestami, všemi typy, stahování a zpětné importy; mezní scénáře pokrývají úložiště, vazby, limity, kolize, klávesnici a chybějící WebGL. Přesné výsledky včetně konečného offline průchodu uvádí implementační zpráva.

## Předváděcí balíček

`/Users/jenda/.codex/worktrees/683d/ToroWeb/zdrojove-soubory/outputs/TORO-prototyp-2026-09-12.zip`

Rozbalit a otevřít `TORO-ukazka/TORO-otevrit.html`. Knihovny, obrázky a písma jsou uvnitř. Nový balíček byl skutečně spuštěn přes `file://` v izolovaném Chrome na macOS s vypnutou sítí. Nejde o ověření fyzického telefonu nebo Windows. Výsledná data zůstávají v prohlížeči nebo ve stažených souborech; u místních HTML se dostupnost úložiště může lišit, proto přenos návrhu provádějte souborem.

Původní HTML v kořenu zůstává historické. Aktuální balíčky v `outputs/` a důkazy v `.sites-runtime/` jsou ignorované lokální soubory. Zdrojové změny a dokumentace jsou určené k místnímu předání; GitHub a veřejný web nebyly změněny.

## Trvající rozhodnutí

Cenotvorba, skutečný příjemce a doručování poptávek zůstávají nenapojené; označené ukázkové kontakty se nikam neodesílají. Odložená kapitola 27 se neimplementovala: kuchyňský modul, detailnější vestavby, automatiky, účty/cloud, sdílení, komentáře a zakázkový systém.

Půdorysy zůstávají pravoúhlé; atyp zobrazuje vnější obálku a zadání. Výrobu, kotvení, výřezy a zaměření musí upřesnit TORO. Neproběhlo fyzické mobilní, Windows ani úplné přístupnostní ověření.

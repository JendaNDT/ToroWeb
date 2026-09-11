# První etapa plánovače TORO

Místní implementace navazuje na `c6f79b0` a návrh `TORO-ARCHITEKTURA.md`.

## Rozsah

- Pět hlavních sekcí: Prostor, Technické prvky, Nábytek, Kontrola, Poptávka.
- Jeden kontextový panel na desktopu a vysouvací panel na mobilu. Výběr v pracovní ploše nepřekryje scénu; mobilní vlastnosti se otevírají tlačítkem Upravit. Výběr ze seznamu otevře vlastnosti přímo.
- Nábytek lze táhnout za model i jeho popisek v půdorysu. Vybraný kus má přímo nad scénou tlačítka otočení doleva/doprava po 90°. Šipky posouvají, R / Shift+R otáčí při zaměření scény. Jeden dokončený tah tvoří jeden krok historie; Escape nebo přerušení gesta vrátí výchozí polohu.
- Zásuvka 230 V: umístění kliknutím do půdorysu nebo zadáním hodnot, změna stěny, vzdálenosti středu od začátku stěny, výšky středu a rozměrů rámečku. Odebrání lze vrátit historií.
- Stejná zásuvka se vykresluje v 2D i 3D. Značky Z1, Z2… odkazují na seznam v panelu. Značku lze táhnout podél stěny nebo k jiné stěně; výška nad podlahou se zachová. Při zapnutém přichytávání je krok 5 cm.
- Kontrola překrytí zásuvky nábytkem včetně výšky a zásahu do dveří/oken. Kliknutí na hlášení zvýrazní související prvek.
- Export návrhu a poptávky obsahuje technické prvky. Poptávka obsahuje také jejich textový soupis a aktuální upozornění.
- Automatické ukládání a obnovení návrhu v prohlížeči, ruční uložení, historie 40 změn, import starších návrhů.

## Data a hranice

`RoomDesign` je společný zdroj pro scénu, kontrolu a export. Nové návrhy používají verzi 2 a `technicalPoints`. `parseDesign` validuje starší verzi 1, verzi 2 i obálku poptávky; starší návrh převede na verzi 2 bez ztráty nábytku a otvorů. Nepodporované budoucí verze a neplatné souřadnice se odmítají.

Nový klíč úložiště je `toro-room-v2`. Při jeho absenci se načte `toro-room-v1`, případně `forma-room-v1`; původní klíče se nepřepisují. Ukládání začíná až po obnovení dat. Chyba načtení nebo úložiště blokuje automatické přepisování a nabídne export souboru.

Polohy a rozměry jsou v cm. Odsazení zásuvky se měří ke středu, u přední/zadní stěny zleva a u bočních stěn odzadu. Přístupová zóna 12 cm před rámečkem je pouze orientační kontrola překrytí, nikoli technická norma. Kolize se vyhodnocují z aktuálních dat; neukládají se jako zastaralý stav do modelu místnosti.

Kontaktní údaje a fotografie se uchovávají během otevřené relace aplikace a exportují do poptávky. Nejsou součástí automatického uložení místnosti. Skutečné odeslání, cloudové ukládání, ostatní typy technických prvků a stavební překážky patří do dalších etap.

Místnost má nadále obdélníkový půdorys a nejvýše jeden otvor na stěně. Původní `/skrin` zůstává samostatným konfigurátorem. Přechody mezi oběma editory používají plnou navigaci; v ověřovaném náhledu vinext klientský přechod neproběhl, zatímco přímá navigace ano. Kořenový `TORO-otevrit.html` je původní distribuovaná ukázka; změny této etapy se spouštějí ze `zdrojove-soubory/`.

## Vizuální reference

Referencí je [in-toro.com](https://www.in-toro.com/), ověřeno 11. 9. 2026: oranžová `#F1980B`, tmavá `#1B130C`, teplé světlé plochy, Poppins pro hlavní nadpisy a Inter pro běžný text, asymetrické zaoblení hlavních tlačítek. Písma jsou lokální; zdrojem je oficiální distribuce Google Fonts, licence SIL OFL jsou v `public/fonts/`.

Pracovní plocha upřednostňuje návrh místnosti, drobné akcenty a kontextové ovládání. Tato reference platí také pro další etapy.

## Ověření

- `npm run test:room`: původní doménové kontroly a scénáře technických prvků, migrace, historie a exportu.
- `node node_modules/typescript/bin/tsc --noEmit`.
- ESLint změněných modulů; původní `<img>` pro místní datové náhledy ponechány.
- Produkční sestavení přes `npm run build`.
- Myš v místním prohlížeči: tažení nábytku za popisek ve 2D a za čelo ve 3D, přímé otočení oběma směry, přesun zásuvky ve 2D i 3D se zachovanou výškou, samostatné vrácení otočení a celého tahu. Úzké okno už při výběru neotevírá modal; tlačítka se vejdou i do šířky 320 px.
- Místní prohlížeč: vložení kliknutím, přesné hodnoty, upozornění, historie, obnovení stránky, souhrn poptávky, povinná kontaktní pole a rozložení v desktopové a mobilní šířce. Obsah JSON poptávky a zpětný import jsou ověřeny testem společného generátoru. Prohlížeč zobrazil dokončení přípravy podkladů, ale jeho automatizační rozhraní nepotvrdilo událost skutečného stažení souboru; uložení staženého souboru na disk proto není potvrzeno.

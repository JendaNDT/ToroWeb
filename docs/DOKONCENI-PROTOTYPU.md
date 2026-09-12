# Dokončení místního prototypu TORO

> Historická zpráva předchozí etapy z 11. 9. 2026. Navazuje na ni [společný konfigurátor jednoho kusu a pokoje](SPOLECNY-KONFIGURATOR-OVERENI.md); jeho aktuální balíček už má ověřený běh přes `file://` s vypnutou sítí.

Stav k 11. 9. 2026: schválená etapa místních funkcí je implementovaná v pracovní kopii. Navazuje na technické sítě a původní architekturu. Nejde o potvrzení publikace na GitHubu nebo nasazení na in-toro.com.

Zadavatel výslovně určil, že první verze slouží k předvedení kamarádovi. Cenotvorba, příjemce a způsob doručování poptávek zůstávají nenapojené. Ukázkové kontakty a zadání jsou označené; skutečné hodnoty doplní TORO později. Aplikace nic sama neodesílá.

## Dokončený rozsah

| Oblast | Chování prototypu |
| --- | --- |
| Místnost | Obdélník, L a U; přesné posunutí jednotlivé stěny, přidávání výklenků a výstupků; pravoúhlý polygon do 32 vrcholů. |
| Stavební otvory | Až 40 dveří a oken, více na jedné stěně i nad sebou. Otvory se skutečně vyřezávají do modelu stěny. Překryvy a přesahy se hlásí. |
| Geometrie | Podlaha, stěny, nábytek, technické body, tažení a kolize používají stejný půdorys. Kontrola zachytí i kus přemosťující výřez do U, jehož všechny rohy leží uvnitř místnosti. |
| Technické sítě | 28 typů v osmi kategoriích; fungují také na nově vzniklých vnitřních stěnách. Podrobný rozsah zachycuje předchozí zpráva o sítích. |
| Nábytek | 15 druhů včetně postele s rámem, čelem, matrací a polštáři a atypického kusu s rozměry, materiálem a vlastním zadáním. |
| Sestavy | Šest hotových základů včetně nové ložnice do L se dvěma okny, postelí, skříní a atypickým boxem. Koupelna obsahuje sítě. |
| Kontrola | „Beru na vědomí“ ukládá datum a otisk souvisejících údajů. Změna těchto údajů vyžaduje nové potvrzení. Potvrzený problém nadále zůstává problémem a je součástí poptávky. |
| Poptávka | Úplný vektorový půdorys a samostatně vytvořený 3D náhled, nezávisle na aktuální kameře a filtrech. Rozměry místnosti a stěn, otvory, seznam kusů, technické prvky, upozornění, potvrzení, zadání, kontakt a přílohy. |
| Ukázkové údaje | Tlačítko doplní prázdná pole ukázkovým kontaktem; nepřepisuje zadané hodnoty. Export výslovně obsahuje režim prototypu, nenastavenou cenotvorbu a příjemce. |
| Uložení | Formát 4, klíč `toro-room-v4`, bezeztrátový převod podporovaných verzí 1–3. Staré klíče zůstávají zachované. Návrh lze znovu otevřít také z poptávkového souboru. |

Zmenšení pokoje nepřepisuje rozměry otvorů ani zaměřené technické souřadnice. Přesahující otvor zůstává v datech a objeví se v Kontrole. Při změně půdorysu se přípojky a otvory pokud možno přiřadí odpovídajícímu úseku původní stěny; případný nevyřešený přesah vyžaduje kontrolu uživatele.

## Ověření

`npm run check` prošlo: 33 kontrol plánovače, 16 kontrol sítí, 12 kontrol rozšířené geometrie a podkladů. Testy zahrnují 1 080 variant fyzické obálky nábytku, 708 variant technické geometrie, 14 variant vnitřních stěn a 5 250 normalizačních případů bez selhání. ESLint nemá chyby, pět upozornění se týká použití běžných obrázků pro logo, lokální náhledy a fotografie. TypeScript i produkční sestavení prošly. `npm audit --audit-level=moderate` nehlásí známé zranitelnosti.

V místním produkčním náhledu bylo ověřeno:

- Přidání dvou oken na stejnou stěnu, vyvolání překryvu, potvrzení problému, obnovení stránky a zneplatnění potvrzení při změně otvoru. Kliknutí na hlášení vybere příslušný otvor.
- Přepnutí půdorysu do L a U, přidání výklenku a vrácení změny.
- Tažení postele myší směrem do výřezu místnosti, omezení na skutečnou hranici, otočení o 90 stupňů a vrácení změny. Výběr atypického kusu zpřístupní jeho zadání.
- Samostatný půdorys i 3D obrázek při přípravě poptávky z režimu 2D, skutečné zobrazení geometrie a obou oken.
- Ukázkový kontakt, stažení soupisu, návrhu a poptávky v Chrome. Kontrola obsahu skutečně stažených souborů a opětovné načtení pokoje z poptávky.
- Rozložení při šířce 320 px: kontaktní formulář, vysouvací panel místnosti a celé rozhraní bez vodorovného přetékání v ověřených stavech.
- V ověřeném průchodu Chrome bez chyb a varování konzole.

Záznamy kontrol jsou v ignorované složce `zdrojove-soubory/.sites-runtime/technical-tests/` (zejména `architecture-check.log`, `architecture-dependencies.log` a `architecture-package.log`). Nejde o ověření na fyzickém telefonu, Windows ani kompletní audit přístupnosti.

## Balíček pro předvedení

- Soubor: `TORO-prototyp-2026-09-11.zip`.
- Velikost: 3,650,433 bajtů.
- SHA-256 archivu: `73f80d4621c23c8f6348e0f775bc5aecfcd822ff74e078a0d2b1848829585871`.
- Otisk prostředků: `facf5ecf033414d030773edb7ef6aaa9570a4ab47d53dd20d8857dae5def4095`.
- Výchozí commit: `a78cbaf8147ff1ba7b8f43b4ea2338fac4cb3c41`; balíček zahrnuje místní změny nad ním.
- Obsah: samostatné HTML, český návod, označení verze a licence 116 knihoven a součástí.

ZIP vzniká pomocí `npm run package:demo`. Kontroluje se syntaxe vloženého JavaScriptu, vložení prostředků, licence, integrita ZIPu a shoda jeho souborů se sestavením. Neobsahuje osobní návrhy ani fotografie autora. Původní HTML v kořenu repozitáře a dřívější balíček se sítěmi zůstávají historickými verzemi.

Otevření výsledného HTML dvojklikem nebylo v tomto prostředí ověřeno: automatizovaný prohlížeč nepovolil místní adresu. Funkční průchod byl ověřen přes místní produkční server. Stažení souborů z vestavěného prohlížeče se nepodařilo doložit; skutečné stažené soubory jsou ověřené v Chrome.

## Co zůstává mimo tuto verzi

Budoucí rozšíření z kapitoly 27 původní architektury nejsou součástí dokončené místní etapy: specializovaný kuchyňský modul, automatické návrhy, cenový odhad, účty a cloud, sdílecí odkazy, komentáře TORO a převod do zakázkového systému. Cenotvorbu a doručování zadavatel výslovně odložil do získání reálných podkladů.

Půdorys je pravoúhlý; šikmé stěny, šikmé stropy ani více podlaží nejsou podporované. Atypický kus představuje vnější rozměry a textové zadání, nikoli libovolný detailní 3D model. Technické body nejsou projekt tras rozvodů, servisních norem nebo potvrzení připojitelnosti. Odborné zaměření, konstrukci, kotvení, výřezy a cenu musí potvrdit TORO.

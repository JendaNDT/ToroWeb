# Technické prvky a sítě – dopracování architektury

**Stav: původní schválený návrh; etapy A–C jsou nyní implementované v místní pracovní kopii.**

Výchozí posouzení se vztahovalo k `main` na commitu `a78cbaf8147ff1ba7b8f43b4ea2338fac4cb3c41`, 11. 9. 2026. Text níže zachovává tehdejší zadání. Aktuální funkce, výsledky kontrol a dosud neověřené otevření offline HTML popisuje [stav implementace](TECHNICKE-PRVKY-IMPLEMENTACE.md).

Navazuje na kapitoly 6, 7, 11, 12 a 26 dokumentu [TORO-ARCHITEKTURA.md](../TORO-ARCHITEKTURA.md). Voda a další sítě jsou součástí původního záměru. Dosavadní implementace i připravený ZIP představují první etapu, nikoli naplnění celé architektury.

## 1. Co chybělo ve výchozí první etapě

Implementovaný `TechnicalPoint` i jeho validátor přijímají pouze zásuvku. Poloha je vázaná na stěnu, rozměry na rámeček 6–30 cm a vykreslení na symbol zásuvky. Kontrola používá pro každý bod stejnou orientační zónu 12 cm před stěnou. To nestačí pro radiátor, potrubí, podlahový odpad ani přístup k uzávěru.

Nábytek již zahrnuje umyvadlovou skříňku a prádelní skříň s ilustračními spotřebiči. Jejich vztah k vodě, odpadu a elektřině se ale nekontroluje. Technické body nemají vazbu na konkrétní kus či spotřebič.

## 2. Katalog, který má další etapa pokrýt

| Skupina | Prvky | Co je důležité zachytit |
| --- | --- | --- |
| Elektřina | zásuvka, vícezásuvka, silový přívod, vypínač, světelný vývod | druh bodu, poloha, rozměr, dostupnost; požadavky konkrétního spotřebiče, pokud jsou známé |
| Voda | studená voda, teplá voda, vodní uzávěr | každý vývod samostatně; možnost vytvořit pojmenovanou skupinu |
| Odpad | odpadní vývod ve stěně nebo podlaze | samostatná poloha a výška, známý průměr a vyčnívání |
| Plyn | přípojný bod, uzávěr | rozlišení přípojky a ovládacího místa, posouzení přístupu |
| Topení | radiátor, koupelnový žebřík, ventil, viditelné potrubí | skutečný objem v místnosti a samostatně prostor potřebný pro přístup |
| Větrání | větrací otvor, vývod digestoře, otvor vzduchotechniky | tvar, rozměr, umístění na stěně či stropu, možné zakrytí |
| Data | datová a TV/anténní zásuvka, jiný komunikační bod | typ, poloha a dostupnost |
| Pevné překážky a servis | rozvaděč, revizní otvor, měřidlo, šachta, komínové těleso, jiné potrubí či překážka | fyzický objem, přístupná strana a případný servisní prostor |

Zkratka „Voda a odpad pro umyvadlo“ vytvoří tři samostatné prvky ve skupině: studenou vodu, teplou vodu a odpad. Uživatel může každý zvlášť přeměřit, upravit a odebrat. Výchozí polohy jsou pouze návrhem, dokud je nepotvrdí měřením. Obdobná zkratka pro pračku pomůže se zadáním vody, odpadu a zásuvky; není potvrzením vhodnosti zapojení konkrétního výrobku.

## 3. Jednotné a srozumitelné zadávání

Postup zůstane **Technické prvky → kategorie → prvek → umístit → upřesnit**. Vlastnosti se otevírají až po výběru. Kategorie mají ikonu a text; barva sama nenese význam. Vizuál navazuje na TORO a varovné barvy zůstávají vyhrazené kontrolním hlášením.

- Na stěně uživatel zadává vzdálenost od označeného rohu a výšku nad podlahou. Měřicí čára ve scéně ukazuje, zda se měří ke středu vývodu, nebo k okraji objemové překážky.
- Na podlaze a stropu zadává vzdálenosti od dvou označených stěn. Rozhraní nevyžaduje znalost souřadnic X/Y/Z.
- Bod i jeho popisek lze vybrat a táhnout. Pro přesnou výšku slouží číselné pole; pohled na vybranou stěnu může usnadnit práci s více vývody nad sebou.
- Zámek polohy chrání zaměřené prvky před nechtěným tažením. Jeden tah tvoří jeden krok historie a Escape ho zruší.
- Filtr kategorií a výškové popisky udrží čitelný půdorys. Skrytí kategorie nemění kontrolu ani export. Podlahové a stropní prvky se odliší symbolem a textem.
- Každý prvek rozlišuje **stávající / navrhovaný** a **zaměřený / orientační / k doplnění**. Neznámý rozměr se nevydává za přesně změřený.

## 4. Tři rozdílné věci: značka, překážka a přístup

Společný systém musí oddělovat význam prvku od jeho geometrie:

1. **Přípojné místo nebo otvor:** poloha, orientace, rozměr a případné vyčnívání. Zvětšená klikací značka není fyzickým rozměrem přípojky.
2. **Pevný objem:** radiátor, šachta nebo rozvaděč mají šířku, výšku a hloubku. Kontroluje se jejich skutečný prostorový obal.
3. **Prostor pro přístup:** samostatná oblast před ventilem, revizními dvířky nebo jiným obsluhovaným prvkem. Nesmí se zaměňovat s fyzickým objemem.

Viditelné potrubí lze zaznamenat jako jednoduchý přímý úsek s průměrem nebo obalem. Lomená trasa se skládá z úseků; systém tím nepočítá vedení sítí, dimenzování ani proveditelnost instalace. Stavební překážky mohou sdílet geometrii a výběr, ale mají vlastní druh a neopakují se v návrhu pod dvěma identifikátory.

## 5. Kontroly podle významu

| Situace | Výsledek plánovače |
| --- | --- |
| Nábytek se fyzicky protíná s radiátorem, šachtou nebo trubkou | Problém s označením obou objektů. |
| Nábytek zasahuje do zadaného prostoru pro přístup | Upozornění na konkrétní uzávěr, revizi nebo obsluhu; uvést, z jakých zadaných údajů vychází. |
| Voda a odpad jsou uvnitř přiřazené umyvadlové skříňky | Vztah může být zamýšlený. Prověřit prostor pro rozvody a zásuvky nábytku; bez údajů o výřezu zobrazit „ověřit výřez a přístup“. |
| Bod leží za jiným nábytkem a není k němu přiřazen | Upozornění na možné zakrytí. Pouhá blízkost automaticky nevytváří vazbu. |
| Umyvadlo nebo pračka nemá přiřazené přípojky | „Přípojky nejsou zadané nebo přiřazené.“ Neprohlašovat, že v reálné místnosti neexistují. |
| Přípojka je vůči spotřebiči daleko | Zobrazit orientační geometrickou vzdálenost. Bez údajů o výrobku a trase nepotvrzovat ani nezamítat připojitelnost. |
| Změna místnosti dostane zaměřený prvek mimo její hranice | Zachovat měření a upozornit; nepřesouvat automaticky skutečnou přípojku jinam. |
| Některé údaje nejsou známé | Kontrola výslovně ukazuje „nelze posoudit“ u dotčené vlastnosti. |

Přiřazení přípojky ke skříňce nesmí samo potlačit kontrolu fyzického průniku nebo zakrytí uzávěru. Nynější kvádr obálky nábytku nerozlišuje vnitřní dutinu, záda, police a zásuvky; bez doplnění servisního prostoru lze u těchto případů poskytovat jen upozornění k ověření.

Nevytvářet univerzální „bezpečnou vzdálenost“ pro všechny sítě. Případná konkrétní instalační pravidla přidávat pouze s ověřeným zdrojem, rozsahem platnosti a potřebnými vstupy. Dosavadních 12 cm je orientační pomůcka pro zakrytí zásuvky, nikoli použitelný výchozí parametr pro ostatní sítě.

Automatické hledání místa pro nový nábytek musí odmítat skutečné prostorové kolize, ale umožnit přidání kusu, jehož přípojky ještě nejsou zadány. Současné `findFreePosition` odmítá kandidáta při jakémkoli hlášení; po rozšíření kontrol by jinak mohlo nechtěně zablokovat vložení umyvadlové či prádelní skříně.

## 6. Data, kompatibilita a poptávka

Navržená verze `RoomDesign` 3 zachová jeden společný zdroj pro panely, scénu, historii, kontroly a poptávku. Typy a parametry se definují v katalogu; komponenty nemají vlastní seznamy názvů a rozměrových limitů.

- Rozlišit polohu na stěně, podlaze, stropu a v prostoru pomocí explicitního typu umístění. Fyzická geometrie, velikost značky a oblast přístupu jsou samostatné údaje.
- Ukládat typ, stabilní identifikátor a označení, polohu, známé rozměry, stav zaměření, stávající/navrhované provedení, poznámku a volitelnou skupinu. Označení v obrázku a soupisu se nemění při odebrání jiného prvku.
- Vazba na nábytek nebo spotřebič používá identifikátory a účel přípojky. Návrh může obsahovat více přípojek na jeden kus i skupiny bodů. Konkrétní spotřebič nemusí být při prvním návrhu známý.
- Import verzí 1 a 2 zachová nábytek, otvory i identifikátory a polohy zásuvek. Nová verze používá vlastní klíč ukládání; staré uložené návrhy zůstanou zachované pro návrat ke staré aplikaci.
- Rozlišit neplatná vstupní data od platně zaznamenané, ale prostorově kolizní situace. Návrh s hlášením „mimo místnost“ musí jít bezpečně uložit a znovu otevřít. Neznámé typy nebo budoucí verze se nesmějí tiše zahazovat.
- JSON i textová poptávka obsahují typy, označení, měřicí reference, rozměry, stavy zaměření, vazby, poznámky a nevyřešené kontroly. Seznam souhlasí s 2D/3D pohledem.
- Výsledek kontroly rozlišuje „bez nalezených kolizí“ od „vše potřebné bylo posouzeno“. Neúplná data nejsou důvodem k bezpodmínečnému zelenému výsledku.

## 7. Pořadí realizace a podmínky dokončení

**A. Společný model a první úplný scénář:** migrace, katalog, různé plochy umístění; koupelna s umyvadlovou skříňkou, studenou a teplou vodou, odpadem a zásuvkou. Celou cestu dokončit přes ovládání, vazby, upozornění, uložení a poptávku.

**B. Zbývající přípojné body:** vícezásuvka, silový přívod, vypínač, světelný vývod, plyn a uzávěry, větrání, data. Prověřit samostatné zadání i skupiny a podlahové/stropní umístění tam, kde se používá.

**C. Objemové a servisní prvky:** radiátor a žebřík, rozvaděč, revize, měřidla, potrubí, šachta a obecná překážka. Doplnit odpovídající kolize a oblasti přístupu. Ukázková koupelna se rozšíří o topný žebřík; další scénář pokryje prádelní sestavu.

Za dokončenou oblast technických prvků považovat až A–C. Každý krok lze průběžně ověřit; hotový dílčí scénář neznamená kompletní katalog ani kompletní původní architekturu.

Před novým distribučním balíčkem ověřit:

- vložení, přesné zadání, tažení, zámek, smazání a historii ve 2D/3D;
- všechny čtyři stěny, podlahu a strop, desetinné hodnoty a změnu rozměrů místnosti;
- odlišení fyzické kolize, zamýšlené přípojky ve skříňce a neznámého přístupu;
- vložení nábytku před zadáním přípojek, změnu či smazání vazby a přepočet hlášení;
- import starých verzí, opakované uložení/načtení a bezpečné chování při chybě úložiště;
- shodu exportu se scénou a skutečně stažený a zpětně načtený soubor;
- ovládání na desktopu i v úzkém mobilním rozhraní a funkci nové offline distribuce.

## 8. Další omezení původní architektury

Rozšíření sítí samo neřeší další otevřené části: místnost je stále obdélníková, na stěně může být nejvýše jeden otvor a skutečné odeslání poptávky není připojené. Tyto položky se mají dál uvádět jako samostatné mezery vůči původnímu záměru, nikoli schovat pod dokončení technických prvků.

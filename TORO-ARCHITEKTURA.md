# TORO – architektura plánovače interiéru

> Dosavadní místní prototyp a rozsah jeho ověření: [dokončení prototypu](docs/DOKONCENI-PROTOTYPU.md). Tento plán nově zahrnuje schválený konfigurátor jednoho kusu jako hlavní vstup do první verze; tato změna zatím není implementovaná. Cenotvorba a doručování poptávek zůstávají podle zadavatele nenapojené.

**Stav:** pracovní architektura se schváleným doplněním první verze

**Datum:** 11. 9. 2026

**Účel dokumentu:** průběžně zachycovat schválený směr vývoje a odlišovat jej od již implementovaných funkcí.

### Schválené rozhodnutí: nejprve jeden kus, potom pokoj

Konfigurátor **jednoho kusu nábytku** bude součástí první verze a hlavním vstupem do aplikace. Zákazník si vybere typ, upraví kus v samostatném náhledu a následně jej může tlačítkem **Vložit do pokoje** přenést do prostorového návrhu. Přenášejí se všechny parametry kusu; v pokoji jej zákazník rozmístí a může se vracet k jeho detailním úpravám.

Tento společný režim pro všechny podporované typy nahradí dnešní samostatný konfigurátor jedné skříně. Záložka **Celý pokoj** zůstane dostupná i přímo. Oba režimy mají používat jednotný vzhled TORO, ovládání a model nábytku.

Jde o schválený rozsah první verze, nikoli o odložené budoucí rozšíření z kapitoly 27. Dosavadní volba „Jeden kus“ pouze založí pokoj s jedním kusem; sama ještě toto rozhodnutí nenaplňuje.

---

## 1. Hlavní cíl

Plánovač má působit jako přirozená součást značky **TORO Interiors**, nikoli jako cizí aplikace připojená k webu.

Zákazník má být schopný:

1. vybrat a nakonfigurovat jeden kus nábytku,
2. připravit poptávku tohoto kusu nebo jej vložit do pokoje,
3. vytvořit místnost a zadat pevné stavební a technické prvky,
4. rozmístit navržený kus a případný další nábytek,
5. průběžně dostávat jednoduchá upozornění a zkontrolovat návrh,
6. připravit podklady pro poptávku TORO.

Zákazník, který chce rovnou zařizovat místnost, může začít záložkou **Celý pokoj**. Pro samotnou konfiguraci a poptávku jednoho kusu není zadání místnosti povinné.

Hlavní princip:

> **Hodně možností uvnitř, ale na první pohled klid a jednoduchost.**

Složitost se nemá odstranit, ale **skrýt a odkrývat až ve chvíli, kdy ji uživatel potřebuje**.

---

## 2. Postavení plánovače na webu TORO

Plánovač má být výrazná součást webu a může fungovat jako jedna z hlavních cest k poptávce.

Doporučené označení:

**TORO plánovač interiéru**

Možné hlavní výzvy na webu:

- Navrhnout interiér
- Spustit plánovač
- Vytvořit vlastní návrh
- Připravit podklady pro poptávku

Přechod z webu do plánovače musí působit plynule. Uživatel má stále cítit, že je v prostředí TORO.

---

## 3. Základní struktura aplikace

Plánovač bude mít **dvě hlavní záložky v jednom společném prostředí**:

1. **Jeden kus nábytku** — výchozí záložka: výběr typu a detailní konfigurace jednoho kusu.
2. **Celý pokoj** — prostorový návrh místnosti, technických prvků a více kusů nábytku.

Uprostřed zůstává náhled právě upravovaného kusu nebo pokoje. Panely a nástroje odpovídají zvolenému režimu. Přepnutí záložky zachová rozpracovaný kus i pokoj.

### Sekce záložky Celý pokoj

1. **Prostor**
2. **Technické prvky**
3. **Nábytek**
4. **Kontrola**
5. **Poptávka**

Každá sekce otevře pouze nástroje související s právě prováděným úkolem.

### Záložka Jeden kus nábytku

Zákazník nejprve vybere z celého podporovaného katalogu, v dosavadním prototypu z 15 typů. K dispozici mají být skříně, komody, police, stoly, postele, koupelnové i další kusy včetně atypického prvku. Specializovaný kuchyňský modul zůstává samostatným budoucím rozšířením.

Po výběru typu se zobrazí velký samostatný náhled a pouze jeho relevantní nastavení: rozměry, materiály, vnitřní uspořádání, čela nebo vlastní zadání podle typu. Nástroje pro stěny, okna a sítě patří do režimu pokoje.

Hlavní návazné akce jsou **Vložit do pokoje** a **Připravit poptávku**. Samostatná konfigurace má smysl i pro zákazníka, který pokoj modelovat nechce.

### Přenos kusu a návrat k úpravám

- **Vložit do pokoje** přidá nakonfigurovaný kus do existujícího pokoje. Pokud pokoj ještě není založený, aplikace nabídne jeho vytvoření a rozpracovaný kus zachová.
- Přenesou se typ, název, rozměry, materiály, vnitřní členění, čela, kování a ostatní parametry nebo poznámky podporované daným typem.
- Zákazník následně upraví polohu a natočení. Vložení nepřepíše místnost ani již rozmístěný nábytek a respektuje běžné kontroly umístění.
- Z vybraného kusu v pokoji se lze vrátit do stejného detailního konfigurátoru. Uložení úprav změní tento konkrétní kus; nevytvoří nechtěnou kopii. Potom se znovu vyhodnotí kolize.
- Oba režimy sdílejí katalog, modely, pravidla parametrů a vzhled. Nahrazení původního konfigurátoru skříně musí zachovat možnost načíst dřívější uložené návrhy.

---

## 4. Hlavní pracovní obrazovka

### Horní lišta

Má být jednoduchá a nízká.

Obsah:

- logo TORO,
- přepnutí **Jeden kus nábytku / Celý pokoj**,
- název návrhu,
- krok zpět,
- krok vpřed, pokud bude podporován,
- uložení návrhu,
- přepínač pohledu podle režimu, u pokoje **2D / 3D**,
- výrazné tlačítko pro přechod k poptávce.

Do horní lišty nepatří velké množství nastavení.

### Levý nebo kontextový panel

Na počítači může být hlavní navigace vlevo.

Na mobilu se stejný obsah může otevírat jako panel vysunutý ze spodní části obrazovky.

Panel zobrazuje pouze obsah právě zvolené hlavní sekce.

### Střed obrazovky

Největší část prostoru patří samotnému návrhu: samostatnému kusu v první záložce a místnosti v záložce Celý pokoj.

- 2D režim slouží hlavně pro přesné rozmístění a rozměry.
- 3D režim slouží hlavně pro kontrolu prostoru a vizuální představu.

Pracovní prostor musí zůstat vizuálně čistý.

---

## 5. Prostor

Sekce **Prostor** řeší vše, co definuje samotnou místnost.

### Základní položky

- rozměry místnosti,
- tvar místnosti,
- výška místnosti,
- dveře,
- okna,
- stavební prvky.

### Rozbalování funkcí

Po otevření sekce uživatel neuvidí všechny parametry zároveň.

Příklad:

**Prostor**
- Rozměry místnosti
- Dveře a okna
- Stavební prvky

Až po kliknutí na „Dveře a okna“ se ukáže například:

- Přidat dveře
- Přidat okno

Stejný princip platí pro ostatní části.

---

## 6. Technické prvky a inženýrské sítě

Tato oblast je zásadní pro praktické použití návrhu.

Implementační rozsah, vazby na nábytek, migraci dat a podmínky dokončení rozpracovává [návrh další etapy technických prvků](docs/TECHNICKE-PRVKY-DALSI-ETAPA.md). Aktuální zdroje již obsahují 28 typů v osmi kategoriích včetně vody, odpadu, plynu, topení, větrání, dat a servisních překážek. Konkrétní rozsah, ověření a zbývající omezení uvádí [stav implementace](docs/TECHNICKE-PRVKY-IMPLEMENTACE.md); tím není dokončena celá tato architektura.

Uživatel musí být schopný zaznamenat místa, která ovlivňují výrobu a rozmístění nábytku.

Nemá jít o profesionální stavební CAD systém. Zadávání musí být jednoduché.

### Kategorie

#### Elektřina

- zásuvka 230 V,
- vícezásuvka,
- silový přívod,
- vypínač,
- světelný vývod,
- další pevný elektrický bod podle potřeby.

#### Voda

- přívod studené vody,
- přívod teplé vody,
- společný vodní bod.

#### Odpad

- odpadní potrubí / odpadní bod.

Voda a odpad se evidují samostatně, protože jejich poloha a požadavky nejsou totožné.

#### Plyn

- plynový přívod,
- uzávěr plynu.

Uzávěr je důležité odlišit od běžného přípojného bodu, protože musí zůstat přístupný.

#### Topení

- radiátor,
- trubky topení,
- jiné pevné topné prvky.

#### Větrání a vzduchotechnika

- větrací otvor,
- vývod digestoře,
- vzduchotechnický otvor,
- další pevný vzduchotechnický bod.

#### Data a slaboproud

- datová zásuvka,
- internet,
- televizní / anténní zásuvka,
- další komunikační bod.

### Další pevné překážky

Do stejného systému lze zahrnout prvky, které sice nejsou přímo inženýrskou sítí, ale nábytek se jim musí přizpůsobit:

- rozvaděč,
- revizní otvor,
- vodoměr,
- plynoměr,
- elektroměr,
- komínové těleso,
- šachta,
- viditelné potrubí,
- jiný nepřemístitelný bod nebo oblast.

---

## 7. Jak technické prvky zadávat

Zadávání musí být co nejjednodušší.

### Doporučený postup

1. Uživatel otevře **Technické prvky**.
2. Vybere kategorii, například **Voda**.
3. Vybere konkrétní prvek.
4. Klikne na příslušné místo na stěně nebo v prostoru.
5. Aplikace nabídne základní hodnoty.
6. Uživatel případně upraví vzdálenost, výšku nebo rozměr.

Uživatel nemá ručně pracovat se souřadnicemi X, Y, Z.

### Přesnost

Po umístění prvku může aplikace zobrazit jednoduché údaje:

- vzdálenost od levého nebo pravého rohu,
- výška od podlahy,
- případně šířka a výška prvku.

Pokročilé hodnoty zůstanou skryté, dokud nejsou potřeba.

---

## 8. Nábytek

Sekce **Nábytek** obsahuje jednotlivé kusy a sestavy.

Katalog jednotlivých kusů a jejich vlastnosti jsou společné se záložkou **Jeden kus nábytku**. Úprava kusu přímo z pokoje používá tentýž konfigurátor a stejná pravidla.

Na první úrovni se zobrazí pouze hlavní kategorie.

Například:

- Skříně
- Komody a úložné prvky
- Police a knihovny
- Stolky a stoly
- Postele
- Kuchyňské prvky
- Ostatní
- Atypický prvek

Po výběru kategorie se zobrazí konkrétní typy.

### Vlastnosti prvku

Po označení konkrétního kusu se otevře malý kontextový panel.

Základní vlastnosti:

- šířka,
- výška,
- hloubka,
- poloha,
- natočení,
- materiál nebo dekor,
- základní vnitřní členění, pokud ho daný typ podporuje.

Pokročilé možnosti se zobrazí až po rozbalení položky **Pokročilé**.

---

## 9. Postupné odkrývání funkcí

Toto je jeden z hlavních principů celé architektury.

Uživatel nikdy nemá současně vidět všechny možnosti programu.

### Tři úrovně

Nejprve uživatel zvolí záložku **Jeden kus nábytku** nebo **Celý pokoj**. Následující příklady sekcí a kategorií popisují práci uvnitř těchto režimů; samostatný kus odkrývá jen vlastnosti vybraného typu.

#### Úroveň 1 – hlavní činnost

Například:

- Prostor
- Technické prvky
- Nábytek
- Kontrola
- Poptávka

#### Úroveň 2 – kategorie

Například u technických prvků:

- Elektřina
- Voda
- Odpad
- Plyn
- Topení
- Větrání
- Data

#### Úroveň 3 – detail

Konkrétní typ prvku a jeho vlastnosti.

Tím lze přidávat mnoho funkcí, aniž by rozhraní začalo působit složitě.

---

## 10. Kontextové ovládání

Pokud uživatel označí objekt, zobrazí se pouze nástroje související s tímto objektem.

Příklad:

Po kliknutí na skříň se mohou zobrazit:

- rozměry,
- posun,
- otočení,
- dekor,
- vnitřní uspořádání,
- duplikovat,
- odstranit.

Po kliknutí mimo objekt panel zmizí nebo se vrátí na vyšší úroveň.

---

## 11. Kontrola návrhu

Plánovač nemá pouze kreslit, ale také upozorňovat na zjevné problémy.

Kontrola má být pomocná, nikoli agresivní.

### Typy kontrol

Například:

- nábytek překrývá dveře,
- nábytek překrývá okno,
- dva kusy nábytku se překrývají,
- nábytek zakrývá důležitý technický bod,
- uzávěr plynu není přístupný,
- rozvaděč nebo revizní otvor je zakrytý,
- dřez nebo spotřebič je neobvykle daleko od potřebné přípojky,
- prvek je mimo místnost,
- kolem některého prvku není dostatečný manipulační prostor.

### Úrovně upozornění

Doporučené tři stavy:

- **Informace** – pouze doporučení.
- **Upozornění** – návrh je možný, ale stojí za kontrolu.
- **Problém** – pravděpodobná kolize nebo nepřijatelná situace.

Varovné barvy se používají pouze pro skutečné stavy kontroly, nikoli jako běžná součást grafického stylu.

### Kliknutí na problém

Po kliknutí na hlášení se problematické místo automaticky zvýrazní v návrhu.

---

## 12. Inteligence kontroly

Kontrola nemá předstírat, že nahrazuje projektanta nebo řemeslníka.

Jejím účelem je:

- zachytit zjevné chyby,
- pomoci zákazníkovi připravit kvalitnější podklady,
- upozornit TORO na možné problematické místo.

U méně jistých situací má aplikace raději zobrazit doporučení než absolutní zákaz.

---

## 13. Poptávka

Poptávka je přirozeným zakončením návrhu.

Nemá působit jako úplně jiná část aplikace.

### Doporučený průvodce

1. **Kontrola návrhu**
2. **Kontaktní údaje**
3. **Poznámka zákazníka**
4. **Fotografie současného prostoru**
5. **Souhrn**
6. **Příprava / odeslání poptávky**

### Souhrn návrhu

Před dokončením zákazník uvidí:

- půdorys,
- 3D pohled nebo náhled,
- rozměry místnosti,
- dveře a okna,
- seznam nábytku,
- rozměry jednotlivých prvků,
- použité materiály nebo dekory,
- technické body,
- seznam upozornění,
- poznámku,
- přiložené fotografie.

Stejná data mají být dostupná také TORO.

---

## 14. Uložení návrhu

Zachovat možnost:

- automatického lokálního ukládání,
- ručního uložení,
- exportu návrhu,
- importu návrhu.

Uživatel nemá mít strach, že při zavření okna přijde o práci.

Pokud se v budoucnu přidá účet zákazníka nebo online ukládání, musí to být doplněk, nikoli podmínka pro použití základního plánovače.

---

## 15. Mobilní verze

Plánovač musí zůstat použitelný na telefonu a tabletu.

Mobilní rozhraní nemá být pouze zmenšená desktopová verze.

### Mobil

- pracovní plocha přes většinu obrazovky,
- hlavní nástroje v jednoduché spodní nebo horní navigaci,
- detailní panely se vysouvají ze spodní části,
- velké dotykové cíle,
- minimum permanentně viditelných ikon.

### Desktop

- navigace může být vlevo,
- kontextové vlastnosti v bočním panelu,
- větší pracovní plocha,
- přesnější ovládání myší.

Funkční logika musí zůstat na obou platformách stejná.

---

## 16. Vizuální sjednocení s TORO

Vizuální sjednocení není závěrečný „nátěr“. Je součástí architektury.

Plánovač má převzít vizuální jazyk hlavního webu TORO:

- firemní barvy,
- typografii,
- styl tlačítek,
- rádiusy,
- rozestupy,
- celkový tón,
- práci s fotografiemi a značkou.

Současně ale plánovač nesmí kopírovat web mechanicky.

Web slouží k prezentaci firmy. Plánovač je pracovní nástroj.

Proto musí být samotná pracovní plocha jednodušší a klidnější.

---

## 17. Barevný princip

Firemní barvy TORO se používají jako:

- aktivní stav,
- zvýraznění,
- hlavní tlačítka,
- navigace,
- drobné akcenty.

Nemají být použitý jako velké barevné plochy, které by rušily při návrhu.

Pracovní plocha:

- neutrální,
- světlá,
- s jemnými hranicemi,
- s vysokou čitelností.

Výstražné barvy jsou vyhrazené pro:

- upozornění,
- chyby,
- kolize.

---

## 18. Typografie

Použít stejné písmo jako na webu TORO, pokud to dovolí technické a licenční podmínky.

Pokud by stejné písmo nebylo vhodné pro offline použití, použije se vizuálně blízká alternativa.

Důležité je zachovat:

- podobnou kresbu textu,
- jasnou hierarchii nadpisů,
- vysokou čitelnost čísel a rozměrů.

Technické hodnoty musí být čitelnější než dekorativní prvky.

---

## 19. Ikony

Ikony mají být:

- jednoduché,
- jednotné,
- snadno rozpoznatelné,
- bez zbytečných efektů.

Technické body musí být odlišitelné i bez barvy.

Každá ikona má mít také textový název nebo přístupný popisek.

---

## 20. Tlačítka

Hlavní akce mají vizuálně odpovídat tlačítkům na webu TORO.

Nejdůležitější CTA v plánovači:

**Poptat výrobu / Připravit poptávku**

Vedlejší akce mají být vizuálně klidnější.

Na jedné obrazovce nemá být mnoho stejně výrazných tlačítek.

---

## 21. Inspirace IKEA – co převzít a co ne

Inspirací je zejména princip konfigurátorů IKEA:

- uživatel postupuje přirozeně od prostoru k vybavení,
- program pracuje s reálnými omezeními místnosti,
- technické body ovlivňují vhodnost umístění,
- systém upozorňuje na možné problémy,
- funkce se odkrývají podle aktuálního kontextu.

Nemá se kopírovat vizuální styl IKEA ani jejich konkrétní rozhraní.

TORO má mít vlastní identitu a jednodušší cestu k zakázkové výrobě.

---

## 22. Co plánovač není

Plánovač nemá být:

- profesionální CAD,
- stavební projektovací software,
- náhrada odborného zaměření,
- náhrada výrobní dokumentace,
- nástroj, který zákazníka nutí znát technické termíny.

Jeho úkolem je vytvořit **co nejlepší vstupní návrh a podklady pro komunikaci zákazníka s TORO**.

---

## 23. Doporučená uživatelská cesta

### Hlavní cesta: od kusu k pokoji

1. Přijde z webu TORO.
2. Otevře výchozí záložku **Jeden kus nábytku** a vybere typ.
3. Nastaví rozměry, materiály a ostatní vlastnosti v samostatném náhledu.
4. Zvolí **Vložit do pokoje**.
5. Použije rozpracovanou místnost, nebo ji vytvoří a zadá rozměry, otvory a důležité technické body.
6. Rozmístí přenesený kus a případně doplní další nábytek.
7. Podle potřeby se vrátí ke konfiguraci vybraného kusu a upraví jej.
8. Prohlédne pokoj ve 2D i 3D a projde kontrolu.
9. Opraví nebo vezme na vědomí upozornění.
10. Doplní kontakt, poznámku a fotografie a připraví poptávku TORO.

### Přímé alternativy

- **Pouze jeden kus:** po jeho konfiguraci zákazník připraví poptávku bez modelování místnosti.
- **Rovnou celý pokoj:** zákazník otevře druhou záložku, vytvoří prostor a poté přidává a konfiguruje jednotlivé kusy.

Celá cesta má být pochopitelná bez návodu.

---

## 24. Pravidla UX pro další vývoj

Při každé nové funkci se má položit několik otázek:

1. Potřebuje ji uživatel vidět pořád?
2. Lze ji zobrazit až v konkrétním kontextu?
3. Patří do základního nebo pokročilého režimu?
4. Umí aplikace nabídnout rozumnou výchozí hodnotu?
5. Dá se ovládat bez technického termínu?
6. Nezabírá nový prvek zbytečně pracovní plochu?
7. Pomáhá funkce zákazníkovi vytvořit lepší podklad pro TORO?

Pokud odpověď na poslední otázku zní ne, funkce pravděpodobně do hlavního rozhraní nepatří.

---

## 25. Technický princip UI

Doporučený princip:

- jedna hlavní aplikace,
- jeden centrální model návrhu,
- společná reprezentace a konfigurace nábytku v režimu jednoho kusu i pokoje,
- rozpracovaný samostatný kus se zachovává nezávisle na rozpracovaném pokoji; vložení vytvoří konkrétní položku pokoje a následná editace z pokoje pracuje s touto položkou,
- 2D a 3D jsou pouze dva pohledy na stejná data,
- panely jsou kontextové,
- technické body a nábytek používají stejný systém výběru a vlastností,
- kontrolní systém pracuje nad stejným modelem návrhu,
- export a poptávka čerpají ze stejných dat.

Tím se zabrání tomu, aby se různé části aplikace postupně rozešly.

---

## 26. Datové skupiny návrhu

Návrh by měl logicky obsahovat alespoň:

### Místnost
- geometrie,
- rozměry,
- výška.

### Otvory
- dveře,
- okna.

### Stavební prvky
- pevné překážky,
- niky,
- sloupy,
- šachty a podobně.

### Technické body
- typ,
- poloha,
- výška,
- rozměr,
- význam / omezení přístupu.

### Nábytek
- typ,
- rozměry,
- poloha,
- natočení,
- materiály,
- konfigurace.

Konfigurace kusu nesmí vyžadovat zaměřenou místnost. Při vložení do pokoje se ke stejným parametrům přidá identita položky a její prostorové umístění; další úpravy musí zachovat vazbu na vybraný kus.

### Kontrola
- nalezené problémy,
- upozornění,
- potvrzení uživatele.

### Poptávka
- kontaktní údaje,
- poznámka,
- fotografie,
- metadata návrhu.

---

## 27. Budoucí rozšíření

Architektura má umožnit pozdější rozšíření bez překopání základů.

Možné budoucí směry:

- specializovaný kuchyňský modul,
- přesnější návrh vestavěných skříní,
- automatické návrhy rozmístění,
- cenový odhad,
- online zákaznický účet,
- cloudové ukládání,
- sdílení návrhu přes odkaz,
- komentáře TORO přímo k návrhu,
- převod zákaznického návrhu do interní zakázky,
- další pravidla kontroly podle typu místnosti.

Tyto funkce se nemají zobrazovat dříve, než je uživatel potřebuje.

---

## 28. Priorita první další verze

Schválené doplnění první verze nyní zahrnuje:

1. záložku **Jeden kus nábytku** jako výchozí vstup se všemi podporovanými typy,
2. společný detailní konfigurátor a samostatný náhled pro každý typ,
3. přenos **Vložit do pokoje** se zachováním všech parametrů a existující místnosti,
4. návrat z pokoje k úpravám konkrétního kusu bez vytváření kopií,
5. možnost připravit poptávku jednoho kusu bez místnosti,
6. nahrazení původního samostatného konfigurátoru skříně při zachování uložených návrhů,
7. dotažení jednotného vzhledu TORO v obou režimech.

Tyto body jsou zapsaným zadáním, zatím nejsou součástí dosavadního dokončeného prototypu. Ověření musí pokrýt vložení kusu se všemi parametry, zachování rozpracovaného pokoje, opakovanou editaci stejné položky a export obou uživatelských cest.

Dosavadní priority plánovače zůstávají:

1. novou navigační strukturu,
2. vizuální sjednocení s webem TORO,
3. čistší a kontextové panely,
4. systém technických bodů,
5. základní kontrolu kolizí a přístupnosti,
6. sjednocenou cestu od návrhu k poptávce,
7. zachování funkčního 2D a 3D plánování.

Až poté má smysl přidávat další velké funkce.

---

## 29. Závěrečný princip

TORO plánovač nemá zákazníkovi ukazovat, jak je technicky složitý.

Má mu umožnit během několika minut pochopit:

> **Takhle bych chtěl svůj kus nábytku. Tady je můj pokoj a věci, se kterými se musí počítat. Takhle do něj nábytek zapadá. A tohle můžu předat TORO.**

Pokud se podaří zachovat tento princip, může být aplikace výrazně schopnější než současná verze, aniž by na uživatele působila složitěji.

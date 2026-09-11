# TORO – architektura plánovače interiéru

**Stav:** návrh architektury  
**Datum:** 11. 9. 2026  
**Účel dokumentu:** sjednotit směr dalšího vývoje plánovače TORO před zahájením implementace.

---

## 1. Hlavní cíl

Plánovač má působit jako přirozená součást značky **TORO Interiors**, nikoli jako cizí aplikace připojená k webu.

Zákazník má být schopný:

1. vytvořit místnost,
2. zadat pevné stavební a technické prvky,
3. rozmístit nábytek,
4. průběžně dostávat jednoduchá upozornění na možné problémy,
5. zkontrolovat návrh,
6. odeslat nebo připravit podklady pro poptávku TORO.

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

Plánovač bude mít **jednu hlavní pracovní obrazovku**.

Nebude se zbytečně přepínat mezi mnoha samostatnými stránkami. Uprostřed zůstává návrh místnosti a kolem něj se podle potřeby mění nástroje.

### Hlavní sekce

1. **Prostor**
2. **Technické prvky**
3. **Nábytek**
4. **Kontrola**
5. **Poptávka**

Každá sekce otevře pouze nástroje související s právě prováděným úkolem.

---

## 4. Hlavní pracovní obrazovka

### Horní lišta

Má být jednoduchá a nízká.

Obsah:

- logo TORO,
- název návrhu,
- krok zpět,
- krok vpřed, pokud bude podporován,
- uložení návrhu,
- přepínač **2D / 3D**,
- výrazné tlačítko pro přechod k poptávce.

Do horní lišty nepatří velké množství nastavení.

### Levý nebo kontextový panel

Na počítači může být hlavní navigace vlevo.

Na mobilu se stejný obsah může otevírat jako panel vysunutý ze spodní části obrazovky.

Panel zobrazuje pouze obsah právě zvolené hlavní sekce.

### Střed obrazovky

Největší část prostoru patří samotnému návrhu.

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

### Varianta pro nového zákazníka

1. Přijde z webu TORO.
2. Spustí plánovač.
3. Zadá základní rozměry místnosti.
4. Přidá dveře a okna.
5. Přidá důležité technické body.
6. Vloží a rozmístí nábytek.
7. Přizpůsobí rozměry a materiály.
8. Přepne se do 3D a návrh si prohlédne.
9. Spustí kontrolu.
10. Opraví nebo přijme upozornění.
11. Přidá poznámku a fotografie.
12. Připraví poptávku TORO.

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

První další verze po schválení architektury by se měla soustředit hlavně na:

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

> **Tady je můj pokoj. Tady jsou věci, se kterými se musí počítat. Takhle bych chtěl nábytek. A tohle můžu poslat TORO.**

Pokud se podaří zachovat tento princip, může být aplikace výrazně schopnější než současná verze, aniž by na uživatele působila složitěji.

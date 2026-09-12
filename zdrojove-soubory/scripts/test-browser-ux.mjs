// Customer-facing navigation and preservation checks; runs against HTTP or the packaged file URL.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=await import(process.env.TORO_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.connectOverCDP(process.env.TORO_BROWSER_CDP);
const require=createRequire(path.resolve('.sites-runtime/room-tests/package.json'));
const r=require('./room.js'),t=require('./technical.js'),tpl=require('./toro-templates.js');
const url=process.env.TORO_QA_URL||'http://localhost:5174',offline=process.env.TORO_QA_OFFLINE==='1';
const output=path.resolve(process.env.TORO_QA_OUT||'.sites-runtime/ux-tests/journey');await fs.mkdir(output,{recursive:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true,offline});
const page=await context.newPage();page.setDefaultTimeout(10000);
const errors=[],consoleProblems=[],networkRequests=[],results=[];let stage='start';
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))consoleProblems.push(m.text());});page.on('request',req=>{if(/^https?:/.test(req.url()))networkRequests.push(req.url());});
const report=name=>{results.push(name);console.log('PASS '+name);};
const button=name=>page.getByRole('button',{name,exact:true});
async function menu(name){await button('Návrh').click();await page.getByRole('menuitem',{name,exact:true}).click();}
async function save(){await menu('Uložit návrh');return page.evaluate(()=>JSON.parse(localStorage.getItem('toro-workspace-v1')));}
async function number(label,value){const input=page.getByRole('spinbutton',{name:label,exact:true});await input.fill(String(value));await input.press('Enter');}
async function detail(title,open=true){const summary=page.locator('summary').filter({hasText:new RegExp('^'+title)}).first();assert.equal(await summary.count(),1,title);if(await summary.evaluate(e=>e.parentElement.open)!==open)await summary.click();return summary;}
async function step(name){await page.getByRole('navigation',{name:'Kroky návrhu'}).getByRole('button',{name,exact:true}).click();}
async function roomNav(name){await page.getByRole('navigation',{name:'Postup návrhu'}).getByRole('button',{name:new RegExp(name)}).click();}
async function roomTab(name){await page.getByRole('navigation',{name:'Vlastnosti pokoje'}).getByRole('button',{name,exact:true}).click();}
async function upload(value,name='fixture.json'){const file=path.join(output,name);await fs.writeFile(file,JSON.stringify(value));if(await button('Zavřít oznámení').isVisible())await button('Zavřít oznámení').click();await menu('Načíst návrh');await page.locator('input[type=file][accept=".json,application/json"]').setInputFiles(file);await page.getByRole('status').filter({hasText:'Návrh je načtený.'}).waitFor();}
async function downloadMenu(name,filename){const promise=page.waitForEvent('download');await menu(name);const file=await promise;const dest=path.join(output,filename);await file.saveAs(dest);return JSON.parse(await fs.readFile(dest,'utf8'));}
async function downloadButton(name,filename){const promise=page.waitForEvent('download');await button(name).click();const file=await promise;const dest=path.join(output,filename);await file.saveAs(dest);return JSON.parse(await fs.readFile(dest,'utf8'));}
async function noOverflow(){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');}
async function focusIs(name){await page.waitForFunction(name=>document.activeElement?.textContent?.trim()===name||document.activeElement?.getAttribute('aria-label')===name,name);}
try {
  await page.goto(url);await button('Návrh').waitFor();await page.locator('canvas').waitFor();
  stage='keyboard and disclosures';
  await button('Návrh').focus();await page.keyboard.press('Enter');await page.getByRole('menu').waitFor();await page.keyboard.press('ArrowDown');assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('role')),'menuitem');await page.keyboard.press('Escape');await focusIs('Návrh');
  let summary=await detail('Upravit detaily kusu');await page.getByRole('textbox',{name:'Název kusu'}).fill('Moje šatní skříň');await detail('Upravit detaily kusu',false);assert((await summary.innerText()).includes('Moje šatní skříň'));assert(!(await page.getByRole('textbox',{name:'Název kusu'}).isVisible()));await summary.focus();await page.keyboard.press('Enter');await page.getByRole('textbox',{name:'Název kusu'}).waitFor();
  await button('Vybrat typ nábytku').focus();await page.keyboard.press('Enter');await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');await focusIs('Vybrat typ nábytku');
  await button('Přehled a poptávka').click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');await focusIs('Přehled a poptávka');
  const before=await save();await step('Materiály');await focusIs('Materiály');await button('Předchozí krok').click();assert.deepEqual(await save(),before);await noOverflow();report('Keyboard menu, native details, dialog focus and step navigation without undoing data');

  stage='all furniture settings';
  for(const entry of r.catalog){
    await button('Vybrat typ nábytku').click();await page.getByRole('dialog').getByRole('button',{name:new RegExp('^'+entry.name)}).click();
    const base=r.newFurnitureConfiguration(entry.type),limits=r.furnitureLimits(entry.type);
    const width=Math.min(limits.width[1],Math.max(limits.width[0],180));
    await number('Šířka',width);await number(entry.type==='shelf'?'Tloušťka':entry.type==='vanity'?'Výška s umyvadlem':'Výška',Math.min(limits.height[1],base.height+3));await number('Hloubka',Math.min(limits.depth[1],base.depth+2));
    await detail('Upravit detaily kusu');await page.getByRole('textbox',{name:'Název kusu'}).fill('Zkouška '+entry.name);await detail('Upravit detaily kusu',false);
    if(entry.type==='custom')await page.getByRole('textbox',{name:'Zadání atypického kusu'}).fill('Atyp s výřezem a zaobleným rohem.');
    await step('Materiály');
    const surface=page.getByRole('group',{name:entry.type==='shelf'?'Povrch police':entry.type==='mirror'?'Rám zrcadla':'Povrch nábytku',exact:true});
    for(const name of ['Dub přírodní','Bílá matná','Písková','Grafit','Ořech'])await surface.getByRole('button',{name,exact:true}).click();
    await detail('Provedení nábytku');await button('Masiv · olejovaný').click();assert.equal(await surface.getByRole('button').count(),2);await surface.getByRole('button',{name:'Dub přírodní'}).click();await surface.getByRole('button',{name:'Ořech'}).click();await detail('Provedení nábytku',false);assert((await page.locator('summary').filter({hasText:'Provedení nábytku'}).innerText()).includes('Masiv'));
    if(['desk','bench'].includes(entry.type))await button('Mosazný odstín').click();
    if(['vanity','laundry'].includes(entry.type))await page.getByRole('group',{name:'Čela nábytku'}).getByRole('button',{name:'Dub přírodní'}).click();
    const names=await page.getByRole('navigation',{name:'Kroky návrhu'}).getByRole('button').allTextContents();
    if(names.includes('Uspořádání')){
      await step('Uspořádání');await page.getByRole('group',{name:'Počet sekcí',exact:true}).getByRole('button',{name:'2',exact:true}).click();
      if(['wardrobe','builtin'].includes(entry.type)){await button('Upravit sekci 1').click();await page.getByRole('button',{name:/^Zásuvky a police/}).click();await button('Upravit sekci 2').click();await page.getByRole('button',{name:/^Na ramínka/}).click();}
      else await page.getByRole('group',{name:entry.type==='dresser'?'Zásuvky v sekci':'Police v sekci',exact:true}).getByRole('button',{name:'6',exact:true}).click();
    }
    if(names.includes('Vybavení')){await step('Vybavení');if(entry.type==='panel')await number('Počet háčků',7);if(entry.type==='vanity'){await button('Dvě umyvadla').click();await number('Zásuvky pod umyvadlem',3);}if(entry.type==='laundry')await button('Vedle sebe').click();}
    if(names.includes('Dvířka')||names.includes('Čela')){
      await step(names.includes('Dvířka')?'Dvířka':'Čela');
      if(entry.type!=='dresser'){await page.getByRole('button',{name:/^Bez dvířek/}).click();await page.getByRole('button',{name:/^Otevírací dvířka/}).click();if(['wardrobe','builtin'].includes(entry.type))await page.getByRole('button',{name:/^Posuvná dvířka/}).click();}
      await page.getByRole('group',{name:entry.type==='dresser'?'Materiál čel zásuvek':'Materiál dvířek'}).getByRole('button',{name:'Dub přírodní'}).click();await detail('Úchytky');await button('Kartáčovaná mosaz').click();await detail('Úchytky',false);assert((await page.locator('summary').filter({hasText:'Úchytky'}).innerText()).includes('Kartáčovaná mosaz'));
    }
    const state=await save();assert.equal(state.single.width,width);assert.equal(state.single.material,'walnut');assert.equal(state.single.construction,'solid');assert.equal(state.single.name,'Zkouška '+entry.name);
    if(['wardrobe','builtin'].includes(entry.type)){assert.deepEqual(state.single.sections,['drawers','hanging']);assert.equal(state.single.doors,'sliding');}
    if(entry.type==='panel')assert.equal(state.single.hooks,7);if(entry.type==='vanity')assert.equal(state.single.basins,2);if(entry.type==='laundry')assert.equal(state.single.appliances,'side-by-side');
    const file=await downloadMenu('Stáhnout kus',entry.type+'.json');assert.deepEqual(file.item,state.single);await upload(file,entry.type+'-import.json');assert.deepEqual((await save()).single,state.single);await noOverflow();
  }
  report('All 15 furniture types: dimensions, names, all surfaces, construction, layout, fronts, handles and type-specific settings survive actual files');

  stage='room tools';
  const room={version:4,title:'Pokoj pro ověření',room:{width:620,length:540,height:290,wallColor:'#edece5',floor:'oak',openings:[]},items:[],technicalPoints:[]};
  await upload(room,'room.json');await page.locator('.tw-design-title [role=status]').filter({hasText:'Uloženo v tomto prohlížeči'}).waitFor();await roomNav('Prostor');await number('Šířka pokoje',640);await number('Délka pokoje',560);await number('Výška stropu',300);
  await roomTab('Tvar');await button('Do L').click();assert((await save()).room.room.outline.length>4);await button('Do U').click();assert((await save()).room.room.outline.length>6);await button('Obdélník').click();
  await detail('Přidat výklenek nebo výstupek');await button('Přidat úpravu stěny').click();assert((await save()).room.room.outline.length>4);await button('Vrátit poslední změnu').click();
  await roomTab('Dveře a okna');await button('Dveře').click();await number('Šířka otvoru',100);await button('Okno').click();await number('Výška parapetu',110);const openings=(await save()).room.room.openings;assert.equal(openings.length,2);assert.equal(openings[0].width,100);assert.equal(openings[1].sill,110);
  await roomTab('Vzhled');await button('Šalvějová').click();await button('Tmavá').click();let state=await save();assert.equal(state.room.room.wallColor,'#c4cbbd');assert.equal(state.room.room.floor,'dark');
  await roomNav('Nábytek');await page.getByRole('button',{name:'Přidat Umyvadlová skříňka',exact:true}).click();await number('Od levého okraje ke středu kusu',330);await number('Od zadního okraje ke středu kusu',300);await number('Výška nad podlahou',30);await detail('Vlastnictví kusu');await page.getByRole('switch').click();await detail('Vlastnictví kusu',false);assert((await page.locator('summary').filter({hasText:'Vlastnictví kusu'}).innerText()).includes('Tento kus už mám'));
  state=await save();const item=state.room.items[0];assert.equal(item.x,10);assert.equal(item.z,20);assert.equal(item.y,30);assert(item.existing);await detail('Další akce s kusem');await button('Duplikovat').click();assert.equal((await save()).room.items.length,2);await detail('Další akce s kusem');await page.getByRole('button',{name:/^Odstranit/}).click();assert.equal((await save()).room.items.length,1);await button('Vrátit poslední změnu').click();assert.equal((await save()).room.items.length,2);
  report('Room size, L/U/rectangle/recess, doors/windows, finishes, placement, existing furniture, duplication, deletion and undo');

  stage='technical catalogue and details';
  for(const type of t.technicalTypes){
    await roomNav('Technické prvky');if(await button('Všechny technické prvky').isVisible())await button('Všechny technické prvky').click();if(await button('Všechny kategorie').isVisible())await button('Všechny kategorie').click();
    const def=t.technicalCatalog[type],category=t.technicalCategories.find(c=>c.id===def.category).name;
    await button(category).click();await page.getByRole('combobox',{name:category,exact:true}).selectOption(type);await button('Přidat zadáním rozměrů').click();
    await page.getByRole('combobox',{name:'Přesnost údajů'}).selectOption('measured');await page.getByRole('combobox',{name:'Provedení',exact:true}).selectOption('planned');
    const dimTitle=def.shape==='volume'||def.shape==='pipe'?'Rozměry překážky':'Rozměry přípojky / otvoru';await detail(dimTitle);await number('Šířka prvku',def.size[0]+1);await detail(dimTitle,false);
    await detail('Přístup a přiřazení');await page.getByRole('combobox',{name:'Prostor před prvkem'}).selectOption('known');await number('Hloubka prostoru pro přístup',35);await page.getByRole('combobox',{name:'Přiřazený nábytek'}).selectOption(item.id);await detail('Přístup a přiřazení',false);assert((await page.locator('summary').filter({hasText:'Přístup a přiřazení'}).innerText()).includes('35 cm'));
    await detail('Označení a poznámka');await page.getByRole('textbox',{name:'Poznámka k prvku'}).fill('Ověřit při zaměření');await detail('Označení a poznámka',false);await button('Zamknout polohu').click();
    const next=(await save()).room.technicalPoints.at(-1);assert.equal(next.type,type);assert.equal(next.width,def.size[0]+1);assert.equal(next.accessDepth,35);assert.equal(next.linkedItemId,item.id);assert(next.locked);assert.equal(next.notes,'Ověřit při zaměření');
  }
  await button('Odemknout polohu').click();await page.getByRole('button',{name:'Duplikovat',exact:true}).click();assert.equal((await save()).room.technicalPoints.length,29);await button('Odebrat').click();assert.equal((await save()).room.technicalPoints.length,28);
  await page.getByRole('combobox',{name:'Zobrazit v seznamu a scéně'}).selectOption('water');assert.equal(await page.locator('.tw-item-list>button').count(),3);await page.getByRole('combobox',{name:'Zobrazit v seznamu a scéně'}).selectOption('all');
  await detail('Přidat sestavu přípojek');await page.locator('details').filter({has:page.locator('summary').filter({hasText:'Přidat sestavu přípojek'})}).getByRole('button').first().click();assert((await save()).room.technicalPoints.length>28);
  report('All 28 technical types remain reachable; actual edits, summary values, links, notes, locks, duplication, deletion, filtering and connection bundles');

  stage='import clears placement';
  const preserve=await save();await button('Všechny technické prvky').click();if(await button('Všechny kategorie').isVisible())await button('Všechny kategorie').click();await button('Elektřina').click();await button('Umístit prvek').click();await page.getByRole('status').filter({hasText:'Umístěte:'}).waitFor();await upload(preserve,'placement-import.json');assert.equal(await page.locator('.tw-place-banner').count(),0);assert.deepEqual(await save(),preserve);
  stage='backup and inquiry';
  await roomNav('Nábytek');await page.locator('.tw-item-list>button').first().click();await detail('Vlastnictví kusu');await page.getByRole('switch').click();assert.equal((await save()).room.items.filter(i=>!i.existing).length,1);
  const backup=await downloadMenu('Záloha prostředí','workspace.json');assert.deepEqual(backup,await save());const roomFile=await downloadMenu('Stáhnout pokoj','room-export.json');assert.deepEqual(roomFile,backup.room);await upload(backup,'backup-import.json');assert.deepEqual(await save(),backup);
  await roomNav('Kontrola');assert(await page.getByRole('button',{name:'Beru na vědomí'}).count()>0);await page.getByRole('button',{name:'Beru na vědomí'}).first().click();assert((await save()).room.acknowledgements.length>0);
  await roomNav('Poptávka');await page.getByRole('complementary',{name:'Poptávka'}).getByRole('button',{name:'Připravit poptávku'}).click();await detail('Technické prvky');await button('Připravit poptávku').click();await button('Doplnit ukázkové údaje').click();await detail('Termín a montáž');await page.getByRole('combobox',{name:'Představa o termínu'}).selectOption('Za 3–6 měsíců');await page.getByRole('switch').click();await detail('Termín a montáž',false);await page.getByRole('textbox',{name:'Poznámka k návrhu'}).fill('Zkušební podklady, nic neodesílat.');
  await page.getByRole('textbox',{name:'Telefon nepovinné'}).fill('+420 000 000 000');
  await page.getByLabel('Přidat fotografie nebo inspiraci',{exact:true}).setInputFiles(path.resolve('outputs/TORO-UX-pred/jeden-kus-desktop.png'));
  const inquiry=await downloadButton('Stáhnout podklady poptávky','full-inquiry.json');assert.equal(inquiry.design.technicalPoints.length,backup.room.technicalPoints.length);assert(JSON.stringify(inquiry).includes('Za 3–6 měsíců'));assert(JSON.stringify(inquiry).includes('data:image/png'));await button('Zpět k návrhu').click();
  report('Complete workspace/room backups, visible warnings and real inquiry including optional timing, assembly, notes and photo');

  stage='templates and legacy menu';
  for(const entry of tpl.templates){await roomNav('Prostor');await button('Vybrat sestavu').click();await page.getByRole('dialog').locator('.toro-template-card').filter({has:page.getByRole('heading',{name:entry.name,exact:true})}).click();assert.equal((await save()).room.title,tpl.createTemplate(entry.id).title);}
  await menu('Načíst původní skříň');await page.getByText(/není uložená původní skříň/).waitFor();
  await roomNav('Prostor');await button('Vyprázdnit pokoj').click();await page.getByRole('dialog').getByRole('button',{name:'Pokračovat v návrhu'}).click();assert((await save()).room.items.length>0);await button('Vyprázdnit pokoj').click();await page.getByRole('dialog').getByRole('button',{name:'Vyprázdnit pokoj'}).click();assert.equal((await save()).room.items.length,0);await button('Vrátit poslední změnu').click();
  report('Six room templates, clear-room cancellation/confirmation/undo and discoverable legacy-wardrobe action');

  stage='mobile keyboard and touch';
  for(const width of [320,390,768]){
    await page.setViewportSize({width,height:900});await button('Jeden kus nábytku').click();await noOverflow();await button('Návrh').click();await noOverflow();await page.keyboard.press('Escape');await focusIs('Návrh');await step('Materiály');await detail('Provedení nábytku');await button('Lamino · 18 mm').click();await detail('Provedení nábytku',false);await button('Předchozí krok').click();await noOverflow();
    await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(output,`single-${width}.png`),fullPage:true});await button('Celý pokoj').click();await roomNav('Prostor');
    if(width<768){await roomTab('Dveře a okna');await noOverflow();await button('Zavřít panel').click();await focusIs('Prostor');await page.screenshot({path:path.join(output,`room-${width}.png`),fullPage:true});await roomNav('Nábytek');if(await button('Zpět do nábytku').isVisible())await button('Zpět do nábytku').click();await page.locator('[role=dialog] .tw-item-list>button').first().click();await button('Upravit rozměry a provedení').click();await button('Zrušit úpravy').click();await page.getByRole('region',{name:'Pracovní plocha pokoje'}).waitFor();await focusIs('Nábytek');}
  }
  // Separate emulated touch context: use taps (not force clicks), including the sheet close.
  const touch=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,offline});const tp=await touch.newPage();await tp.goto(url);await tp.getByRole('button',{name:'Vybrat typ nábytku'}).tap();await tp.getByRole('dialog').getByRole('button',{name:/^Nástěnná police/}).tap();await tp.getByRole('button',{name:'Vložit do pokoje',exact:true}).tap();await tp.getByRole('button',{name:'Vytvořit a vložit kus'}).tap();await tp.getByRole('navigation',{name:'Postup návrhu'}).getByRole('button',{name:/Prostor/}).tap();await tp.getByRole('button',{name:'Zavřít panel'}).tap();await touch.close();
  report('320/390/768 layouts, step return, menu Escape, mobile sheet return and separate emulated touch journey');
  assert.equal(errors.length,0,errors.join('\n'));assert.equal(consoleProblems.length,0,consoleProblems.join('\n'));if(offline)assert.equal(networkRequests.length,0,networkRequests.join('\n'));
  await fs.writeFile(path.join(output,'results.json'),JSON.stringify({url,offline,results,errors,consoleProblems,networkRequests},null,2));
}catch(error){await page.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});await fs.writeFile(path.join(output,'failure.txt'),stage+'\n'+error.stack+'\n'+await page.locator('body').innerText());throw Error(stage+': '+error.message,{cause:error});}
finally{await context.close();await browser.close();}

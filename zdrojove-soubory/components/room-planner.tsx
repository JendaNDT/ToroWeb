'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ArrowRight, Box, Check, ChevronRight, CircleHelp, Download, Expand, FolderOpen, Grid2X2, House, Layers3, Magnet, Minus, MousePointer2, Plus, Redo2, RotateCcw, Save, SlidersHorizontal, SquareDashed, TriangleAlert, Undo2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FurnitureControls } from '@/components/furniture-controls';
import { FurnitureIcon, RoomControls } from './room-controls';
import { catalog, findFreePosition, issuesFor, newFurniture, normalizeItem, placeItem, resizeRoom, roomDesignSchema, type Furniture, type FurnitureType, type RoomDesign } from '@/lib/room';
import { createTemplate, furnitureCategories, type TemplateId } from '@/lib/toro-templates';
import { ProjectChooser, TemplateRibbon } from './toro-projects';
import { InquiryDialog } from './toro-inquiry';
import { ToroBrand } from './toro-brand';
import { NativeSelect } from '@/components/ui/native-select';
import './room-planner.css';

const Scene=dynamic(()=>import('./room-scene'),{ssr:false,loading:()=> <div className="rp-loading"><House size={32}/><span>Připravuji váš pokoj…</span></div>});
type History={past:RoomDesign[];present:RoomDesign;future:RoomDesign[]};
type HistoryAction={type:'change';update:(d:RoomDesign)=>RoomDesign}|{type:'undo'|'redo'}|{type:'load';design:RoomDesign};
function historyReducer(state:History,action:HistoryAction):History{
  if(action.type==='load')return {past:[],present:action.design,future:[]};
  if(action.type==='undo'){const previous=state.past.at(-1);return previous?{past:state.past.slice(0,-1),present:previous,future:[state.present,...state.future]}:state;}
  if(action.type==='redo'){const next=state.future[0];return next?{past:[...state.past,state.present],present:next,future:state.future.slice(1)}:state;}
  if(action.type==='change'){const next=action.update(state.present);if(JSON.stringify(next)===JSON.stringify(state.present))return state;return {past:[...state.past,state.present].slice(-40),present:next,future:[]};}
  return state;
}
function downloadFile(text:string,name:string,type:string){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

export default function RoomPlanner(){
  const [history,dispatch]=useReducer(historyReducer,{past:[],present:createTemplate('hall'),future:[]});
  const design=history.present;
  const [selectedId,setSelectedId]=useState<string|null>('hall-2'),[leftTab,setLeftTab]=useState<'catalog'|'room'>('catalog');
  const [view,setView]=useState<'3d'|'plan'>('3d'),[showFront,setShowFront]=useState(true),[showWalls,setShowWalls]=useState(true),[snap,setSnap]=useState(true);
  const [reset,setReset]=useState(0),[zoom,setZoom]=useState(1),[summary,setSummary]=useState(false),[help,setHelp]=useState(false),[newDialog,setNewDialog]=useState(false);
  const [toast,setToast]=useState(''),[savedSnapshot,setSavedSnapshot]=useState(''),[mobilePanel,setMobilePanel]=useState<'catalog'|'inspect'|null>(null);
  const fileInput=useRef<HTMLInputElement>(null);
  const [chooser,setChooser]=useState(false),[category,setCategory]=useState('hall'),[service,setService]=useState(false),[inquirySession,setInquirySession]=useState(0),[captureRequest,setCaptureRequest]=useState(0),[preview,setPreview]=useState('');
  const filteredCatalog=catalog.filter(c=>category==='all'||(furnitureCategories.find(g=>g.id===category)?.types as readonly string[]).includes(c.type));
  function openInquiry(asService=false){setService(asService);setInquirySession(s=>s+1);setCaptureRequest(n=>n+1);setSummary(true);setMobilePanel(null);}
  function startDesign(next:RoomDesign){change(()=>next);setSelectedId(next.items[0]?.id||null);setChooser(false);setCategory('all');setMobilePanel(null);setZoom(1);setReset(r=>r+1);setShowFront(true);}
  function chooseTemplate(id:TemplateId){startDesign(createTemplate(id));setCategory(({hall:'hall',bath:'bath',wardrobe:'storage',office:'work',living:'storage'})[id]);}
  function startSingle(type:FurnitureType){const next=createTemplate('hall');next.title=catalog.find(c=>c.type===type)!.name;next.items=[newFurniture(type,next.room,crypto.randomUUID())];next.items[0]=placeItem(next.items[0],next.room,0,-next.room.length/2+next.items[0].depth/2);startDesign(next);}
  function startEmpty(){const next=createTemplate('hall');next.title='Můj pokoj';next.items=[];startDesign(next);}
  const selected=design.items.find(i=>i.id===selectedId)||null;
  const issues=useMemo(()=>issuesFor(design),[design]);
  const issueIds=useMemo(()=>[...new Set(issues.flatMap(i=>i.itemIds))],[issues]);
  const offeredCount=design.items.filter(i=>!i.existing).length,saved=savedSnapshot===JSON.stringify(design);
  function change(update:(d:RoomDesign)=>RoomDesign){dispatch({type:'change',update});}
  // Browser-local state is restored after the server-rendered page has hydrated.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{try{const raw=localStorage.getItem('toro-room-v1')||localStorage.getItem('forma-room-v1');if(raw){const result=roomDesignSchema.safeParse(JSON.parse(raw));if(result.success){dispatch({type:'load',design:result.data});setSavedSnapshot(JSON.stringify(result.data));setSelectedId(result.data.items[0]?.id||null);setToast('Váš uložený pokoj je připraven.');}}}catch{}},[]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),4500);return()=>clearTimeout(timer);},[toast]);
  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{const t=event.target as HTMLElement;if(t instanceof HTMLInputElement||t instanceof HTMLSelectElement||t instanceof HTMLTextAreaElement||t.isContentEditable)return;
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();dispatch({type:event.shiftKey?'redo':'undo'});}
    };window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
  },[]);
  function updateItem(id:string,patch:Partial<Furniture>){change(d=>({...d,items:d.items.map(i=>i.id===id?normalizeItem({...i,...patch},d.room):i)}));}
  function add(type:FurnitureType){
    if(design.items.length>=30){setToast('Do jednoho návrhu lze vložit nejvýše 30 kusů.');return;}
    const item=newFurniture(type,design.room,crypto.randomUUID());const placed=findFreePosition(item,design);
    if(!placed){setToast('Pro tento kus není volné místo. Zvětšete pokoj nebo přesuňte nábytek.');return;}
    change(d=>({...d,items:[...d.items,placed]}));setSelectedId(placed.id);setMobilePanel('inspect');setToast(`${item.name} je v pokoji. Tažením ji přesuňte.`);
  }
  function duplicate(){if(!selected)return;if(design.items.length>=30){setToast('Návrh už má 30 kusů.');return;}
    const copied={...selected,id:crypto.randomUUID(),name:selected.name.replace(/ \(kopie\)$/,'').slice(0,42)+' (kopie)',x:selected.x+30,z:selected.z+30};
    const placed=findFreePosition(copied,design);if(!placed){setToast('Pro kopii není v pokoji volné místo.');return;}change(d=>({...d,items:[...d.items,placed]}));setSelectedId(placed.id);
  }
  function remove(){if(!selected)return;const id=selected.id;change(d=>({...d,items:d.items.filter(i=>i.id!==id)}));setSelectedId(null);setToast('Kus je odebraný. Tlačítkem Zpět ho můžete vrátit.');}
  function save(){try{const data=JSON.stringify(design);localStorage.setItem('toro-room-v1',data);setSavedSnapshot(data);setToast('Pokoj je uložený v tomto prohlížeči.');}catch{setToast('Uložení v prohlížeči není dostupné. Stáhněte návrh v přehledu.');}}
  async function loadFile(event:React.ChangeEvent<HTMLInputElement>){const file=event.target.files?.[0];event.target.value='';if(!file)return;
    try{if(file.size>12_000_000)throw new Error('Soubor je příliš velký.');const loaded=JSON.parse(await file.text());const result=roomDesignSchema.safeParse(loaded.format==='toro-inquiry'?loaded.design:loaded);if(!result.success)throw new Error('Soubor není platný návrh pokoje TORO.');change(()=>result.data);setSelectedId(result.data.items[0]?.id||null);setReset(r=>r+1);setToast('Návrh je načtený. Předchozí stav vrátíte tlačítkem Zpět.');}
    catch(e){setToast(e instanceof Error?e.message:'Návrh se nepodařilo načíst.');}
  }
  return <div className="rp-app toro-app">
    <header className="rp-header"><ToroBrand/><nav className="rp-main-nav" aria-label="Plánovače"><Link href="/" className="active"><House size={17}/> Plánovač interiéru</Link><Link href="/skrin"><Box size={17}/> Jedna skříň</Link></nav><div className="rp-header-actions"><span className="toro-prototype-badge">PRACOVNÍ UKÁZKA</span><Button variant="ghost" onClick={()=>setHelp(true)} aria-label="Nápověda"><CircleHelp size={18}/><span>Jak na to</span></Button><Button variant="outline" onClick={save} aria-label="Uložit návrh"><Save size={16}/><span>Uložit návrh</span></Button></div></header>
    <main className="rp-main"><div className="rp-heading"><div><div className="rp-breadcrumb">TORO STUDIO<ChevronRight size={12}/><span>Nábytek na míru</span></div><h1>{design.title||'Váš prostor, vaše představa'}<span>.</span></h1></div><div className="rp-heading-meta"><span>{saved?<><Check size={14}/> Uloženo v prohlížeči</>:<>Rozpracovaný návrh</>}</span><span className="rp-area">{(design.room.width*design.room.length/10000).toLocaleString('cs-CZ',{maximumFractionDigits:1})} m²</span></div></div>
    <TemplateRibbon onChoose={()=>setChooser(true)} onService={()=>openInquiry(true)}/>
    <div className="rp-workspace">
      <aside className={`rp-catalog-panel ${mobilePanel==='catalog'?'rp-mobile-open':''}`} aria-label="Nábytek a místnost"><div className="rp-panel-tabs"><button className={leftTab==='catalog'?'active':''} aria-pressed={leftTab==='catalog'} onClick={()=>setLeftTab('catalog')}><Layers3 size={17}/> Nábytek</button><button className={leftTab==='room'?'active':''} aria-pressed={leftTab==='room'} onClick={()=>setLeftTab('room')}><House size={17}/> Místnost</button><button className="rp-mobile-close" aria-label="Zavřít panel" onClick={()=>setMobilePanel(null)}><X size={17}/></button></div>
      <div className="rp-left-scroll">{leftTab==='room'?<RoomControls room={design.room} onChange={patch=>change(d=>resizeRoom(d,patch))}/>:<><div className="rp-section-title"><span>VYBERTE SI ZÁKLAD</span><h2>Přidejte nábytek</h2><p>Každý kus pak doladíte na míru.</p></div><label className="toro-catalog-filter">Kategorie<NativeSelect value={category} onChange={e=>setCategory(e.target.value)}>{furnitureCategories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</NativeSelect></label><div className="rp-catalog-grid">{filteredCatalog.map(c=><button key={c.type} className={`rp-catalog-card rp-kind-${c.type}`} onClick={()=>add(c.type)} aria-label={`Přidat ${c.name}`}><span className="rp-catalog-icon"><FurnitureIcon type={c.type} size={33}/></span><span className="rp-catalog-add"><Plus size={14}/></span><strong>{c.name}</strong><span>{c.description}</span></button>)}</div><div className="rp-in-room-heading"><strong>V mém pokoji</strong><span>{design.items.length}</span></div><div className="rp-item-list">{design.items.length===0?<p className="rp-note">Pokoj je prázdný. Vyberte první kus nahoře.</p>:design.items.map(i=><button key={i.id} className={selectedId===i.id?'active':''} aria-pressed={selectedId===i.id} onClick={()=>{setSelectedId(i.id);setMobilePanel('inspect');}}><FurnitureIcon type={i.type} size={21}/><span><strong>{i.name}</strong><small>{i.width} × {i.height} × {i.depth} cm</small></span>{issueIds.includes(i.id)?<TriangleAlert size={15} className="rp-item-alert"/>:<ChevronRight size={14}/>}</button>)}</div></>}
      </div><div className="rp-catalog-bottom"><Button variant="ghost" onClick={()=>fileInput.current?.click()}><FolderOpen size={15}/> Načíst návrh</Button><button title="Nový prázdný pokoj" aria-label="Nový prázdný pokoj" onClick={()=>setNewDialog(true)}><RotateCcw size={15}/></button></div></aside>
      <section className="rp-canvas-panel" aria-label="Pracovní plocha pokoje"><div className="rp-canvas-toolbar"><div className="rp-history"><Button variant="ghost" size="icon" disabled={!history.past.length} onClick={()=>dispatch({type:'undo'})} title="Zpět (Ctrl+Z)" aria-label="Vrátit poslední změnu"><Undo2 size={17}/></Button><Button variant="ghost" size="icon" disabled={!history.future.length} onClick={()=>dispatch({type:'redo'})} title="Znovu (Ctrl+Shift+Z)" aria-label="Znovu provést změnu"><Redo2 size={17}/></Button></div><div className="rp-view-toggle"><button className={view==='3d'?'active':''} onClick={()=>{setView('3d');setZoom(1);}} aria-pressed={view==='3d'}><Box size={15}/> 3D pokoj</button><button className={view==='plan'?'active':''} onClick={()=>{setView('plan');setZoom(1);}} aria-pressed={view==='plan'}><Grid2X2 size={15}/> Půdorys</button></div><Button className="rp-fit-view" variant="ghost" size="icon" title="Zobrazit celý pokoj" aria-label="Zobrazit celý pokoj" onClick={()=>{setZoom(1);setReset(r=>r+1);}}><Expand size={17}/></Button></div>
      <Scene design={design} selectedId={selectedId} view={view} showFront={showFront} showWalls={showWalls} snap={snap} reset={reset} zoom={zoom} issueItemIds={issueIds} onSelect={id=>setSelectedId(id)} captureRequest={captureRequest} onCapture={setPreview} onMove={(id,x,z)=>change(d=>({...d,items:d.items.map(i=>i.id===id?placeItem(i,d.room,x,z):i)}))}/>
      <div className="rp-room-badge"><span>POKOJ 01</span><strong>{design.room.width} × {design.room.length} cm</strong><small>Výška stropu {design.room.height} cm</small></div>
      <div className="rp-scene-options"><label><Switch checked={showFront} onCheckedChange={setShowFront}/> Dvířka</label><label><Switch checked={showWalls} onCheckedChange={setShowWalls}/> Stěny</label></div>
      <div className="rp-zoom"><Button variant="ghost" size="icon" disabled={zoom>=2.2} onClick={()=>setZoom(z=>Math.min(2.2,z+.2))} aria-label="Přiblížit pokoj"><Plus size={17}/></Button><Button variant="ghost" size="icon" disabled={zoom<=.6} onClick={()=>setZoom(z=>Math.max(.6,z-.2))} aria-label="Oddálit pokoj"><Minus size={17}/></Button></div>
      <div className="rp-canvas-bottom"><span><MousePointer2 size={15}/>{view==='plan'?'Přetáhněte nábytek v půdorysu':'Táhněte nábytek · tažením mimo něj otáčejte'}</span><button className={snap?'active':''} aria-pressed={snap} aria-label="Přichytávání k rastru, stěnám a nábytku" title="Přichytávání k rastru, stěnám a nábytku" onClick={()=>setSnap(v=>!v)}><Magnet size={15}/><span>Přichytávání</span></button></div>
      {issues.length>0&&<button className="rp-issues-badge" onClick={()=>openInquiry()}><TriangleAlert size={15}/>{issues.length} {issues.length===1?'upozornění':'upozornění'}<ChevronRight size={13}/></button>}
      <div className="rp-mobile-bar"><Button variant="outline" onClick={()=>setMobilePanel('catalog')}><Plus size={16}/> Nábytek / pokoj</Button><Button variant="outline" onClick={()=>setMobilePanel('inspect')}><SlidersHorizontal size={16}/> Upravit kus</Button></div>
      </section>
      <aside className={`rp-inspector ${mobilePanel==='inspect'?'rp-mobile-open':''}`} aria-label="Nastavení vybraného kusu"><button className="rp-inspector-close rp-mobile-close" aria-label="Zavřít nastavení" onClick={()=>setMobilePanel(null)}><X size={18}/></button>{selected?<FurnitureControls key={selected.id} item={selected} room={design.room} issues={issues} onChange={patch=>updateItem(selected.id,patch)} onDuplicate={duplicate} onDelete={remove} onShowFrontChange={setShowFront} onSummary={()=>openInquiry()}/>:<div className="rp-no-selection"><SquareDashed size={38}/><h2>Všechno začíná výběrem.</h2><p>Klikněte na kus v pokoji nebo v seznamu. Tady upravíte jeho rozměry, materiál a uspořádání.</p><Button variant="outline" onClick={()=>{setLeftTab('catalog');setMobilePanel('catalog');}}><Plus size={16}/> Vybrat nábytek</Button></div>}</aside>
    </div>
    <div className="rp-project-footer"><div className="rp-project-info"><span><House size={21}/></span><div><strong>Od vašeho nápadu k nábytku na míru.</strong><small>{offeredCount} {offeredCount===1?'kus':offeredCount<5&&offeredCount>0?'kusy':'kusů'} k výrobě · {design.items.length-offeredCount} stávajících</small></div></div><div className="rp-total"><span>Individuální nabídka<small>Cenu připravíme podle vašeho návrhu.</small></span></div><Button className="rp-summary-button" onClick={()=>openInquiry()}>Přehled a poptávka<span><ArrowRight size={17}/></span></Button></div>
    <div className="rp-under-footer"><span>Materiály a konstrukce jsou ilustrační. Detaily doladíte s truhlářem.</span><button onClick={()=>downloadFile(JSON.stringify(design,null,2),'TORO-navrh.json','application/json')}><Download size={14}/> Stáhnout upravitelný návrh</button></div></main>
    <input ref={fileInput} type="file" accept=".json,application/json" onChange={loadFile} hidden/>
    <ProjectChooser open={chooser} onOpenChange={setChooser} onTemplate={chooseTemplate} onEmpty={startEmpty} onSingle={startSingle} onService={()=>{setChooser(false);openInquiry(true);}}/>
    <InquiryDialog key={inquirySession} open={summary} onOpenChange={setSummary} design={design} preview={preview} service={service}/>
    <Dialog open={help} onOpenChange={setHelp}><DialogContent className="rp-help-dialog"><DialogHeader><DialogTitle>Váš nábytek, krok za krokem</DialogTitle><DialogDescription>Nejdřív prostor, potom nábytek a jeho detaily.</DialogDescription></DialogHeader><ol className="rp-help-list"><li><span>1</span><div><strong>Nastavte místnost</strong><p>V záložce Místnost upravte délku, šířku, výšku, stěny, podlahu a otvory. V této verzi má každá stěna nejvýše jedno okno nebo dveře.</p></div></li><li><span>2</span><div><strong>Rozmístěte nábytek</strong><p>Klikněte na typ nábytku a přetáhněte jej do správného místa. Půdorys usnadňuje přesné rozmístění. Přichytávání používá rastr 5 cm a blízké stěny.</p></div></li><li><span>3</span><div><strong>Upravte každý kus</strong><p>Vpravo nastavte rozměry, pozici, otočení, dekory a vnitřek. Nástěnné polici změníte i výšku zavěšení. Vestavěnou skříň přizpůsobíte výšce pokoje.</p></div></li><li><span>4</span><div><strong>Uložte si svůj návrh</strong><p>Uložení zůstává v tomto prohlížeči. V přehledu připravíte poptávku a stáhnete podklady. Tlačítkem Načíst návrh otevřete soubor pokoje i staženou poptávku s návrhem.</p></div></li></ol><p className="rp-note">Kolečko přibližuje, pravé tlačítko posouvá pohled. Při zaměření pracovní plochy šipky posouvají vybraný kus o 10 cm, se Shiftem o 1 cm. Ctrl+Z vrací změny. Červené obrysy označují možné kolize.</p></DialogContent></Dialog>
    <Dialog open={newDialog} onOpenChange={setNewDialog}><DialogContent><DialogHeader><DialogTitle>Začít s prázdným pokojem?</DialogTitle><DialogDescription>Rozměry a otvory zůstanou. Odebraný nábytek můžete vrátit tlačítkem Zpět.</DialogDescription></DialogHeader><div className="rp-summary-actions"><Button variant="outline" onClick={()=>setNewDialog(false)}>Pokračovat v návrhu</Button><Button onClick={()=>{change(d=>({...d,items:[]}));setSelectedId(null);setNewDialog(false);}}>Vyprázdnit pokoj</Button></div></DialogContent></Dialog>
    {toast&&<div className="rp-toast" role="status"><span>{toast}</span><button onClick={()=>setToast('')} aria-label="Zavřít oznámení"><X size={16}/></button></div>}
  </div>;
}

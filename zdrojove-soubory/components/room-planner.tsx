'use client';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Box, Check, ClipboardCheck, Download, Expand, FolderOpen, Grid2X2, House, Layers3, Minus, MousePointer2, PlugZap, Plus, Redo2, RotateCcw, RotateCw, Save, Send, Settings2, Undo2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { FurnitureControls } from './furniture-controls';
import { RoomControls } from './room-controls';
import { ProjectChooser } from './toro-projects';
import { InquiryDialog } from './toro-inquiry';
import { ToroBrand } from './toro-brand';
import { CheckPanel, FurnitureCatalog, InquiryPanel, TechnicalPanel } from './planner-panels';
import { useRoomDesign } from '@/hooks/use-room-design';
import { useIsMobile } from '@/hooks/use-mobile';
import { catalog, findFreePosition, issuesFor, nearestWallPoint, newFurniture, normalizeItem, normalizeTechnicalPoint, parseDesign, placeItem, resizeRoom, upgradeDesign, type Furniture, type FurnitureType, type Issue, type RoomDesign, type Selection } from '@/lib/room';
import { createTemplate, type TemplateId } from '@/lib/toro-templates';
import { downloadText } from '@/lib/toro-inquiry';
import './room-planner.css';

const Scene=dynamic(()=>import('./room-scene'),{ssr:false,loading:()=> <div className="rp-loading"><House/><span>Připravuji váš pokoj…</span></div>});
const sections=[{id:'room',name:'Prostor',icon:House},{id:'technical',name:'Technické prvky',icon:PlugZap},{id:'furniture',name:'Nábytek',icon:Layers3},{id:'check',name:'Kontrola',icon:ClipboardCheck},{id:'inquiry',name:'Poptávka',icon:Send}] as const;
type Section=typeof sections[number]['id'];

export default function RoomPlanner() {
  const {history,design,dispatch,ready,storageError,saved,save,recoverSaving,change}=useRoomDesign();
  const [section,setSection]=useState<Section>('room'),[selection,setSelection]=useState<Selection>(null);
  const [view,setView]=useState<'3d'|'plan'>('3d'),[showFront,setShowFront]=useState(true),[showWalls,setShowWalls]=useState(true),[snap,setSnap]=useState(true);
  const [reset,setReset]=useState(0),[zoom,setZoom]=useState(1),[mobileOpen,setMobileOpen]=useState(false),[placing,setPlacing]=useState(false);
  const [chooser,setChooser]=useState(false),[inquiry,setInquiry]=useState(false),[service,setService]=useState(false),[newDialog,setNewDialog]=useState(false);
  const [captureRequest,setCaptureRequest]=useState(0),[preview,setPreview]=useState(''),[toast,setToast]=useState('');
  const fileInput=useRef<HTMLInputElement>(null),isMobile=useIsMobile();
  const issues=useMemo(()=>issuesFor(design),[design]);
  const issueIds=useMemo(()=>[...new Set(issues.flatMap(i=>i.itemIds))],[issues]);
  const technicalIssueIds=useMemo(()=>[...new Set(issues.flatMap(i=>i.technicalPointIds??[]))],[issues]);
  const selected=selection?.kind==='furniture'?design.items.find(i=>i.id===selection.id):undefined;
  const selectedPoint=selection?.kind==='technical'?design.technicalPoints?.find(p=>p.id===selection.id):undefined;
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),4500);return()=>clearTimeout(timer);},[toast]);
  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      const target=event.target as HTMLElement;
      if(target instanceof HTMLInputElement||target instanceof HTMLSelectElement||target instanceof HTMLTextAreaElement||target.isContentEditable)return;
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();dispatch({type:event.shiftKey?'redo':'undo'});}
      if(event.key==='Escape')setPlacing(false);
    };
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
  },[dispatch]);
  function navigate(next:Section) {setSection(next);setPlacing(false);setMobileOpen(true);}
  function select(next:Selection,openPanel=true) {
    setSelection(next);
    if(next)setSection(next.kind==='technical'?'technical':'furniture');
    setMobileOpen(!!next&&openPanel);
  }
  function rotate(direction:1|-1) {
    if(selected)updateItem(selected.id,{rotation:((selected.rotation+direction*90+360)%360) as Furniture['rotation']});
  }
  function focusIssue(issue:Issue) {
    setSelection(issue.technicalPointIds?.length?{kind:'technical',id:issue.technicalPointIds[0]}:{kind:'furniture',id:issue.itemIds[0]});
    setSection('check');setMobileOpen(false);setPlacing(false);
  }
  function openInquiry(asService=false) {setService(asService);setCaptureRequest(n=>n+1);setInquiry(true);setMobileOpen(false);setPlacing(false);setSection('inquiry');}
  function exportDesign() {downloadText(JSON.stringify(design,null,2),'TORO-navrh.json','application/json');}
  function startDesign(next:RoomDesign) {change(()=>upgradeDesign(next));setSelection(null);setChooser(false);setMobileOpen(false);setZoom(1);setReset(r=>r+1);setShowFront(true);setPlacing(false);}
  function chooseTemplate(id:TemplateId) {startDesign(createTemplate(id));}
  function startSingle(type:FurnitureType) {
    const next=createTemplate('hall');next.title=catalog.find(c=>c.type===type)!.name;
    next.items=[newFurniture(type,next.room,crypto.randomUUID())];
    next.items[0]=placeItem(next.items[0],next.room,0,-next.room.length/2+next.items[0].depth/2);startDesign(next);
  }
  function updateItem(id:string,patch:Partial<Furniture>) {change(d=>({...d,items:d.items.map(i=>i.id===id?normalizeItem({...i,...patch},d.room):i)}));}
  function add(type:FurnitureType) {
    if(design.items.length>=30){setToast('Do návrhu lze vložit nejvýše 30 kusů.');return;}
    const item=newFurniture(type,design.room,crypto.randomUUID()),placed=findFreePosition(item,design);
    if(!placed){setToast('Pro tento kus není volné místo. Zvětšete pokoj nebo přesuňte nábytek.');return;}
    change(d=>({...d,items:[...d.items,placed]}));select({kind:'furniture',id:placed.id});
  }
  function duplicate() {
    if(!selected)return;
    if(design.items.length>=30){setToast('Návrh už má 30 kusů.');return;}
    const copy={...selected,id:crypto.randomUUID(),name:selected.name.replace(/ \(kopie\)$/,'').slice(0,42)+' (kopie)',x:selected.x+30,z:selected.z+30};
    const placed=findFreePosition(copy,design);if(!placed){setToast('Pro kopii není v pokoji volné místo.');return;}
    change(d=>({...d,items:[...d.items,placed]}));select({kind:'furniture',id:placed.id});
  }
  function addSocket(x=0,z=-design.room.length/2) {
    if((design.technicalPoints?.length??0)>=100){setToast('Do návrhu lze vložit nejvýše 100 technických prvků.');setPlacing(false);return;}
    const point=normalizeTechnicalPoint({id:crypto.randomUUID(),type:'socket',name:'Zásuvka 230 V',...nearestWallPoint(design.room,x,z),elevation:30,width:8,height:8},design.room);
    change(d=>({...upgradeDesign(d),technicalPoints:[...(d.technicalPoints??[]),point]}));setPlacing(false);select({kind:'technical',id:point.id},!placing);
  }
  async function loadFile(event:React.ChangeEvent<HTMLInputElement>) {
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    try {
      if(file.size>12_000_000)throw Error('Soubor je příliš velký.');
      const loaded=parseDesign(JSON.parse(await file.text()));change(()=>loaded);setSelection(null);setReset(r=>r+1);setPlacing(false);setToast('Návrh je načtený. Předchozí stav vrátíte tlačítkem Zpět.');
    }catch{setToast('Soubor nelze načíst. Vyberte platný návrh TORO nebo poptávku s návrhem do 12 MB.');}
  }
  const panel=section==='room'?<div className="tw-panel-content"><RoomControls room={design.room} onChange={patch=>change(d=>resizeRoom(d,patch))}/><div className="tw-panel-actions"><Button variant="outline" onClick={()=>setChooser(true)}>Vybrat sestavu</Button><Button variant="ghost" onClick={()=>setNewDialog(true)}>Vyprázdnit pokoj</Button></div></div>
    :section==='furniture'?selected?<><Button className="tw-back" variant="ghost" onClick={()=>setSelection(null)}><ArrowLeft/> Zpět do nábytku</Button><FurnitureControls key={selected.id} item={selected} room={design.room} issues={issues} onChange={patch=>updateItem(selected.id,patch)} onDuplicate={duplicate} onDelete={()=>{change(d=>({...d,items:d.items.filter(i=>i.id!==selected.id)}));setSelection(null);}} onShowFrontChange={setShowFront} onSummary={()=>openInquiry()}/></>:<FurnitureCatalog design={design} onAdd={add} onSelect={id=>select({kind:'furniture',id})} onTemplates={()=>setChooser(true)}/>
    :section==='technical'?<TechnicalPanel design={design} selected={selectedPoint} onChange={patch=>change(d=>({...d,technicalPoints:(d.technicalPoints??[]).map(p=>p.id===selectedPoint?.id?normalizeTechnicalPoint({...p,...patch},d.room):p)}))} onDelete={()=>{change(d=>({...d,technicalPoints:d.technicalPoints?.filter(p=>p.id!==selectedPoint?.id)}));setSelection(null);}} onSelect={id=>select(id?{kind:'technical',id}:null)} placing={placing} onPlace={()=>{setSelection(null);setPlacing(true);setView('plan');setZoom(1);setMobileOpen(false);}} onAddDefault={()=>addSocket()} onCancel={()=>setPlacing(false)}/>
    :section==='check'?<CheckPanel issues={issues} onSelect={focusIssue}/>
    :<InquiryPanel design={design} issues={issues} onOpen={()=>openInquiry()} onService={()=>openInquiry(true)} onExport={exportDesign} onCheck={()=>navigate('check')}/>;
  return <div className="rp-app toro-app tw-app">
    <header className="tw-header"><ToroBrand/><div className="tw-design-title"><Input aria-label="Název návrhu" maxLength={80} value={design.title??'Můj pokoj'} onChange={e=>change(d=>({...d,title:e.target.value||'Můj pokoj'}))}/><span role="status">{storageError?'Automatické uložení není dostupné':!ready?'Načítám návrh…':saved?'Uloženo v tomto prohlížeči':'Ukládám změny…'}</span></div><div className="tw-header-actions"><Button variant="ghost" size="icon" disabled={!history.past.length} onClick={()=>dispatch({type:'undo'})} aria-label="Vrátit poslední změnu" title="Zpět (Ctrl+Z)"><Undo2/></Button><Button variant="ghost" size="icon" disabled={!history.future.length} onClick={()=>dispatch({type:'redo'})} aria-label="Znovu provést změnu" title="Znovu (Ctrl+Shift+Z)"><Redo2/></Button><Button variant="outline" size="icon" onClick={()=>{if(save())setToast('Návrh je uložený v tomto prohlížeči.');else exportDesign();}} aria-label="Uložit návrh"><Save/></Button><Button className="tw-primary tw-header-inquiry" onClick={()=>navigate('inquiry')}>Připravit poptávku <Send size={17}/></Button></div></header>
    {storageError&&<div className="tw-storage-error" role="alert"><div>{storageError}<p>Obnovením uložíte aktuální návrh. Předchozí záznam zachováme jako zálohu v prohlížeči.</p></div><Button variant="outline" disabled={!ready} onClick={()=>{if(recoverSaving())setToast('Ukládání je obnovené. Aktuální návrh je uložený.');}}>Obnovit ukládání</Button><Button variant="outline" onClick={exportDesign}>Stáhnout návrh</Button></div>}
    <main className="tw-main"><nav className="toro-workflow" aria-label="Postup návrhu">{sections.map((item,index)=><button key={item.id} aria-pressed={section===item.id} onClick={()=>navigate(item.id)}><item.icon size={19}/><span>{item.name}{item.id==='check'&&issues.length>0&&<span className="tw-count">{issues.length}</span>}</span><small>0{index+1}</small></button>)}</nav>
      <div className="tw-workspace"><aside className="tw-panel" aria-label={sections.find(s=>s.id===section)?.name}>{!isMobile&&panel}</aside>
      <section className="tw-canvas" aria-label="Pracovní plocha pokoje"><div className="tw-canvas-toolbar"><div className="tw-view" role="group" aria-label="Zobrazení návrhu"><button aria-pressed={view==='plan'} onClick={()=>{setView('plan');setZoom(1);}}><Grid2X2/> 2D</button><button aria-pressed={view==='3d'} onClick={()=>{setView('3d');setZoom(1);setPlacing(false);}}><Box/> 3D</button></div><span className="tw-room-size">{design.room.width} × {design.room.length} cm</span><Button variant="ghost" size="icon" aria-label="Zobrazit celý pokoj" onClick={()=>{setZoom(1);setReset(r=>r+1);}}><Expand/></Button></div>
      <div className="tw-object-actions" role="group" aria-label="Ovládání vybraného prvku">
        {selected||selectedPoint?<><span className="tw-object-name" title={selected?.name??selectedPoint?.name}>{selected?.name??selectedPoint?.name}</span>{selected&&<><Button size="sm" variant="outline" aria-label="Otočit nábytek doleva o 90°" title="Otočit doleva (Shift+R)" onClick={()=>rotate(1)}><RotateCcw/>90°</Button><Button size="sm" variant="outline" aria-label="Otočit nábytek doprava o 90°" title="Otočit doprava (R)" onClick={()=>rotate(-1)}><RotateCw/>90°</Button></>}<Button size="sm" variant="outline" aria-label="Vlastnosti vybraného prvku" onClick={()=>select(selection)}><Settings2/><span className="tw-edit-label">Upravit</span></Button><Button size="icon" variant="ghost" aria-label="Zrušit výběr prvku" onClick={()=>select(null,false)}><X/></Button></>:<span className="tw-object-hint"><MousePointer2/> Nábytek i značky zásuvek přemístíte tažením.</span>}
      </div>
      <Scene design={design} selectedId={selected?.id??null} selectedTechnicalId={selectedPoint?.id??null} view={view} showFront={showFront} showWalls={showWalls} snap={snap} reset={reset} zoom={zoom} issueItemIds={issueIds} technicalIssueIds={technicalIssueIds} onSelect={id=>select(id?{kind:'furniture',id}:null,false)} onSelectTechnical={id=>select({kind:'technical',id},false)} placingTechnical={placing} onPlaceTechnical={addSocket} onRotate={rotate} onMoveTechnical={(id,patch)=>change(d=>({...d,technicalPoints:d.technicalPoints?.map(p=>p.id===id?normalizeTechnicalPoint({...p,...patch},d.room):p)}))} captureRequest={captureRequest} onCapture={setPreview} onMove={(id,x,z)=>change(d=>({...d,items:d.items.map(i=>i.id===id?placeItem(i,d.room,x,z):i)}))}/>
      {placing&&<div className="tw-place-banner" role="status"><PlugZap/><span>Klikněte ke stěně pro umístění zásuvky.</span><Button size="icon" variant="ghost" aria-label="Zrušit umístění zásuvky" onClick={()=>setPlacing(false)}><X/></Button></div>}
      <div className="tw-canvas-controls"><details className="tw-display-options"><summary><Settings2/> Zobrazení</summary><label><Switch checked={showFront} onCheckedChange={setShowFront}/> Dvířka</label><label><Switch checked={showWalls} onCheckedChange={setShowWalls}/> Stěny</label><label><Switch checked={snap} onCheckedChange={setSnap}/> Přichytávání</label></details><div className="tw-zoom"><Button size="icon" variant="outline" disabled={zoom<=.6} aria-label="Oddálit pokoj" onClick={()=>setZoom(z=>Math.max(.6,z-.2))}><Minus/></Button><Button size="icon" variant="outline" disabled={zoom>=2.2} aria-label="Přiblížit pokoj" onClick={()=>setZoom(z=>Math.min(2.2,z+.2))}><Plus/></Button></div></div>
      <div className="tw-canvas-footer"><span>{placing?'Poloha se přichytí k nejbližší stěně.':selectedPoint?'Značku zásuvky táhněte podél stěny. Výšku změníte v Upravit.':view==='plan'?'Táhněte kus nebo jeho název · otočení tlačítky 90°':'Táhněte nábytek · tažením mimo něj otáčejte pohled'}</span><Button variant="ghost" onClick={()=>navigate('check')}>{issues.length?<><ClipboardCheck/> {issues.length} k prověření</>:<><Check/> Bez kolizí</>}</Button></div>
      <Button className="tw-mobile-tools" variant="outline" onClick={()=>setMobileOpen(true)}><Settings2/> {sections.find(s=>s.id===section)?.name}</Button></section></div>
      <footer className="tw-footer"><div><Button variant="ghost" onClick={()=>fileInput.current?.click()}><FolderOpen/> Načíst návrh</Button><Button variant="ghost" onClick={exportDesign}><Download/> Stáhnout návrh</Button></div><a href="/skrin">Konfigurátor jedné skříně</a><span>Návrh pro konzultaci s TORO</span></footer></main>
    <Sheet open={isMobile&&mobileOpen} onOpenChange={setMobileOpen}><SheetContent side="bottom" className="tw-mobile-sheet toro-app" showCloseButton={false}><SheetHeader><SheetTitle>{sections.find(s=>s.id===section)?.name}</SheetTitle><SheetDescription className="sr-only">Nástroje pro úpravu návrhu pokoje</SheetDescription><SheetClose asChild><Button className="tw-sheet-close" variant="ghost" size="icon" aria-label="Zavřít panel"><X/></Button></SheetClose></SheetHeader><div className="tw-sheet-body">{isMobile&&panel}</div></SheetContent></Sheet>
    <input type="file" ref={fileInput} accept=".json,application/json" onChange={loadFile} hidden/>
    <ProjectChooser open={chooser} onOpenChange={setChooser} onTemplate={chooseTemplate} onEmpty={()=>startDesign({...createTemplate('hall'),title:'Můj pokoj',items:[]})} onSingle={startSingle} onService={()=>{setChooser(false);openInquiry(true);}}/>
    <InquiryDialog open={inquiry} onOpenChange={setInquiry} design={design} preview={preview} service={service} onIssue={issue=>{setInquiry(false);focusIssue(issue);}}/>
    <Dialog open={newDialog} onOpenChange={setNewDialog}><DialogContent><DialogHeader><DialogTitle>Vyprázdnit pokoj?</DialogTitle><DialogDescription>Nábytek se odebere. Místnost, otvory a zásuvky zůstanou. Změnu lze vrátit tlačítkem Zpět.</DialogDescription></DialogHeader><Button variant="outline" onClick={()=>setNewDialog(false)}>Pokračovat v návrhu</Button><Button onClick={()=>{change(d=>({...d,items:[]}));setSelection(null);setNewDialog(false);}}>Vyprázdnit pokoj</Button></DialogContent></Dialog>
    {toast&&<div className="rp-toast" role="status"><span>{toast}</span><Button variant="ghost" size="icon" onClick={()=>setToast('')} aria-label="Zavřít oznámení"><X/></Button></div>}
  </div>;
}

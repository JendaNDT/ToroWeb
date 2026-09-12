'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Box, Expand, FolderOpen, House, Layers3, Minus, Plus, Redo2, Ruler, Send, Undo2, X } from 'lucide-react';
import { Button } from './ui/button';
import { DesignMenu } from './design-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { FurnitureControls } from './furniture-controls';
import { FurnitureIcon, NumberField } from './room-controls';
import { ToroBrand } from './toro-brand';
import { InquiryDialog } from './toro-inquiry';
import RoomPlanner from './room-planner';
import { useWorkspace } from '@/hooks/use-workspace';
import { catalog, newFurnitureConfiguration, normalizeFurniture, furnitureConfiguration, type FurnitureType, type RoomDesign } from '@/lib/room';
import { beginFurnitureEdit, commitFurnitureEdit, importWorkspace, insertSingle, migrateWardrobe, singleDesign, type Workspace } from '@/lib/workspace';
import { furnitureDiagram, previewFurniture } from '@/lib/furniture-preview';
import { downloadText } from '@/lib/toro-inquiry';
import './room-planner.css';
import './toro-workspace.css';
import './customer-flow.css';

const Scene=dynamic(()=>import('./furniture-scene'),{ssr:false,loading:()=> <div className="rp-loading"><Box/><span>Připravuji náhled kusu…</span></div>});
export default function ToroWorkspace(){
  const state=useWorkspace(),{workspace,history,dispatch,ready,storageError,saved,save,recoverSaving,change}=state;
  const [catalogOpen,setCatalogOpen]=useState(false),[createRoom,setCreateRoom]=useState(false),[pendingInsert,setPendingInsert]=useState(false);
  const [roomSize,setRoomSize]=useState({width:520,length:420,height:270}),[selectedId,setSelectedId]=useState<string>(),[roomRevision,setRoomRevision]=useState(0);
  const [front,setFront]=useState(true),[dimensions,setDimensions]=useState(true),[view,setView]=useState<'3d'|'front'>('3d'),[zoom,setZoom]=useState(1),[reset,setReset]=useState(0);
  const [inquiry,setInquiry]=useState(false),[capture,setCapture]=useState(0),[preview,setPreview]=useState(''),[toast,setToast]=useState('');
  const fileInput=useRef<HTMLInputElement>(null),config=workspace.edit?.draft??workspace.single;
  const editing=!!workspace.edit;
  const lastEditor=useRef<string|undefined>(undefined);
  useEffect(()=>{
    if(!ready)return;
    const key=`${workspace.mode}:${workspace.edit?.itemId??'single'}:${roomRevision}`;
    if(lastEditor.current&&lastEditor.current!==key)requestAnimationFrame(()=>{
      const target=document.querySelector<HTMLElement>(workspace.mode==='single'?'.toro-single-heading h1':window.matchMedia('(max-width: 767px)').matches?'.tw-mobile-tools':'.tw-panel h2');
      if(target){if(!target.matches('button'))target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}
      window.scrollTo({top:0,behavior:'instant'});
    });
    lastEditor.current=key;
  },[ready,workspace.mode,workspace.edit?.itemId,roomRevision]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),7000);return()=>clearTimeout(timer);},[toast]);
  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      const target=event.target as HTMLElement;
      if(target.closest('input,textarea,select,[contenteditable="true"],[role="dialog"]'))return;
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();dispatch({type:event.shiftKey?'redo':'undo'});}
    };
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
  },[dispatch]);
  function act(action:(w:Workspace)=>Workspace){try{const next=action(workspace);change(()=>next);return true;}catch(error){setToast(error instanceof Error?error.message:'Návrh se nepodařilo upravit.');return false;}}
  function exportBackup(){downloadText(JSON.stringify(workspace,null,2),'TORO-prostredi.json','application/json');}
  function exportSingle(){downloadText(JSON.stringify(singleDesign(config),null,2),'TORO-kus.json','application/json');}
  function selectType(type:FurnitureType){change(w=>({...w,mode:'single',edit:null,single:newFurnitureConfiguration(type)}));setCatalogOpen(false);setFront(true);setZoom(1);setReset(n=>n+1);}
  function openSummary(){setPreview(furnitureDiagram(config));setCapture(n=>n+1);setInquiry(true);}
  function insert(){
    if(!workspace.room){setPendingInsert(true);setCreateRoom(true);return;}
    const id=crypto.randomUUID();if(act(w=>insertSingle(w,id))){setSelectedId(id);setToast('Kus je vložený. Samostatný koncept zůstává zachovaný.');}
  }
  function newRoom(){
    const room:RoomDesign={version:4,title:'Můj pokoj',room:{...roomSize,wallColor:'#edece5',floor:'oak',openings:[]},items:[],technicalPoints:[]};
    let next:Workspace={...workspace,room,mode:'room'};
    if(pendingInsert){const id=crypto.randomUUID();try{next=insertSingle(next,id);setSelectedId(id);}catch(error){setToast(error instanceof Error?error.message:'Kus zůstává připravený v samostatné záložce.');}}
    change(()=>next);setCreateRoom(false);setPendingInsert(false);
  }
  async function loadFile(event:React.ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];event.target.value='';if(!file)return;
    try{if(file.size>20_000_000)throw Error('too large');const next=importWorkspace(workspace,JSON.parse(await file.text()));change(()=>next);setSelectedId(undefined);setRoomRevision(n=>n+1);setToast('Návrh je načtený. Předchozí stav vrátíte tlačítkem Zpět.');}
    catch{setToast('Soubor nelze načíst. Použijte návrh, poptávku nebo zálohu TORO do 20 MB. Původní návrh zůstává zachovaný.');}
  }
  function loadLegacy(){
    try{const raw=localStorage.getItem('forma-design-v1');if(raw===null){setToast('V tomto prohlížeči není uložená původní skříň. Můžete načíst její soubor.');return;}const single=migrateWardrobe(JSON.parse(raw));change(w=>({...w,single,edit:null,mode:'single'}));setToast('Původní skříň je načtená. Její starý záznam zůstává zachovaný.');}
    catch{setToast('Původní skříň se nepodařilo načíst. Její záznam zůstává zachovaný.');}
  }
  const modeTabs=<nav className="toro-modes" aria-label="Režim návrhu"><div role="group" aria-label="Výběr režimu"><button aria-pressed={workspace.mode==='single'} onClick={()=>change(w=>({...w,mode:'single'}))}><Box/><span>Jeden kus nábytku</span></button><button aria-pressed={workspace.mode==='room'} onClick={()=>change(w=>({...w,mode:'room'}))}><House/><span>Celý pokoj</span></button></div></nav>;
  const designMenu=<DesignMenu onSave={()=>{if(save())setToast('Oba návrhy i rozpracovaná úprava jsou uložené.');else exportBackup();}} onLoad={()=>fileInput.current?.click()} onLegacy={loadLegacy} onSingle={exportSingle} onRoom={workspace.room?()=>downloadText(JSON.stringify(workspace.room,null,2),'TORO-navrh.json','application/json'):undefined} onBackup={exportBackup}/>;
  const common=<>
    <input hidden ref={fileInput} type="file" accept=".json,application/json" onChange={loadFile}/>
    <Dialog open={createRoom} onOpenChange={setCreateRoom}><DialogContent className="toro-dialog"><DialogHeader><DialogTitle>Vytvořit pokoj</DialogTitle><DialogDescription>{pendingInsert?'Kus zůstává připravený. Zadejte skutečné rozměry pokoje, do kterého jej vložíte.':'Zadejte základní rozměry. Tvar, otvory a technické prvky upravíte v pokoji.'}</DialogDescription></DialogHeader><div className="toro-new-room-fields"><NumberField label="Šířka pokoje" value={roomSize.width} min={120} max={1000} onChange={width=>setRoomSize(s=>({...s,width}))}/><NumberField label="Délka pokoje" value={roomSize.length} min={120} max={1000} onChange={length=>setRoomSize(s=>({...s,length}))}/><NumberField label="Výška pokoje" value={roomSize.height} min={220} max={400} onChange={height=>setRoomSize(s=>({...s,height}))}/></div><div className="toro-dialog-actions"><Button variant="outline" onClick={()=>setCreateRoom(false)}>Zpět ke kusu</Button><Button className="tw-primary" onClick={newRoom}>{pendingInsert?'Vytvořit a vložit kus':'Vytvořit pokoj'}<ArrowRight/></Button></div></DialogContent></Dialog>
    {toast&&<div className="rp-toast" role="status"><span>{toast}</span><Button variant="ghost" size="icon" onClick={()=>setToast('')} aria-label="Zavřít oznámení"><X/></Button></div>}
  </>;
  if(!ready)return <div className="rp-app toro-app"><header className="tw-header"><ToroBrand/></header><div className="toro-hydrating" role="status">Načítám vaše rozpracované návrhy…</div></div>;
  if(workspace.mode==='room'&&workspace.room)return <><RoomPlanner key={roomRevision} controller={{history,design:workspace.room,dispatch,ready,storageError,saved,save,recoverSaving,change:update=>change(w=>({...w,room:w.room?update(w.room):null}))}} designMenu={designMenu} modeTabs={<>{modeTabs}{editing&&<div className="toro-edit-banner"><span>Rozpracovaná úprava: {config.name}. Pokoj obsahuje poslední potvrzené provedení.</span><Button variant="outline" onClick={()=>change(w=>({...w,mode:'single'}))}>Pokračovat v úpravě</Button></div>}</>} initialSelectedId={selectedId} onEdit={id=>{if(editing&&workspace.edit?.itemId!==id){setToast('Nejprve dokončete nebo zrušte rozpracovanou úpravu v záložce Jeden kus nábytku.');return;}if(act(w=>w.edit?{...w,mode:'single'}:beginFurnitureEdit(w,id))){setSelectedId(id);setFront(true);setZoom(1);}}} onStartSingle={type=>{if(editing){setToast('Nejprve dokončete rozpracovanou úpravu.');return;}selectType(type);}}/>{common}</>;
  return <div className="rp-app toro-app tw-app toro-workspace">
    <header className="tw-header"><ToroBrand/><div className="tw-design-title"><strong>{workspace.mode==='room'?'Nový pokoj':editing?'Úprava kusu z pokoje':'Nábytek na míru'}</strong><span role="status">{storageError?'Ukládání je pozastavené':saved?'Uloženo v tomto prohlížeči':'Ukládám změny…'}</span></div><div className="tw-header-actions"><Button variant="ghost" size="icon" disabled={!history.past.length} onClick={()=>dispatch({type:'undo'})} aria-label="Vrátit poslední změnu"><Undo2/></Button><Button variant="ghost" size="icon" disabled={!history.future.length} onClick={()=>dispatch({type:'redo'})} aria-label="Znovu provést změnu"><Redo2/></Button>{designMenu}</div></header>
    {modeTabs}
    {storageError&&<div className="tw-storage-error" role="alert"><p>{storageError}</p><Button variant="outline" onClick={exportBackup}>Stáhnout zálohu</Button><Button variant="outline" onClick={()=>recoverSaving()}>Obnovit ukládání</Button></div>}
    {workspace.mode==='room'?<main className="toro-empty-room"><House size={44}/><h1>Prostor pro váš nábytek.</h1><p>Vytvořte pokoj, přidejte otvory a technické prvky. Váš samostatný kus zůstává připravený.</p><Button onClick={()=>{setPendingInsert(false);setCreateRoom(true);}}>Vytvořit pokoj <ArrowRight/></Button><Button variant="outline" onClick={()=>fileInput.current?.click()}><FolderOpen/> Načíst uložený pokoj</Button></main>:<>
      {editing&&<div className="toro-edit-banner"><div><strong>Upravujete konkrétní kus v pokoji: {config.name}</strong><p>Rozměry a provedení se použijí až po potvrzení. Poloha, natočení a přípojky zůstanou zachované.</p></div><Button variant="outline" onClick={()=>change(w=>({...w,edit:null,mode:'room'}))}>Zrušit úpravy</Button><Button onClick={()=>{if(act(commitFurnitureEdit))setToast('Kus je upravený. Kolize a platnost potvrzení byly znovu vyhodnoceny.');}}>Použít změny v pokoji</Button></div>}
      <main className="toro-single-main"><div className="toro-single-heading"><div><h1>{config.name}</h1><p>Upravte rozměry a provedení. Náhled se mění s vámi.</p></div><Button variant="outline" disabled={editing} onClick={()=>setCatalogOpen(true)}><FurnitureIcon type={config.type}/> Vybrat typ nábytku</Button></div>
      <div className="toro-single-workspace"><aside className="toro-single-settings" aria-label="Vlastnosti samostatného kusu"><FurnitureControls key={`${workspace.edit?.itemId??'single'}-${config.type}`} item={previewFurniture(config)} issues={[]} onChange={patch=>change(w=>{const current=w.edit?.draft??w.single;const next=normalizeFurniture(furnitureConfiguration({...previewFurniture(current),...patch}));return w.edit?{...w,edit:{...w.edit,draft:next}}:{...w,single:next};})} onShowFrontChange={setFront} onSummary={openSummary}/></aside>
      <section className="toro-single-preview" aria-label="Samostatný náhled nábytku"><div className="toro-single-toolbar"><span>Náhled</span><div className="tw-view" role="group" aria-label="Pohled na kus"><button aria-pressed={view==='3d'} onClick={()=>{setView('3d');setZoom(1);}}>3D</button><button aria-pressed={view==='front'} onClick={()=>{setView('front');setZoom(1);}}>Zepředu</button></div></div>
      <Scene config={config} front={front} dimensions={dimensions} view={view} reset={reset} zoom={zoom} captureRequest={capture} onCapture={setPreview}/>
      <div className="toro-single-tools"><Button variant="outline" size="icon" aria-label="Oddálit náhled" disabled={zoom<=.6} onClick={()=>setZoom(z=>Math.max(.6,z-.2))}><Minus/></Button><Button variant="outline" size="icon" aria-label="Přiblížit náhled" disabled={zoom>=2.2} onClick={()=>setZoom(z=>Math.min(2.2,z+.2))}><Plus/></Button><Button variant="outline" size="icon" aria-label="Zobrazit celý kus" onClick={()=>{setZoom(1);setReset(n=>n+1);}}><Expand/></Button><Button variant="outline" size="icon" aria-label="Zobrazit rozměry" aria-pressed={dimensions} onClick={()=>setDimensions(d=>!d)}><Ruler/></Button></div>
      <div className="toro-single-caption"><div><strong>{config.width} × {config.height} × {config.depth} cm</strong><span>Šířka × výška × hloubka</span></div>{['wardrobe','builtin','shoe','dresser','bookcase','tv','vanity','laundry'].includes(config.type)&&<Button variant="outline" aria-pressed={!front} onClick={()=>setFront(v=>!v)}><Layers3/>{front?'Ukázat vnitřek':'Ukázat čela'}</Button>}</div><p className="toro-orbit-hint">Tažením otáčejte pohled · kolečkem přibližujte</p></section></div>
      <div className="toro-single-actions"><span className="toro-action-note">Návrh pro konzultaci s TORO</span>{!editing&&<Button variant="outline" onClick={insert}><House/> Vložit do pokoje</Button>}<Button className="tw-primary" onClick={openSummary}>Přehled a poptávka <Send/></Button></div>
      </main>
      <Dialog open={catalogOpen} onOpenChange={setCatalogOpen}><DialogContent className="toro-dialog toro-catalog-dialog"><DialogHeader><DialogTitle>Co spolu navrhneme?</DialogTitle><DialogDescription>Vyberte jeden z 15 druhů. Změnu typu můžete vrátit tlačítkem Zpět.</DialogDescription></DialogHeader><div className="toro-type-grid">{catalog.map(item=><button key={item.type} aria-pressed={config.type===item.type} onClick={()=>selectType(item.type)}><FurnitureIcon type={item.type}/><strong>{item.name}</strong><span>{item.description}</span></button>)}</div></DialogContent></Dialog>
      <InquiryDialog open={inquiry} onOpenChange={setInquiry} design={singleDesign(config)} preview={preview}/>
    </>}
    <footer className="toro-workspace-footer"><span>Prototyp TORO · nic se neodesílá</span></footer>
    {common}
  </div>;
}

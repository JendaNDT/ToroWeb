'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ToroBrand } from './toro-brand';
import { InquiryDialog } from './toro-inquiry';
import type { RoomDesign } from '@/lib/room';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Box, Check, ChevronRight, CircleHelp, DoorOpen, Expand, Layers3, Leaf, Minus, MousePointer2, Plus, RotateCcw, Ruler, Save, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DimensionField, MaterialPicker, LayoutDiagram, FurnitureSteps, furnitureSteps as steps } from '@/components/furniture-fields';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { z } from 'zod';
import { initialConfiguration, layouts, materials, setDimension, type Configuration } from '@/lib/configuration';

const Scene=dynamic(()=>import('./wardrobe-scene'),{ssr:false,loading:()=> <div className="scene-loading"><Box size={32}/><span>Připravuji váš 3D návrh…</span></div>});
const names={width:'Šířka',height:'Výška',depth:'Hloubka'};
const bounds={width:[80,360],height:[160,280],depth:[40,80]};
const materialSchema=z.enum(['oak','walnut','white','sand','graphite']);
const savedSchema=z.object({width:z.number().int().min(80).max(360),height:z.number().int().min(160).max(280),depth:z.number().int().min(40).max(80),material:materialSchema,front:materialSchema,sections:z.array(z.enum(['hanging','shelves','drawers'])).min(1).max(6),doors:z.enum(['hinged','open']),handles:z.enum(['black','brass'])}).refine(c=>c.width/c.sections.length>=35&&c.width/c.sections.length<=100);

export default function Configurator(){
  const [config,setConfig]=useState<Configuration>(initialConfiguration);
  const [step,setStep]=useState(0),[section,setSection]=useState(0),[front,setFront]=useState(false);
  const [dimensions,setDimensions]=useState(true),[view,setView]=useState<'3d'|'front'>('3d');
  const [reset,setReset]=useState(0),[zoom,setZoom]=useState(1),[summary,setSummary]=useState(false),[help,setHelp]=useState(false),[resetDialog,setResetDialog]=useState(false);
  const [toast,setToast]=useState(''),[saved,setSaved]=useState(false);
  const [captureRequest,setCaptureRequest]=useState(0),[preview,setPreview]=useState('');
  const design:RoomDesign={version:1,title:'Samostatná skříň',room:{width:Math.max(400,config.width+100),length:330,height:Math.max(270,config.height+10),wallColor:'#edece5',floor:'oak',openings:[]},items:[{...config,id:'wardrobe-single',type:'wardrobe',name:'Šatní skříň',x:0,z:-165+config.depth/2,y:0,rotation:0,shelfCount:4,construction:'laminate',existing:false}]};
  function openSummary(){setCaptureRequest(n=>n+1);setSummary(true);}
  // Hydrate this browser's validated draft only after SSR hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{try{const stored=localStorage.getItem('forma-design-v1');if(stored){const parsed=savedSchema.safeParse(JSON.parse(stored));if(parsed.success){setConfig(parsed.data);setSaved(true);setToast('Váš uložený návrh je připraven.');}}}catch{}},[]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),4200);return()=>clearTimeout(timer);},[toast]);
  function change(next:Configuration){setConfig(next);setSaved(false);}
  function save(){try{localStorage.setItem('forma-design-v1',JSON.stringify(config));setSaved(true);setToast('Návrh je uložený v tomto prohlížeči.');}catch{setToast('Uložení není dostupné. Stáhněte návrh z jeho přehledu.');}}
  const selectedSection=Math.min(section,config.sections.length-1);
  function chooseStep(i:number){setStep(i);if(i===2)setFront(false);if(i===3&&config.doors==='hinged')setFront(true);}
  return <div className="app-shell toro-standalone">
    <header className="site-header">
      <ToroBrand/>
      <Link className="header-center" href="/"><ArrowLeft size={16}/> Zpět do plánovače pokoje</Link>
      <Button className="help-button" variant="ghost" onClick={()=>setHelp(true)}><CircleHelp size={18}/><span>Jak na to</span></Button>
    </header>
    <main className="main-content">
      <div className="page-heading"><div><div className="breadcrumb">Vaše tvorba <ChevronRight size={13}/> Skříně na míru</div><h1>Prostor pro vaše představy<span>.</span></h1></div><div className="heading-actions"><span className="save-status">{saved?<><Check size={14}/> Uloženo v prohlížeči</>:<>Můj návrh skříně</>}</span><Button variant="outline" className="save-button" onClick={save}><Save size={16}/> Uložit návrh</Button></div></div>
      <div className="configurator">
        <aside className="settings-panel" aria-label="Nastavení skříně">
          <FurnitureSteps step={step} onChange={chooseStep}/>
          <div className="settings-content">
            <div className="step-eyebrow">KROK 0{step+1} <span>/ 04</span></div>
            <h2>{['Začněte prostorem','Dejte jí svůj charakter','Každá věc má své místo','Zvenku přesně vaše'][step]}</h2>
            <p className="step-description">{['Zadejte rozměry. Zbytek se přizpůsobí vám.','Vyberte si povrch, který k vám domů sedne.','Sestavte si vnitřek podle toho, co ukládáte.','Dolaďte čela a drobné detaily.'][step]}</p>
            {step===0&&<>
              <div className="product-label"><span className="product-icon"><Box size={21}/></span><div><strong>Samostatně stojící skříň</strong><span>S plným korpusem a soklem</span></div><Check size={17}/></div>
              <div className="dimension-fields">{(['width','height','depth'] as const).map(key=><DimensionField key={key} label={names[key]} min={bounds[key][0]} max={bounds[key][1]} value={config[key]} onChange={v=>change(setDimension(config,key,v))}/>)}</div>
              <div className="small-tip"><Ruler size={17}/><p>Měřte na více místech a počítejte s rezervou pro montáž.</p></div>
            </>}
            {step===1&&<><MaterialPicker title="Materiál korpusu" value={config.material} onChange={material=>change({...config,material})}/><div className="material-detail"><span className={`material-preview mat-${config.material}`}/><div><strong>{materials.find(m=>m.id===config.material)!.name}</strong><p>Laminovaná deska · 18 mm</p><span>Odolný povrch pro každodenní život</span></div></div><div className="small-tip"><Leaf size={18}/><p>Dekory v náhledu jsou ilustrační. Skutečný odstín ověřte na vzorku.</p></div></>}
            {step===2&&<>
              <div className="field-label">Počet sekcí <span>{Math.round(config.width/config.sections.length)} cm / sekce</span></div>
              <div className="section-count">{[1,2,3,4,5,6].map(n=><Button key={n} variant="outline" disabled={config.width/n<35||config.width/n>100} className={config.sections.length===n?'selected':''} onClick={()=>change({...config,sections:Array.from({length:n},(_,i)=>config.sections[i]||'shelves')})}>{n}</Button>)}</div>
              <div className="field-label section-label">Upravit sekci <span>zleva doprava</span></div>
              <div className="section-selector">{config.sections.map((l,i)=><button className={selectedSection===i?'selected':''} key={i} onClick={()=>setSection(i)} aria-label={`Upravit sekci ${i+1}`} aria-pressed={selectedSection===i}><LayoutDiagram layout={l}/><span>{i+1}</span></button>)}</div>
              <div className="layout-options">{layouts.map(l=><button key={l.id} className={`option-card ${config.sections[selectedSection]===l.id?'selected':''}`} onClick={()=>{const sections=[...config.sections];sections[selectedSection]=l.id;change({...config,sections});setFront(false);}} aria-pressed={config.sections[selectedSection]===l.id}><LayoutDiagram layout={l.id}/><div><strong>{l.name}</strong><span>{l.detail}</span></div><span className="radio-mark">{config.sections[selectedSection]===l.id&&<Check size={12}/>}</span></button>)}</div>
              {config.depth<55&&config.sections.includes('hanging')&&<p className="depth-note">Pro běžná ramínka doporučujeme hloubku alespoň 55 cm.</p>}
            </>}
            {step===3&&<>
              <div className="door-options"><button className={`option-card ${config.doors==='hinged'?'selected':''}`} onClick={()=>{change({...config,doors:'hinged'});setFront(true);}} aria-pressed={config.doors==='hinged'}><DoorOpen size={24}/><div><strong>Otevírací dvířka</strong><span>Klasické pantové otevírání</span></div><span className="radio-mark">{config.doors==='hinged'&&<Check size={12}/>}</span></button><button className={`option-card ${config.doors==='open'?'selected':''}`} onClick={()=>{change({...config,doors:'open'});setFront(false);}} aria-pressed={config.doors==='open'}><Layers3 size={24}/><div><strong>Otevřená skříň</strong><span>Všechno hezky po ruce</span></div><span className="radio-mark">{config.doors==='open'&&<Check size={12}/>}</span></button></div>
              {config.doors==='hinged'&&<><MaterialPicker title="Materiál dvířek" value={config.front} onChange={front=>change({...config,front})} compact/><div className="field-label">Úchytky</div><div className="handle-options">{(['black','brass'] as const).map(h=><button key={h} className={config.handles===h?'selected':''} onClick={()=>change({...config,handles:h})} aria-pressed={config.handles===h}><span className={`handle-sample ${h}`}/>{h==='black'?'Černé matné':'Kartáčovaná mosaz'}</button>)}</div></>}
            </>}
          </div>
          <div className="step-bottom"><Button variant="ghost" className="previous-step" disabled={step===0} onClick={()=>chooseStep(step-1)}><ArrowLeft size={16}/> Zpět</Button><Button className="next-step" onClick={()=>step<3?chooseStep(step+1):openSummary()}>{step<3?steps[step+1].name:'Přehled návrhu'}<ArrowRight size={16}/></Button></div>
        </aside>
        <section className="preview-panel" aria-label="Náhled skříně">
          <div className="preview-top"><div className="live-label"><Box size={15}/><span>VÁŠ NÁVRH V REÁLNÉM ČASE</span></div><div className="view-switch"><button className={view==='3d'?'selected':''} onClick={()=>setView('3d')} aria-pressed={view==='3d'}>3D</button><button className={view==='front'?'selected':''} onClick={()=>setView('front')} aria-pressed={view==='front'}>Zepředu</button></div></div>
          <Scene config={config} front={front} dimensions={dimensions} view={view} reset={reset} zoom={zoom} captureRequest={captureRequest} onCapture={setPreview}/>
          <div className="preview-tools"><Button variant="ghost" size="icon" title="Přiblížit" aria-label="Přiblížit náhled" disabled={zoom>=1.6} onClick={()=>setZoom(z=>Math.min(1.6,z+.15))}><Plus/></Button><Button variant="ghost" size="icon" title="Oddálit" aria-label="Oddálit náhled" disabled={zoom<=.7} onClick={()=>setZoom(z=>Math.max(.7,z-.15))}><Minus/></Button><span/><Button variant="ghost" size="icon" title="Výchozí pohled" aria-label="Obnovit výchozí pohled" onClick={()=>{setZoom(1);setReset(r=>r+1);}}><Expand/></Button><Button variant="ghost" size="icon" className={dimensions?'tool-active':''} title="Zobrazit rozměry" aria-label="Zobrazit rozměry" aria-pressed={dimensions} onClick={()=>setDimensions(v=>!v)}><Ruler/></Button></div>
          <div className="preview-bottom"><div className="preview-hint"><MousePointer2 size={15}/><span>{view==='3d'?'Tažením otáčejte · kolečkem přibližujte':'Čelní pohled na vaši sestavu'}</span></div><div className="front-toggle"><button className={!front?'selected':''} onClick={()=>setFront(false)} aria-pressed={!front}><Layers3 size={15}/> Vnitřek</button><button className={front?'selected':''} disabled={config.doors==='open'} onClick={()=>setFront(true)} aria-pressed={front}><DoorOpen size={15}/> S dvířky</button></div></div>
          <div className="preview-caption"><strong>{config.width} × {config.height} × {config.depth} cm</strong><span>{materials.find(m=>m.id===config.material)!.name} <i/> {config.sections.length} {config.sections.length===1?'sekce':config.sections.length<5?'sekce':'sekcí'}</span></div>
        </section>
      </div>
      <div className="project-footer"><div className="footer-note"><span className="footer-icon"><SlidersHorizontal size={18}/></span><div><strong>Váš prostor. Vaše pravidla.</strong><span>Každý rozměr i detail máte ve svých rukou.</span></div></div><div className="toro-standalone-quote"><strong>Individuální nabídka</strong><span>Podle materiálu, kování a montáže</span></div><Button className="summary-button" onClick={openSummary}>Přehled a poptávka<span><ArrowRight size={18}/></span></Button></div>
      <div className="below-footer"><span>Navrženo vámi, do posledního centimetru.</span><button onClick={()=>setResetDialog(true)}><RotateCcw size={13}/> Začít znovu</button><span>Prototyp TORO · návrh k doladění s truhlářem</span></div>
    </main>
    <InquiryDialog standalone key={captureRequest} open={summary} onOpenChange={setSummary} design={design} preview={preview}/>
    <Dialog open={help} onOpenChange={setHelp}><DialogContent><DialogHeader><DialogTitle>Od nápadu k vaší skříni</DialogTitle><DialogDescription>Čtyři kroky, které zvládnete během pár minut.</DialogDescription></DialogHeader><ol className="help-steps">{steps.map((s,i)=><li key={s.name}><span>{i+1}</span><div><strong>{s.name}</strong><p>{['Nastavte šířku, výšku a hloubku posuvníkem nebo napište přesné číslo.','Zvolte povrch korpusu. Náhled se ihned přizpůsobí.','Klikněte na číslo sekce a vyberte její police, tyč nebo zásuvky.','Vyberte dvířka, jejich materiál a úchytky. Hotový přehled si stáhněte.'][i]}</p></div></li>)}</ol><p className="summary-disclaimer">Tažením myší otáčíte modelem, kolečkem měníte přiblížení. Uložený návrh zůstává pouze v tomto prohlížeči. Konfigurátor nepřijímá objednávky.</p></DialogContent></Dialog>
    <Dialog open={resetDialog} onOpenChange={setResetDialog}><DialogContent><DialogHeader><DialogTitle>Začít s novým návrhem?</DialogTitle><DialogDescription>Aktuální i uložený návrh v tomto prohlížeči se nahradí výchozí skříní.</DialogDescription></DialogHeader><div className="dialog-actions"><Button variant="outline" onClick={()=>setResetDialog(false)}>Pokračovat v návrhu</Button><Button onClick={()=>{setConfig(initialConfiguration);setSaved(false);setStep(0);setFront(false);setZoom(1);setReset(r=>r+1);try{localStorage.removeItem('forma-design-v1');}catch{}setResetDialog(false);}}>Začít znovu</Button></div></DialogContent></Dialog>
    {toast&&<div className="toast" role="status"><Check size={17}/>{toast}<button aria-label="Zavřít oznámení" onClick={()=>setToast('')}><X size={15}/></button></div>}
  </div>;
}

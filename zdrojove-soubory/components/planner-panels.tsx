'use client';
import { useState } from 'react';
import { Check, ChevronRight, CircleAlert, Download, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { NativeSelect } from './ui/native-select';
import { FurnitureIcon } from './room-controls';
import { catalog, type FurnitureType, type Issue, type RoomDesign } from '@/lib/room';
import { furnitureCategories } from '@/lib/toro-templates';
import { currentAcknowledgement } from '@/lib/issue-acknowledgements';

export function FurnitureCatalog({design,onAdd,onSelect,onTemplates}:{design:RoomDesign;onAdd:(type:FurnitureType)=>void;onSelect:(id:string)=>void;onTemplates:()=>void}) {
  const [category,setCategory]=useState('all');
  const entries=catalog.filter(c=>category==='all'||(furnitureCategories.find(g=>g.id===category)?.types as readonly string[])?.includes(c.type));
  return <div className="tw-panel-content"><h2>Nábytek v pokoji</h2>
    <div className="tw-item-list">{design.items.map(item=><button key={item.id} onClick={()=>onSelect(item.id)}><FurnitureIcon type={item.type}/><span><strong>{item.name}</strong><small>{item.width} × {item.height} × {item.depth} cm{item.existing?' · už ho mám':''}</small></span><ChevronRight size={17}/></button>)}{!design.items.length&&<p>Vyberte první kus z nabídky.</p>}</div>
    <details className="toro-detail" open={!design.items.length||undefined}><summary><span><Plus size={16}/> Přidat nábytek</span><small>15 druhů nábytku</small></summary><div className="toro-detail-body"><label className="toro-field-label">Kategorie<NativeSelect value={category} onChange={e=>setCategory(e.target.value)}>{furnitureCategories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</NativeSelect></label><div className="tw-catalog">{entries.map(c=><button key={c.type} onClick={()=>onAdd(c.type)} aria-label={`Přidat ${c.name}`}><FurnitureIcon type={c.type} size={27}/><strong>{c.name}</strong><Plus size={15}/></button>)}</div></div></details>
    <Button variant="outline" onClick={onTemplates}>Vybrat připravenou sestavu</Button></div>;

}

export { TechnicalPanel } from './technical-panel';

export function CheckPanel({design,issues,onSelect,onAcknowledge,onRevoke}:{design:RoomDesign;issues:Issue[];onSelect:(issue:Issue)=>void;onAcknowledge:(issue:Issue)=>void;onRevoke:(id:string)=>void}) {
  const severity={info:'Informace',warning:'Upozornění',problem:'Problém'},important=issues.filter(i=>i.severity!=='info'),information=issues.filter(i=>i.severity==='info');
  const rows=(list:Issue[])=>list.map(issue=>{const acknowledgement=currentAcknowledgement(design,issue);return <div key={issue.id} className={`tw-issue-card ${acknowledgement?'tw-acknowledged':''}`}><button className={`tw-issue tw-${issue.severity}`} onClick={()=>onSelect(issue)}><CircleAlert size={20}/><span><strong>{severity[issue.severity]}</strong>{issue.text}<small>Zobrazit místo v návrhu</small></span></button><div className="tw-issue-ack">{acknowledgement?<><span>Vzato na vědomí · {new Date(acknowledgement.acknowledgedAt).toLocaleDateString('cs-CZ')}</span><Button variant="ghost" onClick={()=>onRevoke(issue.id)}>Zrušit potvrzení</Button></>:<Button variant="outline" disabled={(design.acknowledgements?.length??0)>=300&&!design.acknowledgements?.some(a=>a.issueId===issue.id)} onClick={()=>onAcknowledge(issue)}>Beru na vědomí</Button>}</div></div>;});
  return <div className="tw-panel-content"><h2>{important.length?'Místa k dořešení':information.length?'Údaje k ověření':'Bez zjevných kolizí'}</h2>
    {!important.length&&<div className="tw-check-clear"><Check size={28}/><p>Podle zadaných rozměrů nebyly nalezeny kolize. {information.length?'Zbývají údaje k doplnění a ověření.':'Nezadané přípojky a instalační podmínky tím nejsou ověřené.'}</p></div>}
    <div className="tw-issues">{rows(important.filter(i=>i.severity==='problem'))}{rows(important.filter(i=>i.severity==='warning'))}</div>
    {information.length>0&&<details className="tw-details tw-information" open={information.length<4}><summary>Informace a údaje k doplnění ({information.length})</summary><div className="tw-issues">{rows(information)}</div></details>}
    <p className="tw-note">Potvrzení zaznamená, že jste hlášení četli. Problém tím není opravený. Změna souvisejících údajů vyžaduje nové potvrzení. Trasy rozvodů, výřezy a vhodnost připojení ověříte s TORO.</p></div>;
}

export function InquiryPanel({design,issues,onOpen,onService,onExport,onCheck}:{design:RoomDesign;issues:Issue[];onOpen:()=>void;onService:()=>void;onExport:()=>void;onCheck:()=>void}) {
  return <div className="tw-panel-content"><h2>Váš návrh pro TORO</h2><p>Projděte souhrn, doplňte kontakt a fotografie a stáhněte podklady.</p><dl className="tw-summary"><div><dt>Pokoj</dt><dd>{design.room.width} × {design.room.length} cm</dd></div><div><dt>Nábytek k výrobě</dt><dd>{design.items.filter(i=>!i.existing).length} ks</dd></div><div><dt>Technické prvky</dt><dd>{design.technicalPoints?.length??0}</dd></div></dl>{issues.length>0&&<Button variant="outline" onClick={onCheck}><CircleAlert/> Projít upozornění ({issues.length})</Button>}<Button className="tw-primary" onClick={onOpen}>Připravit poptávku <ChevronRight/></Button><Button variant="outline" onClick={onExport}><Download/> Stáhnout upravitelný návrh</Button><Button variant="ghost" onClick={onService}>Montáž nebo atypická zakázka</Button><p className="tw-note">Podklady se uloží do souboru. Odeslání přímo do TORO zatím není připojeno.</p></div>;
}

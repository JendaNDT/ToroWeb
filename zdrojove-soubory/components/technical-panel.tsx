'use client';
import { useState } from 'react';
import { ArrowLeft, ChevronRight, PlugZap, Droplets, CircleDot, Flame, Heater, Wind, Network, PanelsTopLeft, Plus, Trash2, Copy, LockKeyhole, UnlockKeyhole, Link2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { NativeSelect } from './ui/native-select';
import { NumberField } from './room-controls';
import { getRoomWall, roomWalls } from '@/lib/room-geometry';
import { type RoomDesign, type Wall } from '@/lib/room';
import { technicalCatalog, technicalTypes, technicalCategories, technicalBundles, surfaceNames, statusNames, accuracyNames, changeTechnicalSurface, describeTechnicalPlacement, type TechnicalPoint, type TechnicalType, type TechnicalCategory, type TechnicalBundle, type Surface } from '@/lib/technical';

export function TechnicalIcon({category,size=21}:{category:TechnicalCategory;size?:number}) {
  const Icon={electric:PlugZap,water:Droplets,drain:CircleDot,gas:Flame,heating:Heater,air:Wind,data:Network,service:PanelsTopLeft}[category];
  return <Icon size={size} strokeWidth={1.6}/>;
}
type Props={design:RoomDesign;selected:TechnicalPoint|undefined;onChange:(patch:Partial<TechnicalPoint>)=>void;onDelete:()=>void;onDuplicate:()=>void;onSelect:(id:string|null)=>void;onPlace:(type:TechnicalType)=>void;onAddDefault:(type:TechnicalType)=>void;onBundle:(kind:TechnicalBundle,itemId?:string)=>void;placing:TechnicalType|null;onCancel:()=>void;filter:TechnicalCategory|'all';onFilter:(filter:TechnicalCategory|'all')=>void};
function TechnicalProperties({design,point,onChange,onDelete,onDuplicate,onBack}:{design:RoomDesign;point:TechnicalPoint;onChange:Props['onChange'];onDelete:()=>void;onDuplicate:()=>void;onBack:()=>void}) {
  const def=technicalCatalog[point.type],p=point.placement,room=design.room;
  const shapeLabel=def.shape==='volume'||def.shape==='pipe'?'Rozměry překážky':'Rozměry přípojky / otvoru';
  return <div className="tw-panel-content tw-technical-properties">
    <Button variant="ghost" onClick={onBack}><ArrowLeft/> Všechny technické prvky</Button>
    <span className="tw-eyebrow">{technicalCategories.find(c=>c.id===def.category)?.name} / {point.label}</span>
    <h2><TechnicalIcon category={def.category}/>{def.name}</h2>
    <label className="toro-field-label">Název prvku<Input value={point.name} maxLength={80} onChange={e=>onChange({name:e.target.value||def.name})}/></label>
    <div className="tw-tech-pair"><label className="toro-field-label">Provedení<NativeSelect value={point.status} onChange={e=>onChange({status:e.target.value as TechnicalPoint['status']})}>{Object.entries(statusNames).map(([v,n])=><option key={v} value={v}>{n}</option>)}</NativeSelect></label>
    <label className="toro-field-label">Přesnost údajů<NativeSelect value={point.accuracy} onChange={e=>onChange({accuracy:e.target.value as TechnicalPoint['accuracy']})}>{Object.entries(accuracyNames).map(([v,n])=><option key={v} value={v}>{n}</option>)}</NativeSelect></label></div>
    <Button variant="outline" aria-pressed={point.locked} onClick={()=>onChange({locked:!point.locked})}>{point.locked?<LockKeyhole/>:<UnlockKeyhole/>}{point.locked?'Odemknout polohu':'Zamknout polohu'}</Button>
    <fieldset className="tw-tech-fields" disabled={point.locked}><legend className="sr-only">Poloha a rozměry technického prvku</legend>
      <label className="toro-field-label">Umístění<NativeSelect value={p.surface} onChange={e=>onChange(changeTechnicalSurface(point,e.target.value as Surface,room))}>{def.surfaces.map(s=><option key={s} value={s}>{surfaceNames[s]}</option>)}</NativeSelect></label>
      {p.surface==='wall'?<>
        <label className="toro-field-label">Stěna<NativeSelect value={p.wall} onChange={e=>onChange({placement:{...p,wall:e.target.value as Wall}})}>{!getRoomWall(room,p.wall)&&<option value={p.wall}>Odebraná stěna</option>}{roomWalls(room).map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</NativeSelect></label>
        <NumberField label={getRoomWall(room,p.wall)?.u.x?'Od levého rohu ke středu':'Od zadního rohu ke středu'} value={p.offset} step={.1} min={-1000} max={2000} onChange={offset=>onChange({placement:{...p,offset}})}/>
        <NumberField label="Výška středu nad podlahou" value={p.elevation} step={.1} min={-1000} max={2000} onChange={elevation=>onChange({placement:{...p,elevation}})}/>
      </>:<>
        <NumberField label="Od levé stěny ke středu" value={p.x+room.width/2} step={.1} min={-1000} max={2000} onChange={x=>onChange({placement:{...p,x:x-room.width/2}})}/>
        <NumberField label="Od zadní stěny ke středu" value={p.z+room.length/2} step={.1} min={-1000} max={2000} onChange={z=>onChange({placement:{...p,z:z-room.length/2}})}/>
        {p.surface==='space'&&<NumberField label="Výška středu nad podlahou" value={p.elevation} step={.1} min={-1000} max={2000} onChange={elevation=>onChange({placement:{...p,elevation}})}/>}
        <label className="toro-field-label">Otočení<NativeSelect value={p.rotation} onChange={e=>onChange({placement:{...p,rotation:Number(e.target.value) as 0|90|180|270}})}>{[0,90,180,270].map(n=><option value={n} key={n}>{n}°</option>)}</NativeSelect></label>
      </>}
      <p className="tw-note">Měříme ke středu. {p.surface==='floor'||p.surface==='ceiling'?'Šířka a délka leží v ploše; vyčnívání směřuje do pokoje.':'Hloubka určuje skutečný prostor, který prvek zabírá.'} Změna pokoje vaše měření neposune.</p>
      <details className="tw-details" open><summary>{shapeLabel}</summary>
        <NumberField label="Šířka prvku" value={point.width} step={.1} min={.2} max={1000} onChange={width=>onChange({width})}/>
        <NumberField label={p.surface==='floor'||p.surface==='ceiling'?'Délka v ploše':'Výška prvku'} value={point.height} step={.1} min={.2} max={1000} onChange={height=>onChange({height})}/>
        <NumberField label={p.surface==='space'?'Hloubka prvku':'Vyčnívání do pokoje'} value={point.depth} step={.1} min={def.shape==='volume'||def.shape==='pipe'?.2:0} max={1000} onChange={depth=>onChange({depth})}/>
        {def.shape==='pipe'&&<p className="tw-note">Zadejte obal přímého úseku potrubí. Další úsek vytvoříte duplikováním.</p>}
      </details>
    </fieldset>
    <details className="tw-details"><summary>Přístup a přiřazení</summary>
      <label className="toro-field-label">Prostor před prvkem<NativeSelect value={point.accessDepth?'known':'unknown'} onChange={e=>onChange({accessDepth:e.target.value==='known'?30:undefined})}><option value="unknown">Není zadaný</option><option value="known">Zadat rozměr</option></NativeSelect></label>
      {point.accessDepth&&<NumberField label="Hloubka prostoru pro přístup" value={point.accessDepth} step={.1} min={1} max={500} onChange={accessDepth=>onChange({accessDepth})}/>}
      <p className="tw-note">Zadejte požadovaný rozměr podle skutečného prvku. Výchozí hodnota není normový odstup.</p>
      <label className="toro-field-label"><Link2 size={14}/> Přiřazený nábytek<NativeSelect value={point.linkedItemId??''} onChange={e=>onChange({linkedItemId:e.target.value||undefined})}><option value="">Bez přiřazení</option>{point.linkedItemId&&!design.items.some(i=>i.id===point.linkedItemId)&&<option value={point.linkedItemId}>Původní kus byl odebrán</option>}{design.items.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</NativeSelect></label>
      <p className="tw-note">Přiřazení zaznamená účel přípojky. Prostor pro rozvody, výřezy a přístup se posuzuje samostatně.</p>
    </details>
    <label className="toro-field-label">Poznámka k prvku<Textarea value={point.notes} maxLength={1000} rows={3} onChange={e=>onChange({notes:e.target.value})}/></label>
    {point.groupId&&<p className="tw-note">Součást skupiny přípojek · {(design.technicalPoints??[]).filter(t=>t.groupId===point.groupId).map(t=>t.label).join(', ')}</p>}
    <div className="tw-tech-pair"><Button variant="outline" onClick={onDuplicate} disabled={(design.technicalPoints?.length??0)>=100}><Copy/> Duplikovat</Button><Button variant="outline" onClick={onDelete} disabled={point.locked}><Trash2/> Odebrat</Button></div>
  </div>;
}
export function TechnicalPanel(props:Props) {
  const {design,selected,onChange,onDelete,onDuplicate,onSelect,onPlace,onAddDefault,onBundle,placing,onCancel,filter,onFilter}=props;
  const [category,setCategory]=useState<TechnicalCategory|null>(null),[type,setType]=useState<TechnicalType>('socket'),[bundleTarget,setBundleTarget]=useState('');
  const points=design.technicalPoints??[],full=points.length>=100;
  if(selected)return <TechnicalProperties key={selected.id} design={design} point={selected} onChange={onChange} onDelete={onDelete} onDuplicate={onDuplicate} onBack={()=>onSelect(null)}/>;
  return <div className="tw-panel-content">
    <span className="tw-eyebrow">TECHNICKÉ PRVKY</span><h2>Přípojky a pevné prvky</h2><p>Zaznamenejte, s čím má nábytek počítat.</p>
    {category?<>
      <Button variant="ghost" onClick={()=>setCategory(null)}><ArrowLeft/> Všechny kategorie</Button>
      <label className="toro-field-label">{technicalCategories.find(c=>c.id===category)?.name}<NativeSelect value={type} onChange={e=>setType(e.target.value as TechnicalType)}>{technicalTypes.filter(t=>technicalCatalog[t].category===category).map(t=><option key={t} value={t}>{technicalCatalog[t].name}</option>)}</NativeSelect></label>
      {placing?<div className="tw-placement" role="status"><strong>Umístění: {technicalCatalog[placing].name}</strong><p>Klikněte do půdorysu. Přesné rozměry potom upravíte.</p><Button variant="outline" onClick={onCancel}>Zrušit umístění</Button></div>:<Button className="tw-primary" disabled={full} onClick={()=>onPlace(type)}><Plus/> Umístit prvek</Button>}
      <Button variant="ghost" disabled={full} onClick={()=>onAddDefault(type)}>Přidat zadáním rozměrů</Button>
    </>:<div className="tw-tech-categories">{technicalCategories.map(c=><button key={c.id} onClick={()=>{setCategory(c.id);setType(technicalTypes.find(t=>technicalCatalog[t].category===c.id)!);}}><TechnicalIcon category={c.id}/><span>{c.name}</span><ChevronRight size={15}/></button>)}</div>}
    <details className="tw-details"><summary>Přidat sestavu přípojek</summary>
      <label className="toro-field-label">Pro který kus?<NativeSelect value={design.items.some(i=>i.id===bundleTarget)?bundleTarget:''} onChange={e=>setBundleTarget(e.target.value)}><option value="">Zatím bez přiřazení</option>{design.items.filter(i=>i.type==='vanity'||i.type==='laundry').map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</NativeSelect></label>
      {(Object.keys(technicalBundles) as TechnicalBundle[]).map(kind=><Button key={kind} variant="outline" disabled={points.length>97} onClick={()=>onBundle(kind,design.items.some(i=>i.id===bundleTarget)?bundleTarget:undefined)}><Plus/>{technicalBundles[kind].name}</Button>)}
      <p className="tw-note">Každý vývod zůstává samostatně upravitelný. Polohy jsou orientační.</p>
    </details>
    <h3>V návrhu · {points.length} / 100</h3>
    <label className="toro-field-label">Zobrazit v seznamu a scéně<NativeSelect value={filter} onChange={e=>onFilter(e.target.value as TechnicalCategory|'all')}><option value="all">Všechny kategorie</option>{technicalCategories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</NativeSelect></label>
    {filter!=='all'&&<p className="tw-note">Skryté kategorie zůstávají součástí kontroly a exportu.</p>}
    <div className="tw-item-list">{points.filter(p=>filter==='all'||technicalCatalog[p.type].category===filter).map(point=><button key={point.id} onClick={()=>onSelect(point.id)}><TechnicalIcon category={technicalCatalog[point.type].category}/><span><strong>{point.label} · {point.name}{point.locked?' 🔒':''}</strong><small>{describeTechnicalPlacement(point,design.room)}</small><small>{statusNames[point.status]} · {accuracyNames[point.accuracy]}</small></span><ChevronRight size={17}/></button>)}</div>
  </div>;
}

export function FurnitureConnections({item,design,onBundle,onSelect}:{item:RoomDesign['items'][number];design:RoomDesign;onBundle:(kind:TechnicalBundle)=>void;onSelect:(id:string)=>void}) {
  const points=(design.technicalPoints??[]).filter(p=>p.linkedItemId===item.id),kind=item.type==='vanity'?'sink':item.type==='laundry'?'laundry':undefined;
  if(!kind&&!points.length)return null;
  return <div className="tw-panel-content tw-furniture-connections"><h3>Přípojky k tomuto kusu</h3>{points.length?<div className="tw-item-list">{points.map(p=><button key={p.id} onClick={()=>onSelect(p.id)}><TechnicalIcon category={technicalCatalog[p.type].category}/><span>{p.label} · {p.name}</span><ChevronRight size={16}/></button>)}</div>:<p>Přípojky zatím nejsou přiřazené. Přidejte orientační sestavu nebo přiřaďte stávající body v Technických prvcích.</p>}{kind&&<Button variant="outline" disabled={(design.technicalPoints?.length??0)>97} onClick={()=>onBundle(kind)}><Plus/>{technicalBundles[kind].name}</Button>}</div>;
}

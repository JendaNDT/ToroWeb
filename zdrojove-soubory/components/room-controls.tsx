'use client';
import { useId, useState } from 'react';
import { Check, DoorOpen, PanelTop, Plus, Trash2, Columns3, LibraryBig, Rows3, Archive, RectangleHorizontal, Armchair, RectangleVertical, Bath, WashingMachine, Monitor, Table2, Shirt, BedDouble, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { RoomShapePanel } from './room-shape-panel';
import { getRoomWall, roomWalls, roomWallName } from '@/lib/room-geometry';
import { openingLimits, type FurnitureType, type Room, type Wall, type Opening } from '@/lib/room';

export function FurnitureIcon({type,size=24}:{type:FurnitureType;size?:number}){
  const Icon={wardrobe:Columns3,builtin:DoorOpen,shoe:Archive,dresser:Rows3,bookcase:LibraryBig,shelf:RectangleHorizontal,bench:Armchair,panel:Shirt,mirror:RectangleVertical,vanity:Bath,laundry:WashingMachine,desk:Table2,tv:Monitor,bed:BedDouble,custom:Box}[type];
  return <Icon size={size} strokeWidth={1.4}/>;
}
export function NumberField({label,value,min,max,onChange,unit='cm',step=1}:{label:string;value:number;min:number;max:number;onChange:(n:number)=>void;unit?:string;step?:number}){
  const id=useId(),[draft,setDraft]=useState<string|null>(null);
  function commit(){if(draft!==null&&draft.trim()!==''&&Number.isFinite(Number(draft))){const n=Number((Math.round(Number(draft)/step)*step).toFixed(10));onChange(Math.min(max,Math.max(min,n)));}setDraft(null);}
  return <div className="rp-number"><label htmlFor={id}>{label}</label><div><Input id={id} type="number" step={step} min={min} max={max} value={draft??value} onChange={e=>setDraft(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();if(e.key==='Escape'){e.preventDefault();setDraft(null);}}}/><span>{unit}</span></div></div>;
}
export function RoomControls({room,onChange,selectedOpeningId,onSelectOpening}:{room:Room;onChange:(patch:Partial<Room>)=>void;selectedOpeningId?:string;onSelectOpening?:(id:string)=>void}){
  const [section,setSection]=useState<'size'|'shape'|'openings'|'appearance'>(selectedOpeningId?'openings':'size');
  const colors=[{color:'#edece5',name:'Teplá bílá'},{color:'#ffffff',name:'Čistá bílá'},{color:'#c4cbbd',name:'Šalvějová'},{color:'#d7c7b6',name:'Písková'},{color:'#a9b4bb',name:'Modrošedá'}];
  function updateOpening(id:string,patch:Partial<Opening>){onChange({openings:room.openings.map(o=>o.id===id?openingLimits(room,{...o,...patch}):o)});}
  function addOpening(type:'door'|'window'){
    const walls=roomWalls(room).filter(w=>w.length>=80),desired=type==='door'?90:120;
    let free=walls[0],offset=10;
    for(const wall of walls){
      const gaps=[10,...room.openings.filter(o=>o.wall===wall.id).map(o=>o.offset+o.width+20)];
      const candidate=gaps.find(x=>x+desired<=wall.length-10&&!room.openings.some(o=>o.wall===wall.id&&x<o.offset+o.width+10&&x+desired>o.offset-10));
      if(candidate!==undefined){free=wall;offset=candidate;break;}
    }
    if(!free)return;
    const opening=openingLimits(room,{id:crypto.randomUUID(),type,wall:free.id,offset,width:desired,height:type==='door'?210:120,sill:type==='door'?0:100});
    onChange({openings:[...room.openings,opening]});onSelectOpening?.(opening.id);
  }
  return <div className="rp-room-controls"><div className="rp-section-title"><h2>Váš pokoj</h2><p>{room.width} × {room.length} cm · {roomWalls(room).length===4?'4 stěny':`${roomWalls(room).length} stěn`} · dveře a okna: {room.openings.length}</p></div>
    <nav className="toro-context-nav" aria-label="Vlastnosti pokoje">{([{id:'size',name:'Rozměry'},{id:'shape',name:'Tvar'},{id:'openings',name:'Dveře a okna'},{id:'appearance',name:'Vzhled'}] as const).map(s=><button key={s.id} aria-pressed={section===s.id} onClick={()=>setSection(s.id)}>{s.name}</button>)}</nav>
    {section==='size'&&<><h3>Rozměry pokoje</h3><div className="rp-field-stack"><NumberField label="Šířka pokoje" value={room.width} min={120} max={1000} onChange={width=>onChange({width})}/><NumberField label="Délka pokoje" value={room.length} min={120} max={1000} onChange={length=>onChange({length})}/><NumberField label="Výška stropu" value={room.height} min={220} max={400} onChange={height=>onChange({height})}/></div>
    <p className="rp-note">Všechny rozměry jsou v centimetrech. Dveře, okna a členitý tvar upravíte v záložkách nahoře.</p></>}
    {section==='shape'&&<RoomShapePanel room={room} onChange={onChange}/>}
    {section==='appearance'&&<><div className="rp-control-section"><div className="rp-field-heading"><strong>Barva stěn</strong></div><div className="rp-wall-colors">{colors.map(c=><button key={c.color} style={{background:c.color}} className={room.wallColor===c.color?'active':''} aria-label={c.name} aria-pressed={room.wallColor===c.color} title={c.name} onClick={()=>onChange({wallColor:c.color})}>{room.wallColor===c.color&&<Check size={15}/>}</button>)}</div></div>
    <div className="rp-control-section"><div className="rp-field-heading"><strong>Podlaha</strong></div><div className="rp-floor-options">{([{id:'oak',label:'Dub',color:'#c6ae89'},{id:'light',label:'Světlá',color:'#dfdfd7'},{id:'dark',label:'Tmavá',color:'#72776e'}] as const).map(f=><button key={f.id} aria-pressed={room.floor===f.id} className={room.floor===f.id?'active':''} onClick={()=>onChange({floor:f.id})}><span style={{background:f.color}} className={f.id==='oak'?'mat-oak':''}/>{f.label}</button>)}</div></div>
    </>}
    {section==='openings'&&<div className="rp-control-section"><div className="rp-field-heading"><strong>Dveře a okna</strong><span>{room.openings.length} / 40</span></div><p className="rp-note">Na jedné stěně může být více otvorů. Jejich překrytí zobrazí Kontrola.</p><div className="rp-opening-list">{room.openings.map(o=><details key={o.id} className="rp-opening" open={selectedOpeningId===o.id?true:undefined}><summary>{o.type==='door'?<DoorOpen size={17}/>:<PanelTop size={17}/>}<span>{o.type==='door'?'Dveře':'Okno'}<small>{roomWallName(room,o.wall)}</small></span><span className="rp-opening-chevron">⌄</span></summary><div className="rp-opening-content"><label className="rp-select-label">Stěna<NativeSelect value={o.wall} onChange={e=>updateOpening(o.id,{wall:e.target.value as Wall})}>{!getRoomWall(room,o.wall)&&<option value={o.wall}>Odebraná stěna</option>}{roomWalls(room).map(w=><option key={w.id} value={w.id}>{w.name} · {Number(w.length.toFixed(1))} cm</option>)}</NativeSelect></label><NumberField label="Šířka otvoru" value={o.width} min={40} max={240} onChange={width=>updateOpening(o.id,{width})}/><NumberField label="Výška otvoru" value={o.height} min={40} max={room.height-10} onChange={height=>updateOpening(o.id,{height})}/><NumberField label="Od začátku stěny" value={o.offset} min={10} max={Math.max(10,(getRoomWall(room,o.wall)?.length??room.width)-o.width-10)} onChange={offset=>updateOpening(o.id,{offset})}/>{o.type==='window'&&<NumberField label="Výška parapetu" value={o.sill} min={0} max={room.height-o.height-5} onChange={sill=>updateOpening(o.id,{sill})}/>}<p className="rp-note">Počátek: {getRoomWall(room,o.wall)?.u.x?'levý':'zadní'} konec vybrané stěny.</p><Button variant="ghost" className="rp-delete-text" onClick={()=>onChange({openings:room.openings.filter(x=>x.id!==o.id)})}><Trash2 size={14}/> Odebrat otvor</Button></div></details>)}</div><div className="rp-opening-add"><Button variant="outline" disabled={room.openings.length>=40} onClick={()=>addOpening('door')}><Plus size={14}/> Dveře</Button><Button variant="outline" disabled={room.openings.length>=40} onClick={()=>addOpening('window')}><Plus size={14}/> Okno</Button></div></div>}
  </div>;
}

'use client';
import { useState } from 'react';
import { Button } from './ui/button';
import { NativeSelect } from './ui/native-select';
import { NumberField } from './room-controls';
import type { Room } from '@/lib/room';
import { addRoomRecess, outlineError, roomOutline, roomWalls, shapeOutline, type RoomShape } from '@/lib/room-geometry';

export function RoomShapePanel({room,onChange}:{room:Room;onChange:(patch:Partial<Room>)=>void}) {
  const [wallId,setWallId]=useState('north'),[offset,setOffset]=useState(40),[width,setWidth]=useState(100),[depth,setDepth]=useState(40),[outward,setOutward]=useState(true),[error,setError]=useState('');
  const walls=roomWalls(room),wall=walls.find(w=>w.id===wallId)??walls[0],points=roomOutline(room);
  const polygon=points.map(p=>`${p.x},${p.z}`).join(' ');
  function chooseShape(shape:RoomShape){setError('');onChange({outline:shapeOutline(room,shape)});}
  function moveWall(position:number){
    const index=points.findIndex(p=>p.id===wall.id),axis=wall.u.x===0?'x':'z';
    const outline=points.map((v,i)=>i===index||i===(index+1)%points.length?{...v,[axis]:position}:v);
    const minX=Math.min(...outline.map(v=>v.x)),minZ=Math.min(...outline.map(v=>v.z));
    const candidate={...room,width:Math.max(...outline.map(v=>v.x))-minX,length:Math.max(...outline.map(v=>v.z))-minZ,outline:outline.map(v=>({...v,x:v.x-minX,z:v.z-minZ}))};
    const reason=outlineError(candidate)??(candidate.width<120||candidate.length<120?'Celkový rozměr pokoje musí být alespoň 120 cm.':null);
    if(reason){setError(reason);return;}setError('');onChange({width:candidate.width,length:candidate.length,outline:candidate.outline});
  }
  function recess(){
    try{const candidate=addRoomRecess(room,wall.id,offset,width,depth,outward,()=>crypto.randomUUID());onChange({width:candidate.width,length:candidate.length,outline:candidate.outline});setError('');}
    catch(e){setError(e instanceof Error?e.message:'Výklenek nelze vytvořit.');}
  }
  return <section className="tw-room-shape">
    <h3>Tvar místnosti · {room.outline?`${walls.length} stěn`:'obdélník'}</h3>
    <div className="tw-shape-presets">{([{id:'rectangle',name:'Obdélník'},{id:'l',name:'Do L'},{id:'u',name:'Do U'}] as const).map(s=><Button key={s.id} variant="outline" onClick={()=>chooseShape(s.id)}>{s.name}</Button>)}</div>
    <svg className="tw-shape-map" viewBox={`-45 -45 ${room.width+90} ${room.length+90}`} role="img" aria-label="Půdorys s označením stěn">
      <polygon points={polygon} fill="#f7ecd9" stroke="#78634b" strokeWidth="3"/>
      {walls.map((w,i)=><g key={w.id}><line x1={w.start.x+room.width/2} y1={w.start.z+room.length/2} x2={w.end.x+room.width/2} y2={w.end.z+room.length/2} stroke={wall.id===w.id?'#bd6d00':'#78634b'} strokeWidth={wall.id===w.id?7:3}/><text x={(w.start.x+w.end.x)/2+room.width/2+w.normal.x*20} y={(w.start.z+w.end.z)/2+room.length/2+w.normal.z*20} textAnchor="middle" dominantBaseline="central" fontSize={Math.max(room.width,room.length)/23} fill="#33291d">{i+1}</text></g>)}
    </svg>
    <label className="toro-field-label">Upravit stěnu<NativeSelect value={wall.id} onChange={e=>{setWallId(e.target.value);setError('');}}>{walls.map((w,i)=><option key={w.id} value={w.id}>{i+1}. {w.name} · {Number(w.length.toFixed(1))} cm</option>)}</NativeSelect></label>
    <NumberField label={wall.u.x===0?'Vzdálenost stěny od levého okraje':'Vzdálenost stěny od zadního okraje'} value={wall.u.x===0?wall.start.x+room.width/2:wall.start.z+room.length/2} min={0} max={1000} step={.1} onChange={moveWall}/>
    <details className="tw-details"><summary>Přidat výklenek nebo výstupek</summary>
      <label className="toro-field-label">Úprava stěny<NativeSelect value={outward?'recess':'projection'} onChange={e=>setOutward(e.target.value==='recess')}><option value="recess">Výklenek ven z pokoje</option><option value="projection">Výstupek do pokoje</option></NativeSelect></label>
      <NumberField label="Od začátku vybrané stěny" value={offset} min={20} max={Math.max(20,wall.length-40)} onChange={setOffset}/>
      <NumberField label="Šířka výklenku / výstupku" value={width} min={20} max={Math.max(20,wall.length-40)} onChange={setWidth}/>
      <NumberField label="Hloubka výklenku / výstupku" value={depth} min={20} max={800} onChange={setDepth}/>
      <Button variant="outline" disabled={points.length>28} onClick={recess}>Přidat úpravu stěny</Button>
    </details>
    {error&&<p className="tw-shape-error" role="alert">{error}</p>}
    <p className="tw-note">Čísla odpovídají stěnám v seznamu. Půdorys zůstává pravoúhlý. Po změně tvaru zkontrolujte otvory a přípojky; změnu lze vrátit tlačítkem Zpět.</p>
  </section>;
}

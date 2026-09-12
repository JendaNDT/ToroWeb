'use client';
import { ArrowLeft, Copy, Pencil, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { FurniturePlacement } from './furniture-controls';
import { DetailSection } from './detail-section';
import { materials } from '@/lib/configuration';
import type { Furniture, Room, Issue } from '@/lib/room';

export function RoomItemPanel({item,room,issues,onBack,onEdit,onChange,onDuplicate,onDelete}:{item:Furniture;room:Room;issues:Issue[];onBack:()=>void;onEdit:()=>void;onChange:(patch:Partial<Furniture>)=>void;onDuplicate:()=>void;onDelete:()=>void}) {
  const ownIssues=issues.filter(i=>i.itemIds.includes(item.id));
  return <div className="tw-panel-content toro-room-item">
    <Button variant="ghost" onClick={onBack}><ArrowLeft/> Zpět do nábytku</Button>
    <h2>{item.name}</h2><p className="toro-item-overview">{item.width} × {item.height} × {item.depth} cm<br/>{item.construction==='solid'?'Masiv':'Lamino'} · {materials.find(m=>m.id===item.material)?.name}</p>
    <Button className="tw-primary" onClick={onEdit}><Pencil/> Upravit rozměry a provedení</Button>
    {ownIssues.length>0&&<div className="rp-item-warnings" aria-label="Upozornění k vybranému kusu">{ownIssues.map(issue=><p key={issue.id}>{issue.text}</p>)}</div>}
    <FurniturePlacement item={item} room={room} onChange={onChange}/>
    <DetailSection title="Další akce s kusem"><div className="tw-tech-pair"><Button variant="outline" onClick={onDuplicate}><Copy/> Duplikovat</Button><Button variant="outline" onClick={onDelete} aria-label={`Odstranit ${item.name}`}><Trash2/> Odebrat</Button></div></DetailSection>
  </div>;
}

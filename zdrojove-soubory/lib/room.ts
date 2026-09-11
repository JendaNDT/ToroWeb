import { z } from 'zod';
import { materials, type Configuration, type MaterialId, type LayoutId } from './configuration';

export type FurnitureType = 'wardrobe' | 'builtin' | 'shoe' | 'dresser' | 'bookcase' | 'shelf' | 'bench' | 'panel' | 'mirror' | 'vanity' | 'laundry' | 'desk' | 'tv';
export type Wall = 'north' | 'east' | 'south' | 'west';
export type Opening = { id: string; type: 'door' | 'window'; wall: Wall; offset: number; width: number; height: number; sill: number };
export type Room = { width: number; length: number; height: number; wallColor: string; floor: 'oak' | 'light' | 'dark'; openings: Opening[] };
export type Furniture = {
  id: string; type: FurnitureType; name: string; width: number; height: number; depth: number;
  x: number; z: number; y: number; rotation: 0 | 90 | 180 | 270;
  material: MaterialId; front: MaterialId; doors: 'hinged' | 'open' | 'sliding';
  handles: 'black' | 'brass'; sections: LayoutId[]; shelfCount: number;
  construction?: 'laminate' | 'solid'; existing?: boolean;
  basins?: 1 | 2; appliances?: 'stacked' | 'side-by-side'; hooks?: number;
};
export type RoomDesign = { version: 1; room: Room; items: Furniture[]; title?: string };
export type Issue = { id: string; itemIds: string[]; text: string; kind: 'overlap' | 'outside' | 'opening' };
export const wallNames: Record<Wall,string> = { north:'Zadní stěna', east:'Pravá stěna', south:'Přední stěna', west:'Levá stěna' };
export const catalog: { type: FurnitureType; name: string; description: string; width: number; height: number; depth: number; }[] = [
  {type:'wardrobe',name:'Šatní skříň',description:'Samostatná, podle vás',width:120,height:220,depth:60},
  {type:'builtin',name:'Vestavěná skříň',description:'Od podlahy ke stropu',width:200,height:258,depth:65},
  {type:'shoe',name:'Botník',description:'Pořádek hned u dveří',width:100,height:95,depth:35},
  {type:'dresser',name:'Komoda',description:'Zásuvky pro drobnosti',width:120,height:85,depth:45},
  {type:'bookcase',name:'Knihovna',description:'Otevřené police',width:90,height:190,depth:32},
  {type:'shelf',name:'Nástěnná police',description:'Prostor nad nábytkem',width:100,height:4,depth:25},
  {type:'bench',name:'Lavice na obuv',description:'Dřevo a kov',width:100,height:45,depth:38},
  {type:'panel',name:'Věšákový panel',description:'Háčky a obložení',width:100,height:120,depth:8},
  {type:'mirror',name:'Zrcadlo',description:'V rámu na míru',width:60,height:110,depth:4},
  {type:'vanity',name:'Umyvadlová skříňka',description:'Závěsná s umyvadlem',width:120,height:60,depth:50},
  {type:'laundry',name:'Prádelní skříň',description:'Pračka a sušička',width:75,height:210,depth:70},
  {type:'desk',name:'Pracovní stůl',description:'Deska s kovovou podnoží',width:140,height:75,depth:65},
  {type:'tv',name:'TV skříňka',description:'Nízká úložná sestava',width:160,height:40,depth:40},
];

export function furnitureLimits(type:FurnitureType) {
  const limits:Record<FurnitureType,{width:[number,number];height:[number,number];depth:[number,number]}>= {
    wardrobe:{width:[40,500],height:[160,400],depth:[40,100]},builtin:{width:[70,500],height:[160,400],depth:[40,100]},
    shoe:{width:[30,300],height:[30,180],depth:[20,60]},dresser:{width:[30,400],height:[30,180],depth:[25,80]},
    bookcase:{width:[30,400],height:[30,300],depth:[20,60]},shelf:{width:[30,250],height:[2,12],depth:[15,50]},
    bench:{width:[50,200],height:[35,60],depth:[30,60]},panel:{width:[40,220],height:[50,240],depth:[6,12]},
    mirror:{width:[35,180],height:[40,220],depth:[3,8]},vanity:{width:[65,200],height:[45,85],depth:[40,65]},
    laundry:{width:[70,250],height:[185,260],depth:[65,85]},desk:{width:[70,240],height:[65,90],depth:[40,100]},
    tv:{width:[40,400],height:[30,90],depth:[25,65]},
  };
  return limits[type];
}
export const canMount = (type:FurnitureType) => ['shelf','panel','mirror','vanity','tv'].includes(type);
export const initialRoom: RoomDesign = {
  version:1,
  room:{width:520,length:420,height:270,wallColor:'#edece5',floor:'oak',openings:[
    {id:'window-1',type:'window',wall:'north',offset:300,width:140,height:120,sill:100},
    {id:'door-1',type:'door',wall:'west',offset:280,width:90,height:210,sill:0},
  ]},
  items:[
    {id:'wardrobe-1',type:'wardrobe',name:'Šatní skříň',width:140,height:220,depth:60,x:-165,z:-178,y:0,rotation:0,material:'oak',front:'sand',doors:'hinged',handles:'black',sections:['hanging','shelves'],shelfCount:4},
    {id:'dresser-1',type:'dresser',name:'Komoda',width:120,height:85,depth:45,x:115,z:-185.5,y:0,rotation:0,material:'oak',front:'white',doors:'open',handles:'black',sections:['drawers','drawers'],shelfCount:3},
    {id:'shelf-1',type:'shelf',name:'Nástěnná police',width:95,height:4,depth:25,x:-244.5,z:-60,y:145,rotation:90,material:'oak',front:'oak',doors:'open',handles:'black',sections:['shelves'],shelfCount:1},
  ],
};
export const clamp = (n:number,min:number,max:number) => Math.min(max,Math.max(min,n));
export function footprint(item: Furniture) {
  const turn=item.rotation===90||item.rotation===270;
  return {width:turn?item.depth:item.width,depth:turn?item.width:item.depth};
}
export function boundsOf(item:Furniture) {
  const p=footprint(item);
  return {left:item.x-p.width/2,right:item.x+p.width/2,back:item.z-p.depth/2,front:item.z+p.depth/2,bottom:item.y,top:item.y+item.height};
}
export function placeItem(item:Furniture,room:Room,x=item.x,z=item.z,snap=false):Furniture {
  const p=footprint(item), minX=-room.width/2+p.width/2, maxX=room.width/2-p.width/2;
  const minZ=-room.length/2+p.depth/2, maxZ=room.length/2-p.depth/2;
  if(snap){x=Math.round(x/5)*5;z=Math.round(z/5)*5;}
  if(snap&&minX<=maxX){if(Math.abs(x-minX)<12)x=minX;if(Math.abs(x-maxX)<12)x=maxX;}
  if(snap&&minZ<=maxZ){if(Math.abs(z-minZ)<12)z=minZ;if(Math.abs(z-maxZ)<12)z=maxZ;}
  return {...item,x:minX>maxX?0:Math.round(clamp(x,minX,maxX)*10)/10,z:minZ>maxZ?0:Math.round(clamp(z,minZ,maxZ)*10)/10};
}
export function normalizeItem(item:Furniture,room:Room):Furniture {
  const type=item.type, limits=furnitureLimits(type);
  const next={...item,width:clamp(item.width,...limits.width),depth:clamp(item.depth,...limits.depth),height:clamp(item.height,...limits.height),y:0};
  if(type==='vanity'&&item.basins===2)next.width=Math.max(120,next.width);
  if(type==='laundry'&&item.appliances==='side-by-side')next.width=Math.max(140,next.width);
  next.y=canMount(type)?clamp(item.y,0,Math.max(0,room.height-next.height)):0;
  if(next.construction==='solid') {if(!['oak','walnut'].includes(next.material))next.material='oak';if(!['oak','walnut'].includes(next.front))next.front='oak';}
  const count=Math.max(1,Math.ceil(next.width/100),Math.min(next.sections.length,Math.floor(next.width/30)));
  next.sections=Array.from({length:count},(_,i)=>next.sections[i]||'shelves');
  if(['shelf','bench','panel','mirror','vanity','laundry','desk'].includes(type))next.sections=['shelves'];
  next.shelfCount=Math.round(clamp(next.shelfCount,1,type==='vanity'?3:8));
  return placeItem(next,room);
}
/** Align neighbouring pieces along a shared back edge when dragging nearby. */
export function placeInDesign(item:Furniture,design:RoomDesign,x:number,z:number,snap=false):Furniture {
  const placed=placeItem(item,design.room,x,z,snap);if(!snap)return placed;
  const a=boundsOf(placed),p=footprint(placed),candidates:Furniture[]=[];
  for(const other of design.items){
    if(other.id===item.id||other.rotation!==item.rotation)continue;
    const b=boundsOf(other);if(a.bottom>=b.top||a.top<=b.bottom)continue;
    if(item.rotation===0||item.rotation===180){
      const alignedZ=item.rotation===0?b.back+p.depth/2:b.front-p.depth/2;
      if(Math.abs(placed.z-alignedZ)>10)continue;
      for(const alignedX of [b.left-p.width/2,b.right+p.width/2])if(Math.abs(placed.x-alignedX)<10)candidates.push(placeItem(item,design.room,alignedX,alignedZ));
    }else{
      const alignedX=item.rotation===90?b.left+p.width/2:b.right-p.width/2;
      if(Math.abs(placed.x-alignedX)>10)continue;
      for(const alignedZ of [b.back-p.depth/2,b.front+p.depth/2])if(Math.abs(placed.z-alignedZ)<10)candidates.push(placeItem(item,design.room,alignedX,alignedZ));
    }
  }
  return candidates.sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z)).find(candidate=>!issuesFor({...design,items:[...design.items.filter(i=>i.id!==item.id),candidate]}).some(issue=>issue.itemIds.includes(item.id)))||placed;
}
export function openingLimits(room:Room,opening:Opening):Opening {
  const wallLength=opening.wall==='north'||opening.wall==='south'?room.width:room.length;
  const width=clamp(opening.width,40,Math.min(240,wallLength-20));
  const height=clamp(opening.height,40,room.height-10);
  return {...opening,width,height,offset:clamp(opening.offset,10,wallLength-width-10),sill:opening.type==='door'?0:clamp(opening.sill,0,room.height-height-5)};
}
export function resizeRoom(design:RoomDesign,patch:Partial<Room>):RoomDesign {
  const room={...design.room,...patch};
  room.width=clamp(room.width,120,1000);room.length=clamp(room.length,120,1000);room.height=clamp(room.height,220,400);
  room.openings=room.openings.map(o=>openingLimits(room,o));
  return {...design,room,items:design.items.map(i=>placeItem({...i,y:Math.max(0,Math.min(i.y,room.height-i.height))},room))};
}
export function attachToWall(item:Furniture,room:Room,wall:Wall):Furniture {
  const rotation=({north:0,east:270,south:180,west:90} as const)[wall];
  const next={...item,rotation};const p=footprint(next);
  if(wall==='north')next.z=-room.length/2+p.depth/2;
  if(wall==='south')next.z=room.length/2-p.depth/2;
  if(wall==='west')next.x=-room.width/2+p.width/2;
  if(wall==='east')next.x=room.width/2-p.width/2;
  return placeItem(next,room);
}
function intersects(a:ReturnType<typeof boundsOf>,b:ReturnType<typeof boundsOf>,tolerance=.5){
  return a.left<b.right-tolerance&&a.right>b.left+tolerance&&a.back<b.front-tolerance&&a.front>b.back+tolerance&&a.bottom<b.top-tolerance&&a.top>b.bottom+tolerance;
}
export function openingBounds(o:Opening,r:Room){
  const vertical=o.wall==='east'||o.wall==='west';
  const len=vertical?r.length:r.width,start=-len/2+o.offset,clearance=o.type==='door'?Math.min(o.width,100):8;
  if(o.wall==='north')return {left:start,right:start+o.width,back:-r.length/2,front:-r.length/2+clearance,bottom:o.sill,top:o.sill+o.height};
  if(o.wall==='south')return {left:start,right:start+o.width,back:r.length/2-clearance,front:r.length/2,bottom:o.sill,top:o.sill+o.height};
  if(o.wall==='west')return {left:-r.width/2,right:-r.width/2+clearance,back:start,front:start+o.width,bottom:o.sill,top:o.sill+o.height};
  return {left:r.width/2-clearance,right:r.width/2,back:start,front:start+o.width,bottom:o.sill,top:o.sill+o.height};
}
export function issuesFor(design:RoomDesign):Issue[]{
  const {room,items}=design,issues:Issue[]=[];
  for(let i=0;i<items.length;i++){
    const item=items[i],a=boundsOf(item);
    if(a.left < -room.width/2-.1||a.right>room.width/2+.1||a.back < -room.length/2-.1||a.front>room.length/2+.1||a.top>room.height+.1||a.bottom<0)issues.push({id:'outside-'+item.id,itemIds:[item.id],kind:'outside',text:`${item.name}: přesahuje rozměry pokoje.`});
    for(let j=i+1;j<items.length;j++)if(intersects(a,boundsOf(items[j])))issues.push({id:item.id+'-'+items[j].id,itemIds:[item.id,items[j].id],kind:'overlap',text:`${item.name} a ${items[j].name} se překrývají.`});
    for(const opening of room.openings)if(intersects(a,openingBounds(opening,room)))issues.push({id:item.id+'-'+opening.id,itemIds:[item.id],kind:'opening',text:`${item.name}: ${opening.type==='door'?'blokuje prostor u dveří':'zasahuje do okna'}.`});
  }
  return issues;
}
export function newFurniture(type:FurnitureType,room:Room,id:string):Furniture {
  const def=catalog.find(c=>c.type===type)!;
  return normalizeItem({id,type,name:def.name,width:def.width,height:type==='builtin'?room.height-2:def.height,depth:def.depth,x:0,z:0,y:({shelf:145,panel:65,mirror:90,vanity:25,tv:20} as Partial<Record<FurnitureType,number>>)[type]||0,rotation:0,material:'oak',front:'sand',doors:type==='builtin'?'sliding':['wardrobe','shoe','tv'].includes(type)?'hinged':'open',handles:'black',sections:type==='wardrobe'?['hanging','shelves']:type==='builtin'?['hanging','shelves']:type==='dresser'?['drawers','drawers']:['shelves'],shelfCount:type==='shoe'?3:type==='vanity'?2:4,construction:'laminate',existing:false,basins:1,appliances:'stacked',hooks:4},room);
}
export function findFreePosition(item:Furniture,design:RoomDesign):Furniture|null {
  const candidates=[placeItem(item,design.room)];
  for(let z=-design.room.length/2;z<=design.room.length/2;z+=20)for(let x=-design.room.width/2;x<=design.room.width/2;x+=20)candidates.push(placeItem(item,design.room,x,z));
  for(const candidate of candidates){const placed={...design,items:[...design.items,candidate]};if(!issuesFor(placed).some(i=>i.itemIds.includes(candidate.id)))return candidate;}
  return null;
}
export function furniturePrice(item:Furniture):number {
  const w=item.width/100,h=item.height/100,d=item.depth/100;
  const factor=materials.find(m=>m.id===item.material)!.factor;
  const surface=item.type==='shelf'?2*w*d:(item.sections.length+1)*h*d+2*w*d+w*h*.35+item.shelfCount*w*d;
  const hardware=item.type==='shelf'?0:item.type==='dresser'?item.sections.length*2300:item.sections.reduce((s,l)=>s+(l==='drawers'?2800:l==='hanging'?650:350),0);
  const doorCost=item.doors==='open'?0:w*h*850*materials.find(m=>m.id===item.front)!.factor+(item.doors==='sliding'?2800:480*item.sections.length);
  return Math.round(surface*1100*factor+hardware+doorCost+(item.type==='builtin'?1600:0));
}
export function asWardrobe(item:Furniture):Configuration {
  return {...item,doors:'open'};
}

const material=z.enum(['oak','walnut','white','sand','graphite']);
const openingSchema=z.object({id:z.string().min(1).max(80),type:z.enum(['door','window']),wall:z.enum(['north','east','south','west']),offset:z.number().finite().min(0).max(1000),width:z.number().finite().min(40).max(240),height:z.number().finite().min(40).max(390),sill:z.number().finite().min(0).max(360)});
const itemSchema=z.object({id:z.string().min(1).max(80),type:z.enum(['wardrobe','builtin','shoe','dresser','bookcase','shelf','bench','panel','mirror','vanity','laundry','desk','tv']),name:z.string().min(1).max(50),width:z.number().finite().min(30).max(500),height:z.number().finite().min(2).max(400),depth:z.number().finite().min(3).max(100),x:z.number().finite().min(-1000).max(1000),z:z.number().finite().min(-1000).max(1000),y:z.number().finite().min(0).max(400),rotation:z.union([z.literal(0),z.literal(90),z.literal(180),z.literal(270)]),material,front:material,doors:z.enum(['hinged','open','sliding']),handles:z.enum(['black','brass']),sections:z.array(z.enum(['hanging','shelves','drawers'])).min(1).max(16),shelfCount:z.number().int().min(1).max(8),construction:z.enum(['laminate','solid']).optional(),existing:z.boolean().optional(),basins:z.union([z.literal(1),z.literal(2)]).optional(),appliances:z.enum(['stacked','side-by-side']).optional(),hooks:z.number().int().min(1).max(8).optional()});
export const roomDesignSchema=z.object({version:z.literal(1),title:z.string().min(1).max(80).optional(),room:z.object({width:z.number().finite().min(120).max(1000),length:z.number().finite().min(120).max(1000),height:z.number().finite().min(220).max(400),wallColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),floor:z.enum(['oak','light','dark']),openings:z.array(openingSchema).max(4)}),items:z.array(itemSchema).max(30)}).superRefine((d,ctx)=>{
  if(new Set(d.items.map(i=>i.id)).size!==d.items.length)ctx.addIssue({code:'custom',message:'Duplicitní kusy nábytku.'});
  if(new Set(d.room.openings.map(o=>o.wall)).size!==d.room.openings.length)ctx.addIssue({code:'custom',message:'Na jedné stěně může být jeden otvor.'});
  if(new Set(d.room.openings.map(o=>o.id)).size!==d.room.openings.length)ctx.addIssue({code:'custom',message:'Duplicitní otvory.'});
  d.room.openings.forEach(o=>{const fixed=openingLimits(d.room,o);if(fixed.offset!==o.offset||fixed.width!==o.width||fixed.height!==o.height||fixed.sill!==o.sill)ctx.addIssue({code:'custom',message:'Otvor přesahuje stěnu.'});});
  d.items.forEach(i=>{if((!['panel','mirror'].includes(i.type)&&i.depth<15)||i.width/i.sections.length<25||(i.type!=='shelf'&&i.height<30)||(i.type==='shelf'&&i.height>12)||(['wardrobe','builtin'].includes(i.type)&&(i.height<160||i.depth<40)))ctx.addIssue({code:'custom',message:'Neplatné rozměry nábytku.'});});
  d.items.filter(i=>['bench','panel','mirror','vanity','laundry','desk','tv'].includes(i.type)).forEach(i=>{
    const limits=furnitureLimits(i.type);
    if((['width','height','depth'] as const).some(k=>i[k]<limits[k][0]||i[k]>limits[k][1])||(i.type==='vanity'&&(i.shelfCount>3||(i.basins===2&&i.width<120)))||(i.type==='laundry'&&i.appliances==='side-by-side'&&i.width<140))ctx.addIssue({code:'custom',message:'Rozměry neodpovídají zvolenému vybavení.'});
  });
});

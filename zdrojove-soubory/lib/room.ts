import { z } from 'zod';
import { materials, type Configuration, type MaterialId, type LayoutId } from './configuration';
import { technicalPointSchema, technicalIssues, technicalBounds, technicalCatalog, newTechnicalPoint, type TechnicalPoint } from './technical';
import { boundsInsideRoom, fitBoundsInRoom, getRoomWall, outlineError, roomOutline, roomWalls, wallPoint, wallRotation, type RoomVertex } from './room-geometry';
export { normalizeTechnicalPoint, technicalPosition, nearestWallPoint, technicalWallNames as wallNames } from './technical';
export type { TechnicalPoint } from './technical';

export type FurnitureType = 'wardrobe' | 'builtin' | 'shoe' | 'dresser' | 'bookcase' | 'shelf' | 'bench' | 'panel' | 'mirror' | 'vanity' | 'laundry' | 'desk' | 'tv' | 'bed' | 'custom';
export type Wall = string;
export type Opening = { id: string; type: 'door' | 'window'; wall: Wall; offset: number; width: number; height: number; sill: number };
export type Room = { width: number; length: number; height: number; wallColor: string; floor: 'oak' | 'light' | 'dark'; openings: Opening[]; outline?:RoomVertex[] };
export type Furniture = {
  id: string; type: FurnitureType; name: string; width: number; height: number; depth: number;
  x: number; z: number; y: number; rotation: 0 | 90 | 180 | 270;
  material: MaterialId; front: MaterialId; doors: 'hinged' | 'open' | 'sliding';
  handles: 'black' | 'brass'; sections: LayoutId[]; shelfCount: number;
  construction?: 'laminate' | 'solid'; existing?: boolean;
  basins?: 1 | 2; appliances?: 'stacked' | 'side-by-side'; hooks?: number;
  notes?:string;
};
/** Product parameters have no identity, room position or mounting height. */
export type FurnitureConfiguration = Omit<Furniture, 'id' | 'x' | 'y' | 'z' | 'rotation' | 'existing'>;
export function furnitureConfiguration(item:Furniture):FurnitureConfiguration {
  const {id,x,y,z,rotation,existing,...configuration}=item;
  void id;void x;void y;void z;void rotation;void existing;
  return configuration;
}
export type IssueAcknowledgement={issueId:string;fingerprint:string;acknowledgedAt:string;note:string};
export type RoomDesign = { version: 1 | 2 | 3 | 4; room: Room; items: Furniture[]; title?: string; technicalPoints?: TechnicalPoint[]; acknowledgements?:IssueAcknowledgement[] };
export type Selection = { kind: 'furniture' | 'technical' | 'opening'; id: string } | null;
export type Issue = { id: string; itemIds: string[]; text: string; kind: 'overlap' | 'outside' | 'opening' | 'technical' | 'connection'; severity: 'info' | 'warning' | 'problem'; technicalPointIds?: string[]; openingIds?:string[]; blocksPlacement?: boolean };

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
  {type:'bed',name:'Postel',description:'Rám, čelo a ilustrační matrace',width:180,height:90,depth:210},
  {type:'custom',name:'Atypický kus',description:'Vlastní rozměry a zadání',width:100,height:80,depth:60},
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
    bed:{width:[85,240],height:[40,140],depth:[170,240]},custom:{width:[20,500],height:[5,400],depth:[10,400]},
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
/** Closed fronts/hardware beyond the carcass, in cm. Kept in sync with all model variants by geometry tests. */
export function frontProjection(item:FurnitureConfiguration):number {
  if(item.type==='wardrobe'||item.type==='builtin')return Math.max(
    item.doors==='sliding'?6.6:item.doors==='hinged'?5.35:0,
    item.sections.includes('drawers')?1.65:0,item.type==='builtin'?1.1:0);
  if(item.type==='dresser')return 4.35;
  if(item.type==='mirror')return .45;
  if(item.type==='vanity')return .7;
  if(item.type==='laundry')return Math.max(0,Math.min(60,item.depth-4)/2+3-item.depth/2);
  if(['shoe','bookcase','tv'].includes(item.type)&&item.doors!=='open')return 4.7;
  return 0;
}
export function footprint(item: Furniture) {
  const extra=frontProjection(item),depth=item.depth+extra,turn=item.rotation===90||item.rotation===270;
  // The stored position remains the carcass centre; projecting fronts shift the envelope centre.
  const [dx,dz]=({0:[0,1],90:[1,0],180:[0,-1],270:[-1,0]} as const)[item.rotation];
  return {width:turn?depth:item.width,depth:turn?item.width:depth,centerX:dx*extra/2,centerZ:dz*extra/2};
}
export function boundsOf(item:Furniture) {
  const p=footprint(item);
  return {left:item.x+p.centerX-p.width/2,right:item.x+p.centerX+p.width/2,back:item.z+p.centerZ-p.depth/2,front:item.z+p.centerZ+p.depth/2,bottom:item.y,top:item.y+item.height};
}
export function placeItem(item:Furniture,room:Room,x=item.x,z=item.z,snap=false):Furniture {
  const p=footprint(item), minX=-room.width/2+p.width/2-p.centerX, maxX=room.width/2-p.width/2-p.centerX;
  const minZ=-room.length/2+p.depth/2-p.centerZ, maxZ=room.length/2-p.depth/2-p.centerZ;
  if(snap){x=Math.round(x/5)*5;z=Math.round(z/5)*5;}
  if(snap&&minX<=maxX){if(Math.abs(x-minX)<12)x=minX;if(Math.abs(x-maxX)<12)x=maxX;}
  if(snap&&minZ<=maxZ){if(Math.abs(z-minZ)<12)z=minZ;if(Math.abs(z-maxZ)<12)z=maxZ;}
  const placed={...item,x:minX>maxX?-p.centerX:clamp(Math.round(x*10)/10,minX,maxX),z:minZ>maxZ?-p.centerZ:clamp(Math.round(z*10)/10,minZ,maxZ)};
  if(room.outline){const shift=fitBoundsInRoom(room,boundsOf(placed));placed.x+=shift.x;placed.z+=shift.z;}
  return placed;
}
export function normalizeFurniture(item:FurnitureConfiguration):FurnitureConfiguration {
  const type=item.type, limits=furnitureLimits(type);
  const next={...item,width:clamp(item.width,...limits.width),depth:clamp(item.depth,...limits.depth),height:clamp(item.height,...limits.height)};
  if(type==='vanity'&&item.basins===2)next.width=Math.max(120,next.width);
  if(type==='laundry'&&item.appliances==='side-by-side')next.width=Math.max(140,next.width);
  if(next.construction==='solid') {if(!['oak','walnut'].includes(next.material))next.material='oak';if(!['oak','walnut'].includes(next.front))next.front='oak';}
  const count=Math.max(1,Math.ceil(next.width/100),Math.min(next.sections.length,Math.floor(next.width/30)));
  next.sections=Array.from({length:count},(_,i)=>next.sections[i]||'shelves');
  if(['shelf','bench','panel','mirror','vanity','laundry','desk','bed','custom'].includes(type))next.sections=['shelves'];
  next.shelfCount=Math.round(clamp(next.shelfCount,1,type==='vanity'?3:8));
  return next;
}
export function normalizeItem(item:Furniture,room:Room):Furniture {
  const next={...item,...normalizeFurniture(furnitureConfiguration(item))};
  next.y=canMount(item.type)?clamp(item.y,0,Math.max(0,room.height-next.height)):0;
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
      const alignedZ=(item.rotation===0?b.back+p.depth/2:b.front-p.depth/2)-p.centerZ;
      if(Math.abs(placed.z-alignedZ)>10)continue;
      for(const edge of [b.left-p.width/2,b.right+p.width/2]){const alignedX=edge-p.centerX;if(Math.abs(placed.x-alignedX)<10)candidates.push(placeItem(item,design.room,alignedX,alignedZ));}
    }else{
      const alignedX=(item.rotation===90?b.left+p.width/2:b.right-p.width/2)-p.centerX;
      if(Math.abs(placed.x-alignedX)>10)continue;
      for(const edge of [b.back-p.depth/2,b.front+p.depth/2]){const alignedZ=edge-p.centerZ;if(Math.abs(placed.z-alignedZ)<10)candidates.push(placeItem(item,design.room,alignedX,alignedZ));}
    }
  }
  return candidates.sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z)).find(candidate=>!issuesFor({...design,items:[...design.items.filter(i=>i.id!==item.id),candidate]}).some(issue=>issue.itemIds.includes(item.id)))||placed;
}
export function openingLimits(room:Room,opening:Opening):Opening {
  const wallLength=getRoomWall(room,opening.wall)?.length??room.width;
  if(wallLength<60)return {...opening,offset:0,width:40,height:clamp(opening.height,40,room.height-10),sill:opening.type==='door'?0:opening.sill};
  const width=clamp(opening.width,40,Math.min(240,wallLength-20));
  const height=clamp(opening.height,40,room.height-10);
  return {...opening,width,height,offset:clamp(opening.offset,10,wallLength-width-10),sill:opening.type==='door'?0:clamp(opening.sill,0,room.height-height-5)};
}
export function resizeRoom(design:RoomDesign,patch:Partial<Room>):RoomDesign {
  design=upgradeDesign(design);
  const room={...design.room,...patch};
  room.width=clamp(room.width,120,1000);room.length=clamp(room.length,120,1000);room.height=clamp(room.height,220,400);
  if(!Object.hasOwn(patch,'outline')&&room.outline)room.outline=room.outline.map(v=>({...v,x:Math.round(v.x*room.width/design.room.width*10)/10,z:Math.round(v.z*room.length/design.room.length*10)/10}));
  if(outlineError(room))return design;
  const oldOrigin=roomOutline(design.room)[0],newOrigin=roomOutline(room).find(v=>v.id===oldOrigin.id);
  const dx=(newOrigin?newOrigin.x-oldOrigin.x:0)+(design.room.width-room.width)/2,dz=(newOrigin?newOrigin.z-oldOrigin.z:0)+(design.room.length-room.length)/2;
  const rebase=(wall:string,offset:number,width=0)=>{
    const before=getRoomWall(design.room,wall);if(!before)return {wall,offset};
    const world=wallPoint(before,offset),x=world.x+dx,z=world.z+dz;
    const same=roomWalls(room).filter(w=>w.normal.x===before.normal.x&&w.normal.z===before.normal.z&&Math.abs((x-w.start.x)*w.normal.x+(z-w.start.z)*w.normal.z)<.1);
    const target=same.find(w=>{const n=(x-w.start.x)*w.u.x+(z-w.start.z)*w.u.z;return n>=-.1&&n+width<=w.length+.1;})??getRoomWall(room,wall);
    return target?{wall:target.id,offset:Math.round(((x-target.start.x)*target.u.x+(z-target.start.z)*target.u.z)*1000000)/1000000}:{wall,offset};
  };
  const shapeChanged=Object.hasOwn(patch,'outline');
  if(shapeChanged&&!Object.hasOwn(patch,'openings'))room.openings=room.openings.map(o=>({...o,...rebase(o.wall,o.offset,o.width)}));
  return {...design,room,technicalPoints:design.technicalPoints?.map(p=>p.placement.surface==='wall'?(shapeChanged?{...p,placement:{...p.placement,...rebase(p.placement.wall,p.placement.offset)}}:p):{...p,placement:{...p.placement,x:p.placement.x+dx,z:p.placement.z+dz}}),items:design.items.map(i=>placeItem({...i,x:i.x+(shapeChanged?dx:0),z:i.z+(shapeChanged?dz:0),y:Math.max(0,Math.min(i.y,room.height-i.height))},room))};
}
export function attachToWall(item:Furniture,room:Room,wall:Wall):Furniture {
  const segment=getRoomWall(room,wall);if(!segment)return item;
  const next={...item,rotation:wallRotation(segment)},along=(item.x-segment.start.x)*segment.u.x+(item.z-segment.start.z)*segment.u.z;
  const centre=wallPoint(segment,clamp(along,item.width/2,Math.max(item.width/2,segment.length-item.width/2)),item.depth/2);
  next.x=centre.x;next.z=centre.z;
  return placeItem(next,room);
}
function intersects(a:ReturnType<typeof boundsOf>,b:ReturnType<typeof boundsOf>,tolerance=.5){
  return a.left<b.right-tolerance&&a.right>b.left+tolerance&&a.back<b.front-tolerance&&a.front>b.back+tolerance&&a.bottom<b.top-tolerance&&a.top>b.bottom+tolerance;
}
export function openingBounds(o:Opening,r:Room){
  const w=getRoomWall(r,o.wall);if(!w)return {left:0,right:0,back:0,front:0,bottom:0,top:0};
  const a=wallPoint(w,o.offset),b=wallPoint(w,o.offset+o.width,o.type==='door'?Math.min(o.width,100):8);
  return {left:Math.min(a.x,b.x),right:Math.max(a.x,b.x),back:Math.min(a.z,b.z),front:Math.max(a.z,b.z),bottom:o.sill,top:o.sill+o.height};
}
export function issuesFor(design:RoomDesign):Issue[]{
  const {room,items}=design,issues:Issue[]=[];
  for(const [index,o] of room.openings.entries()){
    const wall=getRoomWall(room,o.wall);
    if(!wall||o.offset<0||o.offset+o.width>wall.length+.1||o.sill+o.height>room.height+.1)issues.push({id:'opening-outside-'+o.id,itemIds:[],openingIds:[o.id],kind:'opening',severity:'problem',text:`${o.type==='door'?'Dveře':'Okno'} ${index+1}: otvor přesahuje stěnu nebo jeho stěna už neexistuje.`});
    for(const other of room.openings.slice(index+1))if(o.wall===other.wall&&o.offset<other.offset+other.width&&o.offset+o.width>other.offset&&o.sill<other.sill+other.height&&o.sill+o.height>other.sill)issues.push({id:'opening-overlap-'+o.id+'-'+other.id,itemIds:[],openingIds:[o.id,other.id],kind:'opening',severity:'problem',text:'Dva stavební otvory se překrývají. Upravte jejich polohu nebo rozměry.'});
  }
  for(let i=0;i<items.length;i++){
    const item=items[i],a=boundsOf(item);
    if(!boundsInsideRoom(room,a)||a.top>room.height+.1||a.bottom<0)issues.push({id:'outside-'+item.id,itemIds:[item.id],kind:'outside',severity:'problem',text:`${item.name}: přesahuje skutečný obrys nebo výšku pokoje.`});
    for(let j=i+1;j<items.length;j++)if(intersects(a,boundsOf(items[j])))issues.push({id:item.id+'-'+items[j].id,itemIds:[item.id,items[j].id],kind:'overlap',severity:'problem',text:`${item.name} a ${items[j].name} se překrývají.`});
    for(const opening of room.openings)if(intersects(a,openingBounds(opening,room)))issues.push({id:item.id+'-'+opening.id,itemIds:[item.id],kind:'opening',severity:'warning',text:`${item.name}: ${opening.type==='door'?'blokuje prostor u dveří':'zasahuje do okna'}.`});
  }
  issues.push(...technicalIssues(upgradeDesign(design),boundsOf));
  return issues;
}
export function newFurniture(type:FurnitureType,room:Room,id:string):Furniture {
  return normalizeItem({...newFurnitureConfiguration(type),id,x:0,z:0,y:defaultMountHeight(type),rotation:0,existing:false,...(type==='builtin'?{height:room.height-2}:{})},room);
}
export const defaultMountHeight=(type:FurnitureType)=>({shelf:145,panel:65,mirror:90,vanity:25,tv:20} as Partial<Record<FurnitureType,number>>)[type]||0;
export function newFurnitureConfiguration(type:FurnitureType):FurnitureConfiguration {
  const def=catalog.find(c=>c.type===type)!;
  return normalizeFurniture({type,name:def.name,width:def.width,height:def.height,depth:def.depth,material:'oak',front:'sand',doors:type==='builtin'?'sliding':['wardrobe','shoe','tv'].includes(type)?'hinged':'open',handles:'black',sections:type==='wardrobe'||type==='builtin'?['hanging','shelves']:type==='dresser'?['drawers','drawers']:['shelves'],shelfCount:type==='shoe'?3:type==='vanity'?2:4,construction:'laminate',basins:1,appliances:'stacked',hooks:4});
}
export function findFreePosition(item:Furniture,design:RoomDesign):Furniture|null {
  // Only physical constraints can prevent insertion; incomplete utility data is advisory.
  const room=design.room,obstacles=[...design.items.map(boundsOf),...room.openings.map(o=>openingBounds(o,room))];
  const services=(upgradeDesign(design).technicalPoints??[]).filter(p=>['volume','pipe'].includes(technicalCatalog[p.type].shape)).map(p=>technicalBounds(p,room));
  const fits=(candidate:Furniture)=>{
    const b=boundsOf(candidate);
    return boundsInsideRoom(room,b)&&b.bottom>=0&&b.top<=room.height+.1
      &&!obstacles.some(o=>intersects(b,o))&&!services.some(o=>intersects(b,o,.05));
  };
  const initial=placeItem(item,room);if(fits(initial))return initial;
  for(let z=-room.length/2;z<=room.length/2;z+=20)for(let x=-room.width/2;x<=room.width/2;x+=20){const candidate=placeItem(item,room,x,z);if(fits(candidate))return candidate;}
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
const openingSchema=z.object({id:z.string().min(1).max(80),type:z.enum(['door','window']),wall:z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),offset:z.number().finite().min(-1000).max(1000),width:z.number().finite().min(40).max(240),height:z.number().finite().min(40).max(390),sill:z.number().finite().min(0).max(360)});
const itemSchema=z.object({id:z.string().min(1).max(80),type:z.enum(['wardrobe','builtin','shoe','dresser','bookcase','shelf','bench','panel','mirror','vanity','laundry','desk','tv','bed','custom']),name:z.string().min(1).max(50),width:z.number().finite().min(20).max(500),height:z.number().finite().min(2).max(400),depth:z.number().finite().min(3).max(400),x:z.number().finite().min(-1000).max(1000),z:z.number().finite().min(-1000).max(1000),y:z.number().finite().min(0).max(400),rotation:z.union([z.literal(0),z.literal(90),z.literal(180),z.literal(270)]),material,front:material,doors:z.enum(['hinged','open','sliding']),handles:z.enum(['black','brass']),sections:z.array(z.enum(['hanging','shelves','drawers'])).min(1).max(16),shelfCount:z.number().int().min(1).max(8),construction:z.enum(['laminate','solid']).optional(),existing:z.boolean().optional(),basins:z.union([z.literal(1),z.literal(2),z.literal(3)]).optional(),appliances:z.enum(['stacked','side-by-side']).optional(),hooks:z.number().int().min(1).max(8).optional(),notes:z.string().max(2000).optional()});
export const furnitureConfigurationSchema=itemSchema.omit({id:true,x:true,y:true,z:true,rotation:true,existing:true}).extend({basins:z.union([z.literal(1),z.literal(2)]).optional()}).strict().superRefine((item,ctx)=>{
  const limits=furnitureLimits(item.type);
  if((['width','height','depth'] as const).some(k=>item[k]<limits[k][0]||item[k]>limits[k][1]) ||
    (item.type==='vanity'&&(item.shelfCount>3||(item.basins===2&&item.width<120))) ||
    (item.type==='laundry'&&item.appliances==='side-by-side'&&item.width<140) ||
    (['wardrobe','builtin','shoe','dresser','bookcase','tv'].includes(item.type)&&item.width/item.sections.length<25))
    ctx.addIssue({code:'custom',message:'Neplatné parametry kusu.'});
});
const legacyTechnicalPointSchema=z.object({id:z.string().min(1).max(80),type:z.literal('socket'),name:z.string().min(1).max(80),wall:z.enum(['north','east','south','west']),offset:z.number().finite().min(0).max(1000),elevation:z.number().finite().min(0).max(400),width:z.number().finite().min(6).max(30),height:z.number().finite().min(6).max(30)}).strict();
export const roomDesignSchema=z.object({version:z.union([z.literal(1),z.literal(2),z.literal(3),z.literal(4)]),acknowledgements:z.array(z.object({issueId:z.string().min(1).max(250),fingerprint:z.string().regex(/^[a-f0-9]{16}$/),acknowledgedAt:z.string().datetime(),note:z.string().max(1000)}).strict()).max(300).optional(),technicalPoints:z.array(z.union([technicalPointSchema,legacyTechnicalPointSchema])).max(100).optional(),title:z.string().min(1).max(80).optional(),room:z.object({width:z.number().finite().min(120).max(1000),length:z.number().finite().min(120).max(1000),height:z.number().finite().min(220).max(400),wallColor:z.string().regex(/^#[0-9a-fA-F]{6}$/),floor:z.enum(['oak','light','dark']),openings:z.array(openingSchema).max(40),outline:z.array(z.object({id:z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),x:z.number().finite().min(0).max(1000),z:z.number().finite().min(0).max(1000)}).strict()).min(4).max(32).optional()}),items:z.array(itemSchema).max(30)}).superRefine((d,ctx)=>{
  if(d.version===1 && d.technicalPoints?.length)ctx.addIssue({code:'custom',message:'Technické prvky vyžadují novější formát návrhu.'});
  const points=d.technicalPoints??[];
  const ids=[...d.items,...d.room.openings,...points].map(i=>i.id);
  if(new Set(ids).size!==ids.length)ctx.addIssue({code:'custom',message:'Duplicitní identifikátory návrhu.'});
  if(d.version>=3&&points.some(p=>!('placement' in p)))ctx.addIssue({code:'custom',message:'Verze 3 vyžaduje úplné technické prvky.'});
  if(d.version<3&&points.some(p=>'placement' in p))ctx.addIssue({code:'custom',message:'Nové technické prvky vyžadují verzi 3.'});
  if(d.version<4&&(d.items.some(i=>i.depth>100)||[...d.room.openings.map(o=>o.wall),...points.flatMap(p=>'placement' in p&&p.placement.surface==='wall'?[p.placement.wall]:[])].some(w=>!['north','east','south','west'].includes(w))))ctx.addIssue({code:'custom',message:'Rozšířený půdorys a rozměry vyžadují verzi 4.'});
  const labels=points.flatMap(p=>'label' in p?[p.label]:[]);
  if(new Set(labels).size!==labels.length)ctx.addIssue({code:'custom',message:'Duplicitní označení technických prvků.'});
  for(const point of points) {
    if('placement' in point){
      const p=point.placement;
      if(p.surface!=='wall'&&(Math.abs(p.x+d.room.width/2)>4000||Math.abs(p.z+d.room.length/2)>4000))ctx.addIssue({code:'custom',message:'Poloha technického prvku je mimo podporovaný rozsah měření.'});
      continue;
    }
    const length=point.wall==='north'||point.wall==='south'?d.room.width:d.room.length;
    if(point.offset<point.width/2||point.offset>length-point.width/2||point.elevation<point.height/2||point.elevation>d.room.height-point.height/2)ctx.addIssue({code:'custom',message:'Technický prvek přesahuje stěnu.'});
  }
  if(new Set(d.items.map(i=>i.id)).size!==d.items.length)ctx.addIssue({code:'custom',message:'Duplicitní kusy nábytku.'});
  if(d.version<4&&(d.room.outline||d.acknowledgements||d.items.some(i=>['bed','custom'].includes(i.type))||d.room.openings.length>4||new Set(d.room.openings.map(o=>o.wall)).size!==d.room.openings.length))ctx.addIssue({code:'custom',message:'Nové funkce vyžadují verzi 4.'});
  const shapeError=outlineError(d.room);if(shapeError)ctx.addIssue({code:'custom',message:shapeError});
  if(new Set(d.acknowledgements?.map(a=>a.issueId)).size!==(d.acknowledgements?.length??0))ctx.addIssue({code:'custom',message:'Duplicitní potvrzení upozornění.'});
  if(new Set(d.room.openings.map(o=>o.id)).size!==d.room.openings.length)ctx.addIssue({code:'custom',message:'Duplicitní otvory.'});
  if(d.version<4)d.room.openings.forEach(o=>{const fixed=openingLimits(d.room,o);if(fixed.offset!==o.offset||fixed.width!==o.width||fixed.height!==o.height||fixed.sill!==o.sill)ctx.addIssue({code:'custom',message:'Otvor přesahuje stěnu.'});});
  d.items.filter(i=>!['bed','custom'].includes(i.type)).forEach(i=>{if((!['panel','mirror'].includes(i.type)&&i.depth<15)||i.width/i.sections.length<25||(i.type!=='shelf'&&i.height<30)||(i.type==='shelf'&&i.height>12)||(['wardrobe','builtin'].includes(i.type)&&(i.height<160||i.depth<40)))ctx.addIssue({code:'custom',message:'Neplatné rozměry nábytku.'});});
  d.items.filter(i=>['bench','panel','mirror','vanity','laundry','desk','tv','bed','custom'].includes(i.type)).forEach(i=>{
    const limits=furnitureLimits(i.type);
    if((['width','height','depth'] as const).some(k=>i[k]<limits[k][0]||i[k]>limits[k][1])||(i.type==='vanity'&&(i.shelfCount>3||(i.basins===2&&i.width<120)))||(i.type==='laundry'&&i.appliances==='side-by-side'&&i.width<140))ctx.addIssue({code:'custom',message:'Rozměry neodpovídají zvolenému vybavení.'});
  });
  if(d.version===4)d.items.forEach(i=>{const limit=furnitureLimits(i.type);if((['width','height','depth'] as const).some(k=>i[k]<limit[k][0]||i[k]>limit[k][1]))ctx.addIssue({code:'custom',message:'Rozměry neodpovídají typu nábytku.'});});
}).transform(d=>upgradeDesign(d as RoomDesign));

/** Upgrade legacy data without rounding measured coordinates or mutating the source. */
export function upgradeDesign(design:RoomDesign):RoomDesign {
  const points:TechnicalPoint[]=[];
  for(const value of design.technicalPoints??[]) {
    if('placement' in value){points.push(value);continue;}
    const old=legacyTechnicalPointSchema.parse(value);
    points.push({...newTechnicalPoint('socket',design.room,old.id,points),name:old.name,width:old.width,height:old.height,
      placement:{surface:'wall',wall:old.wall,offset:old.offset,elevation:old.elevation},accuracy:'unknown'});
  }
  return {...design,version:4,technicalPoints:points};
}
export function parseDesign(value:unknown):RoomDesign {
  const wrapped=value && typeof value==='object' && 'format' in value && value.format==='toro-inquiry' && 'design' in value ? value.design : value;
  return roomDesignSchema.parse(wrapped);
}

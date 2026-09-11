import { z } from 'zod';
import { boundsInsideRoom, fitBoundsInRoom, getRoomWall, nearestRoomWall, roomWallName, roomWalls, wallPoint, wallRotation, cardinalWallNames } from './room-geometry';
import type { Furniture, Issue, Room, RoomDesign, Wall } from './room';

export const technicalTypes = ['socket','multiSocket','power','switch','light','coldWater','hotWater','waterValve','drain','gas','gasValve','radiator','towelRail','heatingValve','pipe','vent','hood','hvac','data','tvSocket','distribution','inspection','waterMeter','gasMeter','electricMeter','shaft','chimney','obstacle'] as const;
export type TechnicalType = typeof technicalTypes[number];
export const technicalCategories = [
  {id:'electric',name:'Elektřina'}, {id:'water',name:'Voda'}, {id:'drain',name:'Odpad'},
  {id:'gas',name:'Plyn'}, {id:'heating',name:'Topení'}, {id:'air',name:'Větrání'},
  {id:'data',name:'Data a TV'}, {id:'service',name:'Překážky a servis'},
] as const;
export type TechnicalCategory = typeof technicalCategories[number]['id'];
export type Surface = 'wall'|'floor'|'ceiling'|'space';
type Definition = {name:string;short:string;category:TechnicalCategory;code:string;shape:'point'|'opening'|'volume'|'pipe';surfaces:Surface[];size:[number,number,number];elevation:number;access?:boolean};
export const technicalCatalog:Record<TechnicalType,Definition> = {
  socket:{name:'Zásuvka 230 V',short:'230 V',category:'electric',code:'Z',shape:'point',surfaces:['wall','floor'],size:[8,8,3],elevation:30},
  multiSocket:{name:'Vícezásuvka',short:'Vícezásuvka',category:'electric',code:'MZ',shape:'point',surfaces:['wall','floor'],size:[22,8,3],elevation:30},
  power:{name:'Silový přívod',short:'Silový přívod',category:'electric',code:'EP',shape:'point',surfaces:['wall','floor'],size:[10,10,4],elevation:30},
  switch:{name:'Vypínač',short:'Vypínač',category:'electric',code:'V',shape:'point',surfaces:['wall'],size:[8,8,3],elevation:110},
  light:{name:'Světelný vývod',short:'Světlo',category:'electric',code:'SV',shape:'point',surfaces:['wall','ceiling'],size:[8,8,2],elevation:220},
  coldWater:{name:'Studená voda',short:'Studená voda',category:'water',code:'VS',shape:'point',surfaces:['wall','floor'],size:[5,5,5],elevation:55},
  hotWater:{name:'Teplá voda',short:'Teplá voda',category:'water',code:'VT',shape:'point',surfaces:['wall','floor'],size:[5,5,5],elevation:55},
  waterValve:{name:'Uzávěr vody',short:'Uzávěr vody',category:'water',code:'UV',shape:'point',surfaces:['wall','floor','space'],size:[8,8,8],elevation:55,access:true},
  drain:{name:'Odpadní vývod',short:'Odpad',category:'drain',code:'O',shape:'opening',surfaces:['wall','floor'],size:[5,5,5],elevation:45},
  gas:{name:'Přívod plynu',short:'Plyn',category:'gas',code:'P',shape:'point',surfaces:['wall','floor'],size:[5,5,5],elevation:50},
  gasValve:{name:'Uzávěr plynu',short:'Uzávěr plynu',category:'gas',code:'UP',shape:'point',surfaces:['wall','floor','space'],size:[10,10,10],elevation:100,access:true},
  radiator:{name:'Radiátor',short:'Radiátor',category:'heating',code:'R',shape:'volume',surfaces:['wall','space'],size:[100,60,15],elevation:45,access:true},
  towelRail:{name:'Koupelnový žebřík',short:'Žebřík',category:'heating',code:'TZ',shape:'volume',surfaces:['wall'],size:[50,120,12],elevation:100,access:true},
  heatingValve:{name:'Ventil topení',short:'Ventil topení',category:'heating',code:'UT',shape:'point',surfaces:['wall','space'],size:[8,8,10],elevation:60,access:true},
  pipe:{name:'Viditelné potrubí',short:'Potrubí',category:'heating',code:'TR',shape:'pipe',surfaces:['wall','floor','ceiling','space'],size:[5,120,5],elevation:80},
  vent:{name:'Větrací otvor',short:'Větrání',category:'air',code:'VE',shape:'opening',surfaces:['wall','ceiling'],size:[20,20,2],elevation:220},
  hood:{name:'Vývod digestoře',short:'Digestoř',category:'air',code:'DI',shape:'opening',surfaces:['wall','ceiling'],size:[15,15,3],elevation:220},
  hvac:{name:'Vzduchotechnický otvor',short:'Vzduchotechnika',category:'air',code:'VZT',shape:'opening',surfaces:['wall','ceiling'],size:[30,20,3],elevation:220},
  data:{name:'Datová zásuvka',short:'Data',category:'data',code:'D',shape:'point',surfaces:['wall','floor'],size:[8,8,3],elevation:30},
  tvSocket:{name:'TV / anténní zásuvka',short:'TV',category:'data',code:'TV',shape:'point',surfaces:['wall','floor'],size:[8,8,3],elevation:30},
  distribution:{name:'Rozvaděč',short:'Rozvaděč',category:'service',code:'RO',shape:'volume',surfaces:['wall','space'],size:[50,70,15],elevation:140,access:true},
  inspection:{name:'Revizní otvor',short:'Revize',category:'service',code:'RE',shape:'opening',surfaces:['wall','floor','ceiling'],size:[40,40,2],elevation:60,access:true},
  waterMeter:{name:'Vodoměr',short:'Vodoměr',category:'service',code:'VM',shape:'volume',surfaces:['wall','space'],size:[25,20,15],elevation:60,access:true},
  gasMeter:{name:'Plynoměr',short:'Plynoměr',category:'service',code:'PM',shape:'volume',surfaces:['wall','space'],size:[30,40,25],elevation:100,access:true},
  electricMeter:{name:'Elektroměr',short:'Elektroměr',category:'service',code:'EM',shape:'volume',surfaces:['wall','space'],size:[30,40,15],elevation:150,access:true},
  shaft:{name:'Šachta',short:'Šachta',category:'service',code:'SA',shape:'volume',surfaces:['space'],size:[50,250,50],elevation:125},
  chimney:{name:'Komínové těleso',short:'Komín',category:'service',code:'KO',shape:'volume',surfaces:['space'],size:[60,250,60],elevation:125},
  obstacle:{name:'Jiná pevná překážka',short:'Překážka',category:'service',code:'PR',shape:'volume',surfaces:['wall','floor','ceiling','space'],size:[40,40,40],elevation:20},
};
const coordinate=z.number().finite().min(-5000).max(5000);
const rotation=z.union([z.literal(0),z.literal(90),z.literal(180),z.literal(270)]);
export const placementSchema=z.discriminatedUnion('surface',[
  z.object({surface:z.literal('wall'),wall:z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),offset:coordinate,elevation:coordinate}).strict(),
  z.object({surface:z.literal('floor'),x:coordinate,z:coordinate,rotation}).strict(),
  z.object({surface:z.literal('ceiling'),x:coordinate,z:coordinate,rotation}).strict(),
  z.object({surface:z.literal('space'),x:coordinate,z:coordinate,elevation:coordinate,rotation}).strict(),
]);
const size=z.number().finite().min(.2).max(1000);
export const technicalPointSchema=z.object({
  id:z.string().min(1).max(80),type:z.enum(technicalTypes),label:z.string().regex(/^[A-Z0-9-]{1,20}$/),name:z.string().min(1).max(80),
  placement:placementSchema,width:size,height:size,depth:z.number().finite().min(0).max(1000),
  status:z.enum(['existing','planned']),accuracy:z.enum(['measured','approximate','unknown']),locked:z.boolean(),
  notes:z.string().max(1000),groupId:z.string().min(1).max(80).optional(),linkedItemId:z.string().min(1).max(80).optional(),
  accessDepth:z.number().finite().min(1).max(500).optional(),
}).strict().superRefine((p,ctx)=>{
  if(['volume','pipe'].includes(technicalCatalog[p.type].shape)&&p.depth<.2)ctx.addIssue({code:'custom',message:'Objemový prvek musí mít kladnou hloubku.'});
  if(!technicalCatalog[p.type].surfaces.includes(p.placement.surface))ctx.addIssue({code:'custom',message:'Tento typ prvku nepodporuje zvolené umístění.'});
});
export type TechnicalPoint=z.infer<typeof technicalPointSchema>;
export type TechnicalPlacement=TechnicalPoint['placement'];
export type Bounds={left:number;right:number;back:number;front:number;bottom:number;top:number};
export const surfaceNames:Record<Surface,string>={wall:'Na stěně',floor:'V podlaze',ceiling:'Ve stropu',space:'V prostoru'};
export const accuracyNames={measured:'Zaměřeno',approximate:'Orientační',unknown:'K doplnění'};
export const statusNames={existing:'Stávající',planned:'Navrhovaný'};
export const technicalWallNames:Record<Wall,string>=cardinalWallNames;
export function describeTechnicalPlacement(point:TechnicalPoint,room:Room) {
  const p=point.placement;
  if(p.surface==='wall')return `${roomWallName(room,p.wall)}, střed ${p.offset} cm od ${getRoomWall(room,p.wall)?.u.x?'levého':'zadního'} rohu; výška středu ${p.elevation} cm nad podlahou`;
  return `${surfaceNames[p.surface]}, střed ${Math.round((p.x+room.width/2)*10)/10} cm od levé a ${Math.round((p.z+room.length/2)*10)/10} cm od zadní stěny${p.surface==='space'?`; výška středu ${p.elevation} cm`:''}; otočení ${p.rotation}°`;
}

export function nextTechnicalLabel(type:TechnicalType,points:TechnicalPoint[]) {
  const prefix=technicalCatalog[type].code,used=new Set(points.map(p=>p.label));
  for(let n=1;;n++)if(!used.has(prefix+n))return prefix+n;
}
export function newTechnicalPoint(type:TechnicalType,room:Room,id:string,points:TechnicalPoint[]=[]):TechnicalPoint {
  const def=technicalCatalog[type],surface=def.surfaces[0];
  const placement:TechnicalPlacement=surface==='wall'?{surface,wall:roomWalls(room)[0].id,offset:roomWalls(room)[0].length/2,elevation:def.elevation}
    :surface==='space'?{surface,x:0,z:0,elevation:def.size[1]/2,rotation:0}:{surface,x:0,z:0,rotation:0};
  return {id,type,label:nextTechnicalLabel(type,points),name:def.name,placement,width:def.size[0],height:def.size[1],depth:def.size[2],status:'existing',accuracy:'approximate',locked:false,notes:''};
}
export function nearestWallPoint(room:Room,x:number,z:number):{wall:Wall;offset:number} {
  const {wall,offset}=nearestRoomWall(room,x,z);return {wall,offset};
}
export function technicalPosition(point:TechnicalPoint,room:Room) {
  const p=point.placement;if(p.surface!=='wall')return {x:p.x,z:p.z};
  const wall=getRoomWall(room,p.wall);return wall?wallPoint(wall,p.offset):{x:0,z:0};
}

export function technicalElevation(point:TechnicalPoint,room:Room) {
  const p=point.placement;return p.surface==='floor'?0:p.surface==='ceiling'?room.height:p.elevation;
}
// Local axes: U is width, V is height, N points out of the supporting surface.
export function technicalFrame(point:TechnicalPoint,room:Room) {
  const p=point.placement,position=technicalPosition(point,room);
  let u=[1,0,0],v=[0,1,0],n=[0,0,1];
  if(p.surface==='wall') {
    const wall=getRoomWall(room,p.wall),angle=(wall?wallRotation(wall):0)*Math.PI/180;
    u=[Math.round(Math.cos(angle)),0,-Math.round(Math.sin(angle))];n=[Math.round(Math.sin(angle)),0,Math.round(Math.cos(angle))];
  }else{
    if(p.surface==='floor'){v=[0,0,-1];n=[0,1,0];}
    if(p.surface==='ceiling'){v=[0,0,1];n=[0,-1,0];}
    const c=Math.round(Math.cos(p.rotation*Math.PI/180)),s=Math.round(Math.sin(p.rotation*Math.PI/180));
    const turn=(a:number[])=>[a[0]*c+a[2]*s,a[1],-a[0]*s+a[2]*c];
    u=turn(u);v=turn(v);n=turn(n);
  }
  return {origin:[position.x,technicalElevation(point,room),position.z],u,v,n};
}
export function technicalBounds(point:TechnicalPoint,room:Room,access=false):Bounds {
  const {origin,u,v,n}=technicalFrame(point,room),free=point.placement.surface==='space';
  const end=free?point.depth/2:point.depth,from=access?end:free?-point.depth/2:0,to=access?end+(point.accessDepth??0):end;
  const corners=[];
  for(const a of [-point.width/2,point.width/2])for(const b of [-point.height/2,point.height/2])for(const c of [from,to])corners.push(origin.map((o,i)=>o+u[i]*a+v[i]*b+n[i]*c));
  return {left:Math.min(...corners.map(c=>c[0])),right:Math.max(...corners.map(c=>c[0])),bottom:Math.min(...corners.map(c=>c[1])),top:Math.max(...corners.map(c=>c[1])),back:Math.min(...corners.map(c=>c[2])),front:Math.max(...corners.map(c=>c[2]))};
}
const clamp=(v:number,lo:number,hi:number)=>lo>hi?v:Math.max(lo,Math.min(hi,v));
const round=(n:number)=>Math.round(n*10)/10;
/** Used for an intentional drag only. Import, typed measurements and room resize preserve coordinates. */
export function normalizeTechnicalPoint(point:TechnicalPoint,room:Room):TechnicalPoint {
  const p=point.placement;
  if(p.surface==='wall') {
    const length=getRoomWall(room,p.wall)?.length??room.width;
    return {...point,placement:{...p,offset:clamp(round(p.offset),point.width/2,length-point.width/2),elevation:clamp(round(p.elevation),point.height/2,room.height-point.height/2)}};
  }
  const b=technicalBounds(point,room),dx=clamp(round(p.x),-room.width/2+(p.x-b.left),room.width/2-(b.right-p.x)),dz=clamp(round(p.z),-room.length/2+(p.z-b.back),room.length/2-(b.front-p.z));
  const next={...point,placement:{...p,x:dx,z:dz}},shift=fitBoundsInRoom(room,technicalBounds(next,room));
  return {...next,placement:{...next.placement,x:dx+shift.x,z:dz+shift.z}};
}
export function moveTechnicalPoint(point:TechnicalPoint,room:Room,x:number,z:number,snap=false):TechnicalPoint {
  if(point.locked)return point;
  const p=point.placement,grid=(v:number)=>snap?Math.round(v/5)*5:v;
  const next:TechnicalPlacement=p.surface==='wall'?{...p,...nearestWallPoint(room,x,z)}:{...p,x:grid(x),z:grid(z)};
  if(next.surface==='wall')next.offset=grid(next.offset);
  // Horizontal gestures preserve a measured height, even if the room became too short.
  const normalized=normalizeTechnicalPoint({...point,placement:next},room);
  if(p.surface==='wall'&&normalized.placement.surface==='wall')normalized.placement.elevation=p.elevation;
  return normalized;
}
export function changeTechnicalSurface(point:TechnicalPoint,surface:Surface,room:Room):TechnicalPoint {
  if(point.locked||!technicalCatalog[point.type].surfaces.includes(surface))return point;
  const pos=technicalPosition(point,room),elevation=technicalElevation(point,room);
  const placement:TechnicalPlacement=surface==='wall'?{surface,...nearestWallPoint(room,pos.x,pos.z),elevation:technicalCatalog[point.type].elevation}
    :surface==='space'?{surface,...pos,elevation:Math.max(point.height/2,elevation),rotation:0}:{surface,...pos,rotation:0};
  return normalizeTechnicalPoint({...point,placement},room);
}
export const technicalBundles={
  sink:{name:'Přípojky pro umyvadlo',types:['coldWater','hotWater','drain']},
  laundry:{name:'Přípojky pro pračku',types:['coldWater','drain','socket']},
} as const;
export type TechnicalBundle=keyof typeof technicalBundles;
export function createTechnicalBundle(kind:TechnicalBundle,design:RoomDesign,id:()=>string,linkedItemId?:string):TechnicalPoint[] {
  const groupId=id(),points:TechnicalPoint[]=[],item=design.items.find(i=>i.id===linkedItemId);
  const first=roomWalls(design.room)[0],centre=item?nearestWallPoint(design.room,item.x,item.z):{wall:first.id,offset:first.length/2};
  for(const [index,type] of technicalBundles[kind].types.entries()) {
    const point=newTechnicalPoint(type,design.room,id(),[...(design.technicalPoints??[]),...points]);
    points.push({...point,groupId,linkedItemId,placement:{surface:'wall',...centre,offset:centre.offset+(index-1)*15,elevation:technicalCatalog[type].elevation},notes:'Orientační sestava přípojek; polohy a rozměry přeměřte.'});
  }
  return points;
}
function overlaps(a:Bounds,b:Bounds,t=.05) {return a.left<b.right-t&&a.right>b.left+t&&a.back<b.front-t&&a.front>b.back+t&&a.bottom<b.top-t&&a.top>b.bottom+t;}
function outside(b:Bounds,r:Room){return !boundsInsideRoom(r,b)||b.bottom<-.1||b.top>r.height+.1;}
function distance(a:Bounds,b:Bounds) {return Math.hypot(Math.max(0,a.left-b.right,b.left-a.right),Math.max(0,a.bottom-b.top,b.bottom-a.top),Math.max(0,a.back-b.front,b.back-a.front));}
export function compatibleTechnicalLink(type:TechnicalType,item:Furniture) {
  if(item.type==='vanity')return ['coldWater','hotWater','drain','waterValve'].includes(type);
  if(item.type==='laundry')return ['coldWater','drain','waterValve','socket','multiSocket','power'].includes(type);
  if(item.type==='tv'||item.type==='desk')return ['socket','multiSocket','data','tvSocket'].includes(type);
  return false;
}
export function technicalIssues(design:RoomDesign,itemBounds:(item:Furniture)=>Bounds):Issue[] {
  const issues:Issue[]=[],points=design.technicalPoints??[],room=design.room;
  const physicalBounds=new Map(points.map(p=>[p.id,technicalBounds(p,room)]));
  const accessBounds=new Map(points.filter(p=>p.accessDepth).map(p=>[p.id,technicalBounds(p,room,true)]));
  const furnitureBounds=new Map(design.items.map(item=>[item.id,itemBounds(item)]));
  const add=(p:TechnicalPoint,suffix:string,severity:Issue['severity'],text:string,itemIds:string[]=[],blocksPlacement=false)=>issues.push({id:`technical-${p.id}-${suffix}`,kind:'technical',severity,text:`${p.label} · ${p.name}: ${text}`,technicalPointIds:[p.id],itemIds,blocksPlacement});
  for(const p of points){
    const def=technicalCatalog[p.type],bounds=physicalBounds.get(p.id)!,linked=design.items.find(i=>i.id===p.linkedItemId);
    if(p.placement.surface==='wall'){const w=getRoomWall(room,p.placement.wall);if(!w||p.placement.offset-p.width/2<-.1||p.placement.offset+p.width/2>w.length+.1)add(p,'wall','problem','neleží celý na zvolené stěně. Zkontrolujte polohu po změně půdorysu.');}
    if(outside(bounds,room))add(p,'outside','problem','přesahuje místnost. Zadaná poloha zůstala zachovaná.');
    if(p.accuracy!=='measured')add(p,'measurement','info',p.accuracy==='unknown'?'poloha nebo rozměry čekají na doplnění.':'poloha a rozměry jsou orientační; přeměřte je.');
    if(def.access&&!p.accessDepth)add(p,'access-unknown','info','prostor pro přístup není zadaný; jeho dostatek nelze posoudit.');
    if(p.linkedItemId&&!linked)add(p,'orphan','warning','přiřazený kus už v návrhu není. Přiřaďte přípojku znovu.');
    if(linked&&!compatibleTechnicalLink(p.type,linked))add(p,'incompatible','warning',`ověřte účel přiřazení ke kusu „${linked.name}“.`,[linked.id]);
    if(linked&&compatibleTechnicalLink(p.type,linked)){
      const gap=distance(bounds,furnitureBounds.get(linked.id)!);
      add(p,'connection','info',gap>.1?`od přiřazeného kusu „${linked.name}“ je geometrická vzdálenost ${round(gap)} cm. Trasu a připojení je třeba ověřit.`:`přiřazeno ke kusu „${linked.name}“. Ověřte výřez, místo pro rozvody a přístup.`,[linked.id]);
    }
    for(const item of design.items){
      const b=furnitureBounds.get(item.id)!,physical=overlaps(p.depth===0?technicalBounds({...p,depth:.1},room):bounds,b),assigned=item.id===p.linkedItemId&&compatibleTechnicalLink(p.type,item);
      if(physical&&(def.shape==='volume'||def.shape==='pipe'))add(p,`solid-${item.id}`,'problem',`fyzicky se překrývá s nábytkem „${item.name}“.`,[item.id],true);
      else if(physical&&!assigned)add(p,`cover-${item.id}`,'warning',`nábytek „${item.name}“ může zakrývat tento prvek.`,[item.id]);
      const access=accessBounds.get(p.id);
      if(access&&overlaps(access,b))add(p,`access-${item.id}`,'warning',`nábytek „${item.name}“ zasahuje do zadaného prostoru pro přístup (${p.accessDepth} cm).`,[item.id]);
      else if(!physical&&!p.accessDepth&&['socket','multiSocket','power','switch','data','tvSocket'].includes(p.type)&&overlaps(technicalBounds({...p,accessDepth:12},room,true),b)&&!assigned)add(p,`near-${item.id}`,'warning',`nábytek „${item.name}“ může omezovat přístup. Jde o orientační kontrolu blízkosti.`,[item.id]);
    }
    const anchor=p.placement;
    if(anchor.surface==='wall')for(const o of room.openings){
      if(o.wall===anchor.wall&&anchor.offset+p.width/2>o.offset&&anchor.offset-p.width/2<o.offset+o.width&&anchor.elevation+p.height/2>o.sill&&anchor.elevation-p.height/2<o.sill+o.height)add(p,`opening-${o.id}`,'problem',`zasahuje do ${o.type==='door'?'dveří':'okna'}.`);
    }
  }
  // Volumetric obstacles also constrain access to other technical elements.
  for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
    const a=points[i],b=points[j],ab=physicalBounds.get(a.id)!,bb=physicalBounds.get(b.id)!;
    const solid=(p:TechnicalPoint)=>['volume','pipe'].includes(technicalCatalog[p.type].shape);
    if(overlaps(ab,bb)&&(solid(a)||solid(b)))issues.push({id:`technical-pair-${a.id}-${b.id}`,kind:'technical',severity:'problem',text:`${a.label} · ${a.name} a ${b.label} · ${b.name}: překrývá se fyzický prostor prvků.`,itemIds:[],technicalPointIds:[a.id,b.id]});
    for(const [target,obstacle] of [[a,b],[b,a]])if(target.accessDepth&&solid(obstacle)&&overlaps(accessBounds.get(target.id)!,physicalBounds.get(obstacle.id)!))issues.push({id:`technical-access-pair-${target.id}-${obstacle.id}`,kind:'technical',severity:'warning',text:`${obstacle.label} · ${obstacle.name} zasahuje do zadaného prostoru pro přístup k ${target.label} · ${target.name}.`,itemIds:[],technicalPointIds:[target.id,obstacle.id]});
  }
  for(const item of design.items){
    const required:TechnicalType[]=item.type==='vanity'?['coldWater','hotWater','drain']:item.type==='laundry'?['coldWater','drain','socket']:[];
    const missing=required.filter(type=>!points.some(p=>p.linkedItemId===item.id&&(p.type===type||(type==='socket'&&p.type==='multiSocket'))));
    if(missing.length)issues.push({id:`connection-missing-${item.id}`,kind:'connection',severity:'info',text:`${item.name}: nejsou zadané nebo přiřazené přípojky (${missing.map(t=>technicalCatalog[t].short).join(', ')}).`,itemIds:[item.id]});
  }
  return issues;
}

/** Shared orthogonal room geometry, in centimetres. No rendering dependencies. */
export type RoomVertex = {id:string;x:number;z:number};
export type RoomGeometry = {width:number;length:number;height:number;outline?:RoomVertex[]};
export type WallSegment = {id:string;name:string;start:{x:number;z:number};end:{x:number;z:number};length:number;u:{x:number;z:number};normal:{x:number;z:number}};
export type PlanBounds={left:number;right:number;back:number;front:number};
export const cardinalWallNames:Record<string,string>={north:'Zadní stěna',east:'Pravá stěna',south:'Přední stěna',west:'Levá stěna'};
export function roomOutline(room:RoomGeometry):RoomVertex[] {
  return room.outline??[{id:'north',x:0,z:0},{id:'east',x:room.width,z:0},{id:'south',x:room.width,z:room.length},{id:'west',x:0,z:room.length}];
}
export function outlineArea(points:RoomVertex[]) {return points.reduce((a,p,i)=>{const q=points[(i+1)%points.length];return a+p.x*q.z-q.x*p.z;},0)/2;}
export function outlineError(room:RoomGeometry):string|null {
  const p=roomOutline(room);
  if(p.length<4||p.length>32)return 'Půdorys musí mít 4 až 32 rohů.';
  if(new Set(p.map(v=>v.id)).size!==p.length)return 'Stěny musí mít různá označení.';
  if(p.some(v=>!Number.isFinite(v.x)||!Number.isFinite(v.z)||v.x<0||v.z<0||v.x>room.width||v.z>room.length))return 'Rohy přesahují rozměry půdorysu.';
  if(Math.min(...p.map(v=>v.x))!==0||Math.min(...p.map(v=>v.z))!==0||Math.max(...p.map(v=>v.x))!==room.width||Math.max(...p.map(v=>v.z))!==room.length)return 'Rozměry musí odpovídat celému půdorysu.';
  const segments=p.map((a,i)=>({a,b:p[(i+1)%p.length]}));
  if(segments.some(({a,b})=>(a.x!==b.x&&a.z!==b.z)||Math.hypot(b.x-a.x,b.z-a.z)<20))return 'Stěny musí být pravoúhlé a dlouhé alespoň 20 cm.';
  if(segments.some(({a,b},i)=>{const c=p[(i+2)%p.length];return (b.x-a.x)*(c.x-b.x)+(b.z-a.z)*(c.z-b.z)<0;}))return 'Stěna se nesmí vracet přes předchozí úsek.';
  if(outlineArea(p)<=0)return 'Obrys musí obcházet místnost po směru hodinových ručiček.';
  for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){
    if(j===i+1||(i===0&&j===p.length-1))continue;
    const a=segments[i],b=segments[j];
    if(Math.max(Math.min(a.a.x,a.b.x),Math.min(b.a.x,b.b.x))<=Math.min(Math.max(a.a.x,a.b.x),Math.max(b.a.x,b.b.x))&&Math.max(Math.min(a.a.z,a.b.z),Math.min(b.a.z,b.b.z))<=Math.min(Math.max(a.a.z,a.b.z),Math.max(b.a.z,b.b.z)))return 'Obrys se nesmí křížit ani dotýkat sám sebe.';
  }
  return null;
}
export function roomWalls(room:RoomGeometry):WallSegment[] {
  const p=roomOutline(room);
  return p.map((a,i)=>{
    const b=p[(i+1)%p.length],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),horizontal=dz===0;
    return {id:a.id,name:cardinalWallNames[a.id]??`Stěna ${i+1}`,length,
      start:{x:Math.min(a.x,b.x)-room.width/2,z:Math.min(a.z,b.z)-room.length/2},
      end:{x:Math.max(a.x,b.x)-room.width/2,z:Math.max(a.z,b.z)-room.length/2},
      u:{x:horizontal?1:0,z:horizontal?0:1},normal:{x:-dz/length,z:dx/length}};
  });
}
export function getRoomWall(room:RoomGeometry,id:string){return roomWalls(room).find(w=>w.id===id);}
export function roomWallName(room:RoomGeometry,id:string){return getRoomWall(room,id)?.name??'Odebraná stěna';}
export function wallPoint(w:WallSegment,offset:number,inset=0){return {x:w.start.x+w.u.x*offset+w.normal.x*inset,z:w.start.z+w.u.z*offset+w.normal.z*inset};}
export function wallRotation(w:WallSegment):0|90|180|270 {return w.normal.z>0?0:w.normal.x>0?90:w.normal.z<0?180:270;}
export function pointInRoom(room:RoomGeometry,x:number,z:number,tolerance=.1){
  const p=roomOutline(room),px=x+room.width/2,pz=z+room.length/2;let inside=false;
  for(let i=0,j=p.length-1;i<p.length;j=i++){
    const a=p[j],b=p[i];
    if(px>=Math.min(a.x,b.x)-tolerance&&px<=Math.max(a.x,b.x)+tolerance&&pz>=Math.min(a.z,b.z)-tolerance&&pz<=Math.max(a.z,b.z)+tolerance&&Math.abs((b.x-a.x)*(pz-a.z)-(b.z-a.z)*(px-a.x))<=tolerance*Math.hypot(b.x-a.x,b.z-a.z))return true;
    if((a.z>pz)!==(b.z>pz)&&px<(b.x-a.x)*(pz-a.z)/(b.z-a.z)+a.x)inside=!inside;
  }
  return inside;
}
export function boundsInsideRoom(room:RoomGeometry,b:PlanBounds,tolerance=.1){
  if(b.left<-room.width/2-tolerance||b.right>room.width/2+tolerance||b.back<-room.length/2-tolerance||b.front>room.length/2+tolerance)return false;
  if(!room.outline)return true;
  if(![b.left,b.right].every(x=>[b.back,b.front].every(z=>pointInRoom(room,x,z,tolerance))))return false;
  // A concave notch may cross a rectangle whose four corners are inside.
  return !roomWalls(room).some(w=>w.u.x===0
    ?w.start.x>b.left+tolerance&&w.start.x<b.right-tolerance&&w.end.z>b.back+tolerance&&w.start.z<b.front-tolerance
    :w.start.z>b.back+tolerance&&w.start.z<b.front-tolerance&&w.end.x>b.left+tolerance&&w.start.x<b.right-tolerance);
}
/** Find the nearest supported translation; leave oversize objects visible for correction. */
export function fitBoundsInRoom(room:RoomGeometry,b:PlanBounds):{x:number;z:number} {
  if(boundsInsideRoom(room,b))return {x:0,z:0};
  const xs=new Set([0]),zs=new Set([0]);
  for(const v of roomOutline(room)) {xs.add(v.x-room.width/2-b.left);xs.add(v.x-room.width/2-b.right);zs.add(v.z-room.length/2-b.back);zs.add(v.z-room.length/2-b.front);}
  let best={x:0,z:0},distance=Infinity;
  for(const x of xs)for(const z of zs){const d=x*x+z*z;if(d>=distance)continue;
    if(boundsInsideRoom(room,{left:b.left+x,right:b.right+x,back:b.back+z,front:b.front+z})){best={x,z};distance=d;}}
  return best;
}
export function nearestRoomWall(room:RoomGeometry,x:number,z:number){
  return roomWalls(room).map(w=>{const offset=Math.max(0,Math.min(w.length,(x-w.start.x)*w.u.x+(z-w.start.z)*w.u.z)),p=wallPoint(w,offset);return {wall:w.id,offset,distance:Math.hypot(x-p.x,z-p.z)};}).sort((a,b)=>a.distance-b.distance)[0];
}
export type RoomShape='rectangle'|'l'|'u';
export function shapeOutline(room:RoomGeometry,shape:RoomShape):RoomVertex[]|undefined {
  const w=room.width,l=room.length,x=Math.round(w*.6),z=Math.round(l*.55);
  if(shape==='rectangle')return undefined;
  if(shape==='l')return [{id:'north',x:0,z:0},{id:'east',x:w,z:0},{id:'return-a',x:w,z},{id:'return-b',x,z},{id:'south',x,z:l},{id:'west',x:0,z:l}];
  const a=Math.round(w*.3),b=Math.round(w*.7);
  return [{id:'north',x:0,z:0},{id:'east',x:w,z:0},{id:'south',x:w,z:l},{id:'return-a',x:b,z:l},{id:'return-b',x:b,z},{id:'return-c',x:a,z},{id:'return-d',x:a,z:l},{id:'west',x:0,z:l}];
}
/** Add a rectangular recess or inward projection; existing edge ids remain stable. */
export function addRoomRecess(room:RoomGeometry,wallId:string,offset:number,width:number,depth:number,outward:boolean,id:()=>string):RoomGeometry {
  const outline=roomOutline(room),w=getRoomWall(room,wallId),index=outline.findIndex(p=>p.id===wallId);
  if(!w||index<0)throw Error('Vyberte existující stěnu.');
  if(width<20||depth<20||offset<20||offset+width>w.length-20)throw Error('Výklenek musí mít alespoň 20 cm a z každé strany musí zbýt alespoň 20 cm stěny.');
  const original=outline[index],next=outline[(index+1)%outline.length],forward=(next.x-original.x)*w.u.x+(next.z-original.z)*w.u.z>0;
  const start=wallPoint(w,forward?offset:offset+width),end=wallPoint(w,forward?offset+width:offset),sign=outward?-1:1;
  const vertex=(p:{x:number;z:number},inset=0):RoomVertex=>({id:id(),x:p.x+room.width/2+w.normal.x*depth*sign*inset,z:p.z+room.length/2+w.normal.z*depth*sign*inset});
  const points=[...outline.slice(0,index+1),vertex(start),vertex(start,1),vertex(end,1),vertex(end),...outline.slice(index+1)];
  const minX=Math.min(...points.map(p=>p.x)),minZ=Math.min(...points.map(p=>p.z)),maxX=Math.max(...points.map(p=>p.x)),maxZ=Math.max(...points.map(p=>p.z));
  const result={...room,width:maxX-minX,length:maxZ-minZ,outline:points.map(p=>({...p,x:p.x-minX,z:p.z-minZ}))};
  if(result.width>1000||result.length>1000)throw Error('Celý půdorys může mít nejvýše 1000 × 1000 cm.');
  const error=outlineError(result);if(error)throw Error(error);return result;
}

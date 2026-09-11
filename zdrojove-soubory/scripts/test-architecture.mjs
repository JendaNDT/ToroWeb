import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
const require=createRequire(path.resolve('.sites-runtime/room-tests/package.json'));
const THREE=require('three'),r=require('./room.js'),g=require('./room-geometry.js'),t=require('./technical.js'),a=require('./issue-acknowledgements.js');
const {buildRoom,buildFurniture}=require('./room-model.js'),{disposeGroup}=require('./wardrobe-model.js'),{buildTechnicalPoint}=require('./technical-model.js');
const {createPlanSvg,planDataUrl}=require('./room-previews.js'),{describeDesign,createInquiryPayload}=require('./toro-inquiry.js');
const {historyReducer}=require('./planner-history.js'),{readRoomDraft,restoreRoomSaving,roomStorageKey}=require('./room-storage.js');
const base=()=>({version:4,title:'Půdorys',room:{width:600,length:500,height:270,wallColor:'#ffffff',floor:'light',openings:[]},items:[],technicalPoints:[]});
const shaped=kind=>{const d=base();d.room.outline=g.shapeOutline(d.room,kind);return d;};
let tests=0,wallCases=0;
function test(name,fn){fn();console.log('PASS '+name);tests++;}
const near=(a,b)=>assert(Math.abs(a-b)<.002,`${a} differs from ${b}`);

test('Rectangle, L and U room interiors reject concave gaps even when all object corners are inside',()=>{
 for(const kind of ['rectangle','l','u']){const d=shaped(kind);assert.equal(g.outlineError(d.room),null);assert(r.roomDesignSchema.safeParse(d).success);assert(g.pointInRoom(d.room,-250,-200));}
 const l=shaped('l');assert(!g.pointInRoom(l.room,250,220));assert(g.pointInRoom(l.room,-100,220));
 const u=shaped('u'),bridge={left:-220,right:220,back:160,front:220};
 assert([bridge.left,bridge.right].every(x=>[bridge.back,bridge.front].every(z=>g.pointInRoom(u.room,x,z))));
 assert(!g.boundsInsideRoom(u.room,bridge));assert.equal(g.outlineArea(g.roomOutline(base().room)),300000);
});
test('Invalid polygon data cannot enter saved designs',()=>{
 const d=shaped('u');
 const invalid=[p=>p[1].z=50,p=>p.reverse(),p=>p[1].id=p[0].id,p=>p[1].x=Infinity,p=>p[2].x=0,p=>p[2].z=p[1].z+1];
 for(const edit of invalid){const copy=structuredClone(d);edit(copy.room.outline);assert.throws(()=>r.parseDesign(copy));}
 const legacy={...d,version:3};assert.throws(()=>r.parseDesign(legacy));assert.throws(()=>r.parseDesign({...base(),version:5}));
});
test('Every custom wall shares opening, utility, physical model and inward orientation coordinates',()=>{
 for(const kind of ['l','u']){
  const d=shaped(kind);
  for(const wall of g.roomWalls(d.room)){
   const p={...t.newTechnicalPoint('socket',d.room,'socket'),placement:{surface:'wall',wall:wall.id,offset:wall.length/2,elevation:80},accuracy:'measured'};
   const expected=g.wallPoint(wall,wall.length/2),actual=t.technicalPosition(p,d.room);assert.deepEqual(actual,expected);
   const mesh=buildTechnicalPoint(p,d.room);mesh.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(mesh),envelope=t.technicalBounds(p,d.room);
   assert(b.min.x*100>=envelope.left-.002&&b.max.x*100<=envelope.right+.002);assert(b.min.z*100>=envelope.back-.002&&b.max.z*100<=envelope.front+.002);disposeGroup(mesh);
   const o={id:'opening',type:'window',wall:wall.id,offset:20,width:40,height:80,sill:100};const bounds=r.openingBounds(o,d.room),q=g.wallPoint(wall,40,4);
   near((bounds.left+bounds.right)/2,q.x);near((bounds.back+bounds.front)/2,q.z);
   const attached=r.attachToWall(r.newFurniture('shelf',d.room,'shelf'),d.room,wall.id);assert.equal(attached.rotation,g.wallRotation(wall));
   wallCases++;
  }
 }
});
test('Several doors and windows cut real wall holes without losing stacked or overlapping geometry',()=>{
 for(const wall of ['north','east','south','west']){
  const d=base();d.room.openings=[{id:'d',type:'door',wall,offset:30,width:80,height:210,sill:0},{id:'w1',type:'window',wall,offset:160,width:90,height:60,sill:80},{id:'w2',type:'window',wall,offset:160,width:90,height:60,sill:160}];
  assert.deepEqual(r.parseDesign(JSON.parse(JSON.stringify(d))),d);
  const shell=buildRoom(d.room,null),group=shell.walls[wall];
  const solids=group.children.filter(o=>o.userData.wallSolid);let area=0;
  for(const mesh of solids){const p=mesh.geometry.parameters;area+=p.width*p.height;const x=(mesh.position.x+g.getRoomWall(d.room,wall).length/200)*100,y=mesh.position.y*100;assert(!d.room.openings.some(o=>x>o.offset&&x<o.offset+o.width&&y>o.sill&&y<o.sill+o.height));}
  near(area,g.getRoomWall(d.room,wall).length*d.room.height/10000-(80*210+2*90*60)/10000);
  assert.equal(group.children.filter(o=>o.userData.openingId).length,3);disposeGroup(shell.group);
 }
 const d=base();d.room.openings=[{id:'a',type:'window',wall:'north',offset:20,width:100,height:100,sill:100},{id:'b',type:'window',wall:'north',offset:70,width:100,height:100,sill:150}];
 assert(r.issuesFor(d).some(i=>i.id.startsWith('opening-overlap-')));assert(r.roomDesignSchema.safeParse(d).success);
});
test('Floor triangulation covers exactly the polygon area and leaves L/U notches open',()=>{
 for(const kind of ['l','u']){const d=shaped(kind),shell=buildRoom(d.room,null),floor=shell.group.children.find(o=>o.userData.roomFloor);floor.updateMatrixWorld(true);
  const position=floor.geometry.attributes.position,v=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];let area=0;
  for(let i=0;i<position.count;i+=3){v.forEach((p,j)=>p.fromBufferAttribute(position,i+j).applyMatrix4(floor.matrixWorld));if(v.every(p=>Math.abs(p.y)<.00001)){
    area+=Math.abs((v[1].x-v[0].x)*(v[2].z-v[0].z)-(v[2].x-v[0].x)*(v[1].z-v[0].z))/2;
    assert(g.pointInRoom(d.room,(v[0].x+v[1].x+v[2].x)*100/3,(v[0].z+v[1].z+v[2].z)*100/3));
  }}near(area,g.outlineArea(d.room.outline)/10000);disposeGroup(shell.group);
 }
});
test('Furniture and floor utilities stay in the actual room when dragged into a concave cutout',()=>{
 for(const kind of ['l','u']){const d=shaped(kind),item=r.newFurniture('custom',d.room,'custom');
  for(let x=-300;x<=300;x+=75)for(let z=-250;z<=250;z+=75){const placed=r.placeItem(item,d.room,x,z);assert(g.boundsInsideRoom(d.room,r.boundsOf(placed)),`${kind}: ${x},${z}`);}
  const point=t.changeTechnicalSurface(t.newTechnicalPoint('obstacle',d.room,'p'),'floor',d.room),moved=t.moveTechnicalPoint(point,d.room,260,200);assert(g.boundsInsideRoom(d.room,t.technicalBounds(moved,d.room)));
  const free=r.findFreePosition(item,d);assert(free);assert(g.boundsInsideRoom(d.room,r.boundsOf(free)));
 }
});
test('Recesses preserve physical locations, create usable inner walls and reject self-intersections',()=>{
 for(const wall of ['north','east','south','west'])for(const outward of [true,false]){
  const d=base(),oldWall=g.getRoomWall(d.room,wall);
  d.technicalPoints=[{...t.newTechnicalPoint('coldWater',d.room,'p'),placement:{surface:'wall',wall,offset:oldWall.length-40.123456,elevation:61.3}}];
  let n=0;const next=g.addRoomRecess(d.room,wall,100,100,60,outward,()=>`edge-${++n}`);
  assert.equal(g.outlineError(next),null);assert.equal(g.roomWalls(next).length,8);
  const changed=r.resizeRoom(d,{width:next.width,length:next.length,outline:next.outline});assert.equal(changed.technicalPoints[0].placement.elevation,61.3);
  const before=t.technicalPosition(d.technicalPoints[0],d.room),after=t.technicalPosition(changed.technicalPoints[0],changed.room);near(after.x+changed.room.width/2,before.x+d.room.width/2+(outward&&wall==='west'?60:0));near(after.z+changed.room.length/2,before.z+d.room.length/2+(outward&&wall==='north'?60:0));
  assert(r.roomDesignSchema.safeParse(changed).success);assert(!r.issuesFor(changed).some(i=>i.id==='technical-p-wall'));
  const area=g.outlineArea(next.outline);near(area,300000+(outward?1:-1)*6000);
  assert.throws(()=>g.addRoomRecess(d.room,wall,10,100,60,outward,()=>`invalid-${++n}`));
 }
});
test('Shrinking a room preserves opening measurements and exports unresolved boundary issues',()=>{
 const d=base();d.room.openings=[{id:'w',type:'window',wall:'north',offset:450.25,width:100,height:120,sill:100}];
 const smaller=r.resizeRoom(d,{width:300});assert.deepEqual(smaller.room.openings,d.room.openings);assert(r.issuesFor(smaller).some(i=>i.openingIds?.includes('w')));assert.deepEqual(r.parseDesign(JSON.parse(JSON.stringify(smaller))),smaller);
 const beforeStart=structuredClone(d);beforeStart.room.openings[0].offset=-20;
 assert.deepEqual(r.parseDesign(JSON.parse(JSON.stringify(beforeStart))),beforeStart);assert(r.issuesFor(beforeStart).some(i=>i.openingIds?.includes('w')));assert.throws(()=>r.parseDesign({...beforeStart,version:3}));
});
test('Beds and custom pieces retain dimensions, materials and custom briefs through history and export',()=>{
 for(const type of ['bed','custom']){const d=base(),item=r.newFurniture(type,d.room,type);d.items=[{...item,notes:'Čelo a úložný prostor podle fotografie.'}];assert.deepEqual(r.parseDesign(d),d);assert(describeDesign(d).includes('podle fotografie'));
  const mesh=buildFurniture(item,null,true);mesh.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(mesh);assert(bounds.max.y*100<=item.height+.002);assert(bounds.max.z*100<=item.z+item.depth/2+.002);disposeGroup(mesh);
 }
});
test('Acknowledgements survive save and undo but cannot conceal a changed or unresolved problem',()=>{
 const d=base();d.items=[r.newFurniture('bookcase',d.room,'a'),r.newFurniture('bookcase',d.room,'b')];const issue=r.issuesFor(d)[0];assert(issue);
 const approved=a.acknowledgeIssue(d,issue,'Prověřit při zaměření','2026-09-11T20:00:00.000Z');assert(a.currentAcknowledgement(approved,issue));assert(r.issuesFor(approved).some(i=>i.severity==='problem'));
 assert.deepEqual(r.parseDesign(JSON.parse(JSON.stringify(approved))),approved);assert(a.currentAcknowledgement(r.parseDesign(JSON.parse(JSON.stringify(approved))),issue));assert(describeDesign(approved).includes('Zákazník vzal na vědomí'));
 const changed={...approved,items:approved.items.map((i,n)=>n?{...i,x:5}:i)};assert(!a.currentAcknowledgement(changed,r.issuesFor(changed)[0]));
 const h=historyReducer({past:[],present:approved,future:[]},{type:'change',update:()=>changed});assert(a.currentAcknowledgement(historyReducer(h,{type:'undo'}).present,issue));
 assert(!a.currentAcknowledgement(a.revokeAcknowledgement(approved,issue.id),issue));
 const duplicate={...approved,acknowledgements:[...approved.acknowledgements,...approved.acknowledgements]};assert.throws(()=>r.parseDesign(duplicate));
});
test('Version 3 browser drafts migrate while preserving legacy storage and measured decimals',()=>{
 const legacy={...base(),version:3};legacy.technicalPoints=[{...t.newTechnicalPoint('socket',legacy.room,'socket'),placement:{surface:'wall',wall:'north',offset:123.456789,elevation:51.3}}];
 const raw=JSON.stringify(legacy),values=new Map([['toro-room-v3',raw]]),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 const migrated=readRoomDraft(storage);assert.equal(migrated.version,4);assert.equal(migrated.technicalPoints[0].placement.offset,123.456789);restoreRoomSaving(storage,migrated);assert.equal(values.get('toro-room-v3'),raw);assert.equal(roomStorageKey,'toro-room-v4');
 values.set(roomStorageKey,'{broken');assert.throws(()=>readRoomDraft(storage));
});
test('Inquiry carries both complete views, room geometry and explicit current acknowledgements',()=>{
 const d=shaped('l');d.title='<script>alert(1)</script>';d.items=[r.newFurniture('custom',d.room,'a'),r.newFurniture('custom',d.room,'b')];d.technicalPoints=[t.newTechnicalPoint('coldWater',d.room,'water')];
 const issue=r.issuesFor(d)[0],approved=a.acknowledgeIssue(d,issue),svg=createPlanSvg(approved);assert(svg.includes('&lt;script&gt;'));assert(!svg.includes('<script>'));assert(svg.includes('VS1'));assert(planDataUrl(d).startsWith('data:image/svg+xml'));
 const payload=createInquiryPayload(approved,{name:'Test',email:'test@example.com',phone:'',city:'Test',assembly:false,timing:'Dle domluvy',notes:'',photos:[],service:false,kind:'',preview:'data:image/png;base64,test',planPreview:planDataUrl(approved),summary:describeDesign(approved)},r.issuesFor(approved).map(i=>i.text));
 assert(payload.previews.plan.includes('svg'));assert.equal(payload.previews.perspective,payload.preview);assert.equal(payload.acknowledgements.length,1);assert.deepEqual(r.parseDesign(JSON.parse(JSON.stringify(payload))),approved);
 assert.deepEqual(payload.business,{mode:'prototype',pricing:null,inquiryRecipient:null,delivery:'download-only'});assert(payload.summary.includes('PROTOTYP'));
});
console.log(`${tests} architecture checks passed; ${wallCases} custom wall variants.`);

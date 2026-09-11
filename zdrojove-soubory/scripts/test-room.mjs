import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

// Compile the pure domain/model modules with the project's existing TypeScript.
// Keep generated CommonJS and test state outside the tracked source tree.
const output=path.resolve('.sites-runtime/room-tests');
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'package.json'),JSON.stringify({type:'commonjs'}));
for(const name of ['configuration','wardrobe-model','room','special-furniture-model','room-model','toro-templates','toro-inquiry']){
  const source=fs.readFileSync(`lib/${name}.ts`,'utf8');
  const result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}});
  fs.writeFileSync(path.join(output,`${name}.js`),result.outputText);
}
const require=createRequire(path.join(output,'package.json'));
const THREE=require('three');
const {initialRoom,catalog,placeItem,footprint,boundsOf,normalizeItem,openingLimits,resizeRoom,attachToWall,issuesFor,newFurniture,findFreePosition,furniturePrice,roomDesignSchema}=require('./room.js');
const {buildFurniture,buildRoom}=require('./room-model.js');
const {disposeGroup}=require('./wardrobe-model.js');
let tests=0;
function test(name,check){check();tests++;console.log(`PASS ${name}`);}
const clone=d=>structuredClone(d);
const fixture=()=>clone(initialRoom);

test('Starting room validates and has no overlaps or blocked openings',()=>{
 assert(roomDesignSchema.safeParse(initialRoom).success);assert.deepEqual(issuesFor(initialRoom),[]);
});
test('Placement clamps to all four walls at every supported rotation',()=>{
 for(const type of catalog.map(c=>c.type))for(const rotation of [0,90,180,270]){
  const r=fixture().room,i={...newFurniture(type,r,'item'),rotation};
  for(const x of [-999,0,999])for(const z of [-999,0,999]){
   const p=placeItem(i,r,x,z),b=boundsOf(p);
   assert(b.left>=-r.width/2-.01&&b.right<=r.width/2+.01);assert(b.back>=-r.length/2-.01&&b.front<=r.length/2+.01);
  }
 }
});
test('Grid snapping and wall snapping use the real rotated footprint',()=>{
 const r=fixture().room,i=newFurniture('shoe',r,'test');
 assert.equal(placeItem(i,r,13,18,true).x,15);assert.equal(placeItem(i,r,13,18,true).z,20);
 const p=placeItem({...i,rotation:90},r,999,999,true),b=boundsOf(p);assert.equal(b.right,r.width/2);assert.equal(b.front,r.length/2);
});
test('Wall attachment orients the front toward the room',()=>{
 const r=fixture().room,i=newFurniture('wardrobe',r,'test');
 for(const [wall,rotation] of Object.entries({north:0,east:270,south:180,west:90})){
  const attached=attachToWall(i,r,wall);assert.equal(attached.rotation,rotation);const b=boundsOf(attached);
  assert.equal(wall==='north'?b.back:wall==='south'?b.front:wall==='west'?b.left:b.right,wall==='north'?-r.length/2:wall==='south'?r.length/2:wall==='west'?-r.width/2:r.width/2);
 }
});
test('Collisions account for furniture height and wall shelves',()=>{
 const d=fixture();d.room.openings=[];const dresser=newFurniture('dresser',d.room,'low');
 const shelf={...newFurniture('shelf',d.room,'high'),x:0,z:0,y:145};d.items=[dresser,shelf];assert.equal(issuesFor(d).length,0);
 d.items[1]={...shelf,y:40};assert(issuesFor(d).some(i=>i.kind==='overlap'));
});
test('A cabinet under a window is allowed; tall furniture blocks it',()=>{
 const d=fixture();d.items=[{...newFurniture('dresser',d.room,'one'),x:110,z:-187.5}];
 assert.equal(issuesFor(d).length,0);d.items[0].height=150;assert(issuesFor(d).some(i=>i.kind==='opening'));
});
test('Door clearance is protected on every wall',()=>{
 for(const wall of ['north','east','south','west']){
  const d=fixture();d.room.openings=[{id:'door',type:'door',wall,width:90,height:210,offset:100,sill:0}];
  let item=attachToWall(newFurniture('shoe',d.room,'shoe'),d.room,wall);
  if(wall==='north'||wall==='south')item.x=-d.room.width/2+145;else item.z=-d.room.length/2+145;
  d.items=[item];assert(issuesFor(d).some(i=>i.kind==='opening'),wall);
 }
});
test('Resizing preserves furniture dimensions and reports oversized pieces',()=>{
 const d=fixture();d.items=[{...newFurniture('builtin',d.room,'large'),width:400}];
 const resized=resizeRoom(d,{width:240,height:230});assert.equal(resized.items[0].width,400);assert(issuesFor(resized).some(i=>i.kind==='outside'));
 resized.room.openings.forEach(o=>assert.deepEqual(o,openingLimits(resized.room,o)));
});
test('Every catalog type finds a valid free spot, unless the room is full',()=>{
 const d=fixture();for(const type of catalog.map(c=>c.type)){
  const i=newFurniture(type,d.room,type),p=findFreePosition(i,d);assert(p,type);
  assert(!issuesFor({...d,items:[...d.items,p]}).some(issue=>issue.itemIds.includes(p.id)));
 }
 const room={...d.room,openings:[]},full={...d,room,items:[{...newFurniture('bookcase',room,'full'),width:room.width,depth:room.length,height:room.height}]};
 assert.equal(findFreePosition(newFurniture('wardrobe',room,'blocked'),full),null);
});
test('Invalid and untrusted saved configurations are rejected',()=>{
 const invalid=[d=>d.items.push({...d.items[0]}),d=>d.room.width=Infinity,d=>d.room.wallColor='url(javascript:alert(1))',d=>d.items[0].rotation=45,d=>d.room.openings[0].offset=999,d=>d.items[0].sections=Array(100).fill('shelves'),d=>d.room.openings[1].wall='north'];
 for(const edit of invalid){const d=fixture();edit(d);assert.equal(roomDesignSchema.safeParse(d).success,false);}
 assert(roomDesignSchema.safeParse(JSON.parse(JSON.stringify(initialRoom))).success);
});
test('Built-in wardrobe can reach even the highest supported ceiling',()=>{
 const room={...fixture().room,height:400};const item=newFurniture('builtin',room,'fitted');
 assert.equal(item.height,398);assert(roomDesignSchema.safeParse({version:1,room,items:[item]}).success);
 const changed=normalizeItem({...item,height:room.height-2},room);assert.equal(changed.height,398);
});
test('Every furniture type builds valid geometry at small and large sizes',()=>{
 let count=0;
 for(const type of catalog.map(c=>c.type))for(const size of ['small','normal','large'])for(const front of [false,true]){
  const r=fixture().room;let i=newFurniture(type,r,type);
  if(size!=='normal')i=normalizeItem({...i,width:size==='small'?30:400,height:type==='shelf'?(size==='small'?2:12):(size==='small'?30:300),depth:size==='small'?15:100},r);
  const group=buildFurniture(i,null,front);group.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(group),extent=bounds.getSize(new THREE.Vector3());
  assert(Math.abs(extent.x-i.width/100)<1e-5,`${type} width`);assert(Math.abs(extent.y-i.height/100)<1e-5,`${type} height`);
  group.traverse(o=>{if(o instanceof THREE.Mesh){const {width,height,depth}=o.geometry.parameters;if(width!==undefined)assert(width>0&&height>0&&depth>0,`${type} negative dimensions`);}});
  assert(furniturePrice(i)>0);disposeGroup(group);count++;
 }
 console.log(`  ${count} model variants checked`);
});
test('Each wall has the opening at the same coordinates as the placement rules',()=>{
 for(const wall of ['north','east','south','west']){
  const room={...fixture().room,openings:[{id:'test',type:'window',wall,width:120,height:100,offset:90,sill:100}]};
  const shell=buildRoom(room,null);shell.group.updateMatrixWorld(true);
  const vertical=wall==='west'||wall==='east',along=-(vertical?room.length:room.width)/200+1.2;
  const origin=new THREE.Vector3(vertical?0:along,1.4,vertical?along:0);
  const direction=new THREE.Vector3(wall==='west'?-1:wall==='east'?1:0,0,wall==='north'?-1:wall==='south'?1:0);
  const ray=new THREE.Raycaster(origin,direction),hit=ray.intersectObjects(shell.walls[wall].children,true)[0];
  assert(hit,wall);assert.equal(hit.object.material.color.getHexString(),'d2e5e5',`${wall} should hit window glass, not solid wall`);
  disposeGroup(shell.group);
 }
});
const {templates,createTemplate}=require('./toro-templates.js');
const {placeInDesign}=require('./room.js');
const {describeDesign}=require('./toro-inquiry.js');
test('TORO templates validate, stay collision-free, and retain new fields after round trip',()=>{
 for(const t of templates){const d=createTemplate(t.id);const parsed=roomDesignSchema.safeParse(JSON.parse(JSON.stringify(d)));assert(parsed.success,t.id);assert.deepEqual(issuesFor(d),[],t.id);assert.deepEqual(parsed.data,d);}
});
test('Appliance layout and double sinks enforce usable minimum widths',()=>{
 const room=fixture().room;
 const laundry=normalizeItem({...newFurniture('laundry',room,'l'),appliances:'side-by-side'},room);assert.equal(laundry.width,140);
 const vanity=normalizeItem({...newFurniture('vanity',room,'v'),width:65,basins:2},room);assert.equal(vanity.width,120);
 assert(!roomDesignSchema.safeParse({version:1,room,items:[{...laundry,width:75}]}).success);
 assert(!roomDesignSchema.safeParse({version:1,room,items:[{...newFurniture('bookcase',room,'b'),depth:3}]}).success);
 assert.equal(normalizeItem({...vanity,shelfCount:8},room).shelfCount,3);
});
test('Neighbour snapping joins a cabinet row and can be turned off',()=>{
 const room={...fixture().room,openings:[]},left={...newFurniture('tv',room,'left'),width:100,x:0,z:-190,y:0};
 const moving={...left,id:'moving',x:106,z:-184},d={version:1,room,items:[left,moving]};
 const snapped=placeInDesign(moving,d,106,-184,true);assert.equal(snapped.x,100);assert.equal(snapped.z,-190);
 assert.equal(placeInDesign(moving,d,106,-184,false).x,106);
});
test('Inquiry description distinguishes existing items and names specialised fittings',()=>{
 const d=createTemplate('bath');d.items[1].existing=true;const text=describeDesign(d);assert(text.includes('STÁVAJÍCÍ'));assert(text.includes('Počet umyvadel: 2'));assert(text.includes('Spotřebiče: nad sebou'));
});
console.log(`\n${tests} room-planner checks passed.`);

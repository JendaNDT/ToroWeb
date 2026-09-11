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
for(const name of ['room-geometry','issue-acknowledgements','scene-label','room-previews','technical','configuration','wardrobe-model','room','room-storage','special-furniture-model','room-model','toro-templates','toro-inquiry','toro-prototype','technical-model','planner-history']){
  const source=fs.readFileSync(`lib/${name}.ts`,'utf8');
  const result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}});
  fs.writeFileSync(path.join(output,`${name}.js`),result.outputText);
}
const require=createRequire(path.join(output,'package.json'));
const THREE=require('three');
const {initialRoom,catalog,placeItem,boundsOf,normalizeItem,resizeRoom,attachToWall,issuesFor,newFurniture,findFreePosition,furniturePrice,roomDesignSchema}=require('./room.js');
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
 assert.deepEqual(resized.room.openings,d.room.openings);assert(issuesFor(resized).some(i=>i.id.startsWith('opening-outside-')));assert(roomDesignSchema.safeParse(resized).success);
});
test('Every catalog type finds a valid free spot, unless the room is full',()=>{
 const d=fixture();for(const type of catalog.map(c=>c.type)){
  const i=newFurniture(type,d.room,type),p=findFreePosition(i,d);assert(p,type);
  assert(!issuesFor({...d,items:[...d.items,p]}).some(issue=>issue.itemIds.includes(p.id)&&issue.severity==='problem'));
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
 for(const t of templates){const d=createTemplate(t.id);const parsed=roomDesignSchema.safeParse(JSON.parse(JSON.stringify(d)));assert(parsed.success,t.id);assert.deepEqual(issuesFor(d).filter(i=>i.severity==='problem'),[],t.id);assert.deepEqual(parsed.data,d);}
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


const {parseDesign,upgradeDesign,normalizeTechnicalPoint,technicalPosition,nearestWallPoint}=require('./room.js');
const {historyReducer}=require('./planner-history.js');
const {buildTechnicalPoint}=require('./technical-model.js');
const {newTechnicalPoint}=require('./technical.js');
const legacySocket=(wall='north',offset=100,elevation=30)=>({id:'socket-a',type:'socket',name:'Zásuvka 230 V',wall,offset,elevation,width:8,height:8});
const socket=(wall='north',offset=100,elevation=30)=>({...newTechnicalPoint('socket',fixture().room,'socket-a'),placement:{surface:'wall',wall,offset,elevation},accuracy:'measured'});

test('Old room and inquiry imports migrate without losing furniture or altering the source',()=>{
 const old=fixture(),original=JSON.stringify(old);
 const migrated=parseDesign(old);assert.equal(migrated.version,4);assert.deepEqual(migrated.technicalPoints,[]);
 assert.deepEqual(migrated.items,old.items);assert.equal(JSON.stringify(old),original);
 assert.deepEqual(parseDesign({format:'toro-inquiry',design:old}),migrated);
 assert.throws(()=>parseDesign({format:'toro-inquiry',design:null}));
});
test('Version 4 round trips sockets and rejects future, malformed and ambiguous data',()=>{
 const d={...upgradeDesign(fixture()),technicalPoints:[socket()]};
 assert.deepEqual(parseDesign(JSON.parse(JSON.stringify(d))),d);
 for(const value of [{...d,version:5},{...d,version:2},{...d,version:1},{...d,technicalPoints:[socket(),socket()]},{...d,technicalPoints:[{...socket(),placement:{...socket().placement,offset:NaN}}]},{...d,technicalPoints:[{...socket(),placement:{...socket().placement,elevation:9000}}]},{...d,technicalPoints:[{...socket(),type:'unknown'}]},{...d,technicalPoints:[{...socket(),id:d.items[0].id}]}])assert.throws(()=>parseDesign(value));
});
test('Socket wall position is consistent for four walls and a smaller room',()=>{
 const room={...fixture().room,openings:[]};
 const expected={north:{x:-160,z:-210},south:{x:-160,z:210},west:{x:-260,z:-110},east:{x:260,z:-110}};
 for(const wall of Object.keys(expected)) {
   const point=socket(wall);assert.deepEqual(technicalPosition(point,room),expected[wall]);
   assert.equal(nearestWallPoint(room,expected[wall].x,expected[wall].z).wall,wall);
   const fixed=normalizeTechnicalPoint({...point,placement:{...point.placement,offset:999,elevation:999}},room);
   assert.equal(fixed.placement.offset,(wall==='north'||wall==='south'?520:420)-4);assert.equal(fixed.placement.elevation,266);
 }
 const resized=resizeRoom({...upgradeDesign(fixture()),technicalPoints:[socket('north',500,265)]},{width:240,height:230});
 assert.equal(resized.technicalPoints[0].placement.offset,500);assert.equal(resized.technicalPoints[0].placement.elevation,265);assert(roomDesignSchema.safeParse(resized).success);assert(issuesFor(resized).some(i=>i.id==='technical-socket-a-outside'));
});
test('Socket access warnings use horizontal and vertical overlap on every wall',()=>{
 const room={...fixture().room,openings:[]};
 for(const wall of ['north','south','west','east']) {
   const piece=attachToWall(newFurniture('dresser',room,'dresser'),room,wall);
   const p=socket(wall,wall==='north'||wall==='south'?room.width/2:room.length/2);
   const d={version:3,room,items:[piece],technicalPoints:[p]};
   const issues=issuesFor(d).filter(i=>i.kind==='technical');assert.equal(issues.length,1,wall);
   assert.equal(issues[0].severity,'warning');assert.deepEqual(issues[0].technicalPointIds,[p.id]);
   assert.equal(issuesFor({...d,technicalPoints:[{...p,placement:{...p.placement,elevation:180}}]}).length,0,'socket above dresser '+wall);
   assert.equal(issuesFor({...d,items:[{...piece,x:0,z:0}]}).length,0,'free access '+wall);
 }
});
test('A socket in a window is a problem and can be clear below its sill',()=>{
 const d=upgradeDesign(fixture());d.items=[];
 d.technicalPoints=[socket('north',350,150)];assert(issuesFor(d).some(i=>i.severity==='problem'&&i.technicalPointIds.includes('socket-a')));
 d.technicalPoints[0].placement.elevation=30;assert.equal(issuesFor(d).length,0);
});
test('History restores technical points and invalidates redo after a new change',()=>{
 const d=upgradeDesign(fixture());let h={past:[],present:d,future:[]};
 h=historyReducer(h,{type:'change',update:d=>({...d,technicalPoints:[socket()]})});
 h=historyReducer(h,{type:'undo'});assert.equal(h.present.technicalPoints.length,0);
 h=historyReducer(h,{type:'redo'});assert.equal(h.present.technicalPoints.length,1);
 h=historyReducer(h,{type:'undo'});h=historyReducer(h,{type:'change',update:d=>({...d,title:'Jiný návrh'})});assert.equal(h.future.length,0);
});
test('Socket geometry matches the domain position and fits its measured backplate',()=>{
 const room=fixture().room;
 for(const wall of ['north','south','west','east']) {
   const p=socket(wall),object=buildTechnicalPoint(p,room),position=technicalPosition(p,room);
   assert.deepEqual(object.position.toArray(),[position.x/100,.3,position.z/100]);
   object.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(object),size=box.getSize(new THREE.Vector3());
   assert(Math.abs(size.y-.08)<1e-6);assert(size.x>0&&size.z>0);disposeGroup(object);
 }
});
test('The inquiry includes the same measured socket as the editable design',()=>{
 const d={...upgradeDesign(fixture()),technicalPoints:[socket('west',145,115)]};
 const text=describeDesign(d);assert(text.includes('TECHNICKÉ PRVKY'));assert(text.includes('Zásuvka 230 V'));assert(text.includes('145 cm'));assert(text.includes('115 cm'));
});


test('Full inquiry payload preserves socket, warnings, preview and attachments on JSON export',()=>{
 const {createInquiryPayload}=require('./toro-inquiry.js');
 const d={...upgradeDesign(fixture()),technicalPoints:[socket('west',145,115)]};
 const details={name:'Test',email:'test@example.com',phone:'',city:'Plzeň',assembly:true,timing:'Dle domluvy',notes:'Ponechat přístup',photos:[{name:'test.png',data:'data:image/png;base64,dGVzdA=='}],service:false,kind:'',preview:'data:image/png;base64,bmFobGVk',summary:describeDesign(d)};
 const exported=JSON.parse(JSON.stringify(createInquiryPayload(d,details,['Kontrola přístupu'])));
 assert.deepEqual(parseDesign(exported),d);assert.deepEqual(exported.photos,details.photos);assert.equal(exported.preview,details.preview);assert.deepEqual(exported.warnings,['Kontrola přístupu']);
});
test('Existing version 2 pointer coordinates with extra precision remain readable',()=>{
 const d={...fixture(),version:2,technicalPoints:[legacySocket('west',172.31707318202297,30)]};
 const loaded=parseDesign(d);assert.equal(loaded.technicalPoints[0].placement.offset,172.31707318202297);
});
test('Fractional sockets at every wall edge survive repeated save and reload',()=>{
 const d=upgradeDesign(fixture());
 for(const wall of ['north','east','south','west'])for(const width of [6.1,8.7])for(const height of [8.1,9.7]){
  const length=['north','south'].includes(wall)?d.room.width:d.room.length;
  for(const offset of [width/2,length-width/2])for(const elevation of [height/2,d.room.height-height/2]){
   let saved={...d,technicalPoints:[{...socket(wall,offset,elevation),width,height}]};
   for(let n=0;n<3;n++)saved=parseDesign(JSON.parse(JSON.stringify(saved)));
   assert(roomDesignSchema.safeParse(saved).success);
   assert(Math.abs(saved.technicalPoints[0].placement.offset-offset)<.051);assert(Math.abs(saved.technicalPoints[0].placement.elevation-elevation)<.051);
   assert.deepEqual(parseDesign(JSON.parse(JSON.stringify(saved))),saved);
  }
 }
});
test('Collision envelope contains real geometry in every rotation, size and front variant',()=>{
 const room={...fixture().room,width:1000,length:1000,height:400,openings:[]};let variants=0;
 for(const {type} of catalog)for(const size of ['small','normal','large'])for(const doors of ['open','hinged','sliding'])for(const rotation of [0,90,180,270])for(const visible of [false,true]){
  const original=newFurniture(type,room,type);
  const item={...normalizeItem({...original,...(size==='normal'?{}:{width:size==='small'?30:500,height:size==='small'?2:400,depth:size==='small'?3:100}),doors,sections:['drawers'],rotation},room),x:0,z:0};
  const group=buildFurniture(item,null,visible);group.updateMatrixWorld(true);
  const actual=new THREE.Box3().setFromObject(group),bounds=boundsOf(item),epsilon=.00001;
  for(const [min,max,axis] of [['left','right','x'],['back','front','z'],['bottom','top','y']]){
   assert(actual.min[axis]*100>=bounds[min]-epsilon,`${type}/${size}/${doors}/${rotation}/${visible}: ${min}`);
   assert(actual.max[axis]*100<=bounds[max]+epsilon,`${type}/${size}/${doors}/${rotation}/${visible}: ${max}`);
  }
  // Front visibility is a viewing aid and must never change physical collision bounds.
  for(const wall of ['north','east','south','west']){
   const atWall=placeItem(item,room,wall==='east'?9999:wall==='west'?-9999:0,wall==='south'?9999:wall==='north'?-9999:0);
   assert(!issuesFor({version:2,room,items:[atWall],technicalPoints:[]}).some(i=>i.kind==='outside'));
  }
  disposeGroup(group);variants++;
 }
 console.log(`  ${variants} physical envelope variants checked`);
});
test('Closed fronts collide with a wall and neighbouring furniture beyond the carcass',()=>{
 const room={...fixture().room,openings:[]};
 const cabinet={...newFurniture('builtin',room,'front'),x:0,z:room.length/2-65/2};
 assert(issuesFor({version:2,room,items:[cabinet]}).some(i=>i.kind==='outside'));
 const a={...cabinet,z:0},b={...newFurniture('bookcase',room,'neighbour'),x:0,z:a.depth/2+3+16};
 assert(issuesFor({version:2,room,items:[a,b]}).some(i=>i.kind==='overlap'));
});
test('Storage recovery preserves the previous bytes before saving a valid draft',()=>{
 const {restoreRoomSaving,roomStorageKey}=require('./room-storage.js');
 const data=new Map([[roomStorageKey,'{broken'],['toro-room-v1','old version']]);
 const storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
 const design=upgradeDesign(fixture()),result=restoreRoomSaving(storage,design);
 assert.equal(data.get(result.backupKey),'{broken');assert.deepEqual(parseDesign(JSON.parse(data.get(roomStorageKey))),design);
 assert.equal(data.get('toro-room-v1'),'old version');
 assert.equal(restoreRoomSaving(storage,design).backupKey,null);
});
test('Failed backup or failed main write never destroys the previous draft',()=>{
 const {restoreRoomSaving,roomStorageKey}=require('./room-storage.js');
 for(const failedWrite of ['backup','main']){
  const data=new Map([[roomStorageKey,'{broken']]);
  const storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>{
   if((key===roomStorageKey)===(failedWrite==='main'))throw Error('QuotaExceededError');data.set(key,value);
  }};
  assert.throws(()=>restoreRoomSaving(storage,upgradeDesign(fixture())));
  assert.equal(data.get(roomStorageKey),'{broken');
 }
});
test('Text and JSON inquiry include the same current collision warnings',()=>{
 const {createInquiryPayload}=require('./toro-inquiry.js');
 const d=upgradeDesign(fixture());d.items=[d.items[0],{...d.items[0],id:'overlap'}];
 const issues=issuesFor(d),summary=describeDesign(d,issues);
 assert(issues.length>0);for(const issue of issues)assert(summary.includes(issue.text));
 const payload=createInquiryPayload(d,{summary},issues.map(i=>i.text));
 assert.deepEqual(payload.warnings,issues.map(i=>i.text));assert.equal(payload.summary,summary);
 const empty={...d,items:[],room:{...d.room,openings:[]}};
 assert(describeDesign(empty).includes('Bez zjištěných kolizí podle zadaných údajů.'));
});
console.log(`\n${tests} room-planner checks passed.`);

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
const require=createRequire(path.resolve('.sites-runtime/room-tests/package.json'));
const THREE=require('three');
const t=require('./technical.js'),r=require('./room.js');
const {buildTechnicalPoint,buildTechnicalAccess}=require('./technical-model.js');
const {disposeGroup}=require('./wardrobe-model.js');
const {createTemplate}=require('./toro-templates.js');
const {describeDesign,createInquiryPayload}=require('./toro-inquiry.js');
const {historyReducer}=require('./planner-history.js');
const {roomStorageKey,restoreRoomSaving,readRoomDraft}=require('./room-storage.js');
const room={width:420,length:380,height:270,wallColor:'#ffffff',floor:'light',openings:[]};
const empty=()=>({version:4,room:structuredClone(room),items:[],technicalPoints:[]});
const point=(type,id=type)=>({...t.newTechnicalPoint(type,room,id),accuracy:'measured'});
let count=0,geometryCases=0;
function test(name,fn){fn();count++;console.log(`PASS ${name}`);}
function measuredWall(type,wall='north',offset=210,elevation=70){return {...point(type),placement:{surface:'wall',wall,offset,elevation}};}

test('All 28 technical types validate and preserve every field through export/import',()=>{
 const d=empty();
 for(const type of t.technicalTypes){const p=point(type);p.notes='Změřit podle místa';p.status='planned';p.locked=true;d.technicalPoints.push(p);}
 assert.equal(d.technicalPoints.length,28);
 assert.deepEqual(r.parseDesign(JSON.parse(JSON.stringify(d))),d);
 assert.equal(new Set(d.technicalPoints.map(p=>p.label)).size,28);
});
test('All supported surfaces and rotations render inside the measured physical envelope',()=>{
 for(const type of t.technicalTypes)for(const surface of t.technicalCatalog[type].surfaces)for(const turn of [0,90,180,270])for(const size of [.2,1,2.37]){
  const p=point(type);p.width*=size;p.height*=size;p.depth*=size;
  if(surface==='wall')p.placement={surface,wall:['north','east','south','west'][turn/90],offset:130.25,elevation:90.45};
  else if(surface==='space')p.placement={surface,x:23.7,z:-42.1,elevation:p.height/2,rotation:turn};
  else p.placement={surface,x:23.7,z:-42.1,rotation:turn};
  assert(t.technicalPointSchema.safeParse(p).success,type);
  const object=buildTechnicalPoint(p,room);object.updateMatrixWorld(true);
  const actual=new THREE.Box3().setFromObject(object),expected=t.technicalBounds(p,room),epsilon=.00002;
  for(const [min,max,axis] of [['left','right','x'],['bottom','top','y'],['back','front','z']]){
    assert(Number.isFinite(actual.min[axis])&&Number.isFinite(actual.max[axis]));
    assert(actual.min[axis]>=expected[min]/100-epsilon,`${type} ${surface} ${turn} min ${axis}`);
    assert(actual.max[axis]<=expected[max]/100+epsilon,`${type} ${surface} ${turn} max ${axis}`);
  }
  disposeGroup(object);geometryCases++;
 }
 console.log(`  ${geometryCases} physical technical variants`);
});
test('Access geometry matches its distinct domain bounds on every surface',()=>{
 for(const surface of ['wall','floor','ceiling','space'])for(const rotation of [0,90,180,270]){
  const p={...point('obstacle'),accessDepth:37.5};
  p.placement=surface==='wall'?{surface,wall:['north','east','south','west'][rotation/90],offset:120,elevation:80}:surface==='space'?{surface,x:15,z:30,elevation:75,rotation}:{surface,x:15,z:30,rotation};
  const object=buildTechnicalAccess(p,room);object.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(object),expected=t.technicalBounds(p,room,true);
  for(const [lo,hi,axis] of [['left','right','x'],['bottom','top','y'],['back','front','z']]){assert(Math.abs(b.min[axis]*100-expected[lo])<.001);assert(Math.abs(b.max[axis]*100-expected[hi])<.001);}
  disposeGroup(object);
 }
});
test('Malformed types, duplicate labels, unsupported surfaces and invalid numbers are rejected',()=>{
 const p=point('socket'),d={...empty(),technicalPoints:[p]};
 for(const q of [{...p,type:'unrecognised'},{...p,depth:-1},{...p,placement:{surface:'space',x:0,z:0,elevation:30,rotation:0}},{...p,placement:{surface:'wall',wall:'north',offset:NaN,elevation:30}},{...p,notes:'x'.repeat(1001)},{...p,placement:{surface:'wall',wall:'north',offset:0,elevation:30,extra:true}},{...p,placement:{surface:'floor',x:0,z:0,rotation:45}}])assert.throws(()=>r.parseDesign({...d,technicalPoints:[q]}));
 assert.throws(()=>r.parseDesign({...d,technicalPoints:[p,{...p,id:'other'}]}));
 assert.throws(()=>r.parseDesign({...d,version:99}));
});
test('Legacy v1/v2 migration is lossless and current snapshots preserve out-of-room measurements',()=>{
 const old={...empty(),version:2,technicalPoints:[{id:'legacy',type:'socket',name:'Původní zásuvka',wall:'east',offset:123.456789,elevation:48.7123,width:6.1,height:8.7}]};
 const original=JSON.stringify(old),migrated=r.parseDesign(old);
 assert.equal(migrated.version,4);assert.equal(migrated.technicalPoints[0].placement.offset,123.456789);assert.equal(migrated.technicalPoints[0].placement.elevation,48.7123);assert.equal(migrated.technicalPoints[0].accuracy,'unknown');assert.equal(JSON.stringify(old),original);
 assert.equal(r.parseDesign({...empty(),version:1}).version,4);
 const p={...point('radiator'),placement:{surface:'wall',wall:'north',offset:400,elevation:260},locked:true};
 const d={...empty(),technicalPoints:[p]},smaller=r.resizeRoom(d,{width:220,height:230});
 assert.deepEqual(smaller.technicalPoints,[p]);assert(r.issuesFor(smaller).some(i=>i.id===`technical-${p.id}-outside`));assert.deepEqual(r.parseDesign(JSON.parse(JSON.stringify(smaller))),smaller);
});
test('Room resize rebases floor, ceiling and free objects without changing measured wall distances',()=>{
 for(const surface of ['floor','ceiling','space']){
  const p=t.changeTechnicalSurface(point('obstacle'),surface,room);p.placement.x=37.5;p.placement.z=61.7;p.locked=true;
  const d={...empty(),technicalPoints:[p]},changed=r.resizeRoom(d,{width:240,length:210}),next=changed.technicalPoints[0];
  assert.equal(next.placement.x+changed.room.width/2,p.placement.x+room.width/2);
  assert.equal(next.placement.z+changed.room.length/2,p.placement.z+room.length/2);
  assert.deepEqual(r.parseDesign(JSON.parse(JSON.stringify(changed))),changed);
  const back=r.resizeRoom(changed,{width:room.width,length:room.length});assert(Math.abs(back.technicalPoints[0].placement.x-p.placement.x)<1e-10);assert(Math.abs(back.technicalPoints[0].placement.z-p.placement.z)<1e-10);
 }
});
test('Locked points do not move; floor and wall drags preserve heights and decimal edge positions',()=>{
 for(const surface of ['wall','floor','ceiling','space']){
  let p=t.changeTechnicalSurface(point('obstacle'),surface,room);p.locked=true;
  assert.deepEqual(t.moveTechnicalPoint(p,room,99,101,true),p);
  assert.deepEqual(t.changeTechnicalSurface(p,'wall',room),p);
  p.locked=false;const moved=t.moveTechnicalPoint(p,room,31.32,64.73,false);assert.notDeepEqual(moved.placement,p.placement);
  if(surface==='space')assert.equal(moved.placement.elevation,p.placement.elevation);
  assert(t.technicalPointSchema.safeParse(moved).success);
 }
 const p={...point('coldWater'),width:6.1,placement:{surface:'wall',wall:'north',offset:3.05,elevation:900}};
 const moved=t.moveTechnicalPoint(p,room,-999,-999,true);assert.equal(moved.placement.offset,3.05);assert.equal(moved.placement.elevation,900);
});
test('Physical radiators block furniture while unknown connections never block insertion',()=>{
 const d=empty(),cabinet=r.attachToWall(r.newFurniture('bookcase',room,'shelf'),room,'north');d.items=[cabinet];d.technicalPoints=[measuredWall('radiator')];
 assert(r.issuesFor(d).some(i=>i.severity==='problem'&&i.blocksPlacement&&i.itemIds.includes(cabinet.id)));
 assert(r.findFreePosition(r.newFurniture('vanity',room,'sink'),empty()));
 assert(r.findFreePosition(r.newFurniture('laundry',room,'laundry'),empty()));
 const found=r.findFreePosition(r.newFurniture('bookcase',room,'new'),{...d,items:[]});assert(found);assert(!r.issuesFor({...d,items:[found]}).some(i=>i.blocksPlacement));
});
test('Assigned water in a vanity asks for a cutout; access and unrelated obstruction remain visible',()=>{
 const d=empty(),sink=r.attachToWall(r.newFurniture('vanity',room,'sink'),room,'north');d.items=[sink];
 const supply={...measuredWall('coldWater'),linkedItemId:sink.id};d.technicalPoints=[supply];
 const issues=r.issuesFor(d);assert(issues.some(i=>i.id==='technical-coldWater-connection'));assert(!issues.some(i=>i.id==='technical-coldWater-cover-sink'));
 d.technicalPoints=[{...supply,type:'waterValve',label:'UV1',accessDepth:30}];
 assert(r.issuesFor(d).some(i=>i.id==='technical-coldWater-access-sink'));
 d.technicalPoints=[supply];d.items=[{...sink,id:'other'}];assert(r.issuesFor(d).some(i=>i.id==='technical-coldWater-cover-other'));assert(r.issuesFor(d).some(i=>i.id==='technical-coldWater-orphan'));
});
test('Missing supplies describe missing input, bundle links resolve them, removal restores the prompt',()=>{
 const d=empty(),sink=r.attachToWall(r.newFurniture('vanity',room,'sink'),room,'north');d.items=[sink];
 assert(r.issuesFor(d).some(i=>i.kind==='connection'));
 let sequence=0;d.technicalPoints=t.createTechnicalBundle('sink',d,()=>`bundle-${++sequence}`,sink.id);
 assert.equal(d.technicalPoints.length,3);assert.equal(new Set(d.technicalPoints.map(p=>p.groupId)).size,1);assert.equal(new Set(d.technicalPoints.map(p=>p.id)).size,3);
 assert(!r.issuesFor(d).some(i=>i.kind==='connection'));d.technicalPoints.pop();assert(r.issuesFor(d).some(i=>i.kind==='connection'&&i.text.includes('Odpad')));
 const snapshot=structuredClone(d);t.createTechnicalBundle('laundry',d,()=>`bundle-${++sequence}`);assert.deepEqual(d,snapshot);
});
test('Gas and water valves report unknown access and collisions with other service volumes',()=>{
 const d=empty(),valve=measuredWall('gasValve'),meter={...measuredWall('gasMeter'),placement:{surface:'space',x:0,z:-room.length/2+30,elevation:70,rotation:0}};
 d.technicalPoints=[valve,meter];assert(r.issuesFor(d).some(i=>i.id==='technical-gasValve-access-unknown'));
 d.technicalPoints[0]={...valve,accessDepth:50};assert(r.issuesFor(d).some(i=>i.id==='technical-access-pair-gasValve-gasMeter'));
 d.technicalPoints[1]={...meter,placement:{surface:'wall',wall:'north',offset:210,elevation:70}};assert(r.issuesFor(d).some(i=>i.id.startsWith('technical-pair-')));
});
test('Flush wall and floor openings support zero protrusion but still detect possible covering',()=>{
 for(const surface of ['wall','floor']){
  const d=empty(),p=measuredWall('drain','north',210,70);p.depth=0;
  p.placement=surface==='wall'?p.placement:{surface,x:0,z:0,rotation:0};
  d.items=[surface==='wall'?r.attachToWall(r.newFurniture('bookcase',room,'cabinet'),room,'north'):r.newFurniture('bookcase',room,'cabinet')];d.technicalPoints=[p];
  assert.deepEqual(r.parseDesign(d),d);assert(r.issuesFor(d).some(i=>i.id==='technical-drain-cover-cabinet'));
  const model=buildTechnicalPoint(p,room);model.updateMatrixWorld(true);assert(!new THREE.Box3().setFromObject(model).isEmpty());disposeGroup(model);
 }
 assert(!t.technicalPointSchema.safeParse({...point('radiator'),depth:0}).success);
});
test('A floor drain and a ceiling vent use height when checking furniture',()=>{
 const d=empty(),cabinet={...r.newFurniture('bookcase',room,'cabinet'),x:0,z:0,y:0};d.items=[cabinet];
 d.technicalPoints=[{...point('drain'),placement:{surface:'floor',x:0,z:0,rotation:0}},{...point('vent'),placement:{surface:'ceiling',x:0,z:0,rotation:0}}];
 const issues=r.issuesFor(d);assert(issues.some(i=>i.id==='technical-drain-cover-cabinet'));assert(!issues.some(i=>i.id==='technical-vent-cover-cabinet'));
});
test('Undo/redo restores full technical edits, associations, locks and group membership',()=>{
 const d=empty();let n=0;const group=t.createTechnicalBundle('sink',d,()=>`history-${++n}`);
 let h={past:[],present:d,future:[]};h=historyReducer(h,{type:'change',update:d=>({...d,technicalPoints:group})});
 h=historyReducer(h,{type:'change',update:d=>({...d,technicalPoints:d.technicalPoints.map(p=>({...p,locked:true,accessDepth:45}))})});const result=structuredClone(h.present);
 h=historyReducer(h,{type:'undo'});assert.deepEqual(h.present.technicalPoints,group);h=historyReducer(h,{type:'redo'});assert.deepEqual(h.present,result);
});
test('Legacy storage survives migration and a corrupt current draft does not fall back silently',()=>{
 const legacy=JSON.stringify({...empty(),version:1}),data=new Map([['toro-room-v2',legacy]]),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 const loaded=readRoomDraft(storage);assert.equal(loaded.version,4);restoreRoomSaving(storage,loaded);assert.equal(data.get('toro-room-v2'),legacy);assert.equal(roomStorageKey,'toro-room-v4');
 data.set(roomStorageKey,'{corrupt');assert.throws(()=>readRoomDraft(storage));assert.equal(data.get('toro-room-v2'),legacy);
});
test('Bathroom demonstration has all supplies and heating without hard collisions',()=>{
 const d=createTemplate('bath');assert.equal(d.technicalPoints.length,7);assert(!r.issuesFor(d).some(i=>i.severity==='problem'||i.kind==='connection'));
 const issues=r.issuesFor(d);assert(issues.some(i=>i.text.includes('orientační')));assert(issues.some(i=>i.text.includes('přístup')));
 const text=describeDesign(d);for(const p of d.technicalPoints){assert(text.includes(p.label));assert(text.includes(p.name));assert(text.includes(t.describeTechnicalPlacement(p,d.room)));}
 const payload=createInquiryPayload(d,{summary:text,photos:[],notes:'Test'},issues.map(i=>i.text));assert.deepEqual(r.parseDesign(JSON.parse(JSON.stringify(payload))),d);assert.equal(payload.warnings.length,issues.length);
 fs.mkdirSync('.sites-runtime/technical-tests',{recursive:true});fs.writeFileSync('.sites-runtime/technical-tests/bathroom.json',JSON.stringify(d,null,2));
});
console.log(`\n${count} technical-network checks passed; ${geometryCases} geometry variants.`);

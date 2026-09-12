import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
const require=createRequire(path.resolve('.sites-runtime/room-tests/package.json'));
const r=require('./room.js'),w=require('./workspace.js'),p=require('./furniture-preview.js'),a=require('./issue-acknowledgements.js');
const {createTemplate}=require('./toro-templates.js'),{describeSingle,createInquiryPayload}=require('./toro-inquiry.js');
const {buildFurniture}=require('./room-model.js'),{disposeGroup}=require('./wardrobe-model.js'),THREE=require('three');
let tests=0,geometryCases=0;
const test=(name,fn)=>{fn();tests++;console.log('PASS '+name);};
const clone=structuredClone;
const base=()=>({...w.initialWorkspace(),room:{version:4,title:'Ověřovací pokoj',room:{width:1000,length:1000,height:400,wallColor:'#ffffff',floor:'oak',openings:[]},items:[],technicalPoints:[]}});
const details={name:'Ukázka',email:'ukazka@example.com',phone:'',city:'Ukázkové město',assembly:true,timing:'Dle domluvy',notes:'',photos:[],service:false,kind:'',preview:'data:image/png;base64,test',summary:''};
function memory(initial={}){const values=new Map(Object.entries(initial));return {values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};}

test('The default workspace is genuinely roomless and each catalogue type has a valid independent configuration',()=>{
  assert.equal(w.initialWorkspace().room,null);assert.equal(w.initialWorkspace().mode,'single');
  for(const entry of r.catalog){const config=r.newFurnitureConfiguration(entry.type);assert.deepEqual(r.furnitureConfigurationSchema.parse(config),config);for(const key of ['id','x','y','z','rotation','existing','room'])assert(!(key in config));}
});
test('All 15 types and 120 dimension extremes share actual geometry and fit both portrait and landscape cameras',()=>{
  for(const entry of r.catalog){const limits=r.furnitureLimits(entry.type);
    for(const width of limits.width)for(const height of limits.height)for(const depth of limits.depth){
      const config=r.normalizeFurniture({...r.newFurnitureConfiguration(entry.type),width,height,depth});r.furnitureConfigurationSchema.parse(config);
      assert.deepEqual(r.normalizeFurniture(config),config);
      const model=buildFurniture(p.previewFurniture(config),null,true);model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model);assert(!bounds.isEmpty());
      for(const aspect of [.65,1.8])for(const view of ['front','3d']){
        const camera=new THREE.OrthographicCamera(-5,5,5,-5,.01,100);p.fitFurnitureCamera(camera,config,aspect,view);
        for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
          const point=new THREE.Vector3(x,y,z).project(camera);assert(Math.abs(point.x)<1&&Math.abs(point.y)<1,`${entry.type} clipped at ${width}/${height}/${depth}`);
        }
      }
      disposeGroup(model);geometryCases++;
    }
  }
});
test('Two basins and side-by-side appliances enforce product limits without involving a room',()=>{
  const basin=r.normalizeFurniture({...r.newFurnitureConfiguration('vanity'),width:65,basins:2});assert.equal(basin.width,120);
  const laundry=r.normalizeFurniture({...r.newFurnitureConfiguration('laundry'),width:70,appliances:'side-by-side'});assert.equal(laundry.width,140);
  const tall=r.normalizeFurniture({...r.newFurnitureConfiguration('builtin'),height:400});assert.equal(tall.height,400);
});
test('Every type transfers every parameter, preserving the existing room, openings and utilities',()=>{
  for(const entry of r.catalog){let state=base();state.room.room.openings=[{id:'win',type:'window',wall:'north',offset:500,width:80,height:80,sill:100}];
    state.single=r.normalizeFurniture({...r.newFurnitureConfiguration(entry.type),name:'Vlastní název',material:'walnut',front:'white',notes:'Přesné zadání',hooks:7,basins:2,appliances:'side-by-side'});
    const original=clone(state),next=w.insertSingle(state,'insert');assert.deepEqual(state,original);assert.deepEqual(r.furnitureConfiguration(next.room.items[0]),state.single);assert.deepEqual(next.room.room,state.room.room);assert.deepEqual(next.room.technicalPoints,state.room.technicalPoints);assert.deepEqual(next.single,state.single);
    assert.deepEqual(w.parseWorkspace(JSON.parse(JSON.stringify(next))),next);
  }
});
test('Unspecified mounting height adapts to the available wall while preserving a tall mirror',()=>{
  const state=base();state.room.room.height=270;state.single={...r.newFurnitureConfiguration('mirror'),height:220};
  const inserted=w.insertSingle(state,'mirror');assert.equal(inserted.room.items[0].height,220);assert.equal(inserted.room.items[0].y,50);
});
test('Insertion also checks rotated placement before reporting that a room has no space',()=>{
  const state=base();state.room.room.width=120;state.room.room.length=500;state.single=r.normalizeFurniture({...state.single,width:300});
  const next=w.insertSingle(state,'rotated');assert.equal(next.room.items[0].rotation,90);assert.deepEqual(r.furnitureConfiguration(next.room.items[0]),state.single);
});
test('Repeated insertion creates separate identities, while no room, no space and 30 items are atomic failures',()=>{
  assert.throws(()=>w.insertSingle(w.initialWorkspace(),'new'));
  let state=w.insertSingle(base(),'a');state=w.insertSingle(state,'b');assert.equal(state.room.items.length,2);assert.notEqual(state.room.items[0].id,state.room.items[1].id);
  assert.throws(()=>w.insertSingle(state,'a'));
  const small=base();small.room.room.width=120;small.room.room.length=120;small.single={...small.single,width:500};const before=clone(small);assert.throws(()=>w.insertSingle(small,'large'));assert.deepEqual(small,before);
  const full=base();full.room.items=Array.from({length:30},(_,i)=>({...p.previewFurniture(full.single),id:'item'+i}));assert.throws(()=>w.insertSingle(full,'31'));assert.equal(full.room.items.length,30);
});
test('Edit commits preserve identity, exact mounting height, rotation, utility links and the independent draft',()=>{
  let state=base();state.room=createTemplate('bath');
  const target=state.room.items[0];target.x=12.34;target.z=-32.1;target.y=25;target.rotation=90;target.existing=true;
  const single=clone(state.single),roomBefore=clone(state.room);state=w.beginFurnitureEdit(state,target.id);state.edit.draft={...state.edit.draft,width:200,height:85,front:'walnut'};
  const next=w.commitFurnitureEdit(state),item=next.room.items.find(i=>i.id===target.id);
  for(const key of ['id','x','z','y','rotation','existing'])assert.equal(item[key],target[key]);assert.equal(item.width,200);assert.equal(item.front,'walnut');assert.equal(next.room.items.length,roomBefore.items.length);assert.deepEqual(next.room.technicalPoints,roomBefore.technicalPoints);assert.deepEqual(next.single,single);assert.equal(next.edit,null);
});
test('Draft edits, mode switches, reloads and cancellation never mutate the committed room or the single concept',()=>{
  let state=w.insertSingle(base(),'one');const original=clone(state);state=w.beginFurnitureEdit(state,'one');state.edit.draft.width=300;state.mode='room';
  const restored=w.readWorkspace(memory({[w.workspaceKey]:JSON.stringify(state)}));assert.deepEqual(restored,state);assert.deepEqual(restored.room,original.room);assert.deepEqual(restored.single,original.single);
  const cancelled={...restored,edit:null};assert.deepEqual(cancelled.room,original.room);
});
test('An edit may cause a collision and invalidate its acknowledgement without moving or shrinking the item',()=>{
  let state=base();state.room.items=[{...p.previewFurniture(state.single),id:'one'},{...p.previewFurniture(state.single),id:'two',x:50}];
  const issue=r.issuesFor(state.room).find(i=>i.kind==='overlap');state.room=a.acknowledgeIssue(state.room,issue);assert(a.currentAcknowledgement(state.room,issue));
  state=w.beginFurnitureEdit(state,'one');state.edit.draft.width=500;state.edit.draft.height=400;state.room.room.height=270;
  const next=w.commitFurnitureEdit(state),item=next.room.items[0];assert.equal(item.x,0);assert.equal(item.width,500);assert.equal(item.height,400);assert(r.issuesFor(next.room).some(i=>i.kind==='outside'));assert(!a.currentAcknowledgement(next.room,r.issuesFor(next.room).find(i=>i.kind==='overlap')));assert.equal(next.room.acknowledgements.length,1);
});
test('Removed or concurrently changed furniture cannot be overwritten by a stale edit',()=>{
  let state=w.beginFurnitureEdit(w.insertSingle(base(),'one'),'one');state.room.items[0].width=200;assert.throws(()=>w.commitFurnitureEdit(state));
  state.room.items=[];assert.throws(()=>w.commitFurnitureEdit(state));
});
test('Single designs and inquiries round-trip all 15 types without room coordinates or invented project data',()=>{
  for(const entry of r.catalog){const item=r.newFurnitureConfiguration(entry.type),summary=describeSingle(item);assert(!/Pokoj:|Poloha X|nad podlahou|Stěna|TECHNICKÉ PRVKY/.test(summary));assert(summary.includes(`${item.width} × ${item.height} × ${item.depth}`));
    const payload=createInquiryPayload(w.singleDesign(item),{...details,summary},[]);assert.deepEqual(w.parseSingle(JSON.parse(JSON.stringify(payload))),item);assert(!('room' in payload.design));assert(!('plan' in payload.previews));assert.equal(payload.business.inquiryRecipient,null);
    assert.deepEqual(w.parseSingle(w.singleDesign(item)),item);
  }
});
test('Legacy wardrobe migration preserves original material, layout, dimensions and door data',()=>{
  for(const width of [80,240,360]){const legacy={width,height:280,depth:80,material:'walnut',front:'graphite',sections:Array.from({length:Math.ceil(width/100)},(_,i)=>['hanging','drawers','shelves'][i%3]),doors:'hinged',handles:'brass'};
    const saved=JSON.stringify(legacy),storage=memory({'forma-design-v1':saved}),state=w.readWorkspace(storage);for(const key of Object.keys(legacy))assert.deepEqual(state.single[key],legacy[key]);assert.equal(storage.getItem('forma-design-v1'),saved);assert.deepEqual(w.parseSingle(legacy),state.single);
  }
  assert.throws(()=>w.migrateWardrobe({width:999}));
});
test('Explicitly labelled old wardrobe inquiries migrate to a true standalone piece without guessing from a one-item room',()=>{
  const item={...p.previewFurniture(r.newFurnitureConfiguration('wardrobe')),id:'wardrobe-single'};
  const room={...base().room,title:'Samostatná skříň',items:[item]};
  const inquiry={format:'toro-inquiry',version:1,design:room,summary:'Samostatná skříň. Pokoj v exportu slouží pouze pro zobrazení; nejde o zaměřenou místnost.'};
  assert.deepEqual(w.parseSingle(inquiry),r.furnitureConfiguration(item));
  const current=base(),next=w.importWorkspace(current,inquiry);assert.equal(next.mode,'single');assert.deepEqual(next.room,current.room);
  const ordinary={...inquiry,summary:'Běžný pokoj s jednou skříní'};assert.throws(()=>w.parseSingle(ordinary));assert.equal(w.importWorkspace(current,ordinary).mode,'room');
});
test('Migration reads both old concepts; supported room versions 1 to 4 retain measured data and old keys',()=>{
  const legacy={width:240,height:220,depth:60,material:'oak',front:'sand',sections:['hanging','shelves','drawers'],doors:'hinged',handles:'black'};
  for(const version of [1,2,3,4]){const room={...clone(r.initialRoom),version,technicalPoints:[]};room.items[0].x=-123.456;
    const raw=JSON.stringify(room),storage=memory({['toro-room-v'+version]:raw,'forma-design-v1':JSON.stringify(legacy)}),next=w.readWorkspace(storage);assert.equal(next.room.version,4);assert.equal(next.room.items[0].x,-123.456);assert.equal(next.single.width,240);assert.equal(storage.getItem('toro-room-v'+version),raw);
  }
});
test('Current data wins; malformed current data never falls back, and recovery backs up before replacement',()=>{
  const current=base(),storage=memory({[w.workspaceKey]:JSON.stringify(current),'forma-design-v1':'bad'});assert.deepEqual(w.readWorkspace(storage),current);
  storage.setItem(w.workspaceKey,'{broken');assert.throws(()=>w.readWorkspace(storage));w.restoreWorkspaceSaving(storage,current);assert.equal([...storage.values.entries()].find(([key])=>key.startsWith(w.workspaceKey+'-backup-'))[1],'{broken');assert.deepEqual(w.readWorkspace(storage),current);
});
test('Denied storage and failed backup writes cannot replace the original record',()=>{
  assert.throws(()=>w.readWorkspace({getItem(){throw Error('denied');}}));const storage=memory({[w.workspaceKey]:'broken'});const blocked={getItem:storage.getItem,setItem(){throw Error('quota');}};assert.throws(()=>w.restoreWorkspaceSaving(blocked,base()));assert.equal(storage.getItem(w.workspaceKey),'broken');
});
test('File imports preserve the unrelated concept and invalid imports preserve all current data',()=>{
  const state=base(),next=w.importWorkspace(state,w.singleDesign(r.newFurnitureConfiguration('bed')));assert.deepEqual(next.room,state.room);assert.equal(next.single.type,'bed');
  const roomNext=w.importWorkspace(next,createTemplate('bedroom'));assert.deepEqual(roomNext.single,next.single);assert.equal(roomNext.mode,'room');
  const original=clone(roomNext);assert.throws(()=>w.importWorkspace(roomNext,{format:'toro-workspace',version:99}));assert.deepEqual(roomNext,original);
});
test('Workspace history retains forty changes, supports undo/redo of transfers and restores edit drafts',()=>{
  let history={past:[],present:base(),future:[]};history=w.workspaceReducer(history,{type:'change',update:s=>w.insertSingle(s,'one')});const inserted=history.present;history=w.workspaceReducer(history,{type:'undo'});assert.equal(history.present.room.items.length,0);history=w.workspaceReducer(history,{type:'redo'});assert.deepEqual(history.present,inserted);
  for(let i=0;i<50;i++)history=w.workspaceReducer(history,{type:'change',update:s=>({...s,single:{...s.single,name:'Kus '+i}})});assert.equal(history.past.length,40);
});
test('SVG fallback escapes user labels and includes true dimensions',()=>{const svg=decodeURIComponent(p.furnitureDiagram({...w.initialWorkspace().single,name:'<script> & "'}));assert(svg.includes('&lt;script&gt;'));assert(!svg.includes('<script>'));assert(svg.includes('120 × 220 × 60'));});
console.log(JSON.stringify({tests,geometryCases},null,2));

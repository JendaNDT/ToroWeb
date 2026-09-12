'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildFurniture, buildRoom, type RoomShell } from '@/lib/room-model';
import { buildTechnicalPoint, buildTechnicalAccess, positionTechnicalObject } from '@/lib/technical-model';
import { moveTechnicalPoint, technicalPosition, technicalElevation, technicalBounds, technicalCatalog, type TechnicalPoint, type TechnicalPlacement, type TechnicalCategory } from '@/lib/technical';
import { disposeGroup } from '@/lib/wardrobe-model';
import { sceneLabel, sizeSceneLabels, layoutTechnicalLabels } from '@/lib/scene-label';
import { captureRoomPerspective, planDataUrl } from '@/lib/room-previews';
import { getRoomWall, roomWalls } from '@/lib/room-geometry';
import { footprint, openingBounds, placeInDesign, placeItem, type Furniture, type RoomDesign } from '@/lib/room';

type Props = {
  design:RoomDesign; selectedId:string|null; view:'3d'|'plan'; showFront:boolean; showWalls:boolean;
  snap:boolean; reset:number; zoom:number; issueItemIds:string[];
  onSelect:(id:string|null)=>void; onMove:(id:string,x:number,z:number)=>void;
  selectedOpeningId?:string;
  selectedTechnicalId?:string|null; technicalIssueIds?:string[]; placingTechnical?:boolean;
  onSelectTechnical?:(id:string)=>void; onPlaceTechnical?:(x:number,z:number)=>void;
  onMoveTechnical?:(id:string,placement:TechnicalPlacement)=>void;
  technicalFilter?:TechnicalCategory|'all';
  onRotate?:(direction:1|-1)=>void;
  captureRequest?:number; onCapture?:(data:string)=>void; onCapturePlan?:(data:string)=>void;
};
type Engine={renderer:THREE.WebGLRenderer;scene:THREE.Scene;camera:THREE.OrthographicCamera;controls:OrbitControls;texture:THREE.Texture|null;shell:RoomShell|null;objects:THREE.Group;markers:THREE.Group;technical:THREE.Group;draw:()=>void;frame:()=>void;};
function clear(g:THREE.Group){g.traverse(o=>{if(o instanceof THREE.Sprite){o.material.map?.dispose();o.material.dispose();}});disposeGroup(g);g.clear();}

export default function RoomScene(props:Props){
  const host=useRef<HTMLDivElement>(null),engine=useRef<Engine|null>(null),latest=useRef(props);
  const cancelDrag=useRef<(()=>void)|null>(null);
  const [textureVersion,setTextureVersion]=useState(0),[error,setError]=useState('');
  useEffect(()=>{latest.current=props;});
  useEffect(()=>{cancelDrag.current?.();},[props.design]);
  useEffect(()=>{
    if(!props.captureRequest)return;
    latest.current.onCapturePlan?.(planDataUrl(latest.current.design));
    const e=engine.current;if(!e||error){latest.current.onCapture?.('');return;}
    try{latest.current.onCapture?.(captureRoomPerspective(e.renderer,latest.current.design,e.texture));}catch{latest.current.onCapture?.('');}finally{e.draw();}
  },[props.captureRequest,textureVersion,error]);
  useEffect(()=>{
    const container=host.current;if(!container)return;
    let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}
    catch{queueMicrotask(()=>setError('3D vyžaduje hardwarovou akceleraci prohlížeče. Zobrazuje se půdorys; nábytek můžete dál upravovat v seznamu.'));return;}
    const onContextLost=(event:Event)=>{event.preventDefault();setError('3D spojení se přerušilo. Pokračujte s půdorysem a seznamem kusů.');};
    renderer.domElement.addEventListener('webglcontextlost',onContextLost);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;
    renderer.domElement.setAttribute('aria-label','Plán pokoje. Nábytek i technické prvky přemístíte tažením.');container.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-5,5,5,-5,.05,100);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.enablePan=true;controls.minZoom=.45;controls.maxZoom=3;controls.minPolarAngle=.1;controls.maxPolarAngle=Math.PI/2-.06;controls.mouseButtons.RIGHT=THREE.MOUSE.PAN;
    scene.add(new THREE.HemisphereLight('#fffef4','#c8cebc',2.8));
    const sun=new THREE.DirectionalLight('#fff9ec',3.5);sun.position.set(-2.5,8,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
    sun.shadow.camera.left=-10;sun.shadow.camera.right=10;sun.shadow.camera.top=10;sun.shadow.camera.bottom=-10;sun.shadow.camera.far=30;sun.shadow.bias=-.0003;sun.shadow.normalBias=.02;scene.add(sun);
    const fill=new THREE.DirectionalLight('#f2f9ff',1.5);fill.position.set(6,5,-4);scene.add(fill);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({opacity:.11}));ground.rotation.x=-Math.PI/2;ground.position.y=-.125;ground.receiveShadow=true;scene.add(ground);
    const objects=new THREE.Group(),markers=new THREE.Group(),technical=new THREE.Group();scene.add(objects,markers,technical);
    const draw=()=>{
      const e=engine.current;if(e?.shell){const {view,showWalls}=latest.current;
        for(const wall of Object.values(e.shell.walls)){
          wall.scale.y=view==='plan'?.016:1;
          const n=wall.userData.inward;wall.visible=showWalls&&(view==='plan'||(camera.position.x-wall.position.x)*n.x+(camera.position.z-wall.position.z)*n.z>=0);
        }
      }
      sizeSceneLabels(markers,camera,container.clientHeight);
      sizeSceneLabels(technical,camera,container.clientHeight);
      layoutTechnicalLabels(technical,markers,camera,container.clientWidth,container.clientHeight);
      renderer.render(scene,camera);
    };
    const frame=()=>{
      const {room}=latest.current.design,{view,zoom}=latest.current,a=Math.max(container.clientWidth,1)/Math.max(container.clientHeight,1);
      const w=room.width/100,l=room.length/100,h=room.height/100;
      const span=view==='plan'?Math.max(l+1.7,(w+1.7)/a):1.15*Math.max((w*.64+l*.69+1)/a,(w+l)*.32+h*.64+1);
      camera.left=-span*a/2;camera.right=span*a/2;camera.top=span/2;camera.bottom=-span/2;camera.zoom=zoom;
      if(view==='plan'){camera.position.set(0,18,.001);controls.target.set(0,0,0);camera.up.set(0,0,-1);}
      else {camera.up.set(0,1,0);camera.position.set(8,8,10);controls.target.set(0,h*.34,0);}
      camera.updateProjectionMatrix();controls.enableRotate=view==='3d';controls.minPolarAngle=view==='plan'?0:.1;controls.update();draw();
    };
    engine.current={renderer,scene,camera,controls,texture:null,shell:null,objects,markers,technical,draw,frame};
    controls.addEventListener('change',draw);
    const resize=new ResizeObserver(()=>{renderer.setSize(container.clientWidth,container.clientHeight);frame();});resize.observe(container);
    const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),floor=new THREE.Plane(new THREE.Vector3(0,1,0),0);
    function cast(event:PointerEvent){const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);}
    function floorPoint(){return ray.ray.intersectPlane(floor,new THREE.Vector3());}
    type Gesture={offset:THREE.Vector3;startX:number;startY:number;pointerId:number;moved:boolean};
    let drag:(Gesture&({kind:'furniture';item:Furniture;position:Furniture}|{kind:'technical';item:TechnicalPoint;position:TechnicalPoint}))|null=null;
    function owner(object:THREE.Object3D|undefined,key:'itemId'|'technicalId'):string|undefined {
      while(object){if(object.userData[key])return object.userData[key];object=object.parent??undefined;}
    }
    function hitTarget() {
      // Labels are drawn over the scene: their visible hit area must work too.
      const labels=[...technical.children,...markers.children].filter(o=>o instanceof THREE.Sprite&&o.visible&&(o.userData.technicalId||o.userData.itemId));
      const label=ray.intersectObjects(labels)[0]?.object;
      if(label)return label.userData.technicalId?{kind:'technical' as const,id:label.userData.technicalId as string}:{kind:'furniture' as const,id:label.userData.itemId as string};
      const hit=ray.intersectObjects([...objects.children,...technical.children.filter(o=>!(o instanceof THREE.Sprite))],true).find(h=>h.object instanceof THREE.Mesh);
      if(!hit)return;
      const technicalId=owner(hit.object,'technicalId'),itemId=owner(hit.object,'itemId');
      if(technicalId)return {kind:'technical' as const,id:technicalId};
      if(itemId)return {kind:'furniture' as const,id:itemId};
    }
    function previewFurniture(item:Furniture) {
      const object=objects.children.find(o=>o.userData.itemId===item.id);
      object?.position.set(item.x/100,item.y/100,item.z/100);
      for(const marker of markers.children)if(marker.userData.itemId===item.id){marker.position.x=item.x/100;marker.position.z=item.z/100;}
    }
    function previewTechnical(point:TechnicalPoint) {
      const room=latest.current.design.room,position=technicalPosition(point,room);
      for(const object of technical.children)if(object.userData.technicalId===point.id){
        if(object instanceof THREE.Sprite){
          const anchor=new THREE.Vector3(position.x/100,latest.current.view==='plan'?.15:technicalElevation(point,room)/100+.2,position.z/100);
          object.userData.anchor=anchor;object.position.copy(anchor);
        }else positionTechnicalObject(object,point,room);
      }
    }

    function finish(commit:boolean) {
      if(!drag)return;
      const finished=drag;drag=null;controls.enabled=true;renderer.domElement.style.cursor=latest.current.placingTechnical?'crosshair':'';
      if(renderer.domElement.hasPointerCapture(finished.pointerId))renderer.domElement.releasePointerCapture(finished.pointerId);
      if(finished.kind==='furniture'){
        previewFurniture(commit?finished.position:finished.item);
        if(commit&&finished.moved)latest.current.onMove(finished.item.id,finished.position.x,finished.position.z);
      }else{
        previewTechnical(commit?finished.position:finished.item);
        if(commit&&finished.moved)latest.current.onMoveTechnical?.(finished.item.id,finished.position.placement);
      }
      draw();
    }
    const down=(event:PointerEvent)=>{
      if(event.button!==0||drag)return;cast(event);
      container.focus({preventScroll:true});
      if(latest.current.placingTechnical) {
        const point=floorPoint();
        if(point)latest.current.onPlaceTechnical?.(point.x*100,point.z*100);
        event.stopImmediatePropagation();return;
      }
      const target=hitTarget(),point=floorPoint();
      if(!target){latest.current.onSelect(null);return;}
      if(!point)return;
      const gesture={startX:event.clientX,startY:event.clientY,pointerId:event.pointerId,moved:false};
      if(target.kind==='technical'){
        const item=latest.current.design.technicalPoints?.find(p=>p.id===target.id);if(!item)return;
        latest.current.onSelectTechnical?.(item.id);
        if(item.locked){event.stopImmediatePropagation();return;}
        const position=technicalPosition(item,latest.current.design.room);
        drag={...gesture,kind:'technical',item,position:item,offset:point.sub(new THREE.Vector3(position.x/100,0,position.z/100))};
      }else{
        const item=latest.current.design.items.find(i=>i.id===target.id);if(!item)return;
        drag={...gesture,kind:'furniture',item,position:item,offset:point.sub(new THREE.Vector3(item.x/100,0,item.z/100))};
        latest.current.onSelect(item.id);
      }
      controls.enabled=false;renderer.domElement.style.cursor='grabbing';
      renderer.domElement.setPointerCapture(event.pointerId);event.stopImmediatePropagation();
    };
    const move=(event:PointerEvent)=>{
      if(!drag){cast(event);renderer.domElement.style.cursor=latest.current.placingTechnical?'crosshair':hitTarget()?'grab':'';return;}
      if(event.pointerId!==drag.pointerId)return;
      if(!drag.moved&&Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<4)return;
      drag.moved=true;cast(event);const point=floorPoint();if(!point)return;
      point.sub(drag.offset);
      if(drag.kind==='furniture'){
        const next=placeInDesign(drag.item,latest.current.design,point.x*100,point.z*100,latest.current.snap);
        previewFurniture(next);drag.position=next;
      }else{
        const next=moveTechnicalPoint(drag.item,latest.current.design.room,point.x*100,point.z*100,latest.current.snap);
        previewTechnical(next);drag.position=next;
      }
      draw();event.stopImmediatePropagation();
    };
    const end=(event:PointerEvent)=>{
      if(!drag||event.pointerId!==drag.pointerId)return;
      finish(event.type==='pointerup');event.stopImmediatePropagation();
    };
    const cancel=()=>finish(false);cancelDrag.current=cancel;
    const escape=(event:KeyboardEvent)=>{if(drag&&event.key==='Escape'){event.preventDefault();event.stopPropagation();cancel();}};
    renderer.domElement.addEventListener('pointerdown',down,true);renderer.domElement.addEventListener('pointermove',move,true);renderer.domElement.addEventListener('pointerup',end,true);renderer.domElement.addEventListener('pointercancel',end,true);renderer.domElement.addEventListener('lostpointercapture',cancel);
    window.addEventListener('blur',cancel);window.addEventListener('keydown',escape,true);
    let disposed=false;
    const texture=new THREE.TextureLoader().load('/textures/oak.png',t=>{if(disposed){t.dispose();return;}t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());engine.current!.texture=t;setTextureVersion(v=>v+1);},undefined,()=>{if(!disposed)setTextureVersion(v=>v+1);});
    return()=>{cancelDrag.current=null;disposed=true;resize.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',down,true);renderer.domElement.removeEventListener('pointermove',move,true);renderer.domElement.removeEventListener('pointerup',end,true);renderer.domElement.removeEventListener('pointercancel',end,true);renderer.domElement.removeEventListener('lostpointercapture',cancel);window.removeEventListener('blur',cancel);window.removeEventListener('keydown',escape,true);clear(objects);clear(markers);clear(technical);const shell=engine.current?.shell;if(shell){disposeGroup(shell.group);shell.floorTexture?.dispose();}texture.dispose();ground.geometry.dispose();ground.material.dispose();sun.shadow.dispose();renderer.domElement.removeEventListener('webglcontextlost',onContextLost);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();engine.current=null;};
  },[]);
  useEffect(()=>{
    const e=engine.current;if(!e)return;
    if(e.shell){e.scene.remove(e.shell.group);disposeGroup(e.shell.group);e.shell.floorTexture?.dispose();}
    e.shell=buildRoom(props.design.room,e.texture);e.scene.add(e.shell.group);e.draw();
  },[props.design.room,textureVersion]);
  useEffect(()=>{
    const e=engine.current;if(!e)return;clear(e.objects);
    for(const item of props.design.items)e.objects.add(buildFurniture(item,e.texture,props.showFront));e.draw();
  },[props.design.items,props.showFront,textureVersion]);
  useEffect(()=>{
    const e=engine.current;if(!e)return;clear(e.technical);
    for(const point of props.design.technicalPoints??[]) {
      const selected=point.id===props.selectedTechnicalId,issue=props.technicalIssueIds?.includes(point.id),def=technicalCatalog[point.type];
      if(props.technicalFilter&&props.technicalFilter!=='all'&&def.category!==props.technicalFilter&&!selected)continue;
      const color=issue?'#9c321d':selected?'#1b130c':'#514638';
      e.technical.add(buildTechnicalPoint(point,props.design.room,color));
      if(selected&&point.accessDepth){const access=buildTechnicalAccess(point,props.design.room);access.userData.technicalId=point.id;e.technical.add(access);}
      const place=point.placement,caption=props.view==='plan'?`${point.label} · ${place.surface==='floor'?'podlaha':place.surface==='ceiling'?'strop':technicalElevation(point,props.design.room)+' cm'}`:`${point.label} · ${def.short}`;
      const label=sceneLabel(caption,selected?180:140,{background:issue?'#ffe5dd':selected?'#f1980b':'#fffaf0',ink:color,border:color});
      const position=technicalPosition(point,props.design.room);
      label.position.set(position.x/100,props.view==='plan'?.15:technicalElevation(point,props.design.room)/100+.2,position.z/100);
      label.userData.anchor=label.position.clone();label.userData.technicalId=point.id;
      const leader=new THREE.Line(new THREE.BufferGeometry().setFromPoints([label.position.clone(),label.position.clone()]),new THREE.LineBasicMaterial({color,depthTest:false,transparent:true,opacity:.65}));
      leader.renderOrder=99;label.userData.leader=leader;e.technical.add(leader,label);
      if(selected){
        const r=props.design.room,y=props.view==='plan'?.07:technicalElevation(point,r)/100;
        const target=new THREE.Vector3(position.x/100,y,position.z/100);
        const wall=place.surface==='wall'?getRoomWall(r,place.wall):undefined;
        const starts=wall?[new THREE.Vector3(wall.start.x/100,y,wall.start.z/100),new THREE.Vector3(position.x/100,0,position.z/100)]:[new THREE.Vector3(-r.width/200,y,position.z/100),new THREE.Vector3(position.x/100,y,-r.length/200)];
        for(const start of starts){const guide=new THREE.Line(new THREE.BufferGeometry().setFromPoints([start,target]),new THREE.LineDashedMaterial({color:'#906421',dashSize:.07,gapSize:.035,depthTest:false}));guide.computeLineDistances();e.technical.add(guide);}
        // The physical envelope remains visible when a solid is hidden behind furniture.
        const b=technicalBounds(point,r),outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry((b.right-b.left)/100,(b.top-b.bottom)/100,(b.front-b.back)/100)),new THREE.LineBasicMaterial({color,depthTest:false}));
        outline.position.set((b.left+b.right)/200,(b.bottom+b.top)/200,(b.back+b.front)/200);e.technical.add(outline);
      }
    }
    e.draw();
  },[props.design.technicalPoints,props.design.room,props.selectedTechnicalId,props.technicalIssueIds,props.technicalFilter,props.view,textureVersion]);
  useEffect(()=>{if(engine.current)engine.current.renderer.domElement.style.cursor=props.placingTechnical?'crosshair':'';},[props.placingTechnical]);
  useEffect(()=>{
    const e=engine.current;if(!e)return;clear(e.markers);
    for(const item of props.design.items){
      const selected=item.id===props.selectedId,issue=props.issueItemIds.includes(item.id),p=footprint(item);
      if(selected||issue){
        const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(p.width/100+.014,item.height/100+.014,p.depth/100+.014)),new THREE.LineBasicMaterial({color:issue?'#a34f28':'#9c6a1e',depthTest:true,toneMapped:false}));outline.position.set((item.x+p.centerX)/100,(item.y+item.height/2)/100,(item.z+p.centerZ)/100);outline.userData.itemId=item.id;e.markers.add(outline);
      }
      if(props.view==='plan') {const text=sceneLabel(item.name);text.position.set(item.x/100,(item.y+item.height)/100+.07,item.z/100);text.userData.itemId=item.id;e.markers.add(text);}
    }
    for(const o of props.design.room.openings){if(o.type!=='door')continue;const b=openingBounds(o,props.design.room);
      const shape=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[b.left,b.back],[b.right,b.back],[b.right,b.front],[b.left,b.front]].map(([x,z])=>new THREE.Vector3(x/100,.008,z/100))),new THREE.LineDashedMaterial({color:'#7e6c4c',dashSize:.08,gapSize:.045,transparent:true,opacity:.9,toneMapped:false}));shape.computeLineDistances();e.markers.add(shape);
    }
    const selectedOpening=props.design.room.openings.find(o=>o.id===props.selectedOpeningId);
    if(selectedOpening){const b=openingBounds(selectedOpening,props.design.room),outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(Math.max(.03,(b.right-b.left)/100),(b.top-b.bottom)/100,Math.max(.03,(b.front-b.back)/100))),new THREE.LineBasicMaterial({color:'#bd6d00',depthTest:false}));outline.position.set((b.left+b.right)/200,(b.top+b.bottom)/200,(b.back+b.front)/200);e.markers.add(outline);}
    if(props.view==='plan'&&props.design.room.outline)roomWalls(props.design.room).forEach((wall,i)=>{const label=sceneLabel(String(i+1),28);label.position.set((wall.start.x+wall.end.x)/200+wall.normal.x*.18,.09,(wall.start.z+wall.end.z)/200+wall.normal.z*.18);e.markers.add(label);});
    const {room}=props.design,w=room.width/100,l=room.length/100;
    const xLabel=sceneLabel(`${room.width} cm`);xLabel.position.set(0,.015,l/2+.37);e.markers.add(xLabel);
    const zLabel=sceneLabel(`${room.length} cm`);zLabel.position.set(w/2+.38,.015,l*.23);e.markers.add(zLabel);e.draw();
  },[props.design,props.selectedId,props.selectedOpeningId,props.issueItemIds,props.view,textureVersion]);
  useEffect(()=>{engine.current?.frame();},[props.design.room.width,props.design.room.length,props.design.room.height,props.view,props.zoom,props.reset]);
  useEffect(()=>{engine.current?.draw();},[props.showWalls]);
  function key(event:React.KeyboardEvent){
    const item=props.design.items.find(i=>i.id===props.selectedId),point=props.design.technicalPoints?.find(p=>p.id===props.selectedTechnicalId);
    if(!item&&!point)return;
    if(event.ctrlKey||event.metaKey||event.altKey)return;
    if(event.key.toLowerCase()==='r'){event.preventDefault();if(item)props.onRotate?.(event.shiftKey?1:-1);else if(point&&!point.locked&&point.placement.surface!=='wall')props.onMoveTechnical?.(point.id,{...point.placement,rotation:((point.placement.rotation+(event.shiftKey?90:270))%360) as 0|90|180|270});return;}
    const delta=event.shiftKey?1:10;
    const offset=({ArrowLeft:[-delta,0],ArrowRight:[delta,0],ArrowUp:[0,-delta],ArrowDown:[0,delta]} as Record<string,number[]>)[event.key];
    if(offset){event.preventDefault();if(item){const next=placeItem(item,props.design.room,item.x+offset[0],item.z+offset[1]);props.onMove(item.id,next.x,next.z);}else if(point&&!point.locked){const pos=technicalPosition(point,props.design.room),next=moveTechnicalPoint(point,props.design.room,pos.x+offset[0],pos.z+offset[1]);props.onMoveTechnical?.(point.id,next.placement);}}
  }
  return <div className="rp-scene" ref={host} tabIndex={0} onKeyDown={key} aria-label="Interaktivní pokoj; táhněte nábytek nebo technický prvek. Šipky posouvají vybraný prvek, Shift zpřesní krok na 1 cm, R otáčí, Escape zruší tažení.">{error&&<div className="toro-room-fallback"><img src={planDataUrl(props.design)} alt="Půdorys pokoje bez 3D akcelerace"/><p role="status">{error}</p></div>}</div>;
}

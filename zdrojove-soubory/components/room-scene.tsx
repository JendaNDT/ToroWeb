'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildFurniture, buildRoom, type RoomShell } from '@/lib/room-model';
import { disposeGroup } from '@/lib/wardrobe-model';
import { sceneLabel, sizeSceneLabels } from '@/lib/scene-label';
import { footprint, openingBounds, placeInDesign, placeItem, type Furniture, type RoomDesign } from '@/lib/room';

type Props = {
  design:RoomDesign; selectedId:string|null; view:'3d'|'plan'; showFront:boolean; showWalls:boolean;
  snap:boolean; reset:number; zoom:number; issueItemIds:string[];
  onSelect:(id:string|null)=>void; onMove:(id:string,x:number,z:number)=>void;
  captureRequest?:number; onCapture?:(data:string)=>void;
};
type Engine={renderer:THREE.WebGLRenderer;scene:THREE.Scene;camera:THREE.OrthographicCamera;controls:OrbitControls;texture:THREE.Texture|null;shell:RoomShell|null;objects:THREE.Group;markers:THREE.Group;draw:()=>void;frame:()=>void;};
function clear(g:THREE.Group){g.traverse(o=>{if(o instanceof THREE.Sprite){o.material.map?.dispose();o.material.dispose();}});disposeGroup(g);g.clear();}

export default function RoomScene(props:Props){
  const host=useRef<HTMLDivElement>(null),engine=useRef<Engine|null>(null),latest=useRef(props);
  const [textureVersion,setTextureVersion]=useState(0),[error,setError]=useState('');
  useEffect(()=>{latest.current=props;});
  useEffect(()=>{
    if(!props.captureRequest||!engine.current)return;
    const e=engine.current;e.draw();
    try{latest.current.onCapture?.(e.renderer.domElement.toDataURL('image/png'));}catch{latest.current.onCapture?.('');}
  },[props.captureRequest]);
  useEffect(()=>{
    const container=host.current;if(!container)return;
    let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}
    catch{queueMicrotask(()=>setError('3D vyžaduje hardwarovou akceleraci prohlížeče. Nábytek můžete dál upravovat v seznamu.'));return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;
    renderer.domElement.setAttribute('aria-label','Plán pokoje. Vyberte nábytek a přetáhněte jej na nové místo.');container.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-5,5,5,-5,.05,100);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.enablePan=true;controls.minZoom=.45;controls.maxZoom=3;controls.minPolarAngle=.1;controls.maxPolarAngle=Math.PI/2-.06;controls.mouseButtons.RIGHT=THREE.MOUSE.PAN;
    scene.add(new THREE.HemisphereLight('#fffef4','#c8cebc',2.8));
    const sun=new THREE.DirectionalLight('#fff9ec',3.5);sun.position.set(-2.5,8,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
    sun.shadow.camera.left=-10;sun.shadow.camera.right=10;sun.shadow.camera.top=10;sun.shadow.camera.bottom=-10;sun.shadow.camera.far=30;sun.shadow.bias=-.0003;sun.shadow.normalBias=.02;scene.add(sun);
    const fill=new THREE.DirectionalLight('#f2f9ff',1.5);fill.position.set(6,5,-4);scene.add(fill);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({opacity:.11}));ground.rotation.x=-Math.PI/2;ground.position.y=-.125;ground.receiveShadow=true;scene.add(ground);
    const objects=new THREE.Group(),markers=new THREE.Group();scene.add(objects,markers);
    const draw=()=>{
      const e=engine.current;if(e?.shell){const {view,showWalls}=latest.current;
        for(const [key,wall] of Object.entries(e.shell.walls)){
          wall.scale.y=view==='plan'?.016:1;
          wall.visible=showWalls&&(view==='plan'||(key==='north'?camera.position.z>=0:key==='south'?camera.position.z<0:key==='west'?camera.position.x>=0:camera.position.x<0));
        }
      }
      sizeSceneLabels(markers,camera,container.clientHeight);
      renderer.render(scene,camera);
    };
    const frame=()=>{
      const {room}=latest.current.design,{view,zoom}=latest.current,a=container.clientWidth/Math.max(container.clientHeight,1);
      const w=room.width/100,l=room.length/100,h=room.height/100;
      const span=view==='plan'?Math.max(l+1.7,(w+1.7)/a):1.15*Math.max((w*.64+l*.69+1)/a,(w+l)*.32+h*.64+1);
      camera.left=-span*a/2;camera.right=span*a/2;camera.top=span/2;camera.bottom=-span/2;camera.zoom=zoom;
      if(view==='plan'){camera.position.set(0,18,.001);controls.target.set(0,0,0);camera.up.set(0,0,-1);}
      else {camera.up.set(0,1,0);camera.position.set(8,8,10);controls.target.set(0,h*.34,0);}
      camera.updateProjectionMatrix();controls.enableRotate=view==='3d';controls.minPolarAngle=view==='plan'?0:.1;controls.update();draw();
    };
    engine.current={renderer,scene,camera,controls,texture:null,shell:null,objects,markers,draw,frame};
    controls.addEventListener('change',draw);
    const resize=new ResizeObserver(()=>{renderer.setSize(container.clientWidth,container.clientHeight);frame();});resize.observe(container);
    const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),floor=new THREE.Plane(new THREE.Vector3(0,1,0),0);
    function cast(event:PointerEvent){const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);}
    function floorPoint(){return ray.ray.intersectPlane(floor,new THREE.Vector3());}
    let drag:{item:Furniture;object:THREE.Group;offset:THREE.Vector3;startX:number;startY:number;pointerId:number;moved:boolean;position:Furniture}|null=null;
    const down=(event:PointerEvent)=>{
      if(event.button!==0)return;cast(event);
      const hit=ray.intersectObjects(objects.children,true)[0];let object:THREE.Object3D|undefined=hit?.object;
      while(object&&!object.userData.itemId)object=object.parent||undefined;
      if(!object){latest.current.onSelect(null);return;}
      const item=latest.current.design.items.find(i=>i.id===object!.userData.itemId),point=floorPoint();if(!item||!point)return;
      latest.current.onSelect(item.id);controls.enabled=false;
      drag={item,object:object as THREE.Group,offset:point.sub(new THREE.Vector3(item.x/100,0,item.z/100)),startX:event.clientX,startY:event.clientY,pointerId:event.pointerId,moved:false,position:item};
      renderer.domElement.setPointerCapture(event.pointerId);event.stopImmediatePropagation();
    };
    const move=(event:PointerEvent)=>{
      if(!drag||event.pointerId!==drag.pointerId)return;
      if(!drag.moved&&Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)<4)return;
      drag.moved=true;cast(event);const point=floorPoint();if(!point)return;
      point.sub(drag.offset);const next=placeInDesign(drag.item,latest.current.design,point.x*100,point.z*100,latest.current.snap);
      // The selected item can have been rebuilt by React's selection update.
      const current=objects.children.find(o=>o.userData.itemId===drag!.item.id);if(current)current.position.set(next.x/100,next.y/100,next.z/100);
      drag.position=next;markers.visible=false;renderer.domElement.style.cursor='grabbing';draw();event.stopImmediatePropagation();
    };
    const end=(event:PointerEvent)=>{
      if(!drag||event.pointerId!==drag.pointerId)return;const finished=drag;drag=null;controls.enabled=true;markers.visible=true;renderer.domElement.style.cursor='';
      if(renderer.domElement.hasPointerCapture(event.pointerId))renderer.domElement.releasePointerCapture(event.pointerId);
      if(finished.moved)latest.current.onMove(finished.item.id,finished.position.x,finished.position.z);draw();
    };
    renderer.domElement.addEventListener('pointerdown',down,true);renderer.domElement.addEventListener('pointermove',move,true);renderer.domElement.addEventListener('pointerup',end,true);renderer.domElement.addEventListener('pointercancel',end,true);
    let disposed=false;
    const texture=new THREE.TextureLoader().load('/textures/oak.png',t=>{if(disposed){t.dispose();return;}t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());engine.current!.texture=t;setTextureVersion(v=>v+1);},undefined,()=>{if(!disposed)setTextureVersion(v=>v+1);});
    return()=>{disposed=true;resize.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',down,true);renderer.domElement.removeEventListener('pointermove',move,true);renderer.domElement.removeEventListener('pointerup',end,true);renderer.domElement.removeEventListener('pointercancel',end,true);clear(objects);clear(markers);const shell=engine.current?.shell;if(shell){disposeGroup(shell.group);shell.floorTexture?.dispose();}texture.dispose();ground.geometry.dispose();ground.material.dispose();sun.shadow.dispose();renderer.dispose();renderer.domElement.remove();engine.current=null;};
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
    const e=engine.current;if(!e)return;clear(e.markers);
    for(const item of props.design.items){
      const selected=item.id===props.selectedId,issue=props.issueItemIds.includes(item.id),p=footprint(item);
      if(selected||issue){
        const outline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(p.width/100+.014,item.height/100+.014,p.depth/100+.014)),new THREE.LineBasicMaterial({color:issue?'#a34f28':'#9c6a1e',depthTest:true,toneMapped:false}));outline.position.set(item.x/100,(item.y+item.height/2)/100,item.z/100);e.markers.add(outline);
      }
      if(props.view==='plan') {const text=sceneLabel(item.name);text.position.set(item.x/100,(item.y+item.height)/100+.07,item.z/100);e.markers.add(text);}
    }
    for(const o of props.design.room.openings){if(o.type!=='door')continue;const b=openingBounds(o,props.design.room);
      const shape=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[b.left,b.back],[b.right,b.back],[b.right,b.front],[b.left,b.front]].map(([x,z])=>new THREE.Vector3(x/100,.008,z/100))),new THREE.LineDashedMaterial({color:'#7e6c4c',dashSize:.08,gapSize:.045,transparent:true,opacity:.9,toneMapped:false}));shape.computeLineDistances();e.markers.add(shape);
    }
    const {room}=props.design,w=room.width/100,l=room.length/100;
    const xLabel=sceneLabel(`${room.width} cm`);xLabel.position.set(0,.015,l/2+.37);e.markers.add(xLabel);
    const zLabel=sceneLabel(`${room.length} cm`);zLabel.position.set(w/2+.38,.015,l*.23);e.markers.add(zLabel);e.draw();
  },[props.design,props.selectedId,props.issueItemIds,props.view,textureVersion]);
  useEffect(()=>{engine.current?.frame();},[props.design.room.width,props.design.room.length,props.design.room.height,props.view,props.zoom,props.reset]);
  useEffect(()=>{engine.current?.draw();},[props.showWalls]);
  function key(event:React.KeyboardEvent){
    const item=props.design.items.find(i=>i.id===props.selectedId);if(!item)return;
    const delta=event.shiftKey?1:10;
    const offset=({ArrowLeft:[-delta,0],ArrowRight:[delta,0],ArrowUp:[0,-delta],ArrowDown:[0,delta]} as Record<string,number[]>)[event.key];
    if(offset){event.preventDefault();const next=placeItem(item,props.design.room,item.x+offset[0],item.z+offset[1]);props.onMove(item.id,next.x,next.z);}
  }
  return <div className="rp-scene" ref={host} tabIndex={0} onKeyDown={key} aria-label="Interaktivní pokoj; šipky posouvají vybraný nábytek, Shift zpřesní krok na 1 cm.">{error&&<div className="rp-scene-error">{error}</div>}</div>;
}

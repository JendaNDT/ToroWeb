'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildWardrobe, disposeGroup } from '@/lib/wardrobe-model';
import { sceneLabel, sizeSceneLabels } from '@/lib/scene-label';
import type { Configuration } from '@/lib/configuration';

type Props={config: Configuration; front: boolean; dimensions: boolean; view: '3d'|'front'; reset: number; zoom: number; captureRequest?:number; onCapture?:(image:string)=>void;};
type Engine={renderer:THREE.WebGLRenderer; scene:THREE.Scene; camera:THREE.OrthographicCamera; controls:OrbitControls; model:THREE.Group|null; texture:THREE.Texture|null; draw:()=>void; frame:()=>void; labels:THREE.Group|null;};
export default function WardrobeScene(props:Props){
  const host=useRef<HTMLDivElement>(null), engine=useRef<Engine|null>(null), latest=useRef(props);
  const [failed,setFailed]=useState(false), [ready,setReady]=useState(0);
  useEffect(()=>{latest.current=props;});
  useEffect(()=>{
    const container=host.current;if(!container)return;
    let renderer:THREE.WebGLRenderer;
    // WebGL availability can only be checked when mounting the browser canvas.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{setFailed(true);return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.38;
    renderer.domElement.setAttribute('aria-label','Otočný 3D model vaší skříně');
    container.appendChild(renderer.domElement);
    const scene=new THREE.Scene();
    const camera=new THREE.OrthographicCamera(-3,3,3,-3,.01,100);
    const controls=new OrbitControls(camera,renderer.domElement);
    controls.enablePan=false;controls.enableDamping=false;controls.minZoom=.6;controls.maxZoom=2.2;
    controls.minPolarAngle=.15;controls.maxPolarAngle=Math.PI/2-.01;
    const ambient=new THREE.HemisphereLight('#ffffff','#c6c2b7',2.5);scene.add(ambient);
    const sun=new THREE.DirectionalLight('#fff8eb',3.3);sun.position.set(-3,6,5);sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-5;sun.shadow.camera.right=5;sun.shadow.camera.top=6;sun.shadow.camera.bottom=-4;
    sun.shadow.normalBias=.012;sun.shadow.bias=-.0002;scene.add(sun);
    const fill=new THREE.DirectionalLight('#ffffff',1.3);fill.position.set(4,3,1);scene.add(fill);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.14}));
    floor.rotation.x=-Math.PI/2;floor.position.y=-.003;floor.receiveShadow=true;scene.add(floor);
    const draw=()=>{if(engine.current?.labels)sizeSceneLabels(engine.current.labels,camera,container.clientHeight);renderer.render(scene,camera);};
    const frame=()=>{
      const {config,view,zoom}=latest.current, a=container.clientWidth/Math.max(container.clientHeight,1);
      const span=Math.max(config.height/100+1.0,(config.width/100+.85)/a)*1.12;
      camera.left=-span*a/2;camera.right=span*a/2;camera.top=span/2;camera.bottom=-span/2;
      camera.zoom=zoom; camera.updateProjectionMatrix();
      const y=config.height/200-.025;
      if(view==='front')camera.position.set(0,y,8);else camera.position.set(3.8,y+2.1,7.4);
      controls.target.set(0,y,0);controls.enableRotate=view==='3d';controls.update();draw();
    };
    engine.current={renderer,scene,camera,controls,model:null,texture:null,draw,frame,labels:null};
    controls.addEventListener('change',draw);
    const resize=new ResizeObserver(()=>{renderer.setSize(container.clientWidth,container.clientHeight);frame();});resize.observe(container);
    let disposed=false;
    const loadedTexture=new THREE.TextureLoader().load('/textures/oak.png',texture=>{
      if(disposed){texture.dispose();return;}
      texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
      texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
      engine.current!.texture=texture;setReady(v=>v+1);
    },undefined,()=>{if(!disposed)setReady(v=>v+1);});
    return ()=>{disposed=true;resize.disconnect();controls.dispose();
      if(engine.current?.model)disposeGroup(engine.current.model);
      if(engine.current?.labels)clearLabels(engine.current.labels);
      loadedTexture.dispose();floor.geometry.dispose();floor.material.dispose();
      renderer.dispose();renderer.domElement.remove();engine.current=null;};
  },[]);
  useEffect(()=>{
    const e=engine.current;if(!e)return;
    if(e.model){e.scene.remove(e.model);disposeGroup(e.model);}
    e.model=buildWardrobe(props.config,e.texture,props.front);e.scene.add(e.model);
    if(e.labels){e.scene.remove(e.labels);clearLabels(e.labels);}
    e.labels=dimensionLines(props.config);e.labels.visible=props.dimensions;e.scene.add(e.labels);e.draw();
  },[props.config,props.front,props.dimensions,ready]);
  useEffect(()=>{engine.current?.frame();},[props.config.width,props.config.height,props.config.depth,props.view,props.reset,props.zoom,ready]);
  useEffect(()=>{const e=engine.current;if(!e||!props.captureRequest)return;e.draw();try{latest.current.onCapture?.(e.renderer.domElement.toDataURL('image/png'));}catch{latest.current.onCapture?.('');}},[props.captureRequest]);
  return <div className="scene-host" ref={host}>{failed&&<div className="scene-error"><strong>3D náhled není k dispozici</strong><p>Zapněte hardwarovou akceleraci prohlížeče. Nastavení a přehled návrhu můžete používat dál.</p></div>}</div>;
}
function dimensionLines(c:Configuration){
  const g=new THREE.Group(), w=c.width/100,h=c.height/100,d=c.depth/100;
  const material=new THREE.LineBasicMaterial({color:'#647557',toneMapped:false});
  function line(points:number[][]){const geometry=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p as [number,number,number])));g.add(new THREE.Line(geometry,material));}
  function label(text:string,x:number,y:number,z:number){
    const s=sceneLabel(text);
    s.position.set(x,y,z);g.add(s);
  }
  const z=d/2+.13;
  line([[-w/2,-.13,z],[w/2,-.13,z]]);
  [-w/2,w/2].forEach(x=>line([[x,-.19,z],[x,-.07,z]]));label(`${c.width} cm`,0,-.13,z);
  const x=-w/2-.25;line([[x,0,z],[x,h,z]]);[0,h].forEach(y=>line([[x-.055,y,z],[x+.055,y,z]]));label(`${c.height} cm`,x,h/2,z);
  line([[w/2+.17,0,-d/2],[w/2+.17,0,d/2]]);label(`${c.depth} cm`,w/2+.23,0,0);
  return g;
}
function clearLabels(group:THREE.Group){group.traverse(o=>{if(o instanceof THREE.Sprite){o.material.map?.dispose();o.material.dispose();}});disposeGroup(group);}

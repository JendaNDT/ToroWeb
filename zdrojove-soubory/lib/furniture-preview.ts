import * as THREE from 'three';
import { frontProjection, type FurnitureConfiguration, type Furniture } from './room';
import { buildFurniture } from './room-model';
import { disposeGroup } from './wardrobe-model';

/** Rendering adapter, never used as the saved single-product data. No room is created. */
export const previewFurniture=(config:FurnitureConfiguration):Furniture=>({...config,id:'preview',x:0,y:0,z:0,rotation:0});
export function fitFurnitureCamera(camera:THREE.OrthographicCamera,config:FurnitureConfiguration,aspect:number,view:'front'|'3d'='3d',zoom=1){
  const w=config.width/100,h=config.height/100,d=config.depth/100,extra=frontProjection(previewFurniture(config))/100;
  const center=new THREE.Vector3(0,h/2,0);
  camera.position.copy(center).add(view==='front'?new THREE.Vector3(0,0,15):new THREE.Vector3(9,6,14));camera.lookAt(center);camera.updateMatrixWorld(true);
  let x=0,y=0;
  // Include the full envelope and measurement labels, including a deep bed or custom object.
  for(const px of [-w/2-.4,w/2+.4])for(const py of [-.3,h+.3])for(const pz of [-d/2-.2,d/2+extra+.3]){
    const p=new THREE.Vector3(px,py,pz).applyMatrix4(camera.matrixWorldInverse);x=Math.max(x,Math.abs(p.x));y=Math.max(y,Math.abs(p.y));
  }
  const half=Math.max(y,x/Math.max(.1,aspect))*1.08;
  camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.zoom=zoom;camera.updateProjectionMatrix();
}
export function captureFurniture(renderer:THREE.WebGLRenderer,config:FurnitureConfiguration,texture:THREE.Texture|null):string {
  const size=renderer.getSize(new THREE.Vector2()),ratio=renderer.getPixelRatio(),scene=new THREE.Scene(),model=buildFurniture(previewFurniture(config),texture,true);
  const camera=new THREE.OrthographicCamera(-5,5,5,-5,.01,100);
  scene.background=new THREE.Color('#faf6ee');scene.add(model,new THREE.HemisphereLight('#fffef4','#c8cebc',2.8));
  const sun=new THREE.DirectionalLight('#fff9ec',3.5);sun.position.set(-3,8,6);scene.add(sun);fitFurnitureCamera(camera,config,4/3);
  try{renderer.setPixelRatio(1);renderer.setSize(1024,768,false);renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');}
  finally{disposeGroup(model);renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);}
}
const xml=(value:string)=>value.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));
export function furnitureDiagram(config:FurnitureConfiguration):string {
  const scale=Math.min(620/config.width,440/config.height),w=config.width*scale,h=config.height*scale,x=(960-w)/2,y=(620-h)/2;
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 720"><rect width="960" height="720" fill="#faf6ee"/><g font-family="Arial,sans-serif" fill="#33291d"><text x="50" y="45" font-size="24">${xml(config.name)} · rozměrové schéma</text><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#dfc8a5" stroke="#765c36" stroke-width="3"/><text x="480" y="${y+h+38}" text-anchor="middle" font-size="24">${config.width} cm</text><text x="${x-20}" y="${y+h/2}" text-anchor="end" font-size="22">${config.height} cm</text><text x="50" y="660" font-size="22">Š × V × H: ${config.width} × ${config.height} × ${config.depth} cm</text><text x="50" y="694" font-size="18">Schéma vnějších rozměrů. Provedení je uvedené v soupisu.</text></g></svg>`);
}

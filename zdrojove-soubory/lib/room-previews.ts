import * as THREE from 'three';
import { boundsOf, type RoomDesign } from './room';
import { roomOutline, roomWalls, wallPoint } from './room-geometry';
import { technicalPosition, technicalCatalog } from './technical';
import { buildFurniture, buildRoom } from './room-model';
import { buildTechnicalPoint } from './technical-model';
import { disposeGroup } from './wardrobe-model';
import { sceneLabel, sizeSceneLabels, layoutTechnicalLabels } from './scene-label';

const xml=(value:string)=>value.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));
/** Vector plan uses the complete design, regardless of selection, filters or camera. */
export function createPlanSvg(design:RoomDesign):string {
  const r=design.room,scale=Math.min(790/r.width,560/r.length),left=70,top=80;
  const x=(v:number)=>left+(v+r.width/2)*scale,z=(v:number)=>top+(v+r.length/2)*scale;
  const legend=[...design.items.map((i,n)=>`${n+1}. ${i.name} · ${i.width} × ${i.height} × ${i.depth} cm`),...(design.technicalPoints??[]).map(p=>`${p.label} · ${p.name} · ${p.placement.surface==='wall'?'stěna':p.placement.surface==='floor'?'podlaha':p.placement.surface==='ceiling'?'strop':'prostor'}`)];
  const initialLegendTop=top+r.length*scale+65;
  const parts=[`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="SVG_HEIGHT" viewBox="0 0 960 SVG_HEIGHT"><rect width="960" height="SVG_HEIGHT" fill="#fffdf8"/><g font-family="Arial,sans-serif" fill="#33291d"><text x="45" y="32" font-size="20" font-weight="bold">TORO · ${xml(design.title??'Můj pokoj')}</text><text x="45" y="56" font-size="13">Půdorys · ${r.width} × ${r.length} cm · výška ${r.height} cm</text>`];
  parts.push(`<polygon points="${roomOutline(r).map(p=>`${left+p.x*scale},${top+p.z*scale}`).join(' ')}" fill="#f3eee3" stroke="#6c5f4b" stroke-width="5"/>`);
  const walls=roomWalls(r);
  for(const [index,w] of walls.entries()){
    const p=wallPoint(w,w.length/2,18);parts.push(`<text x="${x(p.x)}" y="${z(p.z)}" text-anchor="middle" font-size="12">S${index+1}</text>`);
  }
  for(const o of r.openings){const w=walls.find(w=>w.id===o.wall);if(!w)continue;const a=wallPoint(w,o.offset),b=wallPoint(w,o.offset+o.width);
    parts.push(`<path d="M ${x(a.x)} ${z(a.z)} L ${x(b.x)} ${z(b.z)}" stroke="${o.type==='door'?'#a06b2c':'#608a95'}" stroke-width="7"><title>${o.type==='door'?'Dveře':'Okno'} · ${o.width} × ${o.height} cm</title></path>`);
  }
  for(const [index,item] of design.items.entries()){
    const b=boundsOf(item),cx=x((b.left+b.right)/2),cz=z((b.back+b.front)/2);
    parts.push(`<rect x="${x(b.left)}" y="${z(b.back)}" width="${(b.right-b.left)*scale}" height="${(b.front-b.back)*scale}" fill="${item.existing?'#d7dcda':'#ddc297'}" fill-opacity=".8" stroke="#6c5231" stroke-width="1.5"><title>${xml(item.name)} · ${item.width} × ${item.height} × ${item.depth} cm</title></rect><circle cx="${cx}" cy="${cz}" r="12" fill="#fffdf8"/><text x="${cx}" y="${cz+4}" text-anchor="middle" font-size="12">${index+1}</text>`);
  }
  const labels:{x:number;y:number;width:number;height:number}[]=[];
  for(const p of design.technicalPoints??[]){
    const pos=technicalPosition(p,r),cx=x(pos.x),cy=z(pos.z),width=Math.max(30,p.label.length*8+10);let box={x:cx+10,y:cy-22,width,height:20};
    for(let n=0;n<100;n++){
      const candidate={x:Math.max(5,Math.min(950-width,cx+(n%2?-(width+10):10))),y:Math.max(65,cy-22+Math.floor(n/2)*22),width,height:20};
      box=candidate;if(!labels.some(b=>candidate.x<b.x+b.width+3&&candidate.x+width>b.x-3&&candidate.y<b.y+b.height+2&&candidate.y+20>b.y-2))break;
    }
    labels.push(box);parts.push(`<circle cx="${cx}" cy="${cy}" r="4" fill="#a36300"><title>${xml(p.name)}</title></circle><path d="M ${cx} ${cy} L ${box.x+width/2} ${box.y+10}" stroke="#886c42"/><rect x="${box.x}" y="${box.y}" width="${width}" height="20" rx="3" fill="#fff8e9" stroke="#886c42"/><text x="${box.x+width/2}" y="${box.y+14}" text-anchor="middle" font-size="12">${xml(p.label)}</text>`);
  }
  const legendTop=Math.max(initialLegendTop,...labels.map(b=>b.y+b.height+45));
  const height=Math.max(740,legendTop+Math.ceil(legend.length/2)*22+40);
  parts[0]=parts[0].replaceAll('SVG_HEIGHT',String(height));
  parts.push(`<text x="45" y="${legendTop-20}" font-size="12">Rozměry jsou v centimetrech. Označení odpovídá soupisu návrhu.</text>`);
  legend.forEach((line,i)=>parts.push(`<text x="${45+(i%2)*450}" y="${legendTop+Math.floor(i/2)*22}" font-size="12">${xml(line.length>61?line.slice(0,58)+'…':line)}</text>`));
  parts.push('</g></svg>');return parts.join('');
}
export const planDataUrl=(design:RoomDesign)=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(createPlanSvg(design));

/** Render an independent complete 3D view, restoring the interactive renderer afterwards. */
export function captureRoomPerspective(renderer:THREE.WebGLRenderer,design:RoomDesign,texture:THREE.Texture|null):string {
  const size=renderer.getSize(new THREE.Vector2()),pixelRatio=renderer.getPixelRatio(),scene=new THREE.Scene(),root=new THREE.Group(),labels=new THREE.Group(),markers=new THREE.Group();
  scene.background=new THREE.Color('#f8f5ed');scene.add(root,labels,markers);
  const shell=buildRoom(design.room,texture);root.add(shell.group);
  const camera=new THREE.OrthographicCamera(-5,5,5,-5,.05,100),aspect=4/3,r=design.room,w=r.width/100,l=r.length/100,h=r.height/100;
  const span=1.15*Math.max((w*.64+l*.69+1)/aspect,(w+l)*.32+h*.64+1);
  camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;
  camera.position.set(8,8,10);camera.lookAt(0,h*.34,0);camera.updateProjectionMatrix();camera.updateMatrixWorld();
  scene.add(new THREE.HemisphereLight('#fffef4','#c8cebc',2.8));const sun=new THREE.DirectionalLight('#fff9ec',3.5);sun.position.set(-2.5,8,5);scene.add(sun);
  for(const wall of Object.values(shell.walls)){const n=wall.userData.inward;wall.visible=(camera.position.x-wall.position.x)*n.x+(camera.position.z-wall.position.z)*n.z>=0;}
  try{
    for(const item of design.items)root.add(buildFurniture(item,texture,true));
    for(const point of design.technicalPoints??[]){root.add(buildTechnicalPoint(point,r));const p=technicalPosition(point,r),label=sceneLabel(`${point.label} · ${technicalCatalog[point.type].short}`,140);
      label.position.set(p.x/100,(point.placement.surface==='floor'?0:point.placement.surface==='ceiling'?r.height:point.placement.elevation)/100+.2,p.z/100);label.userData.anchor=label.position.clone();label.userData.technicalId=point.id;
      const leader=new THREE.Line(new THREE.BufferGeometry().setFromPoints([label.position.clone(),label.position.clone()]),new THREE.LineBasicMaterial({color:'#715736',depthTest:false}));label.userData.leader=leader;labels.add(leader,label);
    }
    renderer.setPixelRatio(1);renderer.setSize(1024,768,false);sizeSceneLabels(labels,camera,768);layoutTechnicalLabels(labels,markers,camera,1024,768);renderer.render(scene,camera);
    return renderer.domElement.toDataURL('image/png');
  }finally{
    labels.traverse(o=>{if(o instanceof THREE.Sprite)o.material.map?.dispose();});disposeGroup(labels);disposeGroup(root);shell.floorTexture?.dispose();renderer.setPixelRatio(pixelRatio);renderer.setSize(size.x,size.y,false);
  }
}

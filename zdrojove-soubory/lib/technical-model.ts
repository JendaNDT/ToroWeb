import * as THREE from 'three';
import type { Room } from './room';
import { technicalCatalog, technicalFrame, type TechnicalPoint } from './technical';

export function positionTechnicalObject(object:THREE.Object3D,point:TechnicalPoint,room:Room) {
  const f=technicalFrame(point,room);
  object.position.fromArray(f.origin.map(v=>v/100));
  object.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(...f.u),new THREE.Vector3(...f.v),new THREE.Vector3(...f.n)));
}
/** Geometry stays inside the same physical envelope used by the domain checks. */
export function buildTechnicalPoint(point:TechnicalPoint,room:Room,color='#514638') {
  const group=new THREE.Group();group.userData.technicalId=point.id;
  positionTechnicalObject(group,point,room);
  const w=point.width/100,h=point.height/100,d=point.depth/100,centre=point.placement.surface==='space'?0:d/2;
  const def=technicalCatalog[point.type];
  const body=new THREE.MeshStandardMaterial({color:point.status==='planned'?'#f5ddb4':'#eee9df',roughness:.65});
  function box(width:number,height:number,depth:number,x=0,y=0,z=centre) {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(width,height,depth),body.clone());
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
  }
  if(d===0){const face=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:'#fffaf0',side:THREE.DoubleSide}));group.add(face);}
  else if(point.type==='towelRail') {
    const bar=Math.min(w*.12,h*.04,d);
    box(bar,h,d,-(w-bar)/2);box(bar,h,d,(w-bar)/2);
    for(let j=0;j<9;j++)box(w,bar,d,0,-h/2+bar/2+j*(h-bar)/8);
  }else if(point.type==='radiator') {
    for(let j=0;j<10;j++)box(w/12,h,d,-w/2+w/24+j*(w-w/12)/9);
  }else if(def.shape==='pipe') {
    // Elliptical cross sections allow a measured bounding envelope for a pipe run.
    const dimensions=[w,h,d],axis=dimensions.indexOf(Math.max(...dimensions));
    const geometry=new THREE.CylinderGeometry(.5,.5,1,16);
    if(axis===0)geometry.rotateZ(Math.PI/2);if(axis===2)geometry.rotateX(Math.PI/2);
    geometry.scale(w,h,d);
    const pipe=new THREE.Mesh(geometry,body.clone());pipe.position.z=centre;group.add(pipe);
  }else if(['coldWater','hotWater','drain','gas','waterValve','gasValve','heatingValve'].includes(point.type)) {
    const geometry=new THREE.CylinderGeometry(.5,.5,1,20).rotateX(Math.PI/2).scale(w,h,d);
    const mesh=new THREE.Mesh(geometry,body.clone());mesh.position.z=centre;group.add(mesh);
    const face=new THREE.Mesh(new THREE.RingGeometry(.22,.4,20),new THREE.MeshBasicMaterial({color}));
    face.scale.set(w,h,1);face.position.z=centre+d/2+.000001;group.add(face);
    if(def.access){const cross=box(w*.6,h*.1,d*.08,0,0,centre+d*.45);cross.material.color.set(color);}
  }else {
    box(w,h,d);
    if(def.category==='air')for(let j=0;j<4;j++){
      const slot=box(w*.75,h*.035,d*.02,0,-h*.3+j*h*.2,centre+d*.49);slot.material.color.set(color);
    }
    if(point.type==='socket'||point.type==='multiSocket') {
      const sockets=point.type==='multiSocket'?3:1;
      for(let n=0;n<sockets;n++)for(const sign of [-1,1]){
        const hole=new THREE.Mesh(new THREE.CircleGeometry(Math.min(w/sockets,h)*.075,12),new THREE.MeshBasicMaterial({color}));
        hole.position.set((n-(sockets-1)/2)*w/sockets+sign*w/sockets*.17,0,centre+d/2+.000001);group.add(hole);
      }
    }
  }
  const envelope=new THREE.EdgesGeometry(new THREE.BoxGeometry(w,h,d));
  const edge=new THREE.LineSegments(envelope,new THREE.LineBasicMaterial({color,transparent:true,opacity:.65}));edge.position.z=centre;group.add(edge);
  body.dispose();return group;
}
export function buildTechnicalAccess(point:TechnicalPoint,room:Room) {
  const group=new THREE.Group();positionTechnicalObject(group,point,room);
  if(!point.accessDepth)return group;
  const depth=point.accessDepth/100;
  const edge=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(point.width/100,point.height/100,depth)),new THREE.LineDashedMaterial({color:'#a16a22',dashSize:.05,gapSize:.035}));
  edge.position.z=(point.placement.surface==='space'?point.depth/200:point.depth/100)+depth/2;
  edge.computeLineDistances();group.add(edge);return group;
}

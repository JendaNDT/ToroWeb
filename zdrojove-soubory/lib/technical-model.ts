import * as THREE from 'three';
import { technicalPosition, type Room, type TechnicalPoint } from './room';

/** Symbolic socket backplate at its measured wall position. */
export function buildTechnicalPoint(point:TechnicalPoint,room:Room,color='#1b130c') {
  const group=new THREE.Group(),position=technicalPosition(point,room);
  group.userData.technicalId=point.id;
  group.position.set(position.x/100,point.elevation/100,position.z/100);
  group.rotation.y=({north:0,south:Math.PI,west:Math.PI/2,east:-Math.PI/2})[point.wall];
  const face=new THREE.Mesh(new THREE.BoxGeometry(point.width/100,point.height/100,.025),new THREE.MeshBasicMaterial({color:'#fffaf0'}));
  face.position.z=.02;group.add(face);
  const border=new THREE.LineSegments(new THREE.EdgesGeometry(face.geometry),new THREE.LineBasicMaterial({color}));border.position.copy(face.position);group.add(border);
  for(const x of [-.014,.014]) {
    const hole=new THREE.Mesh(new THREE.CircleGeometry(.006,12),new THREE.MeshBasicMaterial({color}));hole.position.set(x,0,.034);group.add(hole);
  }
  return group;
}

import * as THREE from 'three';
import { materials, type Configuration, type MaterialId } from './configuration';

export function buildWardrobe(c: Configuration, texture: THREE.Texture | null, showFront: boolean) {
  const group = new THREE.Group();
  const w=c.width/100, h=c.height/100, d=c.depth/100, t=.018, base=.085;
  const finish=(id: MaterialId) => new THREE.MeshStandardMaterial({
    color: id==='oak' && texture ? '#ffffff' : materials.find(m=>m.id===id)!.color,
    map: id==='oak'||id==='walnut' ? texture : null, roughness:.74,
  });
  const wood=finish(c.material), front=finish(c.front);
  const hardware=new THREE.MeshStandardMaterial({color:c.handles==='brass'?'#ad8950':'#303332',metalness:.65,roughness:.32});
  const dark=new THREE.MeshStandardMaterial({color:'#484943',roughness:.9});
  function box(x:number,y:number,z:number,sx:number,sy:number,sz:number,mat:THREE.Material=wood) {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat);
    mesh.position.set(x,y,z); mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh); return mesh;
  }
  box(0,base/2,0,w-.055,base,d-.08,dark);
  box(-w/2+t/2,(h+base)/2,0,t,h-base,d);
  box(w/2-t/2,(h+base)/2,0,t,h-base,d);
  box(0,h-t/2,0,w-2*t,t,d);
  box(0,base+t/2,0,w-2*t,t,d);
  box(0,(h+base)/2,-d/2+.004,w-2*t,h-base-.02,.008);
  const moduleWidth=(w-t)/c.sections.length, inner=moduleWidth-t;
  c.sections.forEach((layout,i)=>{
    const left=-w/2+t+i*moduleWidth, x=left+inner/2;
    if(i>0)box(left-t/2,(h+base)/2,0,t,h-base-2*t,d-.015);
    const shelf=(y:number)=>box(x,y,.005,inner,t,d-.035);
    if(layout==='hanging') {
      shelf(h-.38);
      const bar=new THREE.Mesh(new THREE.CylinderGeometry(.011,.011,inner-.02,16),hardware);
      bar.rotation.z=Math.PI/2;bar.position.set(x,h-.49,0);bar.castShadow=true;group.add(bar);
      shelf(base+.32);
    } else if(layout==='shelves') {
      for(let j=1;j<=4;j++)shelf(base+(h-base)*j/5);
    } else {
      for(let j=0;j<3;j++){
        const y=base+.115+j*.225;
        box(x,y,-.02,inner-.024,.2,d-.08,wood);
        box(x,y,d/2-.012,inner-.007,.218,.018,wood);
        box(x,y+.062,d/2+.006,.20,.009,.021,hardware);
      }
      shelf(base+.70);shelf(base+.7+(h-base-.7)/2);
    }
    if(showFront && c.doors==='hinged'){
      const leafCount=inner>.60?2:1, leaf=moduleWidth/leafCount;
      for(let j=0;j<leafCount;j++){
        const cx=left-t/2+leaf*(j+.5);
        box(cx,(h+base)/2,d/2+.014,leaf-.004,h-base-.005,.022,front);
        const hx=cx+(j%2===0?1:-1)*(leaf/2-.045);
        box(hx,h*.49,d/2+.044,.012,.25,.019,hardware);
      }
    }
  });
  group.userData.materials=[wood,front,hardware,dark];
  return group;
}

export function disposeGroup(group: THREE.Object3D) {
  const uniqueMaterials=new Set<THREE.Material>(group.userData.materials||[]);
  group.traverse(o=>{
    for(const material of o.userData.materials||[]) uniqueMaterials.add(material);
    if(o instanceof THREE.Mesh || o instanceof THREE.Line){
      o.geometry.dispose();
      for(const m of Array.isArray(o.material)?o.material:[o.material]) uniqueMaterials.add(m);
    }
  });
  uniqueMaterials.forEach(m=>m.dispose());
}

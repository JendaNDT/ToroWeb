import * as THREE from 'three';
import { materials, type MaterialId } from './configuration';
import type { Furniture } from './room';

export function buildSpecialFurniture(item:Furniture,texture:THREE.Texture|null,showFront:boolean):THREE.Group|null {
  if(!['bench','panel','mirror','vanity','laundry','desk'].includes(item.type))return null;
  const g=new THREE.Group(),w=item.width/100,h=item.height/100,d=item.depth/100,t=item.construction==='solid'?.028:.018;
  const finish=(id:MaterialId)=>new THREE.MeshStandardMaterial({color:id==='oak'&&texture?'#fff':materials.find(m=>m.id===id)!.color,map:['oak','walnut'].includes(id)?texture:null,roughness:.65});
  const wood=finish(item.material),front=finish(item.front),metal=new THREE.MeshStandardMaterial({color:item.handles==='brass'?'#a98c53':'#26282b',metalness:.65,roughness:.4});
  const white=new THREE.MeshStandardMaterial({color:'#fafafa',roughness:.25});
  const glass=new THREE.MeshStandardMaterial({color:'#9fb8bc',metalness:.7,roughness:.18});
  const dark=new THREE.MeshStandardMaterial({color:'#263136',roughness:.35});
  g.userData.materials=[wood,front,metal,white,glass,dark];
  function box(x:number,y:number,z:number,sx:number,sy:number,sz:number,mat:THREE.Material=wood){
    const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;
  }
  function circle(x:number,y:number,z:number,radius:number,mat:THREE.Material){
    const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,.014,40),mat);m.rotation.x=Math.PI/2;m.position.set(x,y,z);g.add(m);
  }
  if(item.type==='bench'||item.type==='desk'){
    box(0,h-t/2,0,w,t,d);
    for(const x of [-w/2+.04,w/2-.04]){
      for(const z of [-d/2+.04,d/2-.04])box(x,(h-t)/2,z,.035,h-t,.035,metal);
      box(x,.018,0,.035,.035,d-.045,metal);
    }
    if(item.type==='bench')for(let j=0;j<4;j++)box(0,.14,-d/2+.05+(d-.1)*j/3,w-.09,.018,.017,metal);
    else box(0,h-.09,-d/2+.045,w-.08,.035,.025,metal);
  }else if(item.type==='panel'){
    box(0,h/2,-d/2+t/2,w,h,t);
    const hooks=item.hooks||4;
    for(let i=0;i<hooks;i++){
      const x=-w/2+w*(i+1)/(hooks+1);
      box(x,h*.76,0,.018,.018,d,metal);box(x,h*.76+.02,d/2-.009,.018,.055,.018,metal);
    }
  }else if(item.type==='mirror'){
    box(0,h/2,0,w,h,d);
    box(0,h/2,d/2+.002,w-.045,h-.045,.002,glass);
    // Soft highlights suggest glass without claiming a reflection of the room.
    box(-w*.30,h*.63,d/2+.004,.008,h*.42,.001,white);
  }else if(item.type==='vanity'){
    const basinHeight=.18,ch=h-basinHeight;
    box(-w/2+t/2,ch/2,0,t,ch,d);box(w/2-t/2,ch/2,0,t,ch,d);
    box(0,t/2,0,w,t,d);box(0,ch-t/2,0,w,t,d);
    box(0,ch/2,-d/2+t/2,w,ch,t);
    const count=item.basins||1,span=w/count;
    for(let i=0;i<count;i++){
      const x=-w/2+span*(i+.5),r=Math.min(.235,span*.37,(d-.09)/2);
      const bowl=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.78,basinHeight,48,1,true),new THREE.MeshStandardMaterial({color:'#fafafa',side:THREE.DoubleSide,roughness:.2}));
      bowl.position.set(x,h-basinHeight/2,.015);g.add(bowl);
      const bottom=new THREE.Mesh(new THREE.CylinderGeometry(r*.78,r*.78,.01,40),white);bottom.position.set(x,ch+.008,.015);g.add(bottom);
      box(x,ch+.08,-d/2+.045,.02,.16,.025,metal);box(x,ch+.145,-d/2+.10,.02,.015,.13,metal);
      const rows=Math.min(3,item.shelfCount);
      for(let j=0;j<rows;j++){
        const y=(j+.5)*ch/rows;
        if(showFront){box(x,y,d/2-.012,span-.007,ch/rows-.006,.024,front);box(x,y+ch/rows*.25,d/2-.005,span*.30,.01,.024,metal);}
        else box(x,y-ch/rows/2+.02,0,span-.025,.018,d-.025);
      }
    }
  }else if(item.type==='laundry'){
    const side=item.appliances==='side-by-side';
    box(-w/2+t/2,h/2,0,t,h,d);box(w/2-t/2,h/2,0,t,h,d);
    box(0,h-t/2,0,w,t,d);box(0,t/2,0,w,t,d);box(0,h/2,-d/2+t/2,w,h,t);
    const mw=.60,mh=.85,md=Math.min(.60,d-.04);
    for(let i=0;i<2;i++){
      const x=side?(i===0?-w/4:w/4):0,y=side?t: t+i*(mh+.022);
      box(x,y+mh/2,.005,mw,mh,md,white);
      circle(x,y+mh*.46,md/2+.014,.215,metal);circle(x,y+mh*.46,md/2+.023,.176,glass);
      box(x,y+mh-.09,md/2+.012,mw-.03,.11,.015,white);box(x+.16,y+mh-.09,md/2+.023,.095,.036,.007,dark);
    }
    const cabinetBottom=side?.91:1.77;
    box(0,cabinetBottom,0,w-2*t,t,d);
    if(showFront)for(let i=0;i<2;i++)box((i-.5)*w/2,(h+cabinetBottom)/2,d/2-.012,w/2-.004,h-cabinetBottom-.025,.024,front);
    else box(0,(cabinetBottom+h)/2,0,w-2*t,t,d-.02);
  }
  g.position.set(item.x/100,item.y/100,item.z/100);g.rotation.y=item.rotation*Math.PI/180;g.userData.itemId=item.id;
  return g;
}

import * as THREE from 'three';
import { materials, type MaterialId } from './configuration';
import { buildWardrobe } from './wardrobe-model';
import { asWardrobe, type Furniture, type Room, type Wall } from './room';
import { buildSpecialFurniture } from './special-furniture-model';

export function buildFurniture(item:Furniture,texture:THREE.Texture|null,showFront:boolean):THREE.Group {
  const special=buildSpecialFurniture(item,texture,showFront);if(special)return special;
  const g=new THREE.Group(),w=item.width/100,h=item.height/100,d=item.depth/100,t=.018,base=.075;
  const finish=(id:MaterialId)=>new THREE.MeshStandardMaterial({color:id==='oak'&&texture?'#fff':materials.find(m=>m.id===id)!.color,map:id==='oak'||id==='walnut'?texture:null,roughness:.75});
  const wood=finish(item.material),front=finish(item.front),metal=new THREE.MeshStandardMaterial({color:item.handles==='brass'?'#b99555':'#343b35',metalness:.6,roughness:.35});
  g.userData.materials=[wood,front,metal];
  const box=(x:number,y:number,z:number,sx:number,sy:number,sz:number,material:THREE.Material=wood)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;
  };
  if(item.type==='shelf'){
    box(0,h/2,0,w,h,d); // Its bottom face is exactly the requested mounting height.
  }else if(item.type==='wardrobe'||item.type==='builtin'){
    g.add(buildWardrobe({...asWardrobe(item),doors:item.doors==='hinged'?'hinged':'open'},texture,showFront));
    if(item.type==='builtin'){
      box(-w/2+.013,h/2,d/2+.004,.026,h,.014);
      box(w/2-.013,h/2,d/2+.004,.026,h,.014);
      box(0,h-.018,d/2+.004,w,.036,.014);
    }
    if(item.doors==='sliding'&&showFront){
      const count=Math.max(2,Math.ceil(w/1.1)),leaf=w/count;
      for(let i=0;i<count;i++){
        const z=d/2+.015+(i%2)*.027;
        box(-w/2+leaf*(i+.5),(h+.085)/2,z,leaf-.005,h-.085-.012,.022,front);
        box(-w/2+leaf*(i+1)-.015,(h+.085)/2,z+.018,.018,h-.1,.012,metal);
      }
      box(0,.091,d/2+.023,w,.012,.072,metal);
      box(0,h-.006,d/2+.023,w,.012,.072,metal);
    }
  }else{
    box(-w/2+t/2,(h+base)/2,0,t,h-base,d);
    box(w/2-t/2,(h+base)/2,0,t,h-base,d);
    box(0,h-t/2,0,w-2*t,t,d);box(0,base+t/2,0,w-2*t,t,d);
    box(0,base/2,-.02,w-.04,base,d-.06);
    box(0,(h+base)/2,-d/2+.004,w-2*t,h-base-.02,.008);
    const count=item.sections.length,span=(w-t)/count,inner=span-t;
    for(let i=0;i<count;i++){
      const left=-w/2+t+i*span,x=left+inner/2;
      if(i>0)box(left-t/2,(h+base)/2,0,t,h-base-.036,d-.02);
      const drawers=item.type==='dresser';
      if(drawers){
        const n=item.shelfCount,dh=(h-base-.022)/n;
        for(let j=0;j<n;j++){
          const y=base+.012+(j+.5)*dh;
          box(x,y-dh/2+.02,0,inner-.01,.016,d-.035);
          if(showFront){box(x,y,d/2+.011,span-.004,dh-.006,.021,front);box(x,y+dh*.19,d/2+.032,Math.min(.22,inner*.6),.01,.023,metal);}
        }
      }else{
        for(let j=1;j<=item.shelfCount;j++)box(x,base+(h-base)*j/(item.shelfCount+1),.005,inner,t,d-.025);
        if(item.doors!=='open'&&showFront){
          const leaves=inner>.60?2:1,sw=span/leaves;
          for(let j=0;j<leaves;j++){
            const cx=left-t/2+sw*(j+.5);
            box(cx,(h+base)/2,d/2+.014,sw-.004,h-base-.005,.022,front);
            box(cx+(j%2===0?1:-1)*(sw/2-.04),h*.55,d/2+.038,.012,Math.min(.18,h*.3),.018,metal);
          }
        }
      }
    }
  }
  g.position.set(item.x/100,item.y/100,item.z/100);g.rotation.y=item.rotation*Math.PI/180;
  g.userData.itemId=item.id;
  return g;
}

export type RoomShell={group:THREE.Group;walls:Record<Wall,THREE.Group>;floorTexture:THREE.Texture|null};
export function buildRoom(room:Room,texture:THREE.Texture|null):RoomShell {
  const group=new THREE.Group(),w=room.width/100,l=room.length/100,h=room.height/100,t=.1;
  const plaster=new THREE.MeshStandardMaterial({color:room.wallColor,roughness:.96,side:THREE.DoubleSide});
  const trim=new THREE.MeshStandardMaterial({color:'#f9f9f2',roughness:.7});
  const edge=new THREE.MeshStandardMaterial({color:'#d1d4c6',roughness:.8});
  const glass=new THREE.MeshStandardMaterial({color:'#d2e5e5',roughness:.2,metalness:.1});
  const door=new THREE.MeshStandardMaterial({color:'#c8bdab',roughness:.8});
  const metal=new THREE.MeshStandardMaterial({color:'#4b5347',metalness:.5,roughness:.4});
  const floorTexture=room.floor==='oak'&&texture?texture.clone():null;
  if(floorTexture){floorTexture.repeat.set(w/1.3,l/1.3);floorTexture.needsUpdate=true;}
  const floorMaterial=new THREE.MeshStandardMaterial({color:room.floor==='oak'?'#e9d8b6':room.floor==='light'?'#dfdfd7':'#72776e',map:floorTexture,roughness:.85});
  const floor=new THREE.Mesh(new THREE.BoxGeometry(w+.2,.12,l+.2),floorMaterial);floor.position.y=-.06;floor.receiveShadow=true;group.add(floor);
  // Thin floor seams describe individual boards without needing a second texture.
  const seamMaterial=new THREE.LineBasicMaterial({color:room.floor==='dark'?'#c8cbbd':'#696848',transparent:true,opacity:room.floor==='oak'?.1:.06});
  for(let x=-w/2+.24;x<w/2;x+=.24){const seam=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,.002,-l/2),new THREE.Vector3(x,.002,l/2)]),seamMaterial);group.add(seam);}
  const walls={} as Record<Wall,THREE.Group>;
  for(const wall of ['north','east','south','west'] as Wall[]){
    const wallGroup=new THREE.Group(),length=wall==='north'||wall==='south'?w:l;
    function slab(cx:number,cy:number,sx:number,sy:number,z=0,depth=t,material:THREE.Material=plaster){
      if(sx<=.001||sy<=.001)return;
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,depth),material);mesh.position.set(cx,cy,z);mesh.castShadow=true;mesh.receiveShadow=true;wallGroup.add(mesh);
    }
    const opening=room.openings.find(o=>o.wall===wall);
    if(opening){
      const start=-length/2+opening.offset/100,ow=opening.width/100,oh=opening.height/100,sill=opening.sill/100,cx=start+ow/2;
      slab((-length/2+start)/2,h/2,start+length/2,h);
      slab((start+ow+length/2)/2,h/2,length/2-start-ow,h);
      slab(cx,(sill+oh+h)/2,ow,h-sill-oh);
      if(sill>0)slab(cx,sill/2,ow,sill);
      // Window and door frames occupy actual wall openings.
      slab(start+.027,sill+oh/2,.054,oh+.07,.003,.13,trim);
      slab(start+ow-.027,sill+oh/2,.054,oh+.07,.003,.13,trim);
      slab(cx,sill+oh-.027,ow,.054,.003,.13,trim);
      if(opening.type==='window'){
        slab(cx,sill+.027,ow,.054,.003,.13,trim);slab(cx,sill+oh/2,ow-.10,oh-.10,-.01,.015,glass);
        slab(cx,sill+oh/2,.04,oh-.06,.025,.06,trim);slab(cx,sill-.035,ow+.12,.07,.045,.24,trim);
      }else{
        slab(cx,oh/2,ow-.09,oh-.055,-.04,.035,door);
        slab(start+ow-.16,1.02,.12,.018,.007,.09,metal);
      }
      if(opening.type==='door'){
        slab((-length/2+start)/2,.04,start+length/2,.08,.065,.03,trim);
        slab((start+ow+length/2)/2,.04,length/2-start-ow,.08,.065,.03,trim);
      }else slab(0,.04,length,.08,.065,.03,trim);
    }else{slab(0,h/2,length,h);slab(0,.04,length,.08,.065,.03,trim);}
    slab(0,h+.012,length+.05,.025,0,.115,edge);
    // Local x runs in the same direction as the position values used in the UI.
    if(wall==='north')wallGroup.position.z=-l/2-t/2;
    if(wall==='south'){wallGroup.position.z=l/2+t/2;wallGroup.scale.z=-1;}
    if(wall==='west'){wallGroup.position.x=-w/2-t/2;wallGroup.rotation.y=Math.PI/2;wallGroup.scale.x=-1;}
    if(wall==='east'){wallGroup.position.x=w/2+t/2;wallGroup.rotation.y=-Math.PI/2;}
    walls[wall]=wallGroup;group.add(wallGroup);
  }
  group.userData.materials=[plaster,trim,edge,glass,door,metal,floorMaterial,seamMaterial];
  return {group,walls,floorTexture};
}

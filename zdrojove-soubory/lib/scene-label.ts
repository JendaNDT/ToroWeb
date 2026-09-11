import * as THREE from 'three';

/** Keep annotations at a readable screen size, independent of room size or zoom. */
export function sceneLabel(text: string, maxWidth = 170, colors: {background:string;ink:string;border:string} = {background:'#ffffff',ink:'#1b130c',border:'#d2c8b8'}): THREE.Sprite {
  const ratio = 3, fontSize = 14, padding = 9, height = 30;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = `600 ${fontSize * ratio}px Inter, Arial`;
  const width = Math.min(maxWidth, Math.ceil(ctx.measureText(text).width / ratio) + padding * 2);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  ctx.scale(ratio, ratio);
  ctx.fillStyle = colors.background;
  ctx.beginPath(); ctx.roundRect(.5, .5, width - 1, height - 1, 5); ctx.fill();
  ctx.strokeStyle = colors.border; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = colors.ink;
  ctx.font = `600 ${fontSize}px Inter, Arial`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let caption = text;
  while (caption.length > 1 && ctx.measureText(caption).width > width - padding * 2) caption = caption.slice(0, -2) + '…';
  ctx.fillText(caption, width / 2, height / 2 + .5);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.minFilter = THREE.LinearFilter;
  map.generateMipmaps = false;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, depthTest: false, depthWrite: false, toneMapped: false }));
  sprite.userData.labelPixels = { width, height };
  sprite.renderOrder = 100;
  return sprite;
}

export function sizeSceneLabels(group: THREE.Group, camera: THREE.OrthographicCamera, viewportHeight: number) {
  const unitsPerPixel = (camera.top - camera.bottom) / camera.zoom / Math.max(viewportHeight, 1);
  group.traverse(object => {
    const pixels = object.userData.labelPixels;
    if (object instanceof THREE.Sprite && pixels) object.scale.set(pixels.width * unitsPerPixel, pixels.height * unitsPerPixel, 1);
  });
}

/** Arrange technical labels in screen space without moving their measured anchors. */
export function layoutTechnicalLabels(group:THREE.Group,blockers:THREE.Group,camera:THREE.OrthographicCamera,width:number,height:number) {
  if(width<1||height<1)return;
  const rectangles:{x:number;y:number;w:number;h:number}[]=[];
  for(const o of blockers.children)if(o instanceof THREE.Sprite&&o.userData.labelPixels){
    const projected=o.position.clone().project(camera),size=o.userData.labelPixels;
    rectangles.push({x:(projected.x+1)*width/2,y:(1-projected.y)*height/2,w:size.width+6,h:size.height+6});
  }
  const labels=group.children.filter((o):o is THREE.Sprite=>o instanceof THREE.Sprite&&!!o.userData.anchor);
  for(const label of labels){
    const anchor=label.userData.anchor as THREE.Vector3,ndc=anchor.clone().project(camera),size=label.userData.labelPixels;
    const baseX=(ndc.x+1)*width/2,baseY=(1-ndc.y)*height/2;
    let chosen:{x:number;y:number;w:number;h:number}|undefined;
    // Try nearby columns as well as rows, so clustered plumbing points stay selectable.
    for(let radius=0;radius<12&&!chosen;radius++)for(let dx=-radius;dx<=radius&&!chosen;dx++)for(let dy=-radius;dy<=radius&&!chosen;dy++){
      if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;
      const candidate={x:baseX+dx*(size.width+10),y:baseY+dy*36,w:size.width+6,h:size.height+6};
      if(candidate.x<size.width/2+4||candidate.x>width-size.width/2-4||candidate.y<18||candidate.y>height-18)continue;
      if(!rectangles.some(r=>Math.abs(r.x-candidate.x)<(r.w+candidate.w)/2&&Math.abs(r.y-candidate.y)<(r.h+candidate.h)/2))chosen=candidate;
    }
    label.visible=!!chosen;
    const leader=label.userData.leader as THREE.Line;
    leader.visible=!!chosen;
    if(!chosen)continue;
    rectangles.push(chosen);
    label.position.set(chosen.x/width*2-1,1-chosen.y/height*2,ndc.z).unproject(camera);
    const position=leader.geometry.getAttribute('position') as THREE.BufferAttribute;
    position.setXYZ(0,anchor.x,anchor.y,anchor.z);position.setXYZ(1,label.position.x,label.position.y,label.position.z);position.needsUpdate=true;
    leader.geometry.computeBoundingSphere();
  }
}

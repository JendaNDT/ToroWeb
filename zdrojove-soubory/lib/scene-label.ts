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

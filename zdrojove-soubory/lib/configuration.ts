export type MaterialId = 'oak' | 'walnut' | 'white' | 'sand' | 'graphite';
export type LayoutId = 'hanging' | 'shelves' | 'drawers';
export type Configuration = {
  width: number; height: number; depth: number;
  material: MaterialId; front: MaterialId;
  sections: LayoutId[]; doors: 'hinged' | 'open'; handles: 'black' | 'brass';
};
export const materials: {id: MaterialId; name: string; detail: string; color: string; factor: number}[] = [
  {id:'oak', name:'Dub přírodní', detail:'Jemná kresba dřeva', color:'#bf9567', factor:1.15},
  {id:'walnut', name:'Ořech', detail:'Teplý tmavý dekor', color:'#71513c', factor:1.28},
  {id:'white', name:'Bílá matná', detail:'Čistý, hladký povrch', color:'#eeeae2', factor:1},
  {id:'sand', name:'Písková', detail:'Jemný matný povrch', color:'#b8afa0', factor:1.08},
  {id:'graphite', name:'Grafit', detail:'Tmavě šedý mat', color:'#414543', factor:1.12},
];
export const layouts: {id: LayoutId; name: string; detail: string}[] = [
  {id:'hanging', name:'Na ramínka', detail:'Tyč a horní police'},
  {id:'shelves', name:'Police', detail:'Čtyři nastavitelné police'},
  {id:'drawers', name:'Zásuvky a police', detail:'Tři zásuvky a dvě police'},
];
export const initialConfiguration: Configuration = {
  width:240, height:220, depth:60, material:'oak', front:'sand',
  sections:['hanging','shelves','drawers'], doors:'hinged', handles:'black',
};
export const money = (n: number) => new Intl.NumberFormat('cs-CZ', {style:'currency', currency:'CZK', maximumFractionDigits:0}).format(n);
export function estimate(c: Configuration) {
  const w=c.width/100, h=c.height/100, d=c.depth/100;
  const factor=materials.find(m=>m.id===c.material)!.factor;
  const frontFactor=materials.find(m=>m.id===c.front)!.factor;
  const corpus=Math.round(((c.sections.length+1)*h*d + 2*w*d + w*h*.4)*1180*factor);
  const interior=c.sections.reduce((sum,l)=>sum+(l==='drawers'?3450:l==='shelves'?1550:790),0);
  const doors=c.doors==='open'?0:Math.round(w*h*850*frontFactor + c.sections.length*(c.handles==='brass'?650:390));
  return {corpus,interior,doors,total:corpus+interior+doors};
}
export function setDimension(c: Configuration, key:'width'|'height'|'depth', value: number): Configuration {
  const limits={width:[80,360],height:[160,280],depth:[40,80]};
  if(!Number.isFinite(value)) return c;
  const v=Math.min(limits[key][1],Math.max(limits[key][0],Math.round(value)));
  const next={...c,[key]:v};
  if(key==='width') {
    const count=Math.max(Math.ceil(v/100),Math.min(Math.floor(v/35),c.sections.length));
    next.sections=Array.from({length:count},(_,i)=>c.sections[i]||'shelves');
  }
  return next;
}

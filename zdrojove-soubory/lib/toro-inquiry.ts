import { materials } from './configuration';
import { wallNames, type Furniture, type RoomDesign } from './room';

function describeItem(i:Furniture,n:number):string[] {
  const name=(id:string)=>materials.find(m=>m.id===id)?.name||id;
  const cabinet=['wardrobe','builtin','shoe','dresser','bookcase','tv'].includes(i.type);
  return [
    `${n+1}. ${i.name}${i.existing?' — STÁVAJÍCÍ NÁBYTEK, neobjednávat výrobu':''}`,
    `Š × V × H: ${i.width} × ${i.height} × ${i.depth} cm; nad podlahou ${i.y} cm`,
    `Poloha X/Z od středu pokoje: ${i.x}/${i.z} cm; otočení ${i.rotation}°`,
    `Provedení: ${i.construction==='solid'?'olejovaný masiv':'lamino'}; povrch: ${name(i.material)}`,
    ...(cabinet||i.type==='vanity'||i.type==='laundry'?[`Čela: ${name(i.front)}; kování: ${i.handles==='black'?'černé':'mosazný odstín'}`]:[]),
    ...(cabinet?[
      `Dvířka: ${{hinged:'otevírací',sliding:'posuvná',open:'bez dvířek'}[i.doors]}`,
      `Sekce: ${i.sections.map(s=>({hanging:'ramínka',shelves:'police',drawers:'zásuvky'}[s])).join(', ')}; počet polic/zásuvek: ${i.shelfCount}`,
    ]:[]),
    ...(i.type==='vanity'?[`Počet umyvadel: ${i.basins||1}; zásuvky: ${i.shelfCount}. Výška zahrnuje umyvadlo. Výřez a rozvody k upřesnění.`]:[]),
    ...(i.type==='laundry'?[`Spotřebiče: ${i.appliances==='side-by-side'?'vedle sebe':'nad sebou'} (pouze ilustrační modely, nejsou součástí výroby)`]:[]),
    ...(i.type==='panel'?[`Počet háčků: ${i.hooks||4}`]:[]),
    ...(i.type==='bench'||i.type==='desk'?[`Kovová podnož: ${i.handles==='black'?'černá':'mosazný odstín'}`]:[]),
    '',
  ];
}

export function describeDesign(design:RoomDesign):string {
  return [
    'TORO INTERIORS / '+(design.title||'Můj návrh'),
    `Pokoj: ${design.room.width} × ${design.room.length} cm, výška ${design.room.height} cm`,
    '',
    ...design.room.openings.map(o=>`${o.type==='window'?'Okno':'Dveře'}: ${wallNames[o.wall]}, ${o.width} × ${o.height} cm, odsazení ${o.offset} cm, parapet ${o.sill} cm`),
    '',...design.items.flatMap(describeItem),
    'Orientační podklad pro konzultaci. Materiály, konstrukce a ceny se upřesní s truhlářem.',
  ].join('\n');
}

export function downloadText(text:string,name:string,type='text/plain;charset=utf-8'){
  const url=URL.createObjectURL(new Blob([text],{type}));
  const a=document.createElement('a');a.href=url;a.download=name;a.hidden=true;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

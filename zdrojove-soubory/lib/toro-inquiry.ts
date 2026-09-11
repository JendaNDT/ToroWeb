import { materials } from './configuration';
import { frontProjection, issuesFor, wallNames, type Furniture, type RoomDesign, type Issue } from './room';

function describeItem(i:Furniture,n:number):string[] {
  const name=(id:string)=>materials.find(m=>m.id===id)?.name||id;
  const cabinet=['wardrobe','builtin','shoe','dresser','bookcase','tv'].includes(i.type);
  return [
    `${n+1}. ${i.name}${i.existing?' — STÁVAJÍCÍ NÁBYTEK, neobjednávat výrobu':''}`,
    `Š × V × H: ${i.width} × ${i.height} × ${i.depth} cm; nad podlahou ${i.y} cm`,
    ...(frontProjection(i)>0?[`Hloubka korpusu ${i.depth} cm; včetně čel a kování ${Number((i.depth+frontProjection(i)).toFixed(2))} cm.`]:[]),
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

export function describeDesign(design:RoomDesign,issues:Issue[]=issuesFor(design)):string {
  return [
    'TORO INTERIORS / '+(design.title||'Můj návrh'),
    `Pokoj: ${design.room.width} × ${design.room.length} cm, výška ${design.room.height} cm`,
    '',
    ...design.room.openings.map(o=>`${o.type==='window'?'Okno':'Dveře'}: ${wallNames[o.wall]}, ${o.width} × ${o.height} cm, odsazení ${o.offset} cm, parapet ${o.sill} cm`),
    '',...design.items.flatMap(describeItem),
    'TECHNICKÉ PRVKY',
    ...(design.technicalPoints??[]).map(p=>`${p.name}: ${wallNames[p.wall]}, střed ${p.offset} cm od začátku stěny, ${p.elevation} cm nad podlahou; ${p.width} × ${p.height} cm`),
    '',
    'KONTROLA NÁVRHU',
    ...(issues.length?issues.map(issue=>`${{info:'Informace',warning:'Upozornění',problem:'Problém'}[issue.severity]}: ${issue.text}`):['Bez zjištěných kolizí.']),
    '',
    'Orientační podklad pro konzultaci. Materiály, konstrukce a ceny se upřesní s truhlářem.',
  ].join('\n');
}

export function downloadText(text:string,name:string,type='text/plain;charset=utf-8'){
  const url=URL.createObjectURL(new Blob([text],{type}));
  const a=document.createElement('a');a.href=url;a.download=name;a.hidden=true;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export type InquiryDetails = {
  name:string;email:string;phone:string;city:string;assembly:boolean;timing:string;notes:string;
  photos:{name:string;data:string}[];service:boolean;kind:string;preview:string;summary:string;
};
/** One payload builder for download and round-trip validation. */
export function createInquiryPayload(design:RoomDesign,details:InquiryDetails,warnings:string[]) {
  return {
    format:'toro-inquiry',version:1,createdAt:new Date().toISOString(),
    kind:details.service?details.kind:'Nábytek na míru',
    contact:{name:details.name,email:details.email,phone:details.phone,city:details.city},
    assembly:details.assembly,timing:details.timing,notes:details.notes,photos:details.photos,
    design:details.service?null:design,preview:details.service?null:details.preview,
    summary:details.service?details.notes:details.summary,warnings:details.service?[]:warnings,
  };
}

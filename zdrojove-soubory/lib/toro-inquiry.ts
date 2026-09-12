import { describeTechnicalPlacement, technicalCatalog, accuracyNames, statusNames } from './technical';
import { roomWalls, roomWallName, outlineArea, roomOutline } from './room-geometry';
import { currentAcknowledgement } from './issue-acknowledgements';
import { prototypeBusiness } from './toro-prototype';
import { singleDesign, type SingleDesign } from './workspace';
import { materials } from './configuration';
import { frontProjection, issuesFor, type FurnitureConfiguration, type Furniture, type RoomDesign, type Issue } from './room';

function describeItem(i:FurnitureConfiguration & Partial<Furniture>,n:number,standalone=false):string[] {
  const name=(id:string)=>materials.find(m=>m.id===id)?.name||id;
  const cabinet=['wardrobe','builtin','shoe','dresser','bookcase','tv'].includes(i.type);
  return [
    `${n+1}. ${i.name}${i.existing?' — STÁVAJÍCÍ NÁBYTEK, neobjednávat výrobu':''}`,
    `Š × V × H: ${i.width} × ${i.height} × ${i.depth} cm${standalone?'':`; nad podlahou ${i.y} cm`}`,
    ...(frontProjection(i)>0?[`Hloubka korpusu ${i.depth} cm; včetně čel a kování ${Number((i.depth+frontProjection(i)).toFixed(2))} cm.`]:[]),
    ...(!standalone?[`Poloha X/Z od středu pokoje: ${i.x}/${i.z} cm; otočení ${i.rotation}°`]:[]),
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
    ...(i.notes?[`Zadání: ${i.notes}`]:[]),
    '',
  ];
}

export function describeDesign(design:RoomDesign,issues:Issue[]=issuesFor(design)):string {
  return [
    'TORO INTERIORS / '+(design.title||'Můj návrh'),
    `Pokoj: ${design.room.width} × ${design.room.length} cm, výška ${design.room.height} cm`,
    `Plocha půdorysu: ${Number((outlineArea(roomOutline(design.room))/10000).toFixed(2))} m²; stěn: ${roomWalls(design.room).length}`,
    ...roomWalls(design.room).map((w,i)=>`S${i+1} · ${w.name}: ${Number(w.length.toFixed(1))} cm`),
    '',
    ...design.room.openings.map(o=>`${o.type==='window'?'Okno':'Dveře'}: ${roomWallName(design.room,o.wall)}, ${o.width} × ${o.height} cm, odsazení ${o.offset} cm, parapet ${o.sill} cm`),
    '',...design.items.flatMap((item,n)=>describeItem(item,n)),
    'TECHNICKÉ PRVKY',
    ...(design.technicalPoints??[]).flatMap(p=>[
      `${p.label} · ${p.name} (${technicalCatalog[p.type].name}): ${describeTechnicalPlacement(p,design.room)}; ${p.width} × ${p.height} × ${p.depth} cm`,
      `${statusNames[p.status]}; ${accuracyNames[p.accuracy]}; ${p.locked?'poloha zamčená':'poloha odemčená'}. Přístup: ${p.accessDepth?`${p.accessDepth} cm před prvkem`:'prostor nezadaný'}.`,
      ...(p.linkedItemId?[`Přiřazeno: ${design.items.find(i=>i.id===p.linkedItemId)?.name??'odebraný kus'} (${p.linkedItemId}).`]:[]),
      ...(p.groupId?[`Skupina: ${(design.technicalPoints??[]).filter(t=>t.groupId===p.groupId).map(t=>t.label).join(', ')}.`]:[]),
      ...(p.notes?[`Poznámka: ${p.notes}`]:[]),
    ]),
    '',
    'KONTROLA NÁVRHU',
    ...(issues.length?issues.map(issue=>{const a=currentAcknowledgement(design,issue);return `${{info:'Informace',warning:'Upozornění',problem:'Problém'}[issue.severity]}: ${issue.text}${a?` [Zákazník vzal na vědomí ${a.acknowledgedAt}${a.note?`; ${a.note}`:''}; nejde o odstranění problému.]`:''}`;}):['Bez zjištěných kolizí podle zadaných údajů. Nezadané sítě a instalační podmínky nejsou ověřené.']),
    '',
    'PROTOTYP — cenotvorba a příjemce poptávek budou doplněni. Cena se nepočítá a nic se neodesílá.',
    'Orientační podklad pro konzultaci. Materiály, konstrukce a ceny se upřesní s truhlářem.',
  ].join('\n');
}

export function describeSingle(item:FurnitureConfiguration):string {
  return ['TORO INTERIORS / Samostatný kus',...describeItem(item,0,true),
    'Materiály, konstrukci a montáž upřesní TORO. Rozměry jsou v centimetrech.',
    'PROTOTYP — cena se nepočítá, příjemce není nastaven a nic se neodesílá.'].join('\n');
}

export function downloadText(text:string,name:string,type='text/plain;charset=utf-8'){
  const url=URL.createObjectURL(new Blob([text],{type}));
  const a=document.createElement('a');a.href=url;a.download=name;a.hidden=true;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export type InquiryDetails = {
  name:string;email:string;phone:string;city:string;assembly:boolean;timing:string;notes:string;
  photos:{name:string;data:string}[];service:boolean;kind:string;preview:string;planPreview?:string;summary:string;
};
/** One payload builder for download and round-trip validation. */
export function createInquiryPayload(design:RoomDesign|SingleDesign,details:InquiryDetails,warnings:string[]) {
  const single='format' in design;
  return {
    format:'toro-inquiry',version:1,createdAt:new Date().toISOString(),business:prototypeBusiness,
    kind:details.service?details.kind:'Nábytek na míru',
    contact:{name:details.name,email:details.email,phone:details.phone,city:details.city},
    assembly:details.assembly,timing:details.timing,notes:details.notes,photos:details.photos,
    design:details.service?null:single?singleDesign(design.item):design,preview:details.service?null:details.preview,previews:details.service?null:{perspective:details.preview,...(!single?{plan:details.planPreview??''}:{})},acknowledgements:details.service||single?[]:issuesFor(design).flatMap(i=>{const a=currentAcknowledgement(design,i);return a?[{...a,text:i.text,severity:i.severity}]:[]}),
    summary:details.service?details.notes:details.summary,warnings:details.service?[]:warnings,
  };
}

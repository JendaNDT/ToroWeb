import { createTechnicalBundle, newTechnicalPoint } from './technical';
import { shapeOutline } from './room-geometry';
import { newFurniture, normalizeItem, type Furniture, type FurnitureType, type RoomDesign } from './room';

export type TemplateId='hall'|'bath'|'wardrobe'|'office'|'living'|'bedroom';
export const templates:{id:TemplateId;name:string;description:string;detail:string;tag:string}[]=[
  {id:'hall',name:'Předsíň s lavicí',description:'Místo pro každý příchod domů.',detail:'Skříň · lavice · věšáky · zrcadlo',tag:'5 prvků'},
  {id:'bath',name:'Koupelna v dubu',description:'Čisté linie a praktické úložné místo.',detail:'Umyvadlo · pračka · přípojky · žebřík',tag:'4 kusy + sítě'},
  {id:'wardrobe',name:'Šatna na míru',description:'Od podlahy až ke stropu.',detail:'Vestavěná skříň · komoda · zrcadlo',tag:'3 prvky'},
  {id:'office',name:'Klidná pracovna',description:'Prostor na práci i nové nápady.',detail:'Stůl · knihovna · police',tag:'3 prvky'},
  {id:'living',name:'Obývací sestava',description:'Lehká sestava s místem na knihy.',detail:'TV skříňka · knihovna · police',tag:'3 prvky'},
  {id:'bedroom',name:'Ložnice do L',description:'Ukázka členité místnosti a vlastního zadání.',detail:'Postel · skříň · atypický kus · dvě okna',tag:'Nové možnosti'},
];
export function createTemplate(id:TemplateId):RoomDesign {
  const d:RoomDesign={version:4,technicalPoints:[],title:templates.find(t=>t.id===id)!.name,room:{width:420,length:330,height:270,wallColor:'#eeece7',floor:'oak',openings:[{id:'entry',type:'door',wall:'west',offset:220,width:90,height:210,sill:0}]},items:[]};
  const add=(type:FurnitureType,patch:Partial<Furniture>)=>{d.items.push(normalizeItem({...newFurniture(type,d.room,`${id}-${d.items.length+1}`),...patch},d.room));};
  if(id==='hall'){
    add('builtin',{width:110,x:-150,z:-132.5,front:'sand',sections:['hanging','shelves']});
    add('bench',{width:120,depth:40,x:-30,z:-145,construction:'solid'});
    add('panel',{width:120,height:135,x:-30,y:65,z:-161,hooks:5});
    add('mirror',{width:70,x:95,z:-163,y:90});
    add('shoe',{width:70,height:75,x:95,z:-147.5,front:'sand',shelfCount:3});
  }else if(id==='bath'){
    d.room={...d.room,width:360,length:320,floor:'light',openings:[{id:'entry',type:'door',wall:'west',offset:210,width:80,height:210,sill:0}]};
    add('vanity',{width:140,x:-70,z:-135,y:25,front:'oak',basins:2,construction:'solid'});
    add('mirror',{width:140,height:90,x:-70,z:-158,y:100});
    add('laundry',{x:95,z:-125,front:'white'});
    add('shelf',{width:70,x:95,z:-147.5,y:235});
    let sequence=0;const nextId=()=>`bath-technical-${++sequence}`;
    d.technicalPoints=createTechnicalBundle('sink',d,nextId,'bath-1');
    d.technicalPoints.push(...createTechnicalBundle('laundry',d,nextId,'bath-3'));
    d.technicalPoints.push({...newTechnicalPoint('towelRail',d.room,nextId(),d.technicalPoints),placement:{surface:'wall',wall:'east',offset:220,elevation:100},notes:'Ukázkový žebřík; přeměřte rozměry a prostor pro přístup.'});
  }else if(id==='wardrobe'){
    d.room.width=440;
    add('builtin',{width:240,x:-85,z:-132.5,front:'white',sections:['hanging','shelves','drawers']});
    add('dresser',{width:110,height:85,x:100,z:-142.5,front:'oak'});
    add('mirror',{width:80,height:120,x:100,z:-163,y:105});
  }else if(id==='office'){
    d.room.width=400;d.room.length=360;
    add('desk',{width:150,x:-70,z:-147.5,construction:'solid'});
    add('bookcase',{width:80,x:95,z:-164,height:210,shelfCount:5});
    add('shelf',{width:140,x:-70,z:-167.5,y:150});
  }else if(id==='bedroom'){
    d.room={...d.room,width:600,length:500,openings:[
      {id:'entry',type:'door',wall:'south',offset:250,width:90,height:210,sill:0},
      {id:'window-a',type:'window',wall:'north',offset:40,width:130,height:120,sill:110},
      {id:'window-b',type:'window',wall:'north',offset:300,width:120,height:120,sill:110},
    ]};
    d.room.outline=shapeOutline(d.room,'l');
    add('bed',{x:-120,z:-130,construction:'solid',notes:'Ukázkové zadání: postel s čelem. Matrace a detaily konstrukce k doplnění.'});
    add('wardrobe',{width:120,x:200,z:-210,front:'sand'});
    add('custom',{name:'Atypický úložný box',width:80,height:65,depth:60,x:-235,z:170,notes:'Ukázkové zadání: úložný box na míru. Vnitřní členění, kování a cenu doplní TORO.'});
  }else{
    d.room.width=480;d.room.length=400;
    add('tv',{width:180,x:-60,z:-180,y:20,front:'white',sections:['shelves','shelves','shelves'],shelfCount:1});
    add('bookcase',{width:80,x:100,z:-184,height:200,shelfCount:5});
    add('shelf',{width:170,x:-60,z:-187.5,y:170});
  }
  return d;
}
export const furnitureCategories=[
  {id:'all',name:'Všechny',types:[]},
  {id:'storage',name:'Úložné',types:['wardrobe','builtin','dresser','bookcase','shelf','tv']},
  {id:'hall',name:'Předsíň',types:['builtin','shoe','bench','panel','mirror']},
  {id:'bath',name:'Koupelna',types:['vanity','laundry','mirror','shelf']},
  {id:'sleep',name:'Ložnice',types:['bed','wardrobe','builtin','dresser']},
  {id:'other',name:'Atypické',types:['custom']},
  {id:'work',name:'Pracovna',types:['desk','bookcase','shelf']},
] as const;

import { newFurniture, normalizeItem, type Furniture, type FurnitureType, type RoomDesign } from './room';

export type TemplateId='hall'|'bath'|'wardrobe'|'office'|'living';
export const templates:{id:TemplateId;name:string;description:string;detail:string;tag:string}[]=[
  {id:'hall',name:'Předsíň s lavicí',description:'Místo pro každý příchod domů.',detail:'Skříň · lavice · věšáky · zrcadlo',tag:'5 prvků'},
  {id:'bath',name:'Koupelna v dubu',description:'Čisté linie a praktické úložné místo.',detail:'Umyvadlo · zrcadlo · prádelní skříň',tag:'4 prvky'},
  {id:'wardrobe',name:'Šatna na míru',description:'Od podlahy až ke stropu.',detail:'Vestavěná skříň · komoda · zrcadlo',tag:'3 prvky'},
  {id:'office',name:'Klidná pracovna',description:'Prostor na práci i nové nápady.',detail:'Stůl · knihovna · police',tag:'3 prvky'},
  {id:'living',name:'Obývací sestava',description:'Lehká sestava s místem na knihy.',detail:'TV skříňka · knihovna · police',tag:'3 prvky'},
];
export function createTemplate(id:TemplateId):RoomDesign {
  const d:RoomDesign={version:1,title:templates.find(t=>t.id===id)!.name,room:{width:420,length:330,height:270,wallColor:'#eeece7',floor:'oak',openings:[{id:'entry',type:'door',wall:'west',offset:220,width:90,height:210,sill:0}]},items:[]};
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
  {id:'work',name:'Pracovna',types:['desk','bookcase','shelf']},
] as const;

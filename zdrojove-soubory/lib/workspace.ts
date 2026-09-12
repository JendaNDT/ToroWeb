import { z } from 'zod';
import { furnitureConfigurationSchema, furnitureConfiguration, newFurnitureConfiguration, defaultMountHeight, findFreePosition, parseDesign, roomDesignSchema, type FurnitureConfiguration, type RoomDesign } from './room';
import { readRoomDraft } from './room-storage';

export type Workspace = {
  format:'toro-workspace'; version:1; mode:'single'|'room'; single:FurnitureConfiguration;
  room:RoomDesign|null; edit:{itemId:string; draft:FurnitureConfiguration; original:string}|null;
};
export const workspaceKey='toro-workspace-v1';
export const initialWorkspace=():Workspace=>({format:'toro-workspace',version:1,mode:'single',single:newFurnitureConfiguration('wardrobe'),room:null,edit:null});
const workspaceSchema=z.object({format:z.literal('toro-workspace'),version:z.literal(1),mode:z.enum(['single','room']),single:furnitureConfigurationSchema,room:roomDesignSchema.nullable(),edit:z.object({itemId:z.string().min(1).max(80),draft:furnitureConfigurationSchema,original:z.string().max(10000)}).strict().nullable()}).strict();
export function parseWorkspace(value:unknown):Workspace {return workspaceSchema.parse(value);}
export type SingleDesign={format:'toro-furniture';version:1;item:FurnitureConfiguration};
export const singleDesign=(item:FurnitureConfiguration):SingleDesign=>({format:'toro-furniture',version:1,item});
const singleSchema=z.object({format:z.literal('toro-furniture'),version:z.literal(1),item:furnitureConfigurationSchema}).strict();
const legacySchema=z.object({width:z.number().int().min(80).max(360),height:z.number().int().min(160).max(280),depth:z.number().int().min(40).max(80),material:z.enum(['oak','walnut','white','sand','graphite']),front:z.enum(['oak','walnut','white','sand','graphite']),sections:z.array(z.enum(['hanging','shelves','drawers'])).min(1).max(6),doors:z.enum(['hinged','open']),handles:z.enum(['black','brass'])}).strict().refine(c=>c.width/c.sections.length>=35&&c.width/c.sections.length<=100);
export function migrateWardrobe(value:unknown):FurnitureConfiguration {
  return furnitureConfigurationSchema.parse({...newFurnitureConfiguration('wardrobe'),...legacySchema.parse(value)});
}
export function parseSingle(value:unknown):FurnitureConfiguration {
  if(value&&typeof value==='object'&&'format' in value){
    if(value.format==='toro-inquiry'&&'design' in value){
      // The retired wardrobe exported a clearly labelled display-only room.
      // Recognize that exact legacy contract, never infer standalone intent from an ordinary one-item room.
      if('summary' in value&&typeof value.summary==='string'&&value.summary.startsWith('Samostatná skříň. Pokoj v exportu slouží pouze pro zobrazení;')){
        const legacy=parseDesign(value);
        if(legacy.title==='Samostatná skříň'&&legacy.items.length===1&&legacy.items[0].id==='wardrobe-single'&&legacy.items[0].type==='wardrobe')return furnitureConfigurationSchema.parse(furnitureConfiguration(legacy.items[0]));
      }
      return singleSchema.parse(value.design).item;
    }
    return singleSchema.parse(value).item;
  }
  return migrateWardrobe(value);
}
/** Import replaces just the relevant concept unless an explicit workspace backup is opened. */
export function importWorkspace(current:Workspace,value:unknown):Workspace {
  if(value&&typeof value==='object'&&'format' in value&&value.format==='toro-workspace')return parseWorkspace(value);
  try{return {...current,single:parseSingle(value),edit:null,mode:'single'};}catch{}
  return {...current,room:parseDesign(value),edit:null,mode:'room'};
}
export function readWorkspace(storage:Pick<Storage,'getItem'>):Workspace {
  const raw=storage.getItem(workspaceKey);
  // Do not silently fall back from a damaged current record to obsolete drafts.
  if(raw!==null)return parseWorkspace(JSON.parse(raw));
  const legacy=storage.getItem('forma-design-v1');
  return {...initialWorkspace(),single:legacy===null?newFurnitureConfiguration('wardrobe'):migrateWardrobe(JSON.parse(legacy)),room:readRoomDraft(storage)};
}
export function restoreWorkspaceSaving(storage:Pick<Storage,'getItem'|'setItem'>,workspace:Workspace) {
  const snapshot=JSON.stringify(parseWorkspace(workspace)),previous=storage.getItem(workspaceKey);
  if(previous!==null&&previous!==snapshot){
    const prefix=`${workspaceKey}-backup-${Date.now()}`;let key=prefix;
    for(let n=1;storage.getItem(key)!==null;n++)key=`${prefix}-${n}`;
    storage.setItem(key,previous); // If this fails, the original MUST remain intact.
  }
  storage.setItem(workspaceKey,snapshot);return snapshot;
}
export function insertSingle(workspace:Workspace,id:string):Workspace {
  if(!workspace.room)throw Error('Nejprve vytvořte pokoj. Váš kus zůstává připravený.');
  if(workspace.room.items.length>=30)throw Error('V pokoji je už 30 kusů. Před vložením některý odeberte.');
  const room=workspace.room,config=workspace.single;
  if([...room.items,...room.room.openings,...(room.technicalPoints??[])].some(i=>i.id===id))throw Error('Tento identifikátor už v návrhu existuje.');
  const candidate={...config,id,x:0,z:0,y:Math.max(0,Math.min(defaultMountHeight(config.type),room.room.height-config.height)),existing:false};
  let placed:ReturnType<typeof findFreePosition>=null;
  for(const rotation of [0,90,180,270] as const){placed=findFreePosition({...candidate,rotation},room);if(placed)break;}
  if(!placed)throw Error('Pro tento kus není volné místo. Jeho rozměry jsme zachovali. Zvětšete pokoj nebo přesuňte nábytek.');
  return {...workspace,mode:'room',room:{...room,items:[...room.items,placed]}};
}
export function beginFurnitureEdit(workspace:Workspace,itemId:string):Workspace {
  const item=workspace.room?.items.find(i=>i.id===itemId);
  if(!item)throw Error('Kus už není v pokoji.');
  const draft=furnitureConfiguration(item);
  return {...workspace,mode:'single',edit:{itemId,draft,original:JSON.stringify(draft)}};
}
export function commitFurnitureEdit(workspace:Workspace):Workspace {
  const edit=workspace.edit,room=workspace.room;
  if(!edit||!room)throw Error('Úprava už není dostupná.');
  const item=room.items.find(i=>i.id===edit.itemId);
  if(!item)throw Error('Kus byl z pokoje odebrán. Zrušte úpravy nebo je uložte jako samostatný kus.');
  if(JSON.stringify(furnitureConfiguration(item))!==edit.original)throw Error('Kus se mezitím změnil v pokoji. Uložte tuto úpravu do souboru nebo ji zrušte a otevřete aktuální kus.');
  const config=furnitureConfigurationSchema.parse(edit.draft);
  // Parameter edits deliberately keep exact placement, identity and utility links.
  // Geometry outside the room stays visible as a collision; it is never silently shrunk or moved.
  return {...workspace,edit:null,mode:'room',room:{...room,items:room.items.map(i=>i.id===edit.itemId?{...i,...config}:i)}};
}
export type WorkspaceHistory={past:Workspace[];present:Workspace;future:Workspace[]};
export type WorkspaceAction={type:'load';value:Workspace}|{type:'change';update:(value:Workspace)=>Workspace}|{type:'undo'|'redo'};
export function workspaceReducer(state:WorkspaceHistory,action:WorkspaceAction):WorkspaceHistory {
  if(action.type==='load')return {past:[],present:action.value,future:[]};
  if(action.type==='undo'){const next=state.past.at(-1);return next?{past:state.past.slice(0,-1),present:next,future:[state.present,...state.future]}:state;}
  if(action.type==='redo'){const next=state.future[0];return next?{past:[...state.past,state.present].slice(-40),present:next,future:state.future.slice(1)}:state;}
  if(action.type!=='change')return state;
  const next=action.update(state.present);
  return JSON.stringify(next)===JSON.stringify(state.present)?state:{past:[...state.past,state.present].slice(-40),present:next,future:[]};
}

import type { RoomDesign } from './room';
export type History = { past: RoomDesign[]; present: RoomDesign; future: RoomDesign[] };
export type HistoryAction = {type:'change'; update:(design:RoomDesign)=>RoomDesign} | {type:'load';design:RoomDesign} | {type:'undo'|'redo'};
export function historyReducer(state:History,action:HistoryAction):History {
  if(action.type==='load')return {past:[],present:action.design,future:[]};
  if(action.type==='undo') {
    const previous=state.past.at(-1);
    return previous?{past:state.past.slice(0,-1),present:previous,future:[state.present,...state.future]}:state;
  }
  if(action.type==='redo') {
    const next=state.future[0];
    return next?{past:[...state.past,state.present].slice(-40),present:next,future:state.future.slice(1)}:state;
  }
  if(action.type!=='change')return state;
  const next=action.update(state.present);
  return JSON.stringify(next)===JSON.stringify(state.present)?state:{past:[...state.past,state.present].slice(-40),present:next,future:[]};
}

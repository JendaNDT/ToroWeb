import { roomDesignSchema, parseDesign, type RoomDesign } from './room';

export const roomStorageKey='toro-room-v4';
type DraftStorage=Pick<Storage,'getItem'|'setItem'>;

/** Prefer the current draft. Corruption must not silently restore an older project. */
export function readRoomDraft(storage:Pick<Storage,'getItem'>):RoomDesign|null {
  const raw=storage.getItem(roomStorageKey)??storage.getItem('toro-room-v3')??storage.getItem('toro-room-v2')??storage.getItem('toro-room-v1')??storage.getItem('forma-room-v1');
  return raw===null?null:parseDesign(JSON.parse(raw));
}

/** Explicit recovery only: a failed backup must abort the replacement. */
export function restoreRoomSaving(storage:DraftStorage,design:RoomDesign) {
  const canonical=roomDesignSchema.parse(design);
  const snapshot=JSON.stringify(canonical),previous=storage.getItem(roomStorageKey);
  let backupKey:string|null=null;
  if(previous!==null&&previous!==snapshot){
    const prefix=`${roomStorageKey}-backup-${Date.now()}`;
    backupKey=prefix;
    for(let n=1;storage.getItem(backupKey)!==null;n++)backupKey=`${prefix}-${n}`;
    storage.setItem(backupKey,previous);
  }
  storage.setItem(roomStorageKey,snapshot);
  return {snapshot,backupKey};
}

import { roomDesignSchema, type RoomDesign } from './room';

export const roomStorageKey='toro-room-v2';
type DraftStorage=Pick<Storage,'getItem'|'setItem'>;

/** Explicit recovery only: a failed backup must abort the replacement. */
export function restoreRoomSaving(storage:DraftStorage,design:RoomDesign) {
  roomDesignSchema.parse(design);
  const snapshot=JSON.stringify(design),previous=storage.getItem(roomStorageKey);
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

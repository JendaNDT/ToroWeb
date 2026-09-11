'use client';
import { useEffect, useReducer, useState } from 'react';
import { historyReducer } from '@/lib/planner-history';
import { parseDesign, upgradeDesign, type RoomDesign } from '@/lib/room';
import { createTemplate } from '@/lib/toro-templates';
import { roomStorageKey as storageKey, restoreRoomSaving } from '@/lib/room-storage';
export function useRoomDesign() {
  const [history,dispatch]=useReducer(historyReducer,undefined,()=>({past:[],present:upgradeDesign(createTemplate('hall')),future:[]}));
  const [ready,setReady]=useState(false),[savedSnapshot,setSavedSnapshot]=useState(''),[storageError,setStorageError]=useState('');
  const design=history.present;
  // Restore before enabling persistence: the default room must never overwrite a saved design.
  /* Browser-local state can only be restored after server hydration. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(()=>{
    try {
      const raw=localStorage.getItem(storageKey)??localStorage.getItem('toro-room-v1')??localStorage.getItem('forma-room-v1');
      if(raw)dispatch({type:'load',design:parseDesign(JSON.parse(raw))});
      setStorageError('');
    }catch{setStorageError('Uložený návrh se nepodařilo načíst. Původní data zůstávají v prohlížeči; nový návrh zatím ukládejte stažením souboru.');return;}
    finally {setReady(true);}
  },[]);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(()=>{
    if(!ready||storageError)return;
    const data=JSON.stringify(design);
    function persist() {
      try {localStorage.setItem(storageKey,data);setSavedSnapshot(data);}
      catch {setStorageError('V prohlížeči není možné ukládat. Stáhněte návrh do souboru.');}
    }
    const timer=window.setTimeout(persist,400);
    const onHidden=()=>{if(document.visibilityState==='hidden')persist();};
    window.addEventListener('pagehide',persist);document.addEventListener('visibilitychange',onHidden);
    return()=>{clearTimeout(timer);window.removeEventListener('pagehide',persist);document.removeEventListener('visibilitychange',onHidden);};
  },[design,ready,storageError]);
  function save() {
    if(storageError)return false;
    try {const data=JSON.stringify(design);localStorage.setItem(storageKey,data);setSavedSnapshot(data);return true;}
    catch {setStorageError('Uložení není dostupné. Stáhněte návrh do souboru.');return false;}
  }
  function recoverSaving() {
    if(!ready)return false;
    try {
      const {snapshot}=restoreRoomSaving(localStorage,design);
      setSavedSnapshot(snapshot);setStorageError('');return true;
    }catch{setStorageError('Ukládání se nepodařilo obnovit. Původní záznam zůstává zachovaný. Uvolněte místo v prohlížeči nebo stáhněte návrh a zkuste to znovu.');return false;}
  }
  return {history,design,dispatch,ready,storageError,saved:savedSnapshot===JSON.stringify(design),save,recoverSaving,change:(update:(d:RoomDesign)=>RoomDesign)=>dispatch({type:'change',update})};
}

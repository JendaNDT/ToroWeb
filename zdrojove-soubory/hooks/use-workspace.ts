'use client';
import { useEffect, useReducer, useRef, useState } from 'react';
import { initialWorkspace, parseWorkspace, readWorkspace, restoreWorkspaceSaving, workspaceKey, workspaceReducer, type Workspace } from '@/lib/workspace';

export function useWorkspace(){
  const [history,dispatch]=useReducer(workspaceReducer,undefined,()=>({past:[],present:initialWorkspace(),future:[]}));
  const [ready,setReady]=useState(false),[storageError,setStorageError]=useState(''),[savedSnapshot,setSavedSnapshot]=useState('');
  const lastStored=useRef<string|null>(null),workspace=history.present;
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(()=>{
    try{dispatch({type:'load',value:readWorkspace(localStorage)});lastStored.current=localStorage.getItem(workspaceKey);}
    catch{setStorageError('Uložený návrh se nepodařilo načíst. Původní záznamy zůstávají zachované. Pokračujte stažením zálohy nebo výslovně obnovte ukládání.');}
    finally{setReady(true);}
  },[]);
  /* eslint-enable react-hooks/set-state-in-effect */
  function save(){
    if(!ready||storageError)return false;
    try{
      if(localStorage.getItem(workspaceKey)!==lastStored.current)throw Error('conflict');
      const raw=JSON.stringify(parseWorkspace(workspace));localStorage.setItem(workspaceKey,raw);lastStored.current=raw;setSavedSnapshot(raw);return true;
    }catch{setStorageError('Ukládání není dostupné nebo byl návrh změněn v jiném okně. Stáhněte zálohu. Obnova ukládání nejprve zachová předchozí záznam.');return false;}
  }
  useEffect(()=>{
    if(!ready||storageError)return;
    const persist=()=>{
      try{
        if(localStorage.getItem(workspaceKey)!==lastStored.current)throw Error('conflict');
        const raw=JSON.stringify(parseWorkspace(workspace));localStorage.setItem(workspaceKey,raw);lastStored.current=raw;setSavedSnapshot(raw);
      }catch{setStorageError('Automatické ukládání je pozastavené. Úložiště není dostupné nebo byl návrh změněn v jiném okně. Původní data jsme nepřepsali.');}
    };
    const timer=setTimeout(persist,400),hidden=()=>{if(document.visibilityState==='hidden')persist();};
    window.addEventListener('pagehide',persist);document.addEventListener('visibilitychange',hidden);
    return()=>{clearTimeout(timer);window.removeEventListener('pagehide',persist);document.removeEventListener('visibilitychange',hidden);};
  },[workspace,ready,storageError]);
  function recoverSaving(){
    if(!ready)return false;
    try{const raw=restoreWorkspaceSaving(localStorage,workspace);lastStored.current=raw;setSavedSnapshot(raw);setStorageError('');return true;}
    catch{setStorageError('Obnova ukládání se nezdařila. Původní záznam zůstává zachovaný; stáhněte zálohu do souboru.');return false;}
  }
  return {history,workspace,dispatch,ready,storageError,saved:savedSnapshot===JSON.stringify(parseWorkspace(workspace)),save,recoverSaving,change:(update:(w:Workspace)=>Workspace)=>dispatch({type:'change',update})};
}

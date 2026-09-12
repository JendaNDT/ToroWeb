'use client';
import { ChevronDown, Download, FolderOpen, Save } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';

export function DesignMenu({onSave,onLoad,onLegacy,onSingle,onRoom,onBackup}:{onSave:()=>void;onLoad:()=>void;onLegacy:()=>void;onSingle:()=>void;onRoom?:()=>void;onBackup:()=>void}) {
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="toro-design-menu-trigger">Návrh <ChevronDown size={16}/></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="toro-design-menu" aria-label="Soubory návrhu">
      <DropdownMenuItem onSelect={onSave}><Save/> Uložit návrh</DropdownMenuItem>
      <DropdownMenuItem onSelect={onLoad}><FolderOpen/> Načíst návrh</DropdownMenuItem>
      <DropdownMenuItem onSelect={onLegacy}>Načíst původní skříň</DropdownMenuItem>
      <DropdownMenuSeparator/>
      <DropdownMenuLabel>Stáhnout do souboru</DropdownMenuLabel>
      <DropdownMenuItem onSelect={onSingle}><Download/> Stáhnout kus</DropdownMenuItem>
      {onRoom&&<DropdownMenuItem onSelect={onRoom}><Download/> Stáhnout pokoj</DropdownMenuItem>}
      <DropdownMenuItem onSelect={onBackup}><Download/> Záloha prostředí</DropdownMenuItem>
      <p className="toro-menu-note">Záloha obsahuje kus, pokoj i rozpracovanou úpravu.</p>
    </DropdownMenuContent>
  </DropdownMenu>;
}

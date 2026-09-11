'use client';

import { useId, useState } from 'react';
import { Check, DoorOpen, Layers3, Palette, Ruler, type LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { materials, type MaterialId } from '@/lib/configuration';

export const furnitureSteps = [
  { name: 'Rozměry', icon: Ruler },
  { name: 'Materiály', icon: Palette },
  { name: 'Uspořádání', icon: Layers3 },
  { name: 'Dvířka', icon: DoorOpen },
];

export function FurnitureSteps({ steps = furnitureSteps, step, onChange }: {
  steps?: { name: string; icon: LucideIcon }[];
  step: number;
  onChange: (step: number) => void;
}) {
  return <nav className="step-nav" aria-label="Kroky návrhu" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
    {steps.map((s, i) => <button key={s.name} className={`step-item ${step === i ? 'active' : ''}`} onClick={() => onChange(i)} aria-current={step === i ? 'step' : undefined}>
      <s.icon size={19}/><span>{s.name}</span><i/>
    </button>)}
  </nav>;
}

export function DimensionField({ label, value, min, max, onChange, unit = 'cm' }: {
  label: string; value: number; min: number; max: number; onChange: (value: number) => void; unit?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  function commit() {
    if (draft !== null && draft.trim() && Number.isFinite(Number(draft))) {
      onChange(Math.max(min, Math.min(max, Math.round(Number(draft)))));
    }
    setDraft(null);
  }
  return <div className="dimension-field">
    <div className="dimension-title"><label htmlFor={id}>{label}</label><div className="dimension-input">
      <Input id={id} type="number" min={min} max={max} step={1} value={draft ?? String(value)} onChange={e => setDraft(e.target.value)} onBlur={commit} onKeyDown={e => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') { e.preventDefault(); setDraft(null); }
      }}/><span>{unit}</span>
    </div></div>
    <Slider aria-label={label} value={[value]} min={min} max={max} step={1} onValueChange={v => onChange(v[0])}/>
    <div className="range-limits"><span>{min} {unit}</span><span>{max} {unit}</span></div>
  </div>;
}

export function MaterialPicker({ title, value, onChange, compact = false, woodOnly = false }: {
  title: string; value: MaterialId; onChange: (value: MaterialId) => void; compact?: boolean; woodOnly?: boolean;
}) {
  return <div className={`material-picker ${compact ? 'compact' : ''}`} role="group" aria-label={title}>
    <div className="field-label">{title}<span>{materials.find(m => m.id === value)!.name}</span></div>
    <div className="swatches">{materials.filter(m=>!woodOnly||['oak','walnut'].includes(m.id)).map(m => <button key={m.id} className={`swatch ${m.id === value ? 'selected' : ''}`} onClick={() => onChange(m.id)} aria-label={m.name} aria-pressed={m.id === value} title={m.name}>
      <span className={`swatch-color mat-${m.id}`}>{m.id === value && <Check size={17}/>}</span><span className="swatch-name">{m.name}</span>
    </button>)}</div>
  </div>;
}

export function LayoutDiagram({ layout }: { layout: string }) {
  return <svg className="layout-diagram" width="32" height="43" viewBox="0 0 32 43" fill="none" aria-hidden="true">
    <rect x="4.5" y="2.5" width="23" height="37" rx=".5"/>
    {layout === 'hanging' ? <><path d="M5 10h22M5 32h22M8 14h16"/><path d="M16 15v3l-6 4h12l-6-4"/></> : layout === 'shelves' ? <path d="M5 10h22M5 18h22M5 25h22M5 32h22"/> : <path d="M5 11h22M5 20h22M5 26h22M5 32h22M12 23h8M12 29h8M12 35h8"/>}
  </svg>;
}

'use client';

import { useRef, useState } from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowRight, Check, ChevronDown, DoorOpen, Layers3, Leaf, Move, PanelsTopLeft, RotateCw, Rows3, Ruler, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { DimensionField, FurnitureSteps, LayoutDiagram, MaterialPicker, furnitureSteps } from '@/components/furniture-fields';
import { FurnitureIcon, NumberField } from '@/components/room-controls';
import { layouts, materials } from '@/lib/configuration';
import { attachToWall, canMount, furnitureLimits, wallNames, type Furniture, type Room, type Wall, type Issue } from '@/lib/room';

export function FurnitureControls({ item, room, issues, onChange, onDuplicate, onDelete, onShowFrontChange, onSummary }: {
  item: Furniture; room: Room; issues: Issue[];
  onChange: (patch: Partial<Furniture>) => void;
  onDuplicate: () => void; onDelete: () => void;
  onShowFrontChange: (show: boolean) => void; onSummary: () => void;
}) {
  const [step, setStep] = useState(0);
  const [section, setSection] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const tall = item.type === 'wardrobe' || item.type === 'builtin';
  const shelf = item.type === 'shelf';
  const dresser = item.type === 'dresser';
  const bookcase = item.type === 'bookcase';
  const simple = ['shelf','bench','mirror','desk'].includes(item.type);
  const special = ['panel','vanity','laundry'].includes(item.type);
  const limits = furnitureLimits(item.type);
  const steps = simple ? furnitureSteps.slice(0, 2) : special ? furnitureSteps.slice(0,3).map((s,i)=>i===2?{...s,name:'Vybavení'}:s) : bookcase ? furnitureSteps.slice(0, 3) : furnitureSteps.map((s, i) => dresser && i === 3 ? { name: 'Čela', icon: Rows3 } : s);
  const selectedSection = Math.min(section, item.sections.length - 1);
  const ownIssues = issues.filter(i => i.itemIds.includes(item.id));
  const material = materials.find(m => m.id === item.material)!;

  function chooseStep(next: number) {
    setStep(next);
    contentRef.current?.scrollTo({ top: 0 });
    if (next === 2) onShowFrontChange(false);
    if (next === 3) onShowFrontChange(dresser || item.doors !== 'open');
  }
  function setSections(count: number) {
    onChange({ sections: Array.from({ length: count }, (_, i) => item.sections[i] || 'shelves') });
    onShowFrontChange(false);
  }

  return <div className="rp-furniture-settings">
    <div className="rp-inspector-header"><span className="rp-selected-icon"><FurnitureIcon type={item.type} size={25}/></span><div><span>VYBRANÝ NÁBYTEK</span><h2>{item.name}</h2></div></div>
    <FurnitureSteps steps={steps} step={step} onChange={chooseStep}/>
    <div className="settings-content rp-inspector-body" ref={contentRef}>
      <div className="step-eyebrow">KROK 0{step + 1} <span>/ 0{steps.length}</span></div>
      <h2>{special&&step===2?'Dolaďte praktické detaily':['Začněte prostorem', 'Dejte mu svůj charakter', 'Každá věc má své místo', 'Zvenku přesně vaše'][step]}</h2>
      <p className="step-description">{[
        'Zadejte rozměry. Zbytek se přizpůsobí vám.',
        'Vyberte si povrch, který k vám domů sedne.',
        special ? 'Přizpůsobte vybavení tomu, jak nábytek používáte.' : tall ? 'Sestavte si vnitřek podle toho, co ukládáte.' : dresser ? 'Zvolte počet sekcí a zásuvek v každé z nich.' : 'Rozdělte prostor do sekcí a přidejte police.',
        dresser ? 'Dolaďte čela zásuvek a jejich úchytky.' : 'Dolaďte dvířka a drobné detaily.',
      ][step]}</p>

      {step === 0 && <>
        <label className="toro-field-label">Název kusu<Input value={item.name} maxLength={50} onChange={e=>onChange({name:e.target.value || 'Nábytek'})}/></label><div className="dimension-fields">
          <DimensionField label="Šířka" value={item.width} min={item.type==='vanity'&&item.basins===2?120:item.type==='laundry'&&item.appliances==='side-by-side'?140:limits.width[0]} max={limits.width[1]} onChange={width => onChange({ width })}/>
          <DimensionField label={shelf ? 'Tloušťka' : item.type==='vanity'?'Výška s umyvadlem':'Výška'} value={item.height} min={limits.height[0]} max={limits.height[1]} onChange={height => onChange({ height })}/>
          <DimensionField label="Hloubka" value={item.depth} min={limits.depth[0]} max={limits.depth[1]} onChange={depth => onChange({ depth })}/>
          {canMount(item.type) && <DimensionField label="Výška nad podlahou" value={item.y} min={0} max={Math.max(0,room.height - item.height)} onChange={y => onChange({ y })}/>}
        </div>
        {item.type === 'builtin' && <Button className="rp-fit-button" variant="outline" onClick={() => onChange({ height: room.height - 2 })}><ArrowDownToLine size={15}/> Přizpůsobit výšce pokoje</Button>}
        <div className="small-tip"><Ruler size={17}/><p>Měřte na více místech a počítejte s rezervou pro montáž.</p></div>
      </>}

      {step === 1 && <>
        <div className="field-label">Provedení</div><div className="toro-choice-row">{(['laminate','solid'] as const).map(c=><button key={c} aria-pressed={(item.construction||'laminate')===c} className={(item.construction||'laminate')===c?'active':''} onClick={()=>onChange({construction:c})}>{c==='laminate'?'Lamino · 18 mm':'Masiv · olejovaný'}</button>)}</div><MaterialPicker title={shelf ? 'Povrch police' : item.type==='mirror'?'Rám zrcadla':'Povrch nábytku'} value={item.material} woodOnly={item.construction==='solid'} onChange={material => onChange({ material })}/>
        <div className="material-detail"><span className={`material-preview mat-${item.material}`}/><div><strong>{material.name}</strong><p>{item.construction==='solid'?'Masivní dřevo · olejovaný povrch':'Dekor laminované desky'}</p><span>Ilustrační výběr pro první návrh</span></div></div>
        {special&&item.type!=='panel'&&<MaterialPicker title="Čela nábytku" value={item.front} woodOnly={item.construction==='solid'} onChange={front=>onChange({front})} compact/>}{['desk','bench'].includes(item.type)&&<><div className="field-label">Kovová podnož</div><div className="toro-choice-row">{(['black','brass'] as const).map(c=><button key={c} className={item.handles===c?'active':''} aria-pressed={item.handles===c} onClick={()=>onChange({handles:c})}>{c==='black'?'Černá':'Mosazný odstín'}</button>)}</div></>}<div className="small-tip"><Leaf size={18}/><p>Dekory v náhledu jsou ilustrační. Skutečný odstín ověřte na vzorku.</p></div>
      </>}

      {step === 2 && special && <>
        {item.type==='panel'&&<DimensionField label="Počet háčků" value={item.hooks||4} min={1} max={8} onChange={hooks=>onChange({hooks})} unit="ks"/>}
        {item.type==='vanity'&&<><div className="field-label">Počet umyvadel</div><div className="toro-choice-row">{([1,2] as const).map(n=><button key={n} aria-pressed={(item.basins||1)===n} className={(item.basins||1)===n?'active':''} onClick={()=>onChange({basins:n})}>{n===1?'Jedno umyvadlo':'Dvě umyvadla'}</button>)}</div><DimensionField label="Zásuvky pod umyvadlem" value={Math.min(3,item.shelfCount)} min={1} max={3} onChange={shelfCount=>onChange({shelfCount})} unit="ks"/><p className="rp-note">Pro dvě umyvadla počítáme se šířkou alespoň 120 cm. Výřez pro sifon upřesní truhlář.</p></>}
        {item.type==='laundry'&&<><div className="field-label">Pračka a sušička</div><div className="toro-choice-row">{(['stacked','side-by-side'] as const).map(a=><button key={a} aria-pressed={(item.appliances||'stacked')===a} className={(item.appliances||'stacked')===a?'active':''} onClick={()=>onChange({appliances:a})}>{a==='stacked'?'Nad sebou':'Vedle sebe'}</button>)}</div><p className="rp-note">Náhled počítá se spotřebiči 60 × 85 cm. Větrání a přístup k rozvodům se ověří při zaměření. Spotřebiče nejsou součástí výroby.</p></>}
      </>}
      {step === 2 && !special && <>
        <div className="field-label">Počet sekcí <span>{Math.round(item.width / item.sections.length)} cm / sekce</span></div>
        <div className="section-count rp-section-count" role="group" aria-label="Počet sekcí">{[1, 2, 3, 4, 5, 6, 7, 8].map(n => <Button key={n} variant="outline" disabled={item.width / n < 30 || item.width / n > 100} className={item.sections.length === n ? 'selected' : ''} aria-pressed={item.sections.length === n} onClick={() => setSections(n)}>{n}</Button>)}</div>
        {tall ? <>
          <div className="field-label section-label">Upravit sekci <span>zleva doprava</span></div>
          <div className="section-selector">{item.sections.map((layout, i) => <button className={selectedSection === i ? 'selected' : ''} key={i} onClick={() => setSection(i)} aria-label={`Upravit sekci ${i + 1}`} aria-pressed={selectedSection === i}><LayoutDiagram layout={layout}/><span>{i + 1}</span></button>)}</div>
          <div className="layout-options">{layouts.map(layout => <button key={layout.id} className={`option-card ${item.sections[selectedSection] === layout.id ? 'selected' : ''}`} onClick={() => {
            const sections = [...item.sections];
            sections[selectedSection] = layout.id;
            onChange({ sections });
            onShowFrontChange(false);
          }} aria-pressed={item.sections[selectedSection] === layout.id}>
            <LayoutDiagram layout={layout.id}/><div><strong>{layout.name}</strong><span>{layout.detail}</span></div><span className="radio-mark">{item.sections[selectedSection] === layout.id && <Check size={12}/>}</span>
          </button>)}</div>
          {item.depth < 55 && item.sections.includes('hanging') && <p className="depth-note">Pro běžná ramínka doporučujeme hloubku alespoň 55 cm.</p>}
        </> : <>
          <div className="field-label section-label">{dresser ? 'Zásuvky v každé sekci' : 'Police v každé sekci'} <span>{item.shelfCount}×</span></div>
          <div className="section-count rp-section-count" role="group" aria-label={dresser ? 'Zásuvky v sekci' : 'Police v sekci'}>{[1, 2, 3, 4, 5, 6, 7, 8].map(n => <Button key={n} variant="outline" className={item.shelfCount === n ? 'selected' : ''} aria-pressed={item.shelfCount === n} onClick={() => onChange({ shelfCount: n })}>{n}</Button>)}</div>
          <div className="rp-interior-preview" aria-label={`${item.sections.length} sekcí, ${item.shelfCount} ${dresser ? 'zásuvek' : 'polic'} v každé sekci`}>
            {item.sections.map((_, i) => <div key={i} className={dresser ? 'rp-mini-drawers' : ''}>{Array.from({ length: item.shelfCount + (dresser ? 0 : 1) }, (_, j) => <span key={j}>{dresser && <i/>}</span>)}</div>)}
          </div>
          <p className="rp-note">{dresser ? 'Každá sekce má stejný počet zásuvek.' : 'Každá sekce má stejný počet rovnoměrně rozmístěných polic.'}</p>
        </>}
      </>}

      {step === 3 && <>
        {!dresser && <div className="door-options">{[
          { id: 'hinged' as const, name: 'Otevírací dvířka', detail: 'Klasické pantové otevírání', icon: DoorOpen },
          ...(tall ? [{ id: 'sliding' as const, name: 'Posuvná dvířka', detail: 'Šetří místo před skříní', icon: PanelsTopLeft }] : []),
          { id: 'open' as const, name: 'Bez dvířek', detail: 'Všechno hezky po ruce', icon: Layers3 },
        ].map(door => <button key={door.id} className={`option-card ${item.doors === door.id ? 'selected' : ''}`} aria-pressed={item.doors === door.id} onClick={() => { onChange({ doors: door.id }); onShowFrontChange(door.id !== 'open'); }}>
          <door.icon size={24}/><div><strong>{door.name}</strong><span>{door.detail}</span></div><span className="radio-mark">{item.doors === door.id && <Check size={12}/>}</span>
        </button>)}</div>}
        {(dresser || item.doors !== 'open') && <>
          <MaterialPicker title={dresser ? 'Materiál čel zásuvek' : 'Materiál dvířek'} value={item.front} woodOnly={item.construction==='solid'} onChange={front => onChange({ front })} compact/>
          <div className="field-label">Úchytky</div><div className="handle-options">{(['black', 'brass'] as const).map(handle => <button key={handle} className={item.handles === handle ? 'selected' : ''} onClick={() => onChange({ handles: handle })} aria-pressed={item.handles === handle}><span className={`handle-sample ${handle}`}/>{handle === 'black' ? 'Černé matné' : 'Kartáčovaná mosaz'}</button>)}</div>
        </>}
      </>}

      <details className="rp-position-settings"><summary><Move size={16}/><span>Umístění v pokoji</span><ChevronDown size={15}/></summary><div>
        <p className="rp-note">Pozice středu nábytku vůči středu pokoje.</p>
        <div className="rp-field-stack"><NumberField label="Vlevo / vpravo (X)" step={0.1} value={item.x} min={-room.width / 2} max={room.width / 2} onChange={x => onChange({ x })}/><NumberField label="Vzadu / vpředu (Z)" step={0.1} value={item.z} min={-room.length / 2} max={room.length / 2} onChange={z => onChange({ z })}/></div>
        <Button className="rp-rotate-button" variant="outline" onClick={() => onChange({ rotation: ((item.rotation + 90) % 360) as Furniture['rotation'] })}><RotateCw size={15}/> Otočit o 90°<span>{item.rotation}°</span></Button>
        <div className="rp-control-section"><div className="rp-field-heading"><strong>Přisunout ke stěně</strong></div><div className="rp-wall-buttons">{Object.entries(wallNames).map(([wall, name]) => <button key={wall} onClick={() => onChange(attachToWall(item, room, wall as Wall))}>{name.replace(' stěna', '')}</button>)}</div><p className="rp-note">Čelo se automaticky otočí směrem do pokoje.</p></div>
      </div></details>
      <label className="toro-existing"><Switch checked={!!item.existing} onCheckedChange={existing=>onChange({existing})}/><span>Tento kus už mám<small>Zůstane v pokoji, vynechá se z poptávky výroby.</small></span></label>{ownIssues.length > 0 && <div className="rp-item-warnings">{ownIssues.map(issue => <p key={issue.id}>{issue.text}</p>)}</div>}
    </div>
    <div className="step-bottom"><Button variant="ghost" className="previous-step" disabled={step === 0} onClick={() => chooseStep(step - 1)}><ArrowLeft size={16}/> Zpět</Button><Button className="next-step" onClick={() => step < steps.length - 1 ? chooseStep(step + 1) : onSummary()}>{step < steps.length - 1 ? steps[step + 1].name : 'Přehled návrhu'}<ArrowRight size={16}/></Button></div>
    <div className="rp-inspector-footer"><div><span>{item.existing?'Váš stávající nábytek':'Výroba na míru'}</span><strong>{item.existing?'V návrhu':'Cenu připraví TORO'}</strong></div><div className="rp-item-actions"><Button variant="outline" onClick={onDuplicate}>Duplikovat</Button><Button variant="ghost" onClick={onDelete} aria-label={`Odstranit ${item.name}`} title="Odstranit kus"><Trash2 size={16}/></Button></div></div>
  </div>;
}

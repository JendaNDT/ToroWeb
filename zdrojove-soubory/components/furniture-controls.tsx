'use client';

import { useRef, useState } from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowRight, Check, DoorOpen, Layers3, Leaf, Move, PanelsTopLeft, RotateCw, Rows3, Ruler, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { DimensionField, FurnitureSteps, LayoutDiagram, MaterialPicker, furnitureSteps } from '@/components/furniture-fields';
import { NumberField } from '@/components/room-controls';
import { layouts } from '@/lib/configuration';
import { roomWalls } from '@/lib/room-geometry';
import { Textarea } from './ui/textarea';
import { DetailSection } from './detail-section';
import { attachToWall, canMount, frontProjection, furnitureLimits, type Furniture, type Room, type Wall, type Issue } from '@/lib/room';

export function FurnitureControls({ item, room, issues, onChange, onDuplicate, onDelete, onShowFrontChange, onSummary }: {
  item: Furniture; room?: Room; issues: Issue[];
  onChange: (patch: Partial<Furniture>) => void;
  onDuplicate?: () => void; onDelete?: () => void;
  onShowFrontChange: (show: boolean) => void; onSummary: () => void;
}) {
  const [step, setStep] = useState(0);
  const [section, setSection] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const tall = item.type === 'wardrobe' || item.type === 'builtin';
  const shelf = item.type === 'shelf';
  const dresser = item.type === 'dresser';
  const bookcase = item.type === 'bookcase';
  const simple = ['shelf','bench','mirror','desk','bed','custom'].includes(item.type);
  const special = ['panel','vanity','laundry'].includes(item.type);
  const limits = furnitureLimits(item.type);
  const steps = simple ? furnitureSteps.slice(0, 2) : special ? furnitureSteps.slice(0,3).map((s,i)=>i===2?{...s,name:'Vybavení'}:s) : bookcase ? furnitureSteps.slice(0, 3) : furnitureSteps.map((s, i) => dresser && i === 3 ? { name: 'Čela', icon: Rows3 } : s);
  const selectedSection = Math.min(section, item.sections.length - 1);
  const ownIssues = issues.filter(i => i.itemIds.includes(item.id));

  function chooseStep(next: number) {
    setStep(next);
    contentRef.current?.scrollTo({ top: 0 });
    requestAnimationFrame(()=>{
      const heading=contentRef.current?.querySelector<HTMLElement>('h2');
      heading?.focus({preventScroll:true});
      if(window.matchMedia('(max-width: 767px)').matches)heading?.scrollIntoView({block:'start',behavior:'instant'});
    });
    if (next === 2) onShowFrontChange(false);
    if (next === 3) onShowFrontChange(dresser || item.doors !== 'open');
  }
  function setSections(count: number) {
    onChange({ sections: Array.from({ length: count }, (_, i) => item.sections[i] || 'shelves') });
    onShowFrontChange(false);
  }

  return <div className="rp-furniture-settings">
    <FurnitureSteps steps={steps} step={step} onChange={chooseStep}/>
    <div className="settings-content rp-inspector-body" ref={contentRef}>
      <h2 tabIndex={-1} className="toro-step-title">{steps[step].name}</h2>
      <p className="step-description">{[
        'Zadejte vnější rozměry v centimetrech.',
        'Vyberte povrch nábytku.',
        special ? 'Vyberte vybavení pro váš kus.' : tall ? 'Vyberte sekci a její vnitřní uspořádání.' : dresser ? 'Zvolte počet sekcí a zásuvek.' : 'Zvolte počet sekcí a polic.',
        dresser ? 'Vyberte povrch čel a úchytky.' : 'Vyberte otevírání a povrch dvířek.',
      ][step]}</p>

      {step === 0 && <>
        <div className="dimension-fields">
          <DimensionField label="Šířka" value={item.width} min={item.type==='vanity'&&item.basins===2?120:item.type==='laundry'&&item.appliances==='side-by-side'?140:limits.width[0]} max={limits.width[1]} onChange={width => onChange({ width })}/>
          <DimensionField label={shelf ? 'Tloušťka' : item.type==='vanity'?'Výška s umyvadlem':'Výška'} value={item.height} min={limits.height[0]} max={limits.height[1]} onChange={height => onChange({ height })}/>
          <DimensionField label="Hloubka" value={item.depth} min={limits.depth[0]} max={limits.depth[1]} onChange={depth => onChange({ depth })}/>
          {frontProjection(item)>0&&<p className="step-description">S čely a úchytkami: {Number((item.depth+frontProjection(item)).toFixed(2))} cm.</p>}
          {room && canMount(item.type) && <DimensionField label="Výška nad podlahou" value={item.y} min={0} max={Math.max(0,room.height - item.height)} onChange={y => onChange({ y })}/>}
        </div>
        {item.type==='custom'&&<label className="toro-field-label">Zadání atypického kusu<Textarea value={item.notes??''} maxLength={2000} rows={4} onChange={e=>onChange({notes:e.target.value})} placeholder="Popište tvar, využití a důležité detaily pro TORO."/><span className="tw-note">Ve scéně je prostorový obal kusu. Podrobný tvar a konstrukci upřesníte s TORO.</span></label>}{item.type==='bed'&&<p className="tw-note">Rozměry zahrnují rám i čelo. Matrace je ilustrační; její velikost a provedení se upřesní při poptávce.</p>}
        {room && item.type === 'builtin' && <Button className="rp-fit-button" variant="outline" onClick={() => onChange({ height: room.height - 2 })}><ArrowDownToLine size={15}/> Přizpůsobit výšce pokoje</Button>}
        <DetailSection title="Upravit detaily kusu" summary={item.name}>
          <label className="toro-field-label">Název kusu<Input value={item.name} maxLength={50} onChange={e=>onChange({name:e.target.value || 'Nábytek'})}/></label>
          <div className="small-tip"><Ruler size={17}/><p>Měřte na více místech a počítejte s rezervou pro montáž.</p></div>
        </DetailSection>
      </>}

      {step === 1 && <>
        <DetailSection title="Provedení nábytku" summary={item.construction==='solid'?'Masiv · olejovaný':'Lamino · 18 mm'}><div className="toro-choice-row">{(['laminate','solid'] as const).map(c=><button key={c} aria-pressed={(item.construction||'laminate')===c} className={(item.construction||'laminate')===c?'active':''} onClick={()=>onChange({construction:c})}>{c==='laminate'?'Lamino · 18 mm':'Masiv · olejovaný'}</button>)}</div></DetailSection><MaterialPicker title={shelf ? 'Povrch police' : item.type==='mirror'?'Rám zrcadla':'Povrch nábytku'} value={item.material} woodOnly={item.construction==='solid'} onChange={material => onChange({ material })}/>

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
          <DetailSection title="Úchytky" summary={item.handles==='brass'?'Kartáčovaná mosaz':'Černé matné'}><div className="handle-options">{(['black', 'brass'] as const).map(handle => <button key={handle} className={item.handles === handle ? 'selected' : ''} onClick={() => onChange({ handles: handle })} aria-pressed={item.handles === handle}><span className={`handle-sample ${handle}`}/>{handle === 'black' ? 'Černé matné' : 'Kartáčovaná mosaz'}</button>)}</div></DetailSection>
        </>}
      </>}

      {room&&<FurniturePlacement item={item} room={room} onChange={onChange}/>}
      {ownIssues.length>0&&<div className="rp-item-warnings">{ownIssues.map(issue=><p key={issue.id}>{issue.text}</p>)}</div>}
    </div>
    <div className="step-bottom"><Button variant="ghost" className="previous-step" disabled={step === 0} onClick={() => chooseStep(step - 1)} aria-label="Předchozí krok"><ArrowLeft size={16}/> Předchozí</Button><Button className="next-step" onClick={() => step < steps.length - 1 ? chooseStep(step + 1) : onSummary()}>{step < steps.length - 1 ? steps[step + 1].name : 'Přehled návrhu'}<ArrowRight size={16}/></Button></div>
    {room&&<div className="rp-inspector-footer"><div><span>{item.existing?'Váš stávající nábytek':'Výroba na míru'}</span><strong>{item.existing?'V návrhu':'Cenu připraví TORO'}</strong></div>{onDuplicate && onDelete && <div className="rp-item-actions"><Button variant="outline" onClick={onDuplicate}>Duplikovat</Button><Button variant="ghost" onClick={onDelete} aria-label={`Odstranit ${item.name}`} title="Odstranit kus"><Trash2 size={16}/></Button></div>}</div>}
  </div>;
}

export function FurniturePlacement({item,room,onChange}:{item:Furniture;room:Room;onChange:(patch:Partial<Furniture>)=>void}) {
  return <><div className="toro-placement"><h3><Move size={16}/> Umístění v pokoji</h3>
        <p className="rp-note">Kus můžete posouvat tažením. Číselné vzdálenosti měříme ke středu kusu.</p>
        <div className="rp-field-stack"><NumberField label="Od levého okraje ke středu kusu" step={0.1} value={item.x+room.width/2} min={0} max={room.width} onChange={x => onChange({ x:x-room.width/2 })}/><NumberField label="Od zadního okraje ke středu kusu" step={0.1} value={item.z+room.length/2} min={0} max={room.length} onChange={z => onChange({ z:z-room.length/2 })}/></div>
        <Button className="rp-rotate-button" variant="outline" onClick={() => onChange({ rotation: ((item.rotation + 90) % 360) as Furniture['rotation'] })}><RotateCw size={15}/> Otočit o 90°<span>{item.rotation}°</span></Button>
        <DetailSection title="Přisunout ke stěně" summary="Vybrat stěnu a otočit čelo do pokoje"><div className="rp-wall-buttons">{roomWalls(room).map(w => <button key={w.id} onClick={() => onChange(attachToWall(item, room, w.id as Wall))}>{w.name}</button>)}</div><p className="rp-note">Čelo se automaticky otočí směrem do pokoje.</p></DetailSection>
      </div>
    {canMount(item.type)&&<NumberField label="Výška nad podlahou" value={item.y} min={0} max={Math.max(0,room.height-item.height)} onChange={y=>onChange({y})}/>}
    {item.type==='builtin'&&<Button variant="outline" onClick={()=>onChange({height:room.height-2})}><ArrowDownToLine size={15}/> Přizpůsobit výšce pokoje</Button>}
    <DetailSection title="Vlastnictví kusu" summary={item.existing?'Tento kus už mám':'Nový kus k výrobě'}><label className="toro-existing"><Switch checked={!!item.existing} onCheckedChange={existing=>onChange({existing})}/><span>Tento kus už mám<small>Zůstane v pokoji, vynechá se z poptávky výroby.</small></span></label></DetailSection>
  </>;
}

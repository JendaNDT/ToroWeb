import type { Issue, IssueAcknowledgement, RoomDesign } from './room';

function canonical(value:unknown):unknown {
  if(Array.isArray(value))return value.map(canonical);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([key,v])=>[key,canonical(v)]));
  return value;
}

/** A change detector, not a signature or a certification of the design. */
export function issueFingerprint(design:RoomDesign,issue:Issue):string {
  const {width,length,height,outline,openings}=design.room;
  const relevant={issue:{id:issue.id,text:issue.text,severity:issue.severity},room:{width,length,height,outline,openings},
    items:design.items.filter(i=>issue.itemIds.includes(i.id)),technical:design.technicalPoints?.filter(p=>(issue.technicalPointIds??[]).includes(p.id))};
  const text=JSON.stringify(canonical(relevant));let a=2166136261,b=2246822519;
  for(let i=0;i<text.length;i++){a=Math.imul(a^text.charCodeAt(i),16777619);b=Math.imul(b^text.charCodeAt(i),3266489917);}
  return (a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0');
}
export function currentAcknowledgement(design:RoomDesign,issue:Issue):IssueAcknowledgement|undefined {
  return design.acknowledgements?.find(a=>a.issueId===issue.id&&a.fingerprint===issueFingerprint(design,issue));
}
export function acknowledgeIssue(design:RoomDesign,issue:Issue,note='',at=new Date().toISOString()):RoomDesign {
  const acknowledgements=(design.acknowledgements??[]).filter(a=>a.issueId!==issue.id);
  if(acknowledgements.length>=300)return design;
  return {...design,acknowledgements:[...acknowledgements,{issueId:issue.id,fingerprint:issueFingerprint(design,issue),acknowledgedAt:at,note:note.slice(0,1000)}]};
}
export function revokeAcknowledgement(design:RoomDesign,issueId:string):RoomDesign {
  return {...design,acknowledgements:design.acknowledgements?.filter(a=>a.issueId!==issueId)};
}

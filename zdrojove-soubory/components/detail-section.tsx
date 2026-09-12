import type { ReactNode } from 'react';

/** Native disclosure keeps keyboard/touch semantics and current values discoverable. */
export function DetailSection({title,summary,children}:{title:string;summary?:string;children:ReactNode}) {
  return <details className="toro-detail"><summary><span>{title}</span>{summary&&<small>{summary}</small>}</summary><div className="toro-detail-body">{children}</div></details>;
}

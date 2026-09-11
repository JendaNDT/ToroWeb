export function ToroBrand(){
  // Full navigation releases the other editor's WebGL context and avoids the vinext client navigation failure.
  // eslint-disable-next-line @next/next/no-html-link-for-pages
  return <a href="/" className="toro-brand" aria-label="TORO Interiors — plánovač nábytku"><img src="/brand/toro-logo.png" alt="" width="48" height="48"/><span><strong>TORO<span>INTERIORS</span></strong><small>NÁBYTEK PODLE VAŠEHO ŽIVOTA</small></span></a>;
}

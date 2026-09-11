import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { Script } from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'package.json'));
const { build } = require('esbuild');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const date = new Date().toLocaleDateString('en-CA', {timeZone:'Europe/Prague'});
const out = path.join(root, 'outputs', 'TORO-prototyp');
await fs.mkdir(out, { recursive: true });
const assets = {};
async function asset(url) {
  if (!assets[url]) {
    const mime = { '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2' }[path.extname(url)];
    if (!mime || !url.startsWith('/') || url.includes('..')) throw new Error(`Unknown asset: ${url}`);
    assets[url] = `data:${mime};base64,${(await fs.readFile(path.join(root, 'public', url))).toString('base64')}`;
  }
  return assets[url];
}
await asset('/textures/oak.png');
await asset('/brand/toro-logo.png');
const result = await build({
  absWorkingDir: root,
  stdin: {
    contents: `import React from 'react';
      import { createRoot } from 'react-dom/client';
      import RoomPlanner from './components/room-planner';
      import Configurator from './components/configurator';
      // Full navigation preserves the application's pagehide autosave lifecycle.
      window.addEventListener('hashchange', () => window.location.reload());
      createRoot(document.getElementById('root')).render(
        window.location.hash === '#skrin' ? <Configurator/> : <RoomPlanner/>
      );`,
    loader: 'tsx', resolveDir: root, sourcefile: 'toro-offline-entry.tsx',
  },
  bundle: true, minify: true, write: false, metafile: true,
  format: 'iife', platform: 'browser', target: ['chrome110', 'firefox115', 'safari16.4'],
  jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' },
  legalComments: 'inline', loader: { '.css': 'empty' },
  plugins: [{ name: 'offline', setup(b) {
    b.onResolve({ filter: /^next\/dynamic$/ }, () => ({ path: 'dynamic', namespace: 'offline' }));
    b.onLoad({ filter: /.*/, namespace: 'offline' }, () => ({
      contents: `import React from 'react';
        export default function dynamic(loader, options) {
          const Lazy = React.lazy(loader);
          return function Deferred(props) { return React.createElement(React.Suspense,
            { fallback: options?.loading ? React.createElement(options.loading) : null },
            React.createElement(Lazy, props)); };
        }`,
      resolveDir: root, loader: 'js',
    }));
    b.onLoad({ filter: /\.[jt]sx?$/ }, async ({ path: filename }) => {
      if (filename.includes('/node_modules/')) return;
      let source = await fs.readFile(filename, 'utf8');
      source = source.replace(/(['"])\/textures\/oak\.png\1/g, 'globalThis.__TORO_ASSETS__["/textures/oak.png"]')
        .replace(/src="\/brand\/toro-logo\.png"/g, 'src={globalThis.__TORO_ASSETS__["/brand/toro-logo.png"]}')
        .replace(/href="\/skrin"/g, 'href="#skrin"').replace(/href="\/"/g, 'href="#pokoj"');
      return { contents: source, loader: path.extname(filename).slice(1), resolveDir: path.dirname(filename) };
    });
  } }],
});
const cssDir = path.join(root, 'dist/client/_next/static/css');
const cssFiles = (await fs.readdir(cssDir)).filter(f => f.endsWith('.css')).sort((a, b) => {
  if (a.startsWith('index.')) return -1;
  if (b.startsWith('index.')) return 1;
  return a.localeCompare(b);
});
if (!cssFiles.some(f => f.startsWith('index.')) || !cssFiles.some(f => f.startsWith('room-planner.'))) throw new Error('Fresh production CSS is missing');
let css = (await Promise.all(cssFiles.map(f => fs.readFile(path.join(cssDir, f), 'utf8')))).join('\n');
for (const url of new Set([...css.matchAll(/url\(["']?([^)'"\s]+)["']?\)/g)].map(m => m[1]))) {
  if (url.startsWith('data:')) continue;
  const data = await asset(url);
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  css = css.replace(new RegExp(`url\\(["']?${escaped}["']?\\)`, 'g'), url === '/textures/oak.png' ? 'var(--toro-offline-oak)' : `url("${data}")`);
}
if (/@import\s/.test(css)) throw new Error('Unresolved CSS import');
// Fonts are already embedded in CSS; avoid a duplicate copy in the script table.
for (const key of Object.keys(assets)) if (key.startsWith('/fonts/')) delete assets[key];

const packageDirs = new Set();
for (const input of Object.keys(result.metafile.inputs)) {
  if (!input.includes('node_modules/')) continue;
  let directory = path.dirname(path.resolve(root, input));
  while (directory !== root && directory !== path.dirname(directory)) {
    try { await fs.access(path.join(directory, 'package.json')); packageDirs.add(directory); break; } catch {}
    directory = path.dirname(directory);
  }
}
for (const name of ['tailwindcss', 'tw-animate-css']) packageDirs.add(path.join(root, 'node_modules', name));
const licenseParts = ['TORO — licence knihoven a písem obsažených v této ukázce.\nAplikace: https://github.com/JendaNDT/ToroWeb\n'];
const dependencyVersions = [];
for (const dir of [...packageDirs].sort()) {
  const pkg = JSON.parse(await fs.readFile(path.join(dir, 'package.json'), 'utf8'));
  dependencyVersions.push(`${pkg.name}@${pkg.version}`);
  const names = (await fs.readdir(dir)).filter(f => /^(license|licence|copying|notice)([.\-]|$)/i.test(f));
  if (!names.length && pkg.name !== 'react-remove-scroll-bar') throw new Error(`License missing: ${pkg.name}`);
  licenseParts.push(`\n${'='.repeat(72)}\n${pkg.name} ${pkg.version} — ${pkg.license ?? ''}\n`);
  if (!names.length) licenseParts.push('Zdroj licence: https://github.com/theKashey/react-remove-scroll-bar/blob/master/LICENSE\n' + await fs.readFile(path.join(root, 'vendor/react-remove-scroll-bar.LICENSE'), 'utf8'));
  for (const name of names) if ((await fs.stat(path.join(dir, name))).isFile()) licenseParts.push(await fs.readFile(path.join(dir, name), 'utf8'));
}
for (const font of ['inter', 'poppins']) licenseParts.push(`\n${'='.repeat(72)}\n${font.toUpperCase()}\n${await fs.readFile(path.join(root, `public/fonts/${font}-OFL.txt`), 'utf8')}`);
licenseParts.push('\nSHADCN STYLESHEET\n' + await fs.readFile(path.join(root, 'vendor/shadcn-tailwind-4.13.0.LICENSE.md'), 'utf8'));
const licenses = licenseParts.join('\n');
const sourceHash = createHash('sha256').update(result.outputFiles[0].text).update(css).update(JSON.stringify(assets)).digest('hex');
new Script(result.outputFiles[0].text); // Reject a malformed inline script before packaging.
const safeScript = text => text.replace(/<\/script/gi, '<\\/script');
const favicon = await asset('/favicon.svg');
delete assets['/favicon.svg'];
const html = `<!doctype html>
<html lang="cs"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'">
<title>TORO Interiors — Plánovač pokoje a nábytku</title>
<link rel="icon" href="${favicon}"><style>${css}</style></head>
<body class="antialiased"><div id="root"></div><noscript>Pro spuštění plánovače povolte JavaScript.</noscript>
<script>globalThis.__TORO_ASSETS__=${safeScript(JSON.stringify(assets))};document.documentElement.style.setProperty('--toro-offline-oak','url("'+globalThis.__TORO_ASSETS__['/textures/oak.png']+'")');</script>
<script>${safeScript(result.outputFiles[0].text)}</script>
<script type="text/plain" id="toro-licenses">${licenses.replace(/<\/script/gi, '&lt;/script')}</script>
</body></html>`;
await fs.writeFile(path.join(out, 'TORO-otevrit.html'), html);
await fs.writeFile(path.join(out, 'LICENCE-KNIHOVEN.txt'), licenses);
await fs.writeFile(path.join(out, 'ZACNI-TADY.txt'), `TORO INTERIORS — UKÁZKA PLÁNOVAČE
================================

SPUŠTĚNÍ
1. Rozbalte celý ZIP do složky v počítači.
2. Otevřete soubor TORO-otevrit.html dvojklikem v aktuálním Chrome nebo Edge.
   Případně jej do okna prohlížeče přetáhněte.
3. Nic se neinstaluje. Obrázky, písma i 3D knihovna jsou uvnitř HTML.
   Pro používání není potřeba připojení k internetu.

RYCHLÁ PROHLÍDKA
Pro předvedení členité místnosti zvolte „Vybrat sestavu“ → „Ložnice do L“.
Obsahuje postel, skříň, atypický kus a dvě okna na stejné stěně.
Pro předvedení sítí zvolte „Vybrat sestavu“ → „Koupelna v dubu“.
Obsahuje umyvadlo, prádelní sestavu, vodu, odpad, zásuvku a topný žebřík.
- Prostor: obdélník, L, U, úpravy stěn, výklenky a výstupky.
  Půdorys je pravoúhlý. Až 40 dveří a oken, i více na stejné stěně.
- Technické prvky: elektřina, voda, odpad, plyn, topení, větrání, data
  a pevné překážky. Celkem 28 typů. Polohu, rozměry a přístup upravíte
  po výběru prvku. Podporované umístění zahrnuje stěnu, podlahu, strop
  a prostor podle typu prvku. Zaměřenou polohu můžete zamknout.
- Nábytek: 15 druhů včetně postele a atypického kusu s vlastním zadáním.
  Atyp ukazuje vnější rozměry; detaily tvaru patří do poznámky a fotografií.
- Kontrola: projděte upozornění a podle potřeby zvolte „Beru na vědomí“.
  Potvrzení se uloží, problém dál zůstává viditelný. Změna souvisejících
  údajů vyžaduje nové potvrzení.
- Poptávka: stáhněte souhrn, půdorys i celkový 3D pohled v jednom souboru.
  Pro zkoušku lze tlačítkem doplnit zřetelně ukázkový kontakt.
- Odkaz dole otevře samostatný konfigurátor jedné skříně.

OVLÁDÁNÍ MYŠÍ
- Nábytek vyberte kliknutím a přesuňte tažením.
- V půdorysu 2D lze táhnout i název kusu.
- Vybraný kus otočte tlačítky 90° nad scénou nebo klávesou R.
- Šipky posouvají vybraný kus; Shift zpřesní krok na 1 cm.
- Tažení mimo nábytek v 3D otáčí pohled; kolečko přibližuje a oddaluje.
- Escape zruší probíhající tažení. Zpět/Vpřed vrací změny.

ULOŽENÍ A SDÍLENÍ NÁVRHU
Tlačítko „Stáhnout návrh“ uloží pokoj do souboru TORO-navrh.json.
Přes „Načíst návrh“ jej lze znovu otevřít, také na jiném počítači.
Pro předání svého pokoje pošlete spolu s tímto ZIPem i stažený JSON.
Automatické ukládání je pouze v daném prohlížeči. Dostupnost u místních
HTML souborů se může lišit a přesun/přejmenování HTML může úložiště změnit;
pro uchování důležitého návrhu proto použijte stažený JSON.

JDE O UKÁZKU
Poptávka se stáhne do souboru; aplikace ji nikomu sama neposílá.
Cenotvorba a příjemce poptávek zůstávají k doplnění. Cena se nepočítá.
Ukázkový kontakt a zadání slouží jen k předvedení; nejde o reálné údaje.
Balíček neobsahuje osobní návrhy, kontakty ani fotografie autora.
Rozměry, materiály a proveditelnost jsou podkladem pro konzultaci s TORO.
3D vyžaduje prohlížeč s WebGL a zapnutou hardwarovou akcelerací.
Tato ukázka je určena především pro počítač s myší.

Výchozí commit: ${commit}
Otisk sestavení: ${sourceHash}
Datum zabalení: ${date}
Licence vložených knihoven a písem: LICENCE-KNIHOVEN.txt
`);
await fs.writeFile(path.join(out, 'VERZE.txt'), `TORO Interiors — přenosná ukázka\nDatum zabalení: ${date}\nZdroj: https://github.com/JendaNDT/ToroWeb\nVýchozí commit: ${commit}\nZdroj: aktuální pracovní kopie včetně místních změn.\nOtisk sestavení SHA-256: ${sourceHash}\nTechnické prvky: 28 typů; nábytek: 15 druhů; formát návrhu 4; import verzí 1, 2 a 3.\nPravoúhlé půdorysy, více otvorů, potvrzení upozornění, půdorys a 3D v poptávce.\nCeny a doručování poptávek: nenapojeno, zástupné údaje.\nBez serveru, instalace a závislosti na síti.\n\nKnihovny v JS balíčku / CSS:\n${dependencyVersions.join('\n')}\n`);
await fs.writeFile(path.join(root, 'outputs/toro-demo-metafile.json'), JSON.stringify(result.metafile));
const zipPath = path.join(root, 'outputs', `TORO-prototyp-${date}.zip`);
execFileSync('python3', ['-c', `
import pathlib, sys, zipfile
folder=pathlib.Path(sys.argv[1])
with zipfile.ZipFile(sys.argv[2], 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for name in ['TORO-otevrit.html', 'ZACNI-TADY.txt', 'VERZE.txt', 'LICENCE-KNIHOVEN.txt']:
        archive.write(folder/name, 'TORO-ukazka/'+name)
with zipfile.ZipFile(sys.argv[2]) as archive:
    assert archive.testzip() is None
    for item in archive.infolist():
        assert archive.read(item) == (folder/pathlib.Path(item.filename).name).read_bytes()
`, out, zipPath]);
const archive=await fs.readFile(zipPath),sha256=createHash('sha256').update(archive).digest('hex');
await fs.writeFile(zipPath+'.sha256', `${sha256}  ${path.basename(zipPath)}\n`);
console.log(JSON.stringify({ zip:zipPath, zipBytes:archive.length, sha256, sourceHash, htmlBytes:Buffer.byteLength(html), packages:packageDirs.size, cssFiles, baseCommit:commit }));

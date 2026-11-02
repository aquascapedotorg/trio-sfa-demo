// node src/build.mjs  ->  bpmn/*.bpmn, mermaid/*.mmd, peta-proses-3-aplikasi.html
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mofiBpmn, sfaBpmn, hebatBpmn } from './models.mjs';
import { layout, toBpmnXml, toSvg } from './bpmn.mjs';
import { apps, compare } from './content.mjs';
import { renderFlow } from './flow.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(root, 'bpmn'), { recursive: true });
mkdirSync(join(root, 'mermaid'), { recursive: true });

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const models = { mofi: mofiBpmn, sfa: sfaBpmn, hebat: hebatBpmn };
const built = {};
for (const [id, m] of Object.entries(models)) {
  const L = layout(m);
  const xml = toBpmnXml(L);
  writeFileSync(join(root, 'bpmn', `${id}.bpmn`), xml);
  built[id] = { svg: toSvg(L), xml };
}
for (const a of apps) {
  writeFileSync(join(root, 'mermaid', `${a.id}-flowchart.mmd`), a.flowchart + '\n');
  writeFileSync(join(root, 'mermaid', `${a.id}-status.mmd`), a.state + '\n');
  writeFileSync(join(root, 'mermaid', `${a.id}-peta-layar.mmd`), a.sitemap + '\n');
}

const legend = `<ul class="legend" aria-label="Legenda BPMN">
  <li><svg viewBox="0 0 22 22" width="22" height="22"><circle class="b-event b-start" cx="11" cy="11" r="9"/></svg>Mulai</li>
  <li><svg viewBox="0 0 22 22" width="22" height="22"><circle class="b-event b-end" cx="11" cy="11" r="9"/></svg>Selesai</li>
  <li><svg viewBox="0 0 34 22" width="34" height="22"><rect class="b-task b-task-user" x="1" y="1" width="32" height="20" rx="5"/></svg>Tugas pengguna</li>
  <li><svg viewBox="0 0 34 22" width="34" height="22"><rect class="b-task b-task-service" x="1" y="1" width="32" height="20" rx="5"/></svg>Tugas sistem</li>
  <li><svg viewBox="0 0 34 22" width="34" height="22"><rect class="b-task b-task-manual" x="1" y="1" width="32" height="20" rx="5"/></svg>Tugas di luar aplikasi</li>
  <li><svg viewBox="0 0 24 24" width="24" height="24"><polygon class="b-gw" points="12,1 23,12 12,23 1,12"/><path class="b-gw-mark" d="M8 8L16 16M16 8L8 16"/></svg>Pilih satu jalur</li>
  <li><svg viewBox="0 0 24 24" width="24" height="24"><polygon class="b-gw" points="12,1 23,12 12,23 1,12"/><circle class="b-gw-mark" cx="12" cy="12" r="5"/></svg>Satu jalur atau lebih</li>
</ul>`;

const appSection = (a, idx) => `
<section class="app" id="${a.id}" data-app="${a.id}" aria-labelledby="${a.id}-title">
  <header class="app-head">
    <div class="app-head-inner">
      <p class="eyebrow">Aplikasi ${idx + 1} dari 3 · ${esc(a.client)}</p>
      <h2 id="${a.id}-title">${esc(a.name)}</h2>
      <p class="lede">${esc(a.oneLiner)}</p>
      <p class="src">Sumber: <a href="${a.figma}" target="_blank" rel="noopener">wireframe Figma</a>. ${esc(a.figmaScope)}.</p>
    </div>
  </header>

  <div class="block" id="${a.id}-ringkasan">
    <h3>Ringkasan</h3>
    <div class="grid-3">
      <div class="panel">
        <h4>Siapa yang terlibat</h4>
        <dl class="kv">${a.users.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
      </div>
      <div class="panel span-2">
        <h4>Modul dan layar</h4>
        <dl class="kv kv-2">${a.modules.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      </div>
    </div>
    <div class="value">
      <h4>Nilai bisnis yang ditunjukkan saat demo</h4>
      <ul>${a.value.map(v => `<li>${esc(v)}</li>`).join('')}</ul>
    </div>
  </div>

  <div class="block" id="${a.id}-flowchart">
    <h3>Flowchart</h3>
    <p class="note">Alur layar dan keputusan dari sudut pandang pengguna aplikasi.</p>
    <div class="diagram flow-wrap" tabindex="0" aria-label="Flowchart, geser untuk melihat seluruhnya">${renderFlow(a.flowchart, a.id)}</div>
  </div>

  <div class="block" id="${a.id}-bpmn">
    <h3>BPMN</h3>
    <p class="note">Proses bisnis per pihak (lajur). File <code>bpmn/${a.id}.bpmn</code> bisa dibuka di Camunda Modeler atau demo.bpmn.io.</p>
    ${legend}
    <div class="diagram bpmn-wrap" tabindex="0" aria-label="Diagram BPMN, geser ke samping untuk melihat seluruhnya">${built[a.id].svg}</div>
    <details class="xml">
      <summary>Lihat XML BPMN 2.0</summary>
      <div class="xml-bar"><button type="button" class="copy" data-target="${a.id}-xml" id="${a.id}-copy">Salin XML</button><span class="copy-status" id="${a.id}-copy-status" aria-live="polite"></span></div>
      <pre class="code" id="${a.id}-xml">${esc(built[a.id].xml)}</pre>
    </details>
  </div>

  <div class="block" id="${a.id}-status">
    <h3>Siklus status</h3>
    <p class="note">${esc(a.stateNote)}</p>
    <div class="diagram flow-wrap" tabindex="0" aria-label="Siklus status, geser untuk melihat seluruhnya">${renderFlow(a.state, a.id + '-st')}</div>
  </div>

  <div class="block" id="${a.id}-peta">
    <h3>Peta layar</h3>
    <div class="diagram flow-wrap" tabindex="0" aria-label="Peta layar, geser untuk melihat seluruhnya">${renderFlow(a.sitemap, a.id + '-map')}</div>
  </div>

  <div class="block" id="${a.id}-demo">
    <h3>Naskah demo</h3>
    <div class="table-wrap">
      <table class="demo">
        <thead><tr><th scope="col">Urutan</th><th scope="col">Layar</th><th scope="col">Yang ditunjukkan</th><th scope="col">Pesan untuk klien</th></tr></thead>
        <tbody>${a.demo.map(([s, show, msg], i) => `<tr><td class="num">${i + 1}</td><th scope="row">${esc(s)}</th><td>${esc(show)}</td><td>${esc(msg)}</td></tr>`).join('')}</tbody>
      </table>
    </div>
  </div>

  <div class="block" id="${a.id}-tanya">
    <h3>Perlu dikonfirmasi ke klien</h3>
    <ol class="questions">${a.questions.map(q => `<li>${esc(q)}</li>`).join('')}</ol>
  </div>
</section>`;

const html = `<title>Peta Proses MOFI, SFA, HeBAT</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+Condensed:wght@500;600;700&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<style>
/* Layout: dokumen kerja BA; header lengket dengan lompatan per aplikasi, tiap aplikasi satu bab bertingkat, diagram lebar di wadah gulir sendiri. */
:root {
  --bg: #f3f6f7;
  --surface: #ffffff;
  --ink: #14202a;
  --muted: #546573;
  --line: #d6dee3;
  --line-strong: #b4c1ca;
  --lane: #f7fafb;
  --lane-alt: #eef3f5;
  --flow: #3f5262;
  --mofi: #1b5fcf;
  --sfa: #b8560f;
  --hebat: #2a3f93;
  --accent: var(--mofi);
  --start: #1f7a4d;
  --end: #b42318;
  --font-display: "IBM Plex Sans Condensed", "Arial Narrow", "Roboto Condensed", sans-serif;
  --font-body: "IBM Plex Sans", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, "Cascadia Mono", Consolas, monospace;
  --step--1: 0.8125rem;
  --step-0: 0.9375rem;
  --step-1: 1.125rem;
  --step-2: 1.5rem;
  --step-3: 2.125rem;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #0f1519; --surface: #151d23; --ink: #e3eaee; --muted: #93a4b0; --line: #26323b; --line-strong: #3a4954;
    --lane: #131b20; --lane-alt: #172128; --flow: #a9bac6;
    --mofi: #7fa9f2; --sfa: #f0a463; --hebat: #9eaef0; --start: #5fc995; --end: #f08a80;
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg: #0f1519; --surface: #151d23; --ink: #e3eaee; --muted: #93a4b0; --line: #26323b; --line-strong: #3a4954;
  --lane: #131b20; --lane-alt: #172128; --flow: #a9bac6;
  --mofi: #7fa9f2; --sfa: #f0a463; --hebat: #9eaef0; --start: #5fc995; --end: #f08a80;
  color-scheme: dark;
}
* { box-sizing: border-box; }
body { background: var(--bg); color: var(--ink); font-family: var(--font-body); font-size: var(--step-0); line-height: 1.55; }
body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--surface); }
a { color: var(--accent); text-underline-offset: 2px; }
a:focus-visible, button:focus-visible, summary:focus-visible, .bpmn-wrap:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
h1, h2, h3, h4 { font-family: var(--font-display); text-wrap: balance; margin: 0; line-height: 1.15; }
code, .code { font-family: var(--font-mono); font-size: var(--step--1); }
.wrap { max-width: 1180px; margin: 0 auto; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }

.topbar { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: var(--surface); border-bottom: 1px solid var(--line); }
.topbar .wrap { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding-block: 10px; }
.brand { font-family: var(--font-display); font-weight: 600; font-size: var(--step-1); margin-right: auto; }
.jump { display: flex; gap: 6px; flex-wrap: wrap; list-style: none; margin: 0; padding: 0; }
.jump a { display: inline-block; padding: 5px 12px; border: 1px solid var(--line-strong); border-radius: 999px; color: var(--ink); text-decoration: none; font-size: var(--step--1); font-weight: 500; }
.jump a:hover { border-color: var(--ink); }
.jump a[data-app]::before { content: ""; display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 7px; background: var(--c); vertical-align: 1px; }

.intro { padding-block: 40px 28px; display: grid; gap: 14px; }
.intro h1 { font-size: var(--step-3); font-weight: 700; max-width: 22ch; }
.intro p { max-width: 68ch; margin: 0; color: var(--muted); }
.method { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 8px; }
.method div { border-top: 2px solid var(--ink); padding-top: 8px; }
.method dt { font-family: var(--font-display); font-weight: 600; }
.method dd { margin: 2px 0 0; color: var(--muted); font-size: var(--step--1); }

.compare { padding-block: 8px 40px; }
.compare h2 { font-size: var(--step-2); margin-bottom: 12px; }
.compare .pattern { max-width: 72ch; margin: 14px 0 0; }

.table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }
table { border-collapse: collapse; width: 100%; min-width: 640px; font-size: var(--step--1); }
th, td { text-align: left; vertical-align: top; padding: 10px 12px; border-bottom: 1px solid var(--line); }
thead th { font-family: var(--font-display); font-weight: 600; font-size: var(--step-0); background: var(--lane-alt); }
tbody tr:last-child > * { border-bottom: 0; }
tbody th { font-weight: 600; }
td.num { font-family: var(--font-mono); font-variant-numeric: tabular-nums; color: var(--muted); width: 3.5em; }
.compare thead th:nth-child(2) { box-shadow: inset 0 -3px 0 var(--mofi); }
.compare thead th:nth-child(3) { box-shadow: inset 0 -3px 0 var(--sfa); }
.compare thead th:nth-child(4) { box-shadow: inset 0 -3px 0 var(--hebat); }

.app { --accent: var(--c); border-top: 1px solid var(--line); scroll-margin-top: 60px; }
.app[data-app="mofi"], [data-app="mofi"] { --c: var(--mofi); }
.app[data-app="sfa"], [data-app="sfa"] { --c: var(--sfa); }
.app[data-app="hebat"], [data-app="hebat"] { --c: var(--hebat); }
.app-head { background: var(--surface); border-bottom: 1px solid var(--line); }
.app-head-inner { max-width: 1180px; margin: 0 auto; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 32px 24px; display: grid; gap: 8px; border-left: 0; }
.app-head h2 { font-size: var(--step-3); color: var(--c); }
.eyebrow { margin: 0; font-size: var(--step--1); letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); font-weight: 500; }
.lede { margin: 0; font-size: var(--step-1); max-width: 64ch; }
.src { margin: 0; font-size: var(--step--1); color: var(--muted); max-width: 90ch; }

.block { max-width: 1180px; margin: 0 auto; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 26px 6px; display: grid; gap: 12px; scroll-margin-top: 60px; }
.block h3 { font-size: var(--step-2); font-weight: 600; display: flex; align-items: baseline; gap: 10px; }
.block h3::before { content: ""; width: 12px; height: 12px; background: var(--c); border-radius: 2px; flex: none; transform: translateY(-1px); }
.block h4 { font-size: var(--step-1); font-weight: 600; margin-bottom: 8px; }
.note { margin: 0; color: var(--muted); max-width: 80ch; font-size: var(--step--1); }

.grid-3 { display: grid; grid-template-columns: 1fr 2fr; gap: 12px; }
.panel { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 16px; min-width: 0; }
.kv { margin: 0; display: grid; gap: 10px; }
.kv dt { font-weight: 600; }
.kv dd { margin: 0; color: var(--muted); font-size: var(--step--1); }
.kv-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 20px; }
.value { border-left: 3px solid var(--c); padding: 4px 0 4px 14px; }
.value ul { margin: 0; padding-left: 18px; display: grid; gap: 4px; max-width: 80ch; }

.diagram { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 16px; overflow-x: auto; min-width: 0; }
.diagram pre.mermaid { margin: 0; background: transparent; display: flex; justify-content: center; }
.bpmn-wrap { padding: 12px; }
.bpmn-svg { display: block; max-width: none; font-family: var(--font-body); }

.flow-wrap { display: flex; }
.flow-svg { display: block; max-width: none; margin: 0 auto; font-family: var(--font-body); }
.f-proc { fill: var(--surface); stroke: var(--c, var(--ink)); stroke-width: 1.4; }
.f-term { fill: var(--c, var(--ink)); stroke: none; }
.f-dec { fill: var(--lane-alt); stroke: var(--ink); stroke-width: 1.4; }
.f-text { fill: var(--ink); }
.f-text-term { fill: var(--surface); font-weight: 600; }
.f-edge { fill: none; stroke: var(--flow); stroke-width: 1.3; }
.f-dashed { stroke-dasharray: 5 4; }
.f-start { fill: var(--ink); }
.f-end-ring { fill: var(--surface); stroke: var(--ink); stroke-width: 1.6; }
.f-group { fill: var(--lane); stroke: var(--line-strong); stroke-width: 1; stroke-dasharray: 6 4; }
.f-group-label { fill: var(--muted); font-size: 12px; font-weight: 600; letter-spacing: 0.02em; }
.f-arrow { fill: var(--flow); }
.f-elabel-bg { fill: var(--surface); stroke: var(--line-strong); stroke-width: 0.8; }
.f-elabel { fill: var(--ink); font-size: 11px; font-weight: 500; }
.legend { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: var(--step--1); color: var(--muted); }
.legend li { display: inline-flex; align-items: center; gap: 6px; }

.b-pool { fill: var(--surface); stroke: var(--line-strong); stroke-width: 1.2; }
.b-pool-label { fill: var(--ink); font-family: var(--font-display); font-weight: 600; font-size: 13px; }
.b-lane { fill: var(--lane); stroke: var(--line-strong); stroke-width: 1; }
.b-lane-alt { fill: var(--lane-alt); }
.b-lane-sep { stroke: var(--line-strong); stroke-width: 1; }
.b-lane-label { fill: var(--muted); font-size: 11.5px; font-weight: 600; }
.b-flow { fill: none; stroke: var(--flow); stroke-width: 1.3; }
.b-arrow { fill: var(--flow); }
.b-flow-label-bg { fill: var(--surface); stroke: var(--line); stroke-width: 0.8; }
.b-flow-label { fill: var(--ink); font-size: 10px; font-weight: 500; }
.b-event { fill: var(--surface); stroke-width: 2; }
.b-start { stroke: var(--start); }
.b-end { stroke: var(--end); stroke-width: 4; }
.b-task { fill: var(--surface); stroke: var(--c, var(--ink)); stroke-width: 1.5; }
.b-task-service { stroke-dasharray: 5 3; }
.b-task-manual { stroke: var(--muted); }
.b-gw { fill: var(--surface); stroke: var(--ink); stroke-width: 1.5; }
.b-gw-mark { fill: none; stroke: var(--ink); stroke-width: 2.4; }
.b-glyph { fill: none; stroke: var(--muted); stroke-width: 1.1; }
.b-node-label { fill: var(--ink); font-size: 11px; }
.b-node-sub { fill: var(--muted); font-size: 10.5px; }

details.xml { border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }
details.xml summary { cursor: pointer; padding: 10px 14px; font-weight: 500; }
.xml-bar { display: flex; align-items: center; gap: 12px; padding: 0 14px 8px; }
button.copy { font: inherit; font-size: var(--step--1); font-weight: 500; padding: 5px 12px; border-radius: 6px; border: 1px solid var(--line-strong); background: var(--bg); color: var(--ink); cursor: pointer; }
button.copy:hover { border-color: var(--ink); }
.copy-status { font-size: var(--step--1); color: var(--muted); }
pre.code { margin: 0; padding: 12px 14px; max-height: 320px; overflow: auto; border-top: 1px solid var(--line); white-space: pre; }

ol.questions { margin: 0; padding-left: 22px; display: grid; gap: 6px; max-width: 80ch; }
footer { padding-block: 40px; color: var(--muted); font-size: var(--step--1); }
footer p { max-width: 80ch; margin: 0 0 6px; }

@media (max-width: 760px) {
  .grid-3 { grid-template-columns: 1fr; }
  .kv-2 { grid-template-columns: 1fr; }
  .intro h1, .app-head h2 { font-size: var(--step-2); }
  .brand { margin-right: 0; width: 100%; }
}
@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth; } }
</style>

<nav class="topbar" aria-label="Navigasi aplikasi">
  <div class="wrap">
    <span class="brand">Peta Proses 3 Aplikasi</span>
    <ul class="jump">
      <li><a href="#perbandingan">Perbandingan</a></li>
      ${apps.map(a => `<li><a href="#${a.id}" data-app="${a.id}">${esc(a.name.split(' (')[0])}</a></li>`).join('')}
    </ul>
  </div>
</nav>

<main>
  <div class="wrap intro">
    <p class="eyebrow">Bahan demo klien · disusun dari wireframe Figma</p>
    <h1>Bagaimana MOFI, SFA, dan HeBAT bekerja di lapangan</h1>
    <p>Setiap aplikasi punya flowchart alur layar, BPMN per pihak yang terlibat, siklus status, peta layar, naskah demo, dan daftar hal yang perlu dikonfirmasi. Semua diturunkan dari isi wireframe, bukan dari aplikasi yang sudah berjalan.</p>
    <dl class="method">
      <div><dt>Cara membaca wireframe</dt><dd>Nama section, frame, dan teks layer di Figma dibaca satu per satu, lalu disusun menjadi langkah dan keputusan.</dd></div>
      <div><dt>Flowchart</dt><dd>Urutan layar dan percabangan yang dialami pengguna aplikasi.</dd></div>
      <div><dt>BPMN</dt><dd>Siapa mengerjakan apa: pengguna, pelanggan, sistem, dan tim pendukung dalam lajur terpisah.</dd></div>
      <div><dt>Batasan</dt><dd>Hal yang tidak tampak di wireframe ditandai sebagai asumsi dan masuk daftar konfirmasi.</dd></div>
    </dl>
  </div>

  <section class="wrap compare" id="perbandingan" aria-labelledby="cmp-title">
    <h2 id="cmp-title">Perbandingan singkat</h2>
    <div class="table-wrap">
      <table>
        <thead><tr>${compare.head.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${compare.rows.map(r => `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>
    <p class="pattern">${esc(compare.pattern)}</p>
  </section>

  ${apps.map(appSection).join('\n')}
</main>

<footer class="wrap">
  <p>Disusun 2 November 2026 dari tiga file Figma: MOFI RO App (Moladin), NNA - SFA, HEBAT - PROTOTYPE (BAT). Teks contoh di wireframe (nama, nominal, lorem ipsum) tidak dipakai sebagai data.</p>
  <p>File pendamping: <code>bpmn/*.bpmn</code> untuk Camunda Modeler atau bpmn.io, <code>mermaid/*.mmd</code> untuk flowchart, status, dan peta layar.</p>
</footer>

<script>
document.querySelectorAll('button.copy').forEach(btn => {
  btn.addEventListener('click', () => {
    const pre = document.getElementById(btn.dataset.target);
    const status = document.getElementById(btn.id + '-status');
    const done = msg => { status.textContent = msg; setTimeout(() => { status.textContent = ''; }, 2500); };
    const selectText = () => { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); done('Teks sudah dipilih, tekan Ctrl+C'); };
    try {
      navigator.clipboard.writeText(pre.textContent).then(() => done('XML disalin'), selectText);
    } catch (e) { selectText(); }
  });
});
</script>
`;

writeFileSync(join(root, 'peta-proses-3-aplikasi.html'), html);
// versi halaman lengkap untuk GitHub Pages (artifact menambahkan kerangka ini sendiri)
writeFileSync(join(root, 'index.html'), `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
${html}
</html>
`);
console.log('ok', Object.fromEntries(Object.entries(built).map(([k, v]) => [k, v.xml.length])), 'html', html.length);

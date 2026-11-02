// Flowchart SVG dari subset sintaks Mermaid yang dipakai di content.mjs.
// Ukuran kotak dihitung dari teks yang sudah dibungkus, jadi teks tidak pernah terpotong.
import dagre from '@dagrejs/dagre';

const FONT = 12.5;
const LINE_H = 16;
const CHAR_W = 7.1; // perkiraan konservatif lebar karakter IBM Plex Sans 12.5px
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const NODE_RE = /^([A-Za-z0-9_]+)\s*(\(\["([^"]*)"\]\)|\["([^"]*)"\]|\{"([^"]*)"\}|\(\((start|end)\)\))?$/;
const EDGE_RE = /\s*(--\s*"([^"]+)"\s*-->|--\s+([^->"][^>]*?)\s+-->|-->|-\.\s*([^.]+?)\s*\.->|-\.->)\s*/g;

export function parseFlow(src) {
  const nodes = new Map(), edges = [], groups = [];
  let dir = 'TB', group = null;
  const node = spec => {
    const m = spec.trim().match(NODE_RE);
    if (!m) throw new Error('Node tidak dikenal: ' + spec);
    const [, id, , term, proc, dec, dot] = m;
    const n = nodes.get(id) || { id, label: id, kind: 'proc' };
    if (term !== undefined) Object.assign(n, { label: term, kind: 'term' });
    if (proc !== undefined) Object.assign(n, { label: proc, kind: 'proc' });
    if (dec !== undefined) Object.assign(n, { label: dec, kind: 'dec' });
    if (dot !== undefined) Object.assign(n, { label: '', kind: dot });
    if (group && !n.parent) n.parent = group;
    nodes.set(id, n);
    return id;
  };
  for (const raw of src.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const head = line.match(/^flowchart\s+(TD|TB|LR)/);
    if (head) { dir = head[1] === 'LR' ? 'LR' : 'TB'; continue; }
    const sub = line.match(/^subgraph\s+([A-Za-z0-9_]+)\["([^"]*)"\]$/);
    if (sub) { groups.push({ id: sub[1], label: sub[2] }); group = sub[1]; continue; }
    if (line === 'end') { group = null; continue; }
    const parts = [], labels = [], dashed = [];
    let last = 0, m;
    EDGE_RE.lastIndex = 0;
    while ((m = EDGE_RE.exec(line))) {
      parts.push(line.slice(last, m.index));
      labels.push(m[2] || m[3] || m[4] || '');
      dashed.push(m[1].startsWith('-.'));
      last = EDGE_RE.lastIndex;
    }
    parts.push(line.slice(last));
    const segs = parts.map(p => p.split(/\s+&\s+/).map(node));
    for (let i = 0; i < labels.length; i++)
      for (const a of segs[i]) for (const b of segs[i + 1])
        edges.push({ from: a, to: b, label: labels[i].trim(), dashed: dashed[i] });
  }
  return { dir, nodes: [...nodes.values()], edges, groups };
}

function wrap(text, max) {
  const lines = [];
  let cur = '';
  for (const w of String(text).split(' ')) {
    if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}
const textW = lines => Math.max(...lines.map(l => l.length)) * CHAR_W;

function sizeNode(n) {
  if (n.kind === 'start' || n.kind === 'end') {
    n.lines = []; n.w = n.h = 22;
  } else if (n.kind === 'dec') {
    n.lines = wrap(n.label, 16);
    const w0 = textW(n.lines) + 6, h0 = n.lines.length * LINE_H + 4;
    // teks berbentuk persegi panjang harus muat di dalam belah ketupat: w0/W + h0/H <= 1
    n.w = Math.round(w0 / 0.56 + 10); n.h = Math.round(h0 / 0.40 + 10);
  } else {
    n.lines = wrap(n.label, n.kind === 'term' ? 26 : 24);
    n.w = Math.round(textW(n.lines) + (n.kind === 'term' ? 40 : 30));
    n.h = n.lines.length * LINE_H + 22;
  }
}

// titik potong garis dari p menuju pusat c dengan tepi belah ketupat
function diamondPoint(c, p, w, h) {
  const dx = p.x - c.x, dy = p.y - c.y;
  if (!dx && !dy) return p;
  const t = 1 / (Math.abs(dx) / (w / 2) + Math.abs(dy) / (h / 2));
  return { x: c.x + dx * t, y: c.y + dy * t };
}

export function renderFlow(src, id) {
  const { dir, nodes, edges, groups } = parseFlow(src);
  nodes.forEach(sizeNode);
  const g = new dagre.graphlib.Graph({ multigraph: true, compound: groups.length > 0 });
  g.setGraph({ rankdir: dir, nodesep: 34, ranksep: groups.length ? 60 : 46, edgesep: 18, marginx: 16, marginy: groups.length ? 36 : 16 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const gr of groups) g.setNode(gr.id, { label: gr.label });
  for (const n of nodes) {
    g.setNode(n.id, { width: n.w, height: n.h });
    if (n.parent) g.setParent(n.id, n.parent);
  }
  edges.forEach((e, i) => {
    const lw = e.label ? e.label.length * 6.4 + 14 : 0;
    g.setEdge(e.from, e.to, e.label ? { width: lw, height: 20, labelpos: 'c' } : {}, 'e' + i);
  });
  dagre.layout(g);
  const W = Math.ceil(g.graph().width), H = Math.ceil(g.graph().height);
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  const out = [];
  for (const gr of groups) {
    const c = g.node(gr.id);
    const x = c.x - c.width / 2 - 10, y = c.y - c.height / 2 - 10;
    out.push(`<rect class="f-group" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(c.width + 20).toFixed(1)}" height="${(c.height + 20).toFixed(1)}" rx="12"/>`);
    out.push(`<text class="f-group-label" x="${(x + 12).toFixed(1)}" y="${(y - 8).toFixed(1)}">${esc(gr.label)}</text>`);
  }
  edges.forEach((e, i) => {
    const ge = g.edge(e.from, e.to, 'e' + i);
    const pts = ge.points.map(p => ({ ...p }));
    const s = byId[e.from], t = byId[e.to];
    if (s.kind === 'dec') pts[0] = diamondPoint(g.node(s.id), pts[1], s.w, s.h);
    if (t.kind === 'dec') pts[pts.length - 1] = diamondPoint(g.node(t.id), pts[pts.length - 2], t.w, t.h);
    // kurva halus melalui titik dagre
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let k = 1; k < pts.length - 1; k++) {
      const mx = (pts[k].x + pts[k + 1].x) / 2, my = (pts[k].y + pts[k + 1].y) / 2;
      d += ` Q${pts[k].x.toFixed(1)},${pts[k].y.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
    }
    const z = pts[pts.length - 1];
    d += ` L${z.x.toFixed(1)},${z.y.toFixed(1)}`;
    out.push(`<path class="f-edge${e.dashed ? ' f-dashed' : ''}" d="${d}" marker-end="url(#fa-${id})"/>`);
    if (e.label) {
      const lw = e.label.length * 6.4 + 14;
      out.push(`<rect class="f-elabel-bg" x="${(ge.x - lw / 2).toFixed(1)}" y="${(ge.y - 10).toFixed(1)}" width="${lw.toFixed(1)}" height="20" rx="10"/>`);
      out.push(`<text class="f-elabel" x="${ge.x.toFixed(1)}" y="${ge.y.toFixed(1)}" dy="0.35em" text-anchor="middle">${esc(e.label)}</text>`);
    }
  });
  for (const n of nodes) {
    const { x, y } = g.node(n.id);
    if (n.kind === 'start') { out.push(`<circle class="f-start" cx="${x}" cy="${y}" r="10"/>`); continue; }
    if (n.kind === 'end') { out.push(`<circle class="f-end-ring" cx="${x}" cy="${y}" r="10"/><circle class="f-start" cx="${x}" cy="${y}" r="5.5"/>`); continue; }
    if (n.kind === 'dec') {
      out.push(`<polygon class="f-dec" points="${x},${y - n.h / 2} ${x + n.w / 2},${y} ${x},${y + n.h / 2} ${x - n.w / 2},${y}"/>`);
    } else {
      out.push(`<rect class="f-${n.kind}" x="${(x - n.w / 2).toFixed(1)}" y="${(y - n.h / 2).toFixed(1)}" width="${n.w}" height="${n.h}" rx="${n.kind === 'term' ? n.h / 2 : 8}"/>`);
    }
    const top = y - ((n.lines.length - 1) * LINE_H) / 2;
    out.push(`<text class="f-text${n.kind === 'term' ? ' f-text-term' : ''}" text-anchor="middle">${n.lines.map((l, k) =>
      `<tspan x="${x}" y="${(top + k * LINE_H).toFixed(1)}" dy="0.35em">${esc(l)}</tspan>`).join('')}</text>`);
  }
  return `<svg class="flow-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Flowchart" xmlns="http://www.w3.org/2000/svg" style="font-size:${FONT}px">
<defs><marker id="fa-${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="f-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
${out.join('\n')}
</svg>`;
}

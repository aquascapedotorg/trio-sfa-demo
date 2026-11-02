// Tata letak sederhana + ekspor BPMN 2.0 (dengan DI) dan SVG dari model di models.mjs.

const POOL_LABEL_W = 30;
const LANE_LABEL_W = 30;
const COL_W = 150;
const X0 = POOL_LABEL_W + LANE_LABEL_W + 40;
const SIZE = {
  start: [36, 36], end: [36, 36],
  user: [120, 72], service: [120, 72], manual: [120, 72],
  xor: [50, 50], or: [50, 50],
};
const BPMN_TAG = {
  start: 'startEvent', end: 'endEvent', user: 'userTask', service: 'serviceTask',
  manual: 'manualTask', xor: 'exclusiveGateway', or: 'inclusiveGateway',
};

export function layout(model) {
  let y = 0;
  const lanes = model.lanes.map((l, i) => {
    const lane = { ...l, i, id: `${model.id}_lane${i}`, y, x: POOL_LABEL_W };
    y += l.h;
    return lane;
  });
  const maxCol = Math.max(...model.nodes.map(n => n.col));
  const width = X0 + (maxCol + 1) * COL_W + 20;
  for (const l of lanes) l.w = width - POOL_LABEL_W;
  const nodes = {};
  for (const n of model.nodes) {
    const [w, h] = SIZE[n.type];
    const lane = lanes[n.lane];
    const cx = X0 + n.col * COL_W + 60;
    const cy = lane.y + lane.h / 2 + (n.dy || 0);
    nodes[n.id] = { ...n, w, h, x: cx - w / 2, y: cy - h / 2, cx, cy, laneObj: lane };
  }
  const isGw = n => n.type === 'xor' || n.type === 'or';
  const edges = model.flows.map(([from, to, label, route], i) => {
    const s = nodes[from], t = nodes[to];
    let pts;
    if (route === 'right') {
      // keluar dari sisi kanan gateway, naik/turun, lalu masuk dari kiri target
      const mx = s.x + s.w + 16;
      pts = [[s.x + s.w, s.cy], [mx, s.cy], [mx, t.cy], [t.x, t.cy]];
    } else if (route === 'left-down') {
      pts = [[s.x, s.cy], [t.cx, s.cy], [t.cx, t.cy < s.cy ? t.y + t.h : t.y]];
    } else if (route === 'under-left') {
      const low = s.laneObj.y + s.laneObj.h > t.laneObj.y + t.laneObj.h ? s.laneObj : t.laneObj;
      const yb = low.y + low.h - 14, xl = t.x - 30;
      pts = [[s.cx, s.y + s.h], [s.cx, yb], [xl, yb], [xl, t.cy], [t.x, t.cy]];
    } else if (t.col === s.col) {
      pts = t.cy > s.cy ? [[s.cx, s.y + s.h], [t.cx, t.y]] : [[s.cx, s.y], [t.cx, t.y + t.h]];
    } else if (t.col > s.col) {
      if (Math.abs(s.cy - t.cy) < 1) {
        pts = [[s.x + s.w, s.cy], [t.x, t.cy]];
      } else if (isGw(s)) {
        const sy = t.cy < s.cy ? s.y : s.y + s.h;
        pts = [[s.cx, sy], [s.cx, t.cy], [t.x, t.cy]];
      } else if (isGw(t)) {
        const ty = s.cy < t.cy ? t.y : t.y + t.h;
        pts = [[s.x + s.w, s.cy], [t.cx, s.cy], [t.cx, ty]];
      } else {
        const mx = t.x - 22;
        pts = [[s.x + s.w, s.cy], [mx, s.cy], [mx, t.cy], [t.x, t.cy]];
      }
    } else {
      // alur balik: lewat bawah lajur terbawah dari kedua node
      const low = s.laneObj.y + s.laneObj.h > t.laneObj.y + t.laneObj.h ? s.laneObj : t.laneObj;
      const yb = low.y + low.h - 14;
      pts = [[s.cx, s.y + s.h], [s.cx, yb], [t.cx, yb], [t.cx, t.y + t.h]];
    }
    // label di segmen horizontal terakhir (menjauh dari label gateway), kalau tidak ada pakai segmen pertama
    let lx, ly;
    const last = [pts[pts.length - 2], pts[pts.length - 1]];
    if (pts.length > 2 && Math.abs(last[0][1] - last[1][1]) < 1) {
      lx = (last[0][0] + last[1][0]) / 2; ly = last[0][1] - 10;
    } else {
      const [p0, p1] = pts;
      lx = (p0[0] + p1[0]) / 2; ly = (p0[1] + p1[1]) / 2 + (Math.abs(p0[1] - p1[1]) < 1 ? -10 : 0);
    }
    return { id: `${model.id}_f${i}`, from, to, label, pts, lx, ly };
  });
  return { model, lanes, nodes, edges, width, height: y };
}

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function toBpmnXml(L) {
  const { model, lanes, nodes, edges, width, height } = L;
  const pid = `${model.id}_process`;
  const inc = {}, out = {};
  for (const e of edges) { (out[e.from] ||= []).push(e.id); (inc[e.to] ||= []).push(e.id); }
  const nodeXml = Object.values(nodes).map(n => {
    const io = [...(inc[n.id] || []).map(f => `<bpmn:incoming>${f}</bpmn:incoming>`),
      ...(out[n.id] || []).map(f => `<bpmn:outgoing>${f}</bpmn:outgoing>`)].join('');
    return `      <bpmn:${BPMN_TAG[n.type]} id="${model.id}_${n.id}"${n.label ? ` name="${esc(n.label)}"` : ''}>${io}</bpmn:${BPMN_TAG[n.type]}>`;
  }).join('\n');
  const flowXml = edges.map(e =>
    `      <bpmn:sequenceFlow id="${e.id}" sourceRef="${model.id}_${e.from}" targetRef="${model.id}_${e.to}"${e.label ? ` name="${esc(e.label)}"` : ''} />`).join('\n');
  const laneXml = lanes.map(l => `        <bpmn:lane id="${l.id}" name="${esc(l.name)}">\n${
    Object.values(nodes).filter(n => n.lane === l.i).map(n => `          <bpmn:flowNodeRef>${model.id}_${n.id}</bpmn:flowNodeRef>`).join('\n')}\n        </bpmn:lane>`).join('\n');
  const diShapes = [
    `      <bpmndi:BPMNShape id="${model.id}_pool_di" bpmnElement="${model.id}_pool" isHorizontal="true"><dc:Bounds x="0" y="0" width="${width}" height="${height}" /></bpmndi:BPMNShape>`,
    ...lanes.map(l => `      <bpmndi:BPMNShape id="${l.id}_di" bpmnElement="${l.id}" isHorizontal="true"><dc:Bounds x="${l.x}" y="${l.y}" width="${l.w}" height="${l.h}" /></bpmndi:BPMNShape>`),
    ...Object.values(nodes).map(n => {
      const lbl = (n.type === 'start' || n.type === 'end' || n.type === 'xor' || n.type === 'or') && n.label
        ? `<bpmndi:BPMNLabel><dc:Bounds x="${n.cx - 50}" y="${n.y + n.h + 4}" width="100" height="28" /></bpmndi:BPMNLabel>` : '';
      return `      <bpmndi:BPMNShape id="${model.id}_${n.id}_di" bpmnElement="${model.id}_${n.id}"${n.type === 'xor' ? ' isMarkerVisible="true"' : ''}><dc:Bounds x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" />${lbl}</bpmndi:BPMNShape>`;
    }),
  ].join('\n');
  const diEdges = edges.map(e => `      <bpmndi:BPMNEdge id="${e.id}_di" bpmnElement="${e.id}">${
    e.pts.map(([x, y]) => `<di:waypoint x="${Math.round(x)}" y="${Math.round(y)}" />`).join('')}${
    e.label ? `<bpmndi:BPMNLabel><dc:Bounds x="${Math.round(e.lx - 40)}" y="${Math.round(e.ly - 18)}" width="80" height="14" /></bpmndi:BPMNLabel>` : ''}</bpmndi:BPMNEdge>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="${model.id}_defs" targetNamespace="http://bpmn.io/schema/bpmn" exporter="wireframe-rea" exporterVersion="1.0">
  <bpmn:collaboration id="${model.id}_collab">
    <bpmn:participant id="${model.id}_pool" name="${esc(model.pool)}" processRef="${pid}" />
  </bpmn:collaboration>
  <bpmn:process id="${pid}" isExecutable="false">
    <bpmn:laneSet id="${model.id}_laneset">
${laneXml}
    </bpmn:laneSet>
${nodeXml}
${flowXml}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="${model.id}_diagram">
    <bpmndi:BPMNPlane id="${model.id}_plane" bpmnElement="${model.id}_collab">
${diShapes}
${diEdges}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>
`;
}

function wrap(text, max) {
  const words = String(text).split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

function textBlock(lines, cx, cy, cls, lh = 13) {
  const top = cy - ((lines.length - 1) * lh) / 2;
  return `<text class="${cls}" x="${cx}" text-anchor="middle">${lines.map((l, i) =>
    `<tspan x="${cx}" y="${(top + i * lh).toFixed(1)}" dy="0.35em">${esc(l)}</tspan>`).join('')}</text>`;
}

const GLYPH = {
  user: (x, y) => `<g class="b-glyph" transform="translate(${x + 8},${y + 7})"><circle cx="6" cy="4" r="3.2"/><path d="M0.5 13.5c0-3.4 2.5-5.4 5.5-5.4s5.5 2 5.5 5.4z"/></g>`,
  service: (x, y) => `<g class="b-glyph" transform="translate(${x + 8},${y + 7})"><circle cx="6.5" cy="6.5" r="5.6" stroke-dasharray="2.2 1.6"/><circle cx="6.5" cy="6.5" r="2.2"/></g>`,
  manual: (x, y) => `<g class="b-glyph" transform="translate(${x + 8},${y + 8})"><path d="M0.5 5.5h7.5M0.5 8.5h9M0.5 11.5h8M0.5 2.5h5"/></g>`,
};

export function toSvg(L) {
  const { model, lanes, nodes, edges, width, height } = L;
  const W = width + 2, H = height + 2;
  const parts = [];
  parts.push(`<rect class="b-pool" x="0.5" y="0.5" width="${width}" height="${height}"/>`);
  parts.push(`<text class="b-pool-label" transform="translate(${POOL_LABEL_W / 2 + 4},${height / 2}) rotate(-90)" text-anchor="middle">${esc(model.pool)}</text>`);
  for (const l of lanes) {
    parts.push(`<rect class="b-lane${l.i % 2 ? ' b-lane-alt' : ''}" x="${l.x + 0.5}" y="${l.y + 0.5}" width="${l.w}" height="${l.h}"/>`);
    parts.push(`<line class="b-lane-sep" x1="${l.x + LANE_LABEL_W + 0.5}" y1="${l.y}" x2="${l.x + LANE_LABEL_W + 0.5}" y2="${l.y + l.h}"/>`);
    parts.push(`<text class="b-lane-label" transform="translate(${l.x + LANE_LABEL_W / 2 + 4},${l.y + l.h / 2}) rotate(-90)" text-anchor="middle">${esc(l.name)}</text>`);
  }
  for (const e of edges) {
    parts.push(`<polyline class="b-flow" points="${e.pts.map(p => p.join(',')).join(' ')}" marker-end="url(#arrow-${model.id})"/>`);
    if (e.label) {
      const w = e.label.length * 5.6 + 8;
      parts.push(`<rect class="b-flow-label-bg" x="${(e.lx - w / 2).toFixed(1)}" y="${(e.ly - 8).toFixed(1)}" width="${w.toFixed(1)}" height="15" rx="3"/>`);
      parts.push(`<text class="b-flow-label" x="${e.lx.toFixed(1)}" y="${(e.ly + 3).toFixed(1)}" text-anchor="middle">${esc(e.label)}</text>`);
    }
  }
  for (const n of Object.values(nodes)) {
    if (n.type === 'start' || n.type === 'end') {
      parts.push(`<circle class="b-event b-${n.type}" cx="${n.cx}" cy="${n.cy}" r="${n.w / 2}"/>`);
      if (n.label) parts.push(textBlock(wrap(n.label, 16), n.cx, n.y + n.h + 14, 'b-node-sub'));
    } else if (n.type === 'xor' || n.type === 'or') {
      const { cx, cy } = n, r = n.w / 2;
      parts.push(`<polygon class="b-gw" points="${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}"/>`);
      parts.push(n.type === 'xor'
        ? `<path class="b-gw-mark" d="M${cx - 8} ${cy - 8}L${cx + 8} ${cy + 8}M${cx + 8} ${cy - 8}L${cx - 8} ${cy + 8}"/>`
        : `<circle class="b-gw-mark" cx="${cx}" cy="${cy}" r="10"/>`);
      if (n.label) {
        // kiri atas gateway, menjauh dari garis keluar atas/bawah
        const lines = wrap(n.label, 14);
        parts.push(`<text class="b-node-sub" text-anchor="end">${lines.map((l, i) =>
          `<tspan x="${cx - 14}" y="${(cy - 18 - (lines.length - 1 - i) * 12).toFixed(1)}">${esc(l)}</tspan>`).join('')}</text>`);
      }
    } else {
      parts.push(`<rect class="b-task b-task-${n.type}" x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="9"/>`);
      parts.push(GLYPH[n.type](n.x, n.y));
      parts.push(textBlock(wrap(n.label, 19), n.cx, n.cy + 5, 'b-node-label'));
    }
  }
  return `<svg class="bpmn-svg" viewBox="-1 -1 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Diagram BPMN ${esc(model.pool)}" xmlns="http://www.w3.org/2000/svg">
<defs><marker id="arrow-${model.id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="b-arrow" d="M0 0L10 5L0 10z"/></marker></defs>
${parts.join('\n')}
</svg>`;
}

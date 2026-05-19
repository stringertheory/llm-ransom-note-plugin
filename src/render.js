const FONTS = [
  "'Segoe Print', 'Bradley Hand', cursive",
  "Optima, Candara, 'Noto Sans', sans-serif",
  "'Nimbus Mono PS', 'Courier New', monospace",
  "'Iowan Old Style', 'Palatino Linotype', serif",
  "Inter, 'Helvetica Neue', Arial, sans-serif",
  "Rockwell, 'Rockwell Nova', 'Roboto Slab', serif",
  "Georgia, serif",
  "Impact, 'Arial Black', sans-serif",
  "'Times New Roman', serif",
  "Tahoma, sans-serif",
];

// Pure-white and near-white papers are excluded so scraps stay visible
// against a light-mode chat background.
const PAPERS = [
  '#f0e3b8', '#ede0c4', '#e8dcb5', '#dccf9f', '#d6c896',
  '#f2dc9a', '#ffd97a', '#ffc94a',
  '#ffb6c1', '#ff9bb0', '#ffa896',
  '#9ccfe8', '#7fb8d8', '#a6c9e0',
  '#c2c0b0', '#b8b6a8',
  '#e8b873', '#d99c63',
];

const INKS = [
  '#080808', '#111111', '#1a1a1a',
  '#2a1a0a', '#3a2818',
  '#6a1414', '#7a1010',
  '#0a2a6a', '#10306e',
];

// Mulberry32.
function makeRand(seed) {
  let a = (seed >>> 0) || 1;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function clipPathFor(r) {
  const roll = r();
  if (roll < 0.50) return '';
  if (roll < 0.65) {
    const top = tornEdgePoints('top', 7 + Math.floor(r() * 4), r);
    return `polygon(${top.join(', ')}, 100% 100%, 0 100%)`;
  }
  if (roll < 0.75) {
    const bot = tornEdgePoints('bottom', 7 + Math.floor(r() * 4), r);
    return `polygon(0 0, 100% 0, ${bot.join(', ')})`;
  }
  if (roll < 0.83) {
    const top = tornEdgePoints('top', 7 + Math.floor(r() * 4), r);
    const bot = tornEdgePoints('bottom', 7 + Math.floor(r() * 4), r);
    return `polygon(${top.join(', ')}, ${bot.join(', ')})`;
  }
  if (roll < 0.92) {
    const inset = (8 + r() * 16).toFixed(0);
    const corner = Math.floor(r() * 4);
    if (corner === 0) return `polygon(${inset}% 0, 100% 0, 100% 100%, 0 100%, 0 ${inset}%)`;
    if (corner === 1) return `polygon(0 0, ${100 - inset}% 0, 100% ${inset}%, 100% 100%, 0 100%)`;
    if (corner === 2) return `polygon(0 0, 100% 0, 100% 100%, ${inset}% 100%, 0 ${100 - inset}%)`;
    return `polygon(0 0, 100% 0, 100% ${100 - inset}%, ${100 - inset}% 100%, 0 100%)`;
  }
  const lean = (4 + r() * 6).toFixed(0);
  if (r() < 0.5) {
    return `polygon(${lean}% 0, 100% 0, ${100 - lean}% 100%, 0 100%)`;
  }
  return `polygon(0 0, ${100 - lean}% 0, 100% 100%, ${lean}% 100%)`;
}

function tornEdgePoints(edge, segments, r) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const x = ((i / segments) * 100).toFixed(1);
    const amp = 0.5 + r() * 8.5;
    const y = edge === 'top' ? amp.toFixed(1) : (100 - amp).toFixed(1);
    pts.push(`${x}% ${y}%`);
  }
  if (edge === 'bottom') pts.reverse();
  return pts;
}

function styleForToken(isPunct, r) {
  const pick = (a) => a[Math.floor(r() * a.length)];
  const rot = (-12 + r() * 24).toFixed(1);
  const size = (isPunct ? 0.9 + r() * 0.3 : 0.85 + r() * 0.5).toFixed(2);
  const weight = r() < 0.45 ? 400 : 800;
  const italic = r() < 0.1 ? 'italic' : 'normal';
  const dy = (-0.08 + r() * 0.16).toFixed(2);
  const clip = clipPathFor(r);
  // Extra padding when clipping so the cut bites into paper, not letters.
  const padBoost = clip ? 0.04 : 0;
  const px = ((isPunct ? 0.06 + r() * 0.06 : 0.14 + r() * 0.10) + padBoost).toFixed(2);
  const py = (0.04 + r() * 0.06 + padBoost).toFixed(2);
  return [
    'display:inline-block',
    'line-height:1',
    'font-family:' + pick(FONTS),
    'font-weight:' + weight,
    'font-style:' + italic,
    'font-size:' + size + 'em',
    'color:' + pick(INKS),
    'background:' + pick(PAPERS),
    'padding:' + py + 'em ' + px + 'em',
    'margin:0 0.02em',
    'transform:rotate(' + rot + 'deg) translateY(' + dy + 'em)',
    // drop-shadow (not box-shadow) so it follows clip-path edges.
    'filter:drop-shadow(0 1px 1.5px rgba(0,0,0,0.35))',
    clip ? 'clip-path:' + clip : '',
  ].filter(Boolean).join(';');
}

// `encode` and `decode` are passed in so this module stays free of
// gpt-tokenizer's load path (CJS in Node, bundled in the browser).
function renderTokenHtml(text, encode, decode, seed) {
  const r = makeRand(seed);
  const ids = encode(text);
  return ids
    .map((id) => {
      const s = decode([id]);
      const m = s.match(/^(\s*)(.*)$/s);
      const lead = m[1];
      const body = m[2];
      if (!body) return lead;
      const isPunct = /^[^A-Za-z0-9']+$/.test(body);
      return lead + `<span class="ransomy-tok" style="${styleForToken(isPunct, r)}">${escapeHtml(body)}</span>`;
    })
    .join('');
}

module.exports = { renderTokenHtml, makeRand };

// render-v2.js — improved generative ransom-note styling.
//
// Public API:
//   renderTokenHtml(text, encode, decode, seed, options?)
//   options.mode = 'per-letter' | 'per-token' | 'token-coherent'  (default 'per-letter')
//
// Key changes vs v1:
//
//   1. SCRAP PALETTE is a list of (paper, [allowed inks]) pairs, not two
//      independent arrays. Every scrap is guaranteed high-contrast.
//      - Newsprint (white/cream) is the dominant scrap, with dark ink.
//      - Saturated scraps (red/blue/green/black) get WHITE or YELLOW ink —
//        the signature "inverted" look that v1 could never produce.
//
//   2. FONTS are newspaper/magazine headline faces only: Impact, Times Bold,
//      Georgia, Rockwell, Arial Black, Garamond, Cooper. No script.
//
//   3. CASE is per-scrap, not per-letter. Each scrap picks one case style
//      (keep / UPPER / lower / Title) so you never see "hE" or "moN" —
//      the mixed-case feel comes from neighboring scraps disagreeing,
//      not from a single scrap mixing.
//
//   4. SIZE has a ~10% "giant" tier (1.7-2.3×); rotation has a ~5%
//      extreme tier (±15-22°). Most stay calm.
//
//   5. Near-white scraps get a faint inset border so they don't dissolve
//      on a light chat background — included instead of excluded.
//
//   6. THREE RENDER MODES:
//      - per-letter:      each token split into 1-3 char scraps, every
//                         scrap fully independent. Most "ransom-noisy."
//      - per-token:       one scrap per tokenizer token. Preserves the
//                         tokenizer-as-visualization story.
//      - token-coherent:  per-letter scraps, but all letters inside a
//                         token share the same paper color (with a tiny
//                         lightness wiggle) and only pick inks legal
//                         against that paper. Letters still vary in font,
//                         size, rotation, ink — but the token reads as
//                         one cohesive "cutting" visually.

// ── Scrap palette ──────────────────────────────────────────────────────
  // Each entry: { bg, inks: [...], weight, border? }
  // `border` is true for near-white scraps that would otherwise vanish.
  const SCRAPS = [
    // Newsprint workhorses — dominate the mix.
    { bg: '#ffffff', inks: ['#0a0a0a', '#111', '#1a1a1a'],            weight: 7, border: true },
    { bg: '#f7f3e8', inks: ['#0a0a0a', '#1a1a1a'],                    weight: 6, border: true },
    { bg: '#efe7d2', inks: ['#0a0a0a', '#2a1a0a'],                    weight: 5 },
    { bg: '#fbfaf2', inks: ['#0a0a0a', '#c41818'],                    weight: 4, border: true },
    { bg: '#ffffff', inks: ['#c41818', '#0a0a0a'],                    weight: 3, border: true },
    { bg: '#ffffff', inks: ['#0033a0', '#0a0a0a'],                    weight: 2, border: true },
    { bg: '#ffffff', inks: ['#1f7a3a', '#0a0a0a'],                    weight: 2, border: true },

    // Cream / aged
    { bg: '#e8dcb5', inks: ['#0a0a0a', '#2a1a0a'],                    weight: 3 },
    { bg: '#d9cf9b', inks: ['#0a0a0a'],                               weight: 2 },
    { bg: '#c8c0a8', inks: ['#0a0a0a'],                               weight: 2 },

    // Pastel scraps — dark ink
    { bg: '#cfe4e6', inks: ['#0a0a0a'],                               weight: 2 },
    { bg: '#d8e6c8', inks: ['#0a0a0a'],                               weight: 2 },
    { bg: '#f4b6c2', inks: ['#0a0a0a'],                               weight: 2 },
    { bg: '#fbe2c4', inks: ['#0a0a0a', '#7a1010'],                    weight: 2 },
    { bg: '#cdd7f0', inks: ['#0a0a0a', '#0033a0'],                    weight: 2 },

    // Yellow paper → black letter
    { bg: '#ffd400', inks: ['#0a0a0a', '#c41818'],                    weight: 3 },
    { bg: '#f5c518', inks: ['#0a0a0a'],                               weight: 2 },

    // Saturated paper, light letter — signature look.
    { bg: '#c8232c', inks: ['#ffffff', '#ffd400', '#fef7e0'],         weight: 4 },
    { bg: '#a8181f', inks: ['#ffffff', '#ffd400'],                    weight: 2 },
    { bg: '#ff6a1f', inks: ['#ffffff', '#0a0a0a'],                    weight: 3 },
    { bg: '#1a4eb8', inks: ['#ffffff', '#ffd400'],                    weight: 3 },
    { bg: '#0a2a6a', inks: ['#ffffff', '#ffd400'],                    weight: 2 },
    { bg: '#1f7a3a', inks: ['#ffffff', '#ffd400'],                    weight: 3 },
    { bg: '#0a4a2a', inks: ['#ffffff', '#ffd400'],                    weight: 2 },
    { bg: '#111111', inks: ['#ffffff', '#ffd400', '#ff6a1f'],         weight: 3 },
    { bg: '#2a2a2a', inks: ['#ffffff', '#ffd400'],                    weight: 2 },
    { bg: '#6b1f8a', inks: ['#ffffff', '#ffd400'],                    weight: 1 },
  ];

  // Newspaper / magazine headline faces. NO script, NO handwriting.
  const FONTS = [
    { f: "Impact, 'Haettenschweiler', 'Arial Narrow Bold', sans-serif",       w: 900 },
    { f: "'Arial Black', 'Helvetica Neue', sans-serif",                       w: 900 },
    { f: "'Helvetica Neue', Helvetica, Arial, sans-serif",                    w: 800 },
    { f: "'Times New Roman', Times, serif",                                   w: 900 },
    { f: "Georgia, 'Times New Roman', serif",                                 w: 700 },
    { f: "'Rockwell', 'Rockwell Nova', 'Roboto Slab', 'Courier New', serif",  w: 900 },
    { f: "'Garamond', 'EB Garamond', Georgia, serif",                         w: 800 },
    { f: "'Iowan Old Style', 'Palatino Linotype', Palatino, serif",           w: 900 },
    { f: "'Courier New', 'Nimbus Mono PS', monospace",                        w: 700 },
    { f: "'Trebuchet MS', 'Helvetica Neue', sans-serif",                      w: 900 },
    { f: "'Cooper Black', 'Georgia', serif",                                  w: 900 },
    { f: "Georgia, serif",                                                    w: 400 },
    { f: "'Times New Roman', serif",                                          w: 400 },
  ];

  // ── PRNG (mulberry32) ─────────────────────────────────────────────────
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

  function pickWeighted(arr, r) {
    let total = 0;
    for (const it of arr) total += it.weight || 1;
    let x = r() * total;
    for (const it of arr) {
      x -= it.weight || 1;
      if (x <= 0) return it;
    }
    return arr[arr.length - 1];
  }

  // ── Clip-paths ────────────────────────────────────────────────────────
  function tornEdgePoints(edge, segments, r) {
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const x = ((i / segments) * 100).toFixed(1);
      const amp = 0.5 + r() * 7.5;
      const y = edge === 'top' ? amp.toFixed(1) : (100 - amp).toFixed(1);
      pts.push(`${x}% ${y}%`);
    }
    if (edge === 'bottom') pts.reverse();
    return pts;
  }

  function clipPathFor(r) {
    const roll = r();
    if (roll < 0.70) return '';
    if (roll < 0.80) {
      const top = tornEdgePoints('top', 7 + Math.floor(r() * 4), r);
      return `polygon(${top.join(', ')}, 100% 100%, 0 100%)`;
    }
    if (roll < 0.87) {
      const bot = tornEdgePoints('bottom', 7 + Math.floor(r() * 4), r);
      return `polygon(0 0, 100% 0, ${bot.join(', ')})`;
    }
    if (roll < 0.93) {
      const inset = (6 + r() * 14).toFixed(0);
      const corner = Math.floor(r() * 4);
      if (corner === 0) return `polygon(${inset}% 0, 100% 0, 100% 100%, 0 100%, 0 ${inset}%)`;
      if (corner === 1) return `polygon(0 0, ${100 - inset}% 0, 100% ${inset}%, 100% 100%, 0 100%)`;
      if (corner === 2) return `polygon(0 0, 100% 0, 100% 100%, ${inset}% 100%, 0 ${100 - inset}%)`;
      return `polygon(0 0, 100% 0, 100% ${100 - inset}%, ${100 - inset}% 100%, 0 100%)`;
    }
    const lean = (3 + r() * 5).toFixed(0);
    if (r() < 0.5) return `polygon(${lean}% 0, 100% 0, ${100 - lean}% 100%, 0 100%)`;
    return `polygon(0 0, ${100 - lean}% 0, 100% 100%, ${lean}% 100%)`;
  }

  // ── Case style — picked ONCE per scrap, applied to the whole body ─────
  // Distribution biases toward keeping the source's own case so the result
  // doesn't read as totally random — but every scrap commits to one style.
  function pickCaseStyle(r) {
    const roll = r();
    if (roll < 0.50) return 'keep';
    if (roll < 0.78) return 'upper';
    if (roll < 0.93) return 'lower';
    return 'title';
  }
  function applyCase(s, style) {
    if (style === 'upper') return s.toUpperCase();
    if (style === 'lower') return s.toLowerCase();
    if (style === 'title') {
      if (s.length === 0) return s;
      return s[0].toUpperCase() + s.slice(1).toLowerCase();
    }
    return s;
  }

  // ── Tiny per-letter lightness wiggle on a hex bg ──────────────────────
  // Used in 'token-coherent' so neighbouring scraps from the same token
  // feel like they were cut from slightly different spots on the same page.
  function jitterBg(hex, r) {
    // Parse #rrggbb
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
    const R = parseInt(hex.slice(1, 3), 16);
    const G = parseInt(hex.slice(3, 5), 16);
    const B = parseInt(hex.slice(5, 7), 16);
    // ±5% lightness shift
    const d = Math.round((r() * 2 - 1) * 12);
    const cl = (v) => Math.max(0, Math.min(255, v + d));
    const toHex = (v) => cl(v).toString(16).padStart(2, '0');
    return '#' + toHex(R) + toHex(G) + toHex(B);
  }

  // ── Build the inline style for one scrap ──────────────────────────────
  // `scrap` is either picked here (when `forcedScrap` is null) or passed in
  // (token-coherent mode reuses the same scrap across a token's letters).
  function styleForScrap(opts) {
    const { isPunct, isGiantEligible, r, forcedScrap, jitter } = opts;
    const scrap = forcedScrap || pickWeighted(SCRAPS, r);
    const ink = scrap.inks[Math.floor(r() * scrap.inks.length)];
    const font = FONTS[Math.floor(r() * FONTS.length)];

    const extreme = r() < 0.05;
    const rot = extreme
      ? ((r() < 0.5 ? -1 : 1) * (14 + r() * 8)).toFixed(1)
      : (-8 + r() * 16).toFixed(1);

    let size;
    if (isPunct) size = 0.75 + r() * 0.3;
    else if (isGiantEligible && r() < 0.10) size = 1.7 + r() * 0.6;
    else size = 0.85 + r() * 0.7;

    const italic = r() < 0.06 ? 'italic' : 'normal';
    const dy = (-0.10 + r() * 0.20).toFixed(2);

    const clip = clipPathFor(r);
    const padBoost = clip ? 0.04 : 0;
    const px = ((isPunct ? 0.06 + r() * 0.05 : 0.10 + r() * 0.14) + padBoost).toFixed(2);
    const py = (0.04 + r() * 0.08 + padBoost).toFixed(2);

    const bg = jitter ? jitterBg(scrap.bg, r) : scrap.bg;
    const border = scrap.border
      ? 'box-shadow:inset 0 0 0 1px rgba(0,0,0,0.10);'
      : '';

    return {
      scrap,
      style: [
        'display:inline-block',
        'line-height:1',
        'font-family:' + font.f,
        'font-weight:' + font.w,
        'font-style:' + italic,
        'font-size:' + size.toFixed(2) + 'em',
        'color:' + ink,
        'background:' + bg,
        'padding:' + py + 'em ' + px + 'em',
        'margin:0 0.03em',
        'transform:rotate(' + rot + 'deg) translateY(' + dy + 'em)',
        'filter:drop-shadow(0 1px 1.5px rgba(0,0,0,0.30))',
        border,
        clip ? 'clip-path:' + clip : '',
      ].filter(Boolean).join(';'),
    };
  }

  // ── Split a word into 1-3-char chunks (mostly 1) ──────────────────────
  function splitToChunks(word, r) {
    const out = [];
    let i = 0;
    while (i < word.length) {
      const roll = r();
      let n;
      if (roll < 0.72) n = 1;
      else if (roll < 0.94) n = 2;
      else n = 3;
      n = Math.min(n, word.length - i);
      out.push(word.slice(i, i + n));
      i += n;
    }
    return out;
  }

  // ── Build a scrap span ────────────────────────────────────────────────
  function spanFor(body, opts) {
    const { style } = styleForScrap(opts);
    return `<span class="ransomy-tok" style="${style}">${escapeHtml(body)}</span>`;
  }

  // ── Public API ────────────────────────────────────────────────────────
  function renderTokenHtml(text, encode, decode, seed, options) {
    const mode = (options && options.mode) || 'token-coherent';
    const r = makeRand(seed);
    const ids = encode(text);
    let html = '';

    for (const id of ids) {
      const s = decode([id]);
      const m = s.match(/^(\s*)(.*)$/s);
      const lead = m[1];
      const body = m[2];
      if (!body) { html += lead; continue; }
      html += lead;

      const isPunct = /^[^A-Za-z0-9']+$/.test(body);

      if (isPunct) {
        // Punctuation is always a single scrap, regardless of mode.
        html += spanFor(body, { isPunct: true, r });
        continue;
      }

      if (mode === 'per-token') {
        // Whole token = one scrap. Picks ONE case style, one font, one paper.
        const caseStyle = pickCaseStyle(r);
        const styled = applyCase(body, caseStyle);
        html += spanFor(styled, { isPunct: false, isGiantEligible: true, r });
        continue;
      }

      // Per-letter family — split into chunks. Wrap the chunks for this
      // token in a no-wrap inline-block so the letters never break across
      // lines (the wrapper itself wraps at the surrounding whitespace).
      const chunks = splitToChunks(body, r);
      let inner = '';

      if (mode === 'token-coherent') {
        // All chunks in this token share ONE scrap (paper + allowed inks).
        // Letters still vary in font/size/rotation/ink, and the paper gets
        // a tiny per-letter lightness wiggle.
        const sharedScrap = pickWeighted(SCRAPS, r);
        for (const chunk of chunks) {
          const caseStyle = pickCaseStyle(r);
          const styled = applyCase(chunk, caseStyle);
          inner += spanFor(styled, {
            isPunct: false,
            isGiantEligible: true,
            r,
            forcedScrap: sharedScrap,
            jitter: true,
          });
        }
      } else {
        // mode === 'per-letter': each chunk fully independent
        for (const chunk of chunks) {
          const caseStyle = pickCaseStyle(r);
          const styled = applyCase(chunk, caseStyle);
          inner += spanFor(styled, { isPunct: false, isGiantEligible: true, r });
        }
      }

      html += '<span class="ransomy-word" style="white-space:nowrap;display:inline-block">' + inner + '</span>';
    }
    return html;
  }

  module.exports = { renderTokenHtml, makeRand };

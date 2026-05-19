const { encode, decode } = require('gpt-tokenizer/encoding/o200k_base');
const { renderTokenHtml } = require('./render');

const ASSISTANT_SEL = 'div[data-message-author-role="assistant"]';
const DEFAULT_MODE = 'token-coherent';

// Cache of pre-wrap innerHTML per message so toggle-off restores it
// without losing markdown structure.
const originalHtml = new WeakMap();

let on = false;
let currentMode = DEFAULT_MODE;

function wrap(root, mode) {
  if (originalHtml.has(root)) return;
  originalHtml.set(root, root.innerHTML);

  const baseSeed = Math.floor(Math.random() * 0x7fffffff);

  // Walk text nodes rather than replacing innerHTML at the root: the
  // assistant div is flex-column, and inner markdown structure (lists,
  // code blocks, links) must be preserved.
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (n.parentElement && n.parentElement.closest('.text-xs')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);

  nodes.forEach((node, i) => {
    const html = renderTokenHtml(node.nodeValue, encode, decode, baseSeed + i * 1009, { mode });
    const tmpl = document.createElement('template');
    tmpl.innerHTML = html;
    if (node.parentNode) node.parentNode.replaceChild(tmpl.content, node);
  });

  root.style.lineHeight = '2.4';
  root.style.overflow = 'visible';
}

function unwrap(root) {
  const orig = originalHtml.get(root);
  if (orig == null) return;
  root.innerHTML = orig;
  root.style.lineHeight = '';
  root.style.overflow = '';
  originalHtml.delete(root);
}

function applyState() {
  document.querySelectorAll(ASSISTANT_SEL).forEach((root) => {
    if (on) wrap(root, currentMode);
    else unwrap(root);
  });
}

function rerenderForModeChange() {
  if (!on) return;
  document.querySelectorAll(ASSISTANT_SEL).forEach((root) => {
    unwrap(root);
    wrap(root, currentMode);
  });
}

chrome.storage.local.get({ on: false, mode: DEFAULT_MODE }, (state) => {
  on = !!state.on;
  currentMode = state.mode || DEFAULT_MODE;
  if (on) applyState();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.on) {
    on = !!changes.on.newValue;
    applyState();
  }
  if (changes.mode && typeof changes.mode.newValue === 'string') {
    currentMode = changes.mode.newValue;
    rerenderForModeChange();
  }
});

const { encode, decode } = require('gpt-tokenizer/encoding/o200k_base');
const { renderTokenHtml } = require('./render');

const ASSISTANT_SEL = 'div[data-message-author-role="assistant"]';
const DEFAULT_MODE = 'token-coherent';

// A message is styled only after it has stopped mutating for this long, so we
// don't wrap half-streamed text or fight ChatGPT's React re-renders mid-stream.
const STREAM_SETTLE_MS = 600;

// Cache of pre-wrap innerHTML per message so toggle-off restores it
// without losing markdown structure.
const originalHtml = new WeakMap();
// Pending debounce timer per message while it's still streaming.
const wrapTimers = new WeakMap();

let on = false;
let currentMode = DEFAULT_MODE;
let observer = null;

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

// True if `root` holds visible text that isn't already inside a scrap.
// Mirrors wrap()'s filter: ignores whitespace-only nodes (the inter-scrap
// glue) and .text-xs metadata.
function hasUnstyledText(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (n.parentElement && n.parentElement.closest('.text-xs')) return NodeFilter.FILTER_REJECT;
      if (n.parentElement && n.parentElement.closest('.ransomy-tok')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  return walker.nextNode() != null;
}

// Style `root` once it's been quiet for STREAM_SETTLE_MS. Idempotent: a
// fully-styled message is a no-op (so our own edits don't retrigger it), and
// a message ChatGPT changed after we styled it — e.g. it resumed streaming
// after a pause and React replaced our spans — gets its stale snapshot
// dropped and is restyled once the now-complete text settles.
function scheduleWrap(root) {
  clearTimeout(wrapTimers.get(root));
  wrapTimers.set(root, setTimeout(() => {
    wrapTimers.delete(root);
    if (!on || !hasUnstyledText(root)) return;
    originalHtml.delete(root);
    wrap(root, currentMode);
  }, STREAM_SETTLE_MS));
}

function assistantRootFor(node) {
  const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  return el && el.closest ? el.closest(ASSISTANT_SEL) : null;
}

function startObserver() {
  if (observer) return;
  observer = new MutationObserver((mutations) => {
    if (!on) return;
    for (const m of mutations) {
      const root = assistantRootFor(m.target);
      if (root) { scheduleWrap(root); continue; }
      for (const added of m.addedNodes) {
        if (added.nodeType !== Node.ELEMENT_NODE) continue;
        if (added.matches && added.matches(ASSISTANT_SEL)) scheduleWrap(added);
        else if (added.querySelectorAll) added.querySelectorAll(ASSISTANT_SEL).forEach(scheduleWrap);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

function stopObserver() {
  if (observer) { observer.disconnect(); observer = null; }
}

chrome.storage.local.get({ on: false, mode: DEFAULT_MODE }, (state) => {
  on = !!state.on;
  currentMode = state.mode || DEFAULT_MODE;
  if (on) { applyState(); startObserver(); }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.on) {
    on = !!changes.on.newValue;
    applyState();
    if (on) startObserver(); else stopObserver();
  }
  if (changes.mode && typeof changes.mode.newValue === 'string') {
    currentMode = changes.mode.newValue;
    rerenderForModeChange();
  }
});

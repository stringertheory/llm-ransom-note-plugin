// Applies src/render.js to the running chatgpt tab via CDP — fast loop
// for tweaking the look without rebuilding the extension.
//
//   npm run dev:chrome    # start Chrome with debug port + log in
//   npm run dev:proto     # inject latest render, save dev/proto.png

const path = require('path');
const { chromium } = require('playwright');
const { encode, decode } = require('gpt-tokenizer/encoding/o200k_base');
const { renderTokenHtml } = require('../src/render');

const SCREENSHOT = path.join(__dirname, 'proto.png');

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const ctx = browser.contexts()[0];
  const page = ctx.pages().find((p) => /chatgpt\.com/.test(p.url()));
  if (!page) {
    console.error('No chatgpt.com tab found. Run `npm run dev:chrome` and open a chat first.');
    process.exit(2);
  }

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('div[data-message-author-role="assistant"]', { timeout: 30000 });
  await page.waitForTimeout(800);

  // Two passes: first collect text-node values (and stash node references
  // on window), then in a second evaluate replace each with rendered HTML.
  const textNodes = await page.evaluate(() => {
    const out = [];
    window.__ransomyNodes = [];
    document.querySelectorAll('div[data-message-author-role="assistant"]').forEach((root) => {
      root.style.lineHeight = '2.4';
      root.style.overflow = 'visible';
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
          if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          if (n.parentElement && n.parentElement.closest('.text-xs')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      let n;
      while ((n = w.nextNode())) {
        window.__ransomyNodes.push(n);
        out.push(n.nodeValue);
      }
    });
    return out;
  });
  console.log('text nodes:', textNodes.length);

  const seed = 0xC0FFEE;
  const rendered = textNodes.map((t, i) =>
    renderTokenHtml(t, encode, decode, seed + i * 1009)
  );

  await page.evaluate(({ rendered }) => {
    const nodes = window.__ransomyNodes || [];
    nodes.forEach((node, i) => {
      const html = rendered[i];
      if (html == null || !node.parentNode) return;
      const tmpl = document.createElement('template');
      tmpl.innerHTML = html;
      node.parentNode.replaceChild(tmpl.content, node);
    });
    delete window.__ransomyNodes;
  }, { rendered });

  await page.waitForTimeout(400);
  await page.screenshot({ path: SCREENSHOT, fullPage: false });
  console.log('screenshot:', SCREENSHOT);

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

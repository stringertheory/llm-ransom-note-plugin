// Dumps DOM info for the current chatgpt tab — useful when the
// assistant-message selector needs updating.
//
//   npm run dev:chrome      # log in first
//   npm run dev:inspect

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'inspect-result.json');

(async () => {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  let page = null;
  for (const ctx of browser.contexts()) {
    for (const p of ctx.pages()) {
      if (/chatgpt\.com|chat\.openai\.com/.test(p.url())) {
        page = p;
        break;
      }
    }
    if (page) break;
  }
  if (!page) {
    console.error('No chatgpt.com tab found.');
    process.exit(2);
  }
  console.log('attached to:', page.url());

  const info = await page.evaluate(() => {
    const out = { url: location.href };

    out.assistantSelectorCount = document.querySelectorAll(
      'div[data-message-author-role="assistant"]'
    ).length;

    out.roleEls = Array.from(
      document.querySelectorAll('[data-message-author-role]')
    )
      .slice(0, 6)
      .map((el) => ({
        tag: el.tagName,
        role: el.getAttribute('data-message-author-role'),
        classes: el.className.slice(0, 200),
        childTags: Array.from(el.children).slice(0, 4).map((c) => c.tagName),
        textSample: (el.textContent || '').slice(0, 200),
      }));

    out.assistantAttrSweep = Array.from(document.querySelectorAll('*'))
      .filter((el) =>
        Array.from(el.attributes).some((a) => /assistant/i.test(a.value))
      )
      .slice(0, 8)
      .map((el) => ({
        tag: el.tagName,
        attrs: Array.from(el.attributes)
          .filter((a) => /assistant/i.test(a.value))
          .map((a) => `${a.name}="${a.value}"`),
        textSample: (el.textContent || '').slice(0, 120),
      }));

    return out;
  });

  fs.writeFileSync(OUT, JSON.stringify(info, null, 2));
  console.log('wrote', OUT);
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

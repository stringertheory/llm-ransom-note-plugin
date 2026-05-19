// Lists CDP targets in the running Chrome. `npm run dev:targets`.

const http = require('http');

http.get('http://localhost:9222/json/list', (res) => {
  let body = '';
  res.on('data', (c) => (body += c));
  res.on('end', () => {
    for (const t of JSON.parse(body)) {
      console.log(`[${t.type}] ${t.title}\n    url=${t.url}\n`);
    }
  });
}).on('error', (e) => {
  console.error('http error:', e.message);
  console.error('Is Chrome running with --remote-debugging-port=9222? Try: npm run dev:chrome');
  process.exit(1);
});

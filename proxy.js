#!/usr/bin/env node
// Local proxy to bypass CORS for web dev — forwards requests to Anthropic API
const http = require('http');
const https = require('https');

const PORT = 3001;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, anthropic-version');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/messages') {
    res.writeHead(404);
    res.end();
    return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': req.headers['x-api-key'],
        'anthropic-version': req.headers['anthropic-version'],
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const proxy = https.request(options, (apiRes) => {
      res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
      apiRes.pipe(res);
    });

    proxy.on('error', (e) => {
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    });

    proxy.write(body);
    proxy.end();
  });
});

server.listen(PORT, () => {
  console.log(`Proxy rodando em http://localhost:${PORT}`);
});

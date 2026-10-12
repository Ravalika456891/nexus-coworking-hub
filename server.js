const http = require('http');
const fs = require('fs');
const path = require('path');

let PORT = process.env.PORT ? parseInt(process.env.PORT) : 5173;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const db = require('./db');

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

async function handleApi(req, res, reqUrl) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  try {
    if (reqUrl === '/api/health') {
      const status = db.getStatus();
      return sendJson(res, 200, { ok: true, mongo: status });
    }

    if (reqUrl === '/api/state') {
      if (req.method === 'GET') {
        const state = await db.getAppState();
        return sendJson(res, 200, { ok: true, state: state || null });
      }
      if (req.method === 'POST') {
        const body = await parseJsonBody(req);
        const success = await db.saveAppState(body.state);
        return sendJson(res, success ? 200 : 503, { ok: success });
      }
    }

    if (reqUrl === '/api/leads') {
      if (req.method === 'GET') {
        const leads = await db.getLeads();
        return sendJson(res, 200, { ok: true, leads });
      }
      if (req.method === 'POST') {
        const body = await parseJsonBody(req);
        const success = await db.saveLead(body);
        return sendJson(res, success ? 201 : 503, { ok: success });
      }
    }

    if (reqUrl === '/api/leads/update' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const success = await db.updateLead(body.id, body.updates);
      return sendJson(res, success ? 200 : 400, { ok: success });
    }

    if (reqUrl === '/api/leads/delete' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const success = await db.deleteLead(body.id);
      return sendJson(res, success ? 200 : 400, { ok: success });
    }

    if (reqUrl === '/api/inquiries') {
      if (req.method === 'GET') {
        const inquiries = await db.getInquiries();
        return sendJson(res, 200, { ok: true, inquiries });
      }
      if (req.method === 'POST') {
        const body = await parseJsonBody(req);
        const success = await db.saveInquiry(body);
        return sendJson(res, success ? 201 : 503, { ok: success });
      }
    }

    if (reqUrl === '/api/inquiries/update' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const success = await db.updateInquiry(body.id, body.updates);
      return sendJson(res, success ? 200 : 400, { ok: success });
    }

    return sendJson(res, 404, { ok: false, error: 'Endpoint not found' });
  } catch (err) {
    console.error('API Error:', err);
    return sendJson(res, 500, { ok: false, error: err.message });
  }
}

async function handler(req, res) {
  let reqUrl = req.url.split('?')[0];

  if (reqUrl.startsWith('/api/')) {
    return handleApi(req, res, reqUrl);
  }

  if (reqUrl === '/' || reqUrl === '') reqUrl = '/index.html';
  if (reqUrl === '/app' || reqUrl === '/app/') reqUrl = '/app.html';

  let filePath = path.join(__dirname, reqUrl);
  let ext = path.extname(filePath).toLowerCase();
  if (!ext) {
    if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
      ext = '.html';
    }
  }

  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

let currentServer = null;

if (!process.env.VERCEL) {
  function startServer(portToTry) {
    const s = http.createServer(handler);
    s.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        startServer(portToTry + 1);
      } else {
        console.error('Server error:', err);
      }
    });
    s.listen(portToTry, () => {
      currentServer = s;
      console.log(`\n⚡ NEXUS Hub Operating System Server Started!`);
      console.log(`👉 Access URL: http://localhost:${portToTry}/\n`);
    });
  }
  startServer(PORT);
}

module.exports = handler;

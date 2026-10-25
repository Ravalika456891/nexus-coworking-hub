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

const liveReloadClients = new Set();

function broadcastFileChange(file) {
  const msg = JSON.stringify({ type: 'change', file });
  for (const client of liveReloadClients) {
    try {
      client.write(`data: ${msg}\n\n`);
    } catch (e) {
      liveReloadClients.delete(client);
    }
  }
}

let watchDebounce = null;
try {
  fs.watch(__dirname, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    const fn = filename.replace(/\\/g, '/');
    if (
      fn.includes('node_modules') ||
      fn.includes('.git') ||
      fn.includes('.vercel') ||
      fn.includes('.system_generated') ||
      fn.includes('.env') ||
      fn.endsWith('.log') ||
      fn.endsWith('.tmp')
    ) {
      return;
    }
    clearTimeout(watchDebounce);
    watchDebounce = setTimeout(() => {
      console.log(`⚡ [AutoReload] Detected file change: ${filename} -> Broadcasting browser update`);
      broadcastFileChange(filename);
    }, 150);
  });
} catch (err) {
  console.warn('File watcher not supported on this platform:', err.message);
}

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
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

async function handleApi(req, res, parsedUrl) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  const pathname = parsedUrl.pathname;
  const searchParams = parsedUrl.searchParams;

  try {
    // Live Reload SSE Connection
    if (pathname === '/api/live-reload') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      res.write('data: {"type":"connected"}\n\n');
      liveReloadClients.add(res);
      req.on('close', () => liveReloadClients.delete(res));
      return;
    }

    // Database Health & Telemetry
    if (pathname === '/api/health') {
      const status = db.getStatus();
      return sendJson(res, 200, { ok: true, mongo: status });
    }

    // -----------------------------------------------------------
    // Database Tables Explorer Endpoints
    // -----------------------------------------------------------
    if (pathname === '/api/database/tables') {
      const tables = await db.getTableStats();
      const status = db.getStatus();
      return sendJson(res, 200, { ok: true, mongo: status, tables });
    }

    if (pathname === '/api/database/table') {
      const name = searchParams.get('name') || 'startups';
      const page = searchParams.get('page') || 1;
      const limit = searchParams.get('limit') || 25;
      const search = searchParams.get('search') || '';
      const sortField = searchParams.get('sortField') || '_id';
      const sortOrder = searchParams.get('sortOrder') || -1;

      const result = await db.getTableRecords(name, { page, limit, search, sortField, sortOrder });
      return sendJson(res, result.ok ? 200 : 400, result);
    }

    if (pathname === '/api/database/table/seed' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const force = Boolean(body.force);
      const seedResult = await db.seedAllCollections(force);
      return sendJson(res, seedResult.ok ? 200 : 500, seedResult);
    }

    if (pathname === '/api/database/table/insert' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { tableName, document } = body;
      if (!tableName || !document) {
        return sendJson(res, 400, { ok: false, error: 'tableName and document are required' });
      }
      const insertResult = await db.insertTableRecord(tableName, document);
      return sendJson(res, insertResult.ok ? 201 : 500, insertResult);
    }

    if (pathname === '/api/database/table/update' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { tableName, id, updates } = body;
      if (!tableName || !id || !updates) {
        return sendJson(res, 400, { ok: false, error: 'tableName, id, and updates are required' });
      }
      const updateResult = await db.updateTableRecord(tableName, id, updates);
      return sendJson(res, updateResult.ok ? 200 : 400, updateResult);
    }

    if (pathname === '/api/database/table/delete' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { tableName, id } = body;
      if (!tableName || !id) {
        return sendJson(res, 400, { ok: false, error: 'tableName and id are required' });
      }
      const deleteResult = await db.deleteTableRecord(tableName, id);
      return sendJson(res, deleteResult.ok ? 200 : 400, deleteResult);
    }

    // -----------------------------------------------------------
    // Dedicated Direct Entity Endpoints
    // -----------------------------------------------------------
    if (pathname === '/api/startups') {
      if (req.method === 'GET') {
        const resData = await db.getTableRecords('startups', { limit: 100 });
        return sendJson(res, 200, { ok: true, startups: resData.records || [] });
      }
      if (req.method === 'POST') {
        const body = await parseJsonBody(req);
        const ins = await db.insertTableRecord('startups', body);
        return sendJson(res, ins.ok ? 201 : 400, ins);
      }
      if (req.method === 'PUT' || req.method === 'PATCH') {
        const body = await parseJsonBody(req);
        const targetId = body.id || body._id;
        const updates = body.updates || body;
        const upd = await db.updateTableRecord('startups', targetId, updates);
        return sendJson(res, upd.ok ? 200 : 400, upd);
      }
    }

    if (pathname === '/api/workspaces' && req.method === 'GET') {
      const resData = await db.getTableRecords('workspaces', { limit: 100 });
      return sendJson(res, 200, { ok: true, workspaces: resData.records || [] });
    }

    if (pathname === '/api/invoices' && req.method === 'GET') {
      const resData = await db.getTableRecords('invoices', { limit: 100 });
      return sendJson(res, 200, { ok: true, invoices: resData.records || [] });
    }

    if (pathname === '/api/payments' && req.method === 'GET') {
      const resData = await db.getTableRecords('payments', { limit: 100 });
      return sendJson(res, 200, { ok: true, payments: resData.records || [] });
    }

    if (pathname === '/api/milestones' && req.method === 'GET') {
      const resData = await db.getTableRecords('milestones', { limit: 100 });
      return sendJson(res, 200, { ok: true, milestones: resData.records || [] });
    }

    // -----------------------------------------------------------
    // Existing State, Leads & Inquiries
    // -----------------------------------------------------------
    if (pathname === '/api/state') {
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

    if (pathname === '/api/leads') {
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

    if (pathname === '/api/leads/update' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const success = await db.updateLead(body.id, body.updates);
      return sendJson(res, success ? 200 : 400, { ok: success });
    }

    if (pathname === '/api/leads/delete' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const success = await db.deleteLead(body.id);
      return sendJson(res, success ? 200 : 400, { ok: success });
    }

    if (pathname === '/api/inquiries') {
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

    if (pathname === '/api/inquiries/update' && req.method === 'POST') {
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
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let reqUrl = parsedUrl.pathname;

  if (reqUrl.startsWith('/api/')) {
    return handleApi(req, res, parsedUrl);
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

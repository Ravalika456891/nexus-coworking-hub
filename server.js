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
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg', '.ico']);

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

function broadcastMeetingRoomUpdate(data) {
  const msg = JSON.stringify({ type: 'meeting_room_update', ...data });
  for (const client of liveReloadClients) {
    try {
      client.write(`data: ${msg}\n\n`);
    } catch (e) {
      liveReloadClients.delete(client);
    }
  }
}

let watchDebounce = null;
if (!process.env.VERCEL) {
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
        fn.includes('assets/rooms/uploads') ||
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
}

function parseJsonBody(req, maxBytes = 0) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    let aborted = false;
    req.on('data', chunk => {
      if (aborted) return;
      size += chunk.length;
      if (maxBytes && size > maxBytes) {
        aborted = true;
        const err = new Error('Request body too large');
        err.statusCode = 413;
        reject(err);
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      if (aborted) return;
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
      if (process.env.NODE_ENV === 'production') {
        return sendJson(res, 403, { ok: false, error: 'Resetting demo data is disabled in production.' });
      }
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

    if (pathname === '/api/invoices/generate-batch' && req.method === 'POST') {
      const role = req.headers['x-user-role'] || searchParams.get('role') || 'incubator_admin';
      if (role === 'startup') {
        return sendJson(res, 403, { ok: false, error: 'Access denied: Admin only' });
      }
      const body = await parseJsonBody(req);
      const billingPeriod = body.billingPeriod || 'November 2026';
      const previewOnly = Boolean(body.previewOnly);
      const result = await db.generateInvoicesBatchAtomic({ billingPeriod, previewOnly });
      return sendJson(res, result.ok ? 200 : 400, result);
    }

    if ((pathname === '/api/dashboard/summary' || pathname === '/api/startup/dashboard-summary') && req.method === 'GET') {
      const role = req.headers['x-user-role'] || searchParams.get('role') || (pathname.includes('/startup') ? 'startup' : 'incubator_admin');
      const startupId = req.headers['x-startup-id'] || searchParams.get('startupId') || 'STP-XYZ';
      const month = searchParams.get('month');

      if (role === 'startup' || role === 'startup_member' || pathname.includes('/startup')) {
        const summary = await db.getStartupDashboardSummary(startupId, month, role);
        return sendJson(res, 200, summary);
      }

      const summary = await db.getDashboardSummary(month);
      return sendJson(res, 200, summary);
    }

    if (pathname === '/api/config' && req.method === 'GET') {
      return sendJson(res, 200, {
        ok: true,
        nodeEnv: process.env.NODE_ENV || 'development',
        isProduction: process.env.NODE_ENV === 'production'
      });
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
    // Meeting Rooms & Conflict-Proof Scheduler Endpoints
    // -----------------------------------------------------------
    if (pathname === '/api/meeting-rooms/availability' && req.method === 'GET') {
      const date = searchParams.get('date');
      const availability = await db.getMeetingRoomsAvailability(date);
      return sendJson(res, 200, availability);
    }

    if (pathname === '/api/meeting-rooms/book' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await db.reserveMeetingRoomSlotsAtomic(body);
      if (result.ok) {
        broadcastMeetingRoomUpdate({ action: 'booked', roomId: body.roomId, date: body.date, booking: result.booking });
        return sendJson(res, result.status || 201, result);
      } else {
        return sendJson(res, result.status || 409, {
          ok: false,
          code: result.code || 'SLOT_TAKEN',
          message: result.message,
          alternatives: result.alternatives || [],
          conflictWith: result.conflictWith || null
        });
      }
    }

    if (pathname === '/api/meeting-rooms/cancel' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { roomId, bookingId } = body;
      if (!roomId || !bookingId) {
        return sendJson(res, 400, { ok: false, error: 'roomId and bookingId are required' });
      }

      const requestingStartupId = body.requestingStartupId || req.headers['x-startup-id'] || null;
      const userRole = body.userRole || req.headers['x-user-role'] || 'founder';
      const currentClock = body.currentClock || null;

      const result = await db.cancelBooking({
        roomId,
        bookingId,
        requestingStartupId,
        userRole,
        currentClock
      });

      if (result.ok) {
        broadcastMeetingRoomUpdate({
          action: 'cancelled',
          roomId,
          bookingId,
          cancellation: result.cancellation,
          quote: result.quote
        });
        return sendJson(res, 200, result);
      } else {
        return sendJson(res, result.status || 400, result);
      }
    }

    if ((pathname === '/api/meeting-rooms/update-time' || pathname === '/api/meeting-rooms/reschedule') && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      const body = await parseJsonBody(req);
      const { roomId, bookingId, date, startTime, endTime } = body;
      if (!roomId || !bookingId || !date || !startTime || !endTime) {
        return sendJson(res, 400, { ok: false, error: 'roomId, bookingId, date, startTime, and endTime are required' });
      }
      const requestingStartupId = body.requestingStartupId || req.headers['x-startup-id'] || null;
      const userRole = body.userRole || req.headers['x-user-role'] || null;
      const result = await db.updateMeetingRoomBookingTimeWindowAtomic({
        ...body,
        requestingStartupId,
        userRole
      });
      if (result.ok) {
        broadcastMeetingRoomUpdate({ action: 'updated', roomId: result.roomId || roomId, previousRoomId: roomId, bookingId, booking: result.booking });
        return sendJson(res, 200, result);
      } else {
        return sendJson(res, result.status || 400, result);
      }
    }

    if (pathname === '/api/meeting-rooms/book-recurring' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await db.reserveRecurringMeetingRoomAtomic(body);
      if (result.ok) {
        broadcastMeetingRoomUpdate({ action: 'booked_recurring', roomId: body.roomId, seriesId: result.seriesId, bookings: result.bookings });
        return sendJson(res, result.status || 201, result);
      }
      return sendJson(res, result.status || 409, result);
    }

    if (pathname === '/api/meeting-rooms/cancel-series' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const requestingStartupId = body.requestingStartupId || req.headers['x-startup-id'] || null;
      const userRole = body.userRole || req.headers['x-user-role'] || null;
      const result = await db.cancelRecurringSeriesAtomic({ ...body, requestingStartupId, userRole });
      if (result.ok) {
        broadcastMeetingRoomUpdate({ action: 'cancelled_series', seriesId: body.seriesId, cancelledCount: result.cancelledCount });
        return sendJson(res, 200, result);
      }
      return sendJson(res, result.status || 400, result);
    }

    if (pathname === '/api/meeting-rooms/analytics' && req.method === 'GET') {
      const range = parsedUrl.searchParams.get('range') || 'all';
      const startDate = parsedUrl.searchParams.get('startDate') || null;
      const endDate = parsedUrl.searchParams.get('endDate') || null;
      const startupId = parsedUrl.searchParams.get('startupId') || null;
      const analytics = await db.getMeetingRoomsAnalytics({ range, startDate, endDate, startupId });
      return sendJson(res, 200, analytics);
    }

    // Admin: Meeting room image upload (JSON body with base64 data; the client
    // resizes/compresses to WebP before upload). Validated + stored by db.js.
    if (pathname === '/api/meeting-rooms/images/upload' && req.method === 'POST') {
      let body;
      try {
        body = await parseJsonBody(req, 4 * 1024 * 1024); // fits Vercel's 4.5 MB request limit
      } catch (err) {
        return sendJson(res, err.statusCode || 400, { ok: false, code: 'PAYLOAD_TOO_LARGE', message: 'Image upload is too large. Maximum request size is 4 MB.' });
      }
      const userRole = req.headers['x-user-role'] || body.userRole;
      const result = await db.uploadMeetingRoomImageAtomic({ ...body, userRole });
      return sendJson(res, result.status || (result.ok ? 201 : 400), result);
    }

    // Public: Serve an uploaded meeting room image stored in MongoDB
    if (pathname === '/api/meeting-rooms/images/file' && req.method === 'GET') {
      const file = await db.getMeetingRoomImageFile(searchParams.get('id'), searchParams.get('size') === 'thumb' ? 'thumb' : 'full');
      if (!file) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('Image not found');
      }
      res.writeHead(200, {
        'Content-Type': file.mime,
        'Content-Length': file.buffer.length,
        'Cache-Control': 'public, max-age=31536000, immutable', // ids are unique per upload
        'X-Content-Type-Options': 'nosniff'
      });
      return res.end(file.buffer);
    }

    if (pathname === '/api/meeting-rooms/admin' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const userRole = body.userRole || req.headers['x-user-role'] || 'super_admin';
      const result = await db.manageMeetingRoomAdminAtomic({ ...body, userRole });
      if (result.ok) {
        broadcastMeetingRoomUpdate({ action: 'admin_updated', adminAction: body.action, room: result.room, policies: result.policies });
        return sendJson(res, result.status || 200, result);
      }
      return sendJson(res, result.status || 403, result);
    }

    // Admin: Maintenance Blocks CRUD
    if (pathname === '/api/meeting-rooms/maintenance') {
      const userRole = req.headers['x-user-role'] || 'super_admin';
      if (req.method === 'GET') {
        const roomId = searchParams.get('roomId') || null;
        const result = await db.manageMeetingRoomMaintenanceAtomic({ action: 'list', userRole, roomId });
        return sendJson(res, result.status || 200, result);
      }
      if (req.method === 'POST') {
        const body = await parseJsonBody(req);
        const result = await db.manageMeetingRoomMaintenanceAtomic({ ...body, userRole });
        if (result.ok) {
          broadcastMeetingRoomUpdate({ action: 'maintenance_updated', block: result.block });
        }
        return sendJson(res, result.status || (result.ok ? 200 : 403), result);
      }
    }

    // Admin: All Reservations (with filters)
    if (pathname === '/api/meeting-rooms/reservations' && req.method === 'GET') {
      const userRole = req.headers['x-user-role'] || searchParams.get('userRole') || 'super_admin';
      const result = await db.getMeetingRoomReservations({
        userRole,
        startupId: searchParams.get('startupId') || undefined,
        roomId: searchParams.get('roomId') || undefined,
        status: searchParams.get('status') || undefined,
        paymentStatus: searchParams.get('paymentStatus') || undefined,
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined,
        page: searchParams.get('page') || 1,
        limit: searchParams.get('limit') || 50
      });
      return sendJson(res, result.status || (result.ok ? 200 : 403), result);
    }

    // Admin: Export Reservations as CSV
    if (pathname === '/api/meeting-rooms/export-csv' && req.method === 'GET') {
      const userRole = req.headers['x-user-role'] || searchParams.get('userRole') || 'super_admin';
      const result = await db.getMeetingRoomReservations({
        userRole,
        startupId: searchParams.get('startupId') || undefined,
        roomId: searchParams.get('roomId') || undefined,
        status: searchParams.get('status') || undefined,
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined,
        page: 1,
        limit: 5000
      });
      if (!result.ok) return sendJson(res, 403, result);
      const rows = result.reservations || [];
      const headers = ['Booking ID','Startup','Room','Date','Start Time','End Time','Duration (hrs)','Attendees','Purpose','Status','Cost (INR)','Invoice ID','Created At'];
      const csv = [headers.join(','), ...rows.map(r => [
        r.id, `"${(r.startupName || '').replace(/"/g, '""')}"`, `"${(r.roomName || '').replace(/"/g, '""')}"`,
        r.date, r.startTime, r.endTime, r.duration || '', r.attendees || '',
        `"${(r.purpose || r.title || '').replace(/"/g, '""')}"`, r.status || '',
        r.cost || 0, r.invoiceId || '', r.createdAt || ''
      ].join(','))].join('\n');
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="meeting-reservations-${new Date().toISOString().split('T')[0]}.csv"`,
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(csv);
    }

    if (pathname === '/api/meeting-rooms/calendar-sync') {
      if (req.method === 'GET') {
        const startupId = parsedUrl.searchParams.get('startupId') || 'STP-XYZ';
        const statusRes = await db.syncExternalCalendarEvent({ action: 'status', startupId });
        return sendJson(res, 200, statusRes);
      }
      if (req.method === 'POST') {
        const body = await parseJsonBody(req);
        const syncRes = await db.syncExternalCalendarEvent(body);
        return sendJson(res, syncRes.status || (syncRes.ok ? 200 : 400), syncRes);
      }
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

    return sendJson(res, 404, { ok: false, error: 'Endpoint not found', path: pathname });
  } catch (err) {
    console.error('API Error:', err);
    return sendJson(res, 500, { ok: false, error: err.message });
  }
}

async function handler(req, res) {
  const matchedHeader = req.headers['x-matched-path'] || req.headers['x-invoke-path'];
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  
  if (parsedUrl.searchParams.has('__route')) {
    parsedUrl.pathname = '/api/' + parsedUrl.searchParams.get('__route');
  } else if (matchedHeader) {
    try {
      const orig = new URL(matchedHeader, `http://${req.headers.host || 'localhost'}`);
      parsedUrl.pathname = orig.pathname;
    } catch (e) {
      parsedUrl.pathname = matchedHeader;
    }
  }

  let reqUrl = parsedUrl.pathname;

  if (reqUrl.startsWith('/api/') || reqUrl === '/api') {
    return handleApi(req, res, parsedUrl);
  }

  if (reqUrl === '/' || reqUrl === '') reqUrl = '/meeting-rooms.html';
  if (reqUrl === '/app' || reqUrl === '/app/') reqUrl = '/app.html';
  if (reqUrl === '/meeting-rooms' || reqUrl === '/meeting-rooms/') reqUrl = '/meeting-rooms.html';

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
      // Images are cacheable (room photos rarely change); code/HTML stays no-cache for live reload.
      const cacheHeaders = IMAGE_EXTENSIONS.has(ext)
        ? { 'Cache-Control': 'public, max-age=86400' }
        : {
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0'
          };
      res.writeHead(200, {
        'Content-Type': contentType,
        ...cacheHeaders
      });
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

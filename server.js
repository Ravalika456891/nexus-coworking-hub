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
const creditService = require('./creditService');
const billingService = require('./billingService');
const UnifiedSummaryService = require('./services/unifiedSummaryService');

let unifiedSummaryService = null;
async function getSummaryService() {
  if (!unifiedSummaryService) {
    const database = await db.connectDB();
    if (database) {
      unifiedSummaryService = new UnifiedSummaryService(database);
    }
  }
  return unifiedSummaryService;
}

// In-memory Idempotency Store for Top-up & Payment transactions
const IDEMPOTENCY_CACHE = new Map();

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
    // Database Tables Explorer Endpoints (Restricted to super_admin / admin)
    // -----------------------------------------------------------
    if (pathname.startsWith('/api/database/')) {
      const userRole = req.headers['x-user-role'] || searchParams.get('userRole') || 'founder';
      const isAdmin = userRole === 'super_admin' || userRole === 'admin';
      if (!isAdmin) {
        return sendJson(res, 403, { ok: false, error: 'Access denied: Database Tables Explorer requires administrator privileges.' });
      }
    }

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
    // Context & Role-Based Data Scoping (Backend-Enforced)
    // Roles: member, company_admin, operator (staff), super_admin
    // -----------------------------------------------------------
    const rawRole = (req.headers['x-user-role'] || searchParams.get('userRole') || 'member').toLowerCase();
    const userRole = (rawRole === 'founder' || rawRole === 'startup' || rawRole === 'startup_member') ? 'member' : rawRole;
    const companyId = req.headers['x-company-id'] || req.headers['x-startup-id'] || searchParams.get('companyId') || searchParams.get('startupId') || 'STP-XYZ';
    const isOperator = userRole === 'operator' || userRole === 'super_admin' || userRole === 'admin' || userRole === 'incubator_admin';

    // -----------------------------------------------------------
    // Part 5.2 Unified Endpoints (No Stored Copies of Derived Values)
    // -----------------------------------------------------------
    if (pathname === '/company/summary' || pathname === '/api/company/summary') {
      const summaryMonth = searchParams.get('month') || '2026-11';
      const summaryService = await getSummaryService();
      if (summaryService) {
        const summary = await summaryService.getCompanySummary(companyId, summaryMonth);
        return sendJson(res, 200, { ok: true, ...summary });
      } else {
        const appState = await db.getAppState();
        const startup = (appState.startups || []).find(s => s.id === companyId) || { id: companyId, name: 'XYZ Technologies' };
        const allowance = creditService.getMonthlyAllowance(startup, appState.meetingRooms || [], summaryMonth, startup.topUps || []);
        return sendJson(res, 200, { ok: true, companyId, allowance });
      }
    }

    if (pathname === '/company/ledger' || pathname === '/api/company/ledger') {
      const ledgerMonth = searchParams.get('month') || '2026-11';
      const summaryService = await getSummaryService();
      if (summaryService) {
        const ledger = await summaryService.getCompanyLedger(companyId, ledgerMonth);
        return sendJson(res, 200, { ok: true, ledger });
      }
      return sendJson(res, 200, { ok: true, ledger: [] });
    }

    if (pathname === '/bookings' || pathname === '/api/bookings') {
      const appState = await db.getAppState();
      let allBookings = [];
      (appState.meetingRooms || []).forEach(r => {
        (r.bookings || []).forEach(b => {
          if (isOperator || b.startupId === companyId || b.startupName === 'XYZ Technologies') {
            allBookings.push({ ...b, roomId: r.id, roomName: r.name });
          }
        });
      });
      return sendJson(res, 200, { ok: true, bookings: allBookings });
    }

    if (pathname === '/workspaces/summary' || pathname === '/api/workspaces/summary') {
      const summaryService = await getSummaryService();
      if (summaryService) {
        const wsSummary = await summaryService.getWorkspacesSummary(companyId);
        return sendJson(res, 200, { ok: true, ...wsSummary });
      }
      return sendJson(res, 200, { ok: true, totalUnits: 26, totalSeats: 55 });
    }

    if (pathname === '/analytics' || pathname === '/api/analytics') {
      const summaryService = await getSummaryService();
      const scopeRole = isOperator ? 'operator' : 'member';
      if (summaryService) {
        const analytics = await summaryService.getAnalytics(companyId, scopeRole);
        return sendJson(res, 200, { ok: true, ...analytics });
      }
      return sendJson(res, 200, { ok: true, scope: scopeRole });
    }

    // Dedicated Direct Entity Endpoints
    // -----------------------------------------------------------
    if (pathname === '/api/startups') {
      if (req.method === 'GET') {
        const resData = await db.getTableRecords('startups', { limit: 100 });
        let records = resData.records || [];
        // Strict Scoping: Members and company admins see ONLY their own startup profile
        if (!isOperator) {
          records = records.filter(s => s.id === companyId);
        }
        return sendJson(res, 200, { ok: true, startups: records });
      }
      if (req.method === 'POST') {
        // Operator-only: Register Startup
        if (!isOperator) {
          return sendJson(res, 403, { ok: false, error: 'Access denied: Registering startups requires operator or administrator privileges.' });
        }
        const body = await parseJsonBody(req);
        const ins = await db.insertTableRecord('startups', body);
        return sendJson(res, ins.ok ? 201 : 400, ins);
      }
      if (req.method === 'PUT' || req.method === 'PATCH') {
        const body = await parseJsonBody(req);
        const targetId = body.id || body._id;
        // Non-operators can only edit their own startup profile (company_admin)
        if (!isOperator && targetId !== companyId) {
          return sendJson(res, 403, { ok: false, error: 'Access denied: You can only update your own company profile.' });
        }
        const updates = body.updates || body;
        const upd = await db.updateTableRecord('startups', targetId, updates);
        return sendJson(res, upd.ok ? 200 : 400, upd);
      }
    }

    if (pathname === '/api/workspaces' && req.method === 'GET') {
      const resData = await db.getTableRecords('workspaces', { limit: 100 });
      let records = resData.records || [];
      // Anonymize other startups' private allocation data for members
      if (!isOperator) {
        records = records.map(w => {
          if (w.allocatedStartupId && w.allocatedStartupId !== companyId) {
            return {
              ...w,
              allocatedStartupId: 'OCCUPIED',
              assignedTo: 'Occupied by another venture',
              currentOccupant: null
            };
          }
          return w;
        });
      }
      return sendJson(res, 200, { ok: true, workspaces: records });
    }

    if (pathname === '/api/invoices' && req.method === 'GET') {
      const resData = await db.getTableRecords('invoices', { limit: 100 });
      let records = resData.records || [];
      // Strict Scoping: Members see only their own company's invoices
      if (!isOperator) {
        records = records.filter(i => i.startupId === companyId);
      }
      return sendJson(res, 200, { ok: true, invoices: records });
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

    // -----------------------------------------------------------
    // Single Source of Truth Credit & Allowance Endpoints
    // -----------------------------------------------------------
    if (pathname === '/api/credits/allowance' && req.method === 'GET') {
      const startupId = searchParams.get('startupId') || req.headers['x-startup-id'] || 'STP-XYZ';
      const month = searchParams.get('month') || undefined;
      const appState = await db.getAppState();
      const startups = (appState && appState.startups) ? appState.startups : [];
      const rooms = (appState && appState.meetingRooms) ? appState.meetingRooms : [];
      const startup = startups.find(s => s.id === startupId) || { id: startupId, name: 'Startup', includedMeetingHours: 15, subscriptionPlan: 'Startup Plan' };

      const allowance = creditService.getMonthlyAllowance(startup, rooms, month, startup.topUps || []);
      return sendJson(res, 200, { ok: true, allowance });
    }

    if (pathname === '/api/credits/ledger' && req.method === 'GET') {
      const startupId = searchParams.get('startupId') || req.headers['x-startup-id'] || 'STP-XYZ';
      const month = searchParams.get('month') || undefined;
      const appState = await db.getAppState();
      const startups = (appState && appState.startups) ? appState.startups : [];
      const rooms = (appState && appState.meetingRooms) ? appState.meetingRooms : [];
      const startup = startups.find(s => s.id === startupId) || { id: startupId, name: 'Startup', includedMeetingHours: 15, subscriptionPlan: 'Startup Plan' };

      const allowance = creditService.getMonthlyAllowance(startup, rooms, month, startup.topUps || []);
      return sendJson(res, 200, { ok: true, ledger: allowance.ledger, balance: allowance.remainingCredits });
    }

    if (pathname === '/api/credits/topup' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { startupId, credits, hours, amount, packTitle, paymentMethod, idempotencyKey, dueDays } = body;

      if (!startupId || !credits || !amount) {
        return sendJson(res, 400, { ok: false, error: 'startupId, credits, and amount are required' });
      }

      // 1. Idempotency Check (Double-click & retry protection)
      if (idempotencyKey && IDEMPOTENCY_CACHE.has(idempotencyKey)) {
        const cached = IDEMPOTENCY_CACHE.get(idempotencyKey);
        return sendJson(res, 200, { ok: true, idempotentReplay: true, ...cached });
      }

      const appState = await db.getAppState();
      if (!appState) {
        return sendJson(res, 500, { ok: false, error: 'Database state unavailable' });
      }

      const startups = appState.startups || [];
      const startup = startups.find(s => s.id === startupId);
      if (!startup) {
        return sendJson(res, 404, { ok: false, error: 'Startup not found' });
      }

      const now = new Date();
      const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
      const validityDays = Number(body.validityDays) || creditService.DEFAULT_TOPUP_VALIDITY_DAYS;
      const expDateObj = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);
      const expiresAt = expDateObj.toISOString().split('T')[0];

      // Configurable due date (default: 7 days)
      const dueDaysCount = parseInt(dueDays, 10) || 7;
      const dueDateObj = new Date(now.getTime() + dueDaysCount * 24 * 60 * 60 * 1000);
      const dueDateIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(dueDateObj);

      // 2. Generate consecutive GST Invoice as Pending
      if (!Array.isArray(appState.invoices)) appState.invoices = [];
      const nextInvNum = billingService.generateNextInvoiceNumber(appState.invoices, todayIST);
      const gstCalc = billingService.calculateGST(amount, startup.gstin || '29AAACX9920M1Z4');
      const packNameClean = packTitle || 'Growth Pack';

      const invoice = {
        id: nextInvNum,
        startupId: startup.id,
        startupName: startup.name,
        issueDate: todayIST,
        dueDate: dueDateIST,
        billingPeriod: `Credit top-up, ${packNameClean}`,
        lineItems: [
          {
            desc: `Credit top-up, ${packNameClean} (${hours || credits / 10} hrs / ${credits} credits)`,
            qty: 1,
            rate: amount,
            amount: amount,
            sac: '997212'
          }
        ],
        subtotal: amount,
        taxType: gstCalc.taxType,
        cgstAmount: gstCalc.cgstAmount,
        sgstAmount: gstCalc.sgstAmount,
        igstAmount: gstCalc.igstAmount,
        taxGst: gstCalc.totalGst,
        total: gstCalc.totalAmount,
        amountInWords: billingService.numberToWordsIndian(gstCalc.totalAmount),
        status: 'Pending', // Pending until payment is confirmed
        paymentMethod: paymentMethod || 'UPI',
        paidAt: null,
        receiptUrl: `/receipts/${nextInvNum}`
      };

      appState.invoices.unshift(invoice);

      // 3. Top-up entry is recorded as Pending (Credits granted ONLY on payment success)
      if (!Array.isArray(startup.topUps)) startup.topUps = [];
      const topUpEntry = {
        id: `TOPUP-${Date.now()}`,
        purchasedAt: now.toISOString(),
        date: todayIST,
        time: new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).format(now),
        credits: Number(credits),
        remainingCredits: Number(credits),
        packTitle: packNameClean,
        invoiceId: invoice.id,
        expiresAt,
        amount,
        paymentMethod: paymentMethod || 'UPI',
        status: 'Pending' // Requires payment confirmation to activate
      };
      startup.topUps.push(topUpEntry);

      // 4. Save state
      await db.saveAppState(appState);

      const allowance = creditService.getMonthlyAllowance(startup, appState.meetingRooms || [], todayIST.substring(0, 7), startup.topUps);

      const responsePayload = {
        message: `Generated top-up invoice #${invoice.id} for ${startup.name}. Complete payment to activate ${credits} credits.`,
        topUp: topUpEntry,
        invoice,
        allowance
      };

      if (idempotencyKey) {
        IDEMPOTENCY_CACHE.set(idempotencyKey, responsePayload);
      }

      broadcastMeetingRoomUpdate({ action: 'topup_created', startupId, invoiceId: invoice.id });
      return sendJson(res, 201, { ok: true, ...responsePayload });
    }

    // Payment Confirmation Webhook/Endpoint: Grants credits upon payment success
    if (pathname === '/api/credits/topup-confirm-payment' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { invoiceId, startupId, idempotencyKey, paymentReference } = body;

      if (!invoiceId) {
        return sendJson(res, 400, { ok: false, error: 'invoiceId is required' });
      }

      if (idempotencyKey && IDEMPOTENCY_CACHE.has(idempotencyKey)) {
        return sendJson(res, 200, { ok: true, idempotentReplay: true, ...IDEMPOTENCY_CACHE.get(idempotencyKey) });
      }

      const appState = await db.getAppState();
      const invoices = appState.invoices || [];
      const invoice = invoices.find(i => i.id === invoiceId);
      if (!invoice) {
        return sendJson(res, 404, { ok: false, error: 'Invoice not found' });
      }

      const startups = appState.startups || [];
      const targetStartupId = startupId || invoice.startupId;
      const startup = startups.find(s => s.id === targetStartupId);
      if (!startup) {
        return sendJson(res, 404, { ok: false, error: 'Startup not found' });
      }

      // Mark Invoice as Paid
      const now = new Date();
      invoice.status = 'Paid';
      invoice.paidAt = now.toISOString();
      invoice.paymentReference = paymentReference || `PAY-${Date.now().toString(36).toUpperCase()}`;

      // Activate Top-Up Credits
      let activatedCredits = 0;
      if (Array.isArray(startup.topUps)) {
        const topUp = startup.topUps.find(t => t.invoiceId === invoiceId);
        if (topUp) {
          topUp.status = 'Paid';
          topUp.activatedAt = now.toISOString();
          activatedCredits = topUp.credits;
        }
      }

      await db.saveAppState(appState);

      const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
      const allowance = creditService.getMonthlyAllowance(startup, appState.meetingRooms || [], todayIST.substring(0, 7), startup.topUps);

      const resultPayload = {
        message: `Payment successful! Activated ${activatedCredits} credits for ${startup.name}.`,
        invoice,
        allowance
      };

      if (idempotencyKey) {
        IDEMPOTENCY_CACHE.set(idempotencyKey, resultPayload);
      }

      broadcastMeetingRoomUpdate({ action: 'topup_paid', startupId: startup.id, invoiceId, credits: activatedCredits });
      return sendJson(res, 200, { ok: true, ...resultPayload });
    }

    if (pathname === '/api/invoices/void' && req.method === 'POST') {
      const userRole = req.headers['x-user-role'] || 'super_admin';
      const body = await parseJsonBody(req);
      const { invoiceId, reason } = body;

      const appState = await db.getAppState();
      const invoices = (appState && appState.invoices) ? appState.invoices : [];
      const invoice = invoices.find(i => i.id === invoiceId);

      if (!invoice) {
        return sendJson(res, 404, { ok: false, error: 'Invoice not found' });
      }

      const voidResult = billingService.voidInvoice(invoice, reason, userRole, 'Staff Admin');
      if (!voidResult.success) {
        return sendJson(res, 403, { ok: false, error: voidResult.message });
      }

      await db.saveAppState(appState);
      return sendJson(res, 200, { ok: true, message: `Invoice #${invoiceId} voided successfully.`, invoice });
    }

    if (pathname === '/api/billing/profile' && req.method === 'POST') {
      const userRole = req.headers['x-user-role'] || 'founder';
      const body = await parseJsonBody(req);
      const { startupId, legalName, gstin, billingAddress, state, invoiceEmails } = body;

      const isAuthorized = userRole === 'admin' || userRole === 'super_admin' || userRole === 'founder' || userRole === 'company_admin';
      if (!isAuthorized) {
        return sendJson(res, 403, { ok: false, error: 'Forbidden: Only company admin or staff can update billing profile.' });
      }

      if (gstin && !billingService.validateGSTIN(gstin)) {
        return sendJson(res, 400, { ok: false, error: 'Invalid GSTIN format. Expected 15-character alphanumeric format (e.g. 29AAACX9920M1Z4).' });
      }

      const appState = await db.getAppState();
      const startups = (appState && appState.startups) ? appState.startups : [];
      const startup = startups.find(s => s.id === startupId);

      if (!startup) {
        return sendJson(res, 404, { ok: false, error: 'Startup not found' });
      }

      startup.legalName = legalName || startup.legalName;
      if (gstin) startup.gstin = gstin.trim().toUpperCase();
      if (billingAddress) startup.billingAddress = billingAddress;
      if (state) startup.state = state;
      if (invoiceEmails) startup.invoiceEmails = invoiceEmails;

      await db.saveAppState(appState);
      return sendJson(res, 200, { ok: true, message: 'Billing profile updated successfully.', startup });
    }

    if (pathname === '/api/billing/audit-logs' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, auditLogs: billingService.AUDIT_LOGS });
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
      let records = resData.records || [];
      if (!isOperator) {
        records = records.filter(p => p.startupId === companyId);
      }
      return sendJson(res, 200, { ok: true, payments: records });
    }

    if (pathname === '/api/milestones' && req.method === 'GET') {
      const resData = await db.getTableRecords('milestones', { limit: 100 });
      let records = resData.records || [];
      if (!isOperator) {
        records = records.filter(m => m.startupId === companyId);
      }
      return sendJson(res, 200, { ok: true, milestones: records });
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

    // Role-Scoped Reservations Ledger Endpoint (Server-side pagination, search, status tabs)
    if (pathname === '/api/meeting-rooms/reservations' && req.method === 'GET') {
      const targetStartupId = !isOperator ? companyId : (searchParams.get('startupId') || searchParams.get('requestingStartupId') || undefined);
      const result = await db.getMeetingRoomReservations({
        userRole: isOperator ? 'super_admin' : 'founder',
        requestingStartupId: companyId,
        startupId: targetStartupId,
        roomId: searchParams.get('roomId') || undefined,
        status: searchParams.get('status') || undefined,
        paymentStatus: searchParams.get('paymentStatus') || undefined,
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined,
        search: searchParams.get('search') || undefined,
        sortBy: searchParams.get('sortBy') || 'default',
        sortDir: searchParams.get('sortDir') || 'asc',
        page: searchParams.get('page') || 1,
        limit: searchParams.get('limit') || 25
      });
      return sendJson(res, result.status || (result.ok ? 200 : 403), result);
    }

    // Export Reservations as CSV (Operator or strictly scoped to own company)
    if (pathname === '/api/meeting-rooms/export-csv' && req.method === 'GET') {
      const requestedId = searchParams.get('startupId');
      if (!isOperator && requestedId && requestedId !== companyId) {
        return sendJson(res, 403, { ok: false, error: 'Access denied: You cannot export data of other companies.' });
      }

      const result = await db.getMeetingRoomReservations({
        userRole: isOperator ? 'super_admin' : 'founder',
        requestingStartupId: companyId,
        startupId: !isOperator ? companyId : (requestedId || undefined),
        roomId: searchParams.get('roomId') || undefined,
        status: searchParams.get('status') || undefined,
        paymentStatus: searchParams.get('paymentStatus') || undefined,
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined,
        search: searchParams.get('search') || undefined,
        sortBy: searchParams.get('sortBy') || 'default',
        sortDir: searchParams.get('sortDir') || 'asc',
        page: 1,
        limit: 5000
      });
      if (!result.ok) return sendJson(res, 403, result);
      const rows = result.reservations || [];
      const headers = ['Booking Ref', 'Startup', 'Room', 'Floor', 'Date', 'Start Time', 'End Time', 'Duration (hrs)', 'Attendees', 'Purpose', 'Booked By', 'Credits Deducted (hrs)', 'Fees (INR)', 'Status', 'Created At'];
      const csv = [headers.join(','), ...rows.map(r => [
        `"${r.id}"`, `"${(r.startupName || '').replace(/"/g, '""')}"`, `"${(r.roomName || '').replace(/"/g, '""')}"`,
        `"${r.floor || ''}"`, r.date, r.startTime, r.endTime, r.duration || '', r.attendees || '',
        `"${(r.purpose || r.title || '').replace(/"/g, '""')}"`, `"${(r.bookedBy || '').replace(/"/g, '""')}"`,
        r.creditHoursUsed || 0, r.cost || 0, `"${r.status || ''}"`, `"${r.createdAt || ''}"`
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
        if (!isOperator) {
          return sendJson(res, 403, { ok: false, error: 'Access denied: Viewing leads requires operator privileges.' });
        }
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
      if (!isOperator) {
        return sendJson(res, 403, { ok: false, error: 'Access denied: Modifying leads requires operator privileges.' });
      }
      const body = await parseJsonBody(req);
      const success = await db.updateLead(body.id, body.updates);
      return sendJson(res, success ? 200 : 400, { ok: success });
    }

    if (pathname === '/api/leads/delete' && req.method === 'POST') {
      if (!isOperator) {
        return sendJson(res, 403, { ok: false, error: 'Access denied: Deleting leads requires operator privileges.' });
      }
      const body = await parseJsonBody(req);
      const success = await db.deleteLead(body.id);
      return sendJson(res, success ? 200 : 400, { ok: success });
    }

    if (pathname === '/api/inquiries') {
      if (req.method === 'GET') {
        const inquiries = await db.getInquiries();
        let records = Array.isArray(inquiries) ? inquiries : [];
        if (!isOperator) {
          records = records.filter(iq => iq.startupId === companyId || iq.companyId === companyId);
        }
        return sendJson(res, 200, { ok: true, inquiries: records });
      }
      if (req.method === 'POST') {
        const body = await parseJsonBody(req);
        const success = await db.saveInquiry({ ...body, startupId: companyId });
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
  console.log(`[REQ] ${req.method} ${req.url}`);
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

  if (
    reqUrl.startsWith('/api/') || reqUrl === '/api' ||
    reqUrl.startsWith('/company/') ||
    reqUrl === '/bookings' || reqUrl.startsWith('/bookings/') ||
    reqUrl.startsWith('/workspaces/') ||
    reqUrl === '/analytics' || reqUrl.startsWith('/analytics/')
  ) {
    return handleApi(req, res, parsedUrl);
  }

  if (reqUrl === '/' || reqUrl === '') reqUrl = '/app.html';
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
    s.listen(portToTry, '0.0.0.0', () => {
      currentServer = s;
      console.log(`\n⚡ NEXUS Hub Operating System Server Started!`);
      console.log(`👉 Access URL: http://localhost:${portToTry}/ or http://127.0.0.1:${portToTry}/\n`);
    });
  }
  startServer(PORT);
}

module.exports = handler;

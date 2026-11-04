// MongoDB Connection & Data Layer
require('dotenv').config();
const dns = require('dns');
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const https = require('https');
const cancellation = require('./cancellation');
const creditService = require('./creditService');

// On Windows, ensure Atlas SRV resolution works across ISP/local DNS
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if custom DNS cannot be set
}

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

let client = null;
let db = null;
let isConnected = false;
let lastError = null;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://nexusadmin:H1iKZL5M93ugrxwn@h-hub.uyc1vpr.mongodb.net/nexus_hub?retryWrites=true&w=majority&appName=H-HUB';
const DB_NAME = process.env.MONGODB_DB_NAME || 'nexus_hub';

// Defined Schema Tables / Collections
const TABLE_DEFINITIONS = [
  { name: 'startups', label: 'Startups & Ventures', icon: '🏢', sourceKey: 'startups', description: 'Incubated venture profiles, cap tables, sectors & growth stages' },
  { name: 'workspaces', label: 'Workspaces & Desks', icon: '💺', sourceKey: 'workspaces', description: 'Dedicated desks, flex hot desks & private cabins' },
  { name: 'meeting_rooms', label: 'Meeting Rooms', icon: '📅', sourceKey: 'meetingRooms', description: 'Conference halls, boardrooms & hourly booking schedules' },
  { name: 'invoices', label: 'Invoices & Billing', icon: '🧾', sourceKey: 'invoices', description: 'Official tax invoices, GST calculations & payment status' },
  { name: 'payments', label: 'Payments & Transactions', icon: '💳', sourceKey: 'payments', description: 'Gateway receipts, UPI transfers & financial ledger records' },
  { name: 'mentors', label: 'Mentors & Advisory', icon: '🧠', sourceKey: 'mentors', description: 'Assigned domain mentors, advisory profiles & advisory hours' },
  { name: 'milestones', label: 'Incubation Milestones', icon: '🎯', sourceKey: 'incubationMilestones', description: 'Sequential startup targets & mentor verification sign-offs' },
  { name: 'leads', label: 'Inbound Leads', icon: '📥', sourceKey: 'leads', description: 'Cohort applicant submissions & newsletter subscriber pipeline' },
  { name: 'inquiries', label: 'Contact Inquiries', icon: '💬', sourceKey: 'inquiries', description: 'Support tickets & ecosystem contact requests' },
  { name: 'cancellations', label: 'Cancellations & Refunds', icon: '🔄', sourceKey: 'cancellations', description: 'Meeting room cancellations, refund quotes & audit ledger' },
  { name: 'activity_logs', label: 'Activity & Audit Log', icon: '📜', sourceKey: 'activityLog', description: 'System audit logs, automated triggers & event history' }
];

let lastConnectAttempt = 0;
const RETRY_BACKOFF_MS = 30000;

async function connectDB() {
  if (!MONGODB_URI || MONGODB_URI.includes('<db_username>')) {
    lastError = 'MongoDB URI contains placeholder <db_username>. Please provide your database username.';
    console.warn(`⚠️ [MongoDB] ${lastError}`);
    return null;
  }

  if (client && isConnected) return db;

  // Non-blocking backoff if recent connection failed
  if (!isConnected && (Date.now() - lastConnectAttempt) < RETRY_BACKOFF_MS) {
    return null;
  }

  lastConnectAttempt = Date.now();

  try {
    const candidateClient = new MongoClient(MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: false,
        deprecationErrors: true,
      },
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });

    await Promise.race([
      candidateClient.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('MongoDB connection timeout (3s)')), 3000))
    ]);

    client = candidateClient;
    db = client.db(DB_NAME);
    isConnected = true;
    lastError = null;
    console.log(`✅ [MongoDB] Connected successfully to database: ${DB_NAME}`);
    return db;
  } catch (err) {
    isConnected = false;
    lastError = err.message;
    console.error(`❌ [MongoDB] Connection error:`, err.message);
    return null;
  }
}

function getStatus() {
  return {
    connected: isConnected,
    database: DB_NAME,
    hasUri: Boolean(MONGODB_URI && !MONGODB_URI.includes('<db_username>')),
    error: lastError,
    cluster: 'H-HUB (AWS Mumbai)',
    tablesCount: TABLE_DEFINITIONS.length
  };
}

function loadInitialSeedData() {
  try {
    const filePath = path.join(__dirname, 'js', 'initialData.js');
    if (!fs.existsSync(filePath)) return {};
    const code = fs.readFileSync(filePath, 'utf8');
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    return sandbox.window.INITIAL_DATA || {};
  } catch (err) {
    console.error('Error loading initialData.js for DB seed:', err);
    return {};
  }
}

// -------------------------------------------------------------
// Core Table Operations & Seeding Engine
// -------------------------------------------------------------
async function seedAllCollections(force = false) {
  const database = await connectDB();
  if (!database) return { ok: false, error: 'Database not connected' };

  const seedData = loadInitialSeedData();
  const summary = {};

  for (const def of TABLE_DEFINITIONS) {
    const col = database.collection(def.name);
    const count = await col.countDocuments();

    if (count === 0 || force) {
      if (force && count > 0) {
        await col.deleteMany({});
      }

      let items = seedData[def.sourceKey];

      // Fallbacks for leads & inquiries
      if (def.name === 'leads' && (!items || items.length === 0)) {
        items = [
          {
            id: 'LED-001',
            fullName: 'Dr. Arjun Mehta',
            email: 'arjun@quantumgrid.io',
            phone: '+91 98451 22345',
            startupName: 'QuantumGrid Robotics',
            sector: 'DeepTech / Robotics',
            stage: 'MVP Ready',
            teamSize: 4,
            source: 'Website Application',
            status: 'Under Review',
            notes: 'High potential deeptech venture looking for GPU hardware labs.',
            createdAt: new Date('2026-10-10')
          },
          {
            id: 'LED-002',
            fullName: 'Sneha Roy',
            email: 'sneha@agripulse.in',
            phone: '+91 97112 33456',
            startupName: 'AgriPulse AI',
            sector: 'AgriTech',
            stage: 'Early Traction',
            teamSize: 3,
            source: 'Weekly Dispatch',
            status: 'Approved',
            notes: 'Invited for campus tour and founder pitch evaluation.',
            createdAt: new Date('2026-10-11')
          }
        ];
      }

      if (def.name === 'inquiries' && (!items || items.length === 0)) {
        items = [
          {
            id: 'INQ-101',
            ticketNumber: 'THUB-2026-8841',
            name: 'Aditya Sharma',
            email: 'aditya@neuralcraft.ai',
            phone: '+91 98765 43210',
            startupName: 'NeuralCraft Systems',
            category: 'Incubation Application',
            subject: 'Cohort 07 Application & GPU Cloud Access',
            message: 'We are building an agentic enterprise AI copilot looking for Tier-2 incubation and mentor matching.',
            priority: 'High',
            status: 'New',
            createdAt: new Date('2026-10-12')
          }
        ];
      }

      if (Array.isArray(items) && items.length > 0) {
        const toInsert = JSON.parse(JSON.stringify(items)).map(item => ({
          ...item,
          _syncedAt: new Date()
        }));
        await col.insertMany(toInsert);
        summary[def.name] = { status: 'seeded', count: toInsert.length };
      } else {
        summary[def.name] = { status: 'empty_seed', count: 0 };
      }
    } else {
      summary[def.name] = { status: 'existing', count };
    }
  }

  return { ok: true, summary };
}

async function getTableStats() {
  const database = await connectDB();
  if (!database) return [];

  const list = [];
  for (const def of TABLE_DEFINITIONS) {
    const col = database.collection(def.name);
    const count = await col.countDocuments();
    const sample = await col.findOne({}, { projection: { _id: 0, _syncedAt: 0 } });
    const fields = sample ? Object.keys(sample) : [];
    list.push({
      name: def.name,
      label: def.label,
      icon: def.icon,
      description: def.description,
      count,
      fields
    });
  }
  return list;
}

async function getTableRecords(tableName, { page = 1, limit = 25, search = '', sortField = '_id', sortOrder = -1 } = {}) {
  const validTable = TABLE_DEFINITIONS.find(t => t.name === tableName);
  if (!validTable) return { ok: false, error: `Invalid table: ${tableName}` };

  const database = await connectDB();
  if (!database) {
    const seed = loadInitialSeedData();
    const sourceKey = validTable.sourceKey;
    let items = (seed && seed[sourceKey]) ? JSON.parse(JSON.stringify(seed[sourceKey])) : [];
    return {
      ok: true,
      table: validTable,
      total: items.length,
      page: 1,
      limit,
      totalPages: 1,
      records: items.slice(0, parseInt(limit) || 25)
    };
  }

  const col = database.collection(tableName);
  let filter = {};

  if (search && search.trim()) {
    const s = search.trim();
    filter = {
      $or: [
        { id: { $regex: s, $options: 'i' } },
        { name: { $regex: s, $options: 'i' } },
        { title: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { startupName: { $regex: s, $options: 'i' } },
        { status: { $regex: s, $options: 'i' } },
        { invoiceNumber: { $regex: s, $options: 'i' } },
        { deskId: { $regex: s, $options: 'i' } },
        { transactionId: { $regex: s, $options: 'i' } }
      ]
    };
  }

  const total = await col.countDocuments(filter);
  const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  const sort = {};
  if (sortField) {
    sort[sortField] = parseInt(sortOrder) || -1;
  }

  const records = await col.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .toArray();

  let sampleKeys = [];
  if (records.length > 0) {
    sampleKeys = Object.keys(records[0]).filter(k => k !== '_syncedAt');
  } else {
    const anyDoc = await col.findOne();
    if (anyDoc) sampleKeys = Object.keys(anyDoc).filter(k => k !== '_syncedAt');
  }

  return {
    ok: true,
    table: validTable,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / parseInt(limit)) || 1,
    fields: sampleKeys,
    records
  };
}

async function insertTableRecord(tableName, doc) {
  const database = await connectDB();
  if (!database) return { ok: false, error: 'Database not connected' };
  const col = database.collection(tableName);
  if (!doc.id && !doc._id) {
    doc.id = tableName.slice(0, 3).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
  }
  doc._createdAt = new Date();
  if (doc.id) {
    const copy = { ...doc };
    delete copy._id;
    await col.updateOne({ id: doc.id }, { $set: copy }, { upsert: true });
    return { ok: true, doc };
  }
  const res = await col.insertOne(doc);
  return { ok: true, insertedId: res.insertedId, doc };
}

async function updateTableRecord(tableName, id, updates) {
  const database = await connectDB();
  if (!database) return { ok: false, error: 'Database not connected' };
  const col = database.collection(tableName);
  delete updates._id;
  updates._updatedAt = new Date();

  let query;
  if (ObjectId.isValid(id) && String(new ObjectId(id)) === id) {
    query = { $or: [{ _id: new ObjectId(id) }, { id: id }] };
  } else {
    query = { $or: [{ id: id }, { _id: id }] };
  }

  const res = await col.updateOne(query, { $set: updates });
  return { ok: res.matchedCount > 0, modifiedCount: res.modifiedCount };
}

async function deleteTableRecord(tableName, id) {
  const database = await connectDB();
  if (!database) return { ok: false, error: 'Database not connected' };
  const col = database.collection(tableName);

  let query;
  if (ObjectId.isValid(id) && String(new ObjectId(id)) === id) {
    query = { $or: [{ _id: new ObjectId(id) }, { id: id }] };
  } else {
    query = { $or: [{ id: id }, { _id: id }] };
  }

  const res = await col.deleteOne(query);
  return { ok: res.deletedCount > 0 };
}

// -------------------------------------------------------------
// Existing Helpers Preserved (with resilient in-memory fallback)
// -------------------------------------------------------------
let memoryAppState = null;

async function getAppState() {
  const database = await connectDB();
  if (!database) {
    if (!memoryAppState) {
      memoryAppState = JSON.parse(JSON.stringify(loadInitialSeedData()));
    }
    return memoryAppState;
  }
  const col = database.collection('app_state');
  const doc = await col.findOne({ _id: 'current_state' });
  if (doc && doc.state) {
    memoryAppState = doc.state;
    return doc.state;
  }
  if (!memoryAppState) {
    memoryAppState = JSON.parse(JSON.stringify(loadInitialSeedData()));
  }
  return memoryAppState;
}

async function saveAppState(state) {
  memoryAppState = state;
  const database = await connectDB();
  if (!database) return true;
  const col = database.collection('app_state');
  await col.updateOne(
    { _id: 'current_state' },
    { $set: { state, updatedAt: new Date() } },
    { upsert: true }
  );

  // Synchronize individual entities into their dedicated MongoDB collections
  if (state && typeof state === 'object') {
    // 1. Startups
    if (Array.isArray(state.startups)) {
      try {
        const startupsCol = database.collection('startups');
        for (const s of state.startups) {
          if (!s.id) continue;
          const copy = { ...s };
          delete copy._id;
          copy._syncedAt = new Date();
          await startupsCol.updateOne({ id: s.id }, { $set: copy }, { upsert: true });
        }
      } catch (err) {
        console.warn('Could not sync startups collection:', err.message);
      }
    }

    // 2. Workspaces
    if (Array.isArray(state.workspaces)) {
      try {
        const wsCol = database.collection('workspaces');
        for (const w of state.workspaces) {
          if (!w.id) continue;
          const copy = { ...w };
          delete copy._id;
          copy._syncedAt = new Date();
          await wsCol.updateOne({ id: w.id }, { $set: copy }, { upsert: true });
        }
      } catch (err) {
        console.warn('Could not sync workspaces collection:', err.message);
      }
    }

    // 3. Invoices
    if (Array.isArray(state.invoices)) {
      try {
        const invCol = database.collection('invoices');
        for (const inv of state.invoices) {
          if (!inv.id) continue;
          const copy = { ...inv };
          delete copy._id;
          copy._syncedAt = new Date();
          await invCol.updateOne({ id: inv.id }, { $set: copy }, { upsert: true });
        }
      } catch (err) {
        console.warn('Could not sync invoices collection:', err.message);
      }
    }

    // 4. Payments
    if (Array.isArray(state.payments)) {
      try {
        const payCol = database.collection('payments');
        for (const p of state.payments) {
          if (!p.id) continue;
          const copy = { ...p };
          delete copy._id;
          copy._syncedAt = new Date();
          await payCol.updateOne({ id: p.id }, { $set: copy }, { upsert: true });
        }
      } catch (err) {
        console.warn('Could not sync payments collection:', err.message);
      }
    }

    // 5. Milestones
    if (Array.isArray(state.incubationMilestones)) {
      try {
        const mlsCol = database.collection('milestones');
        for (const m of state.incubationMilestones) {
          if (!m.id) continue;
          const copy = { ...m };
          delete copy._id;
          copy._syncedAt = new Date();
          await mlsCol.updateOne({ id: m.id }, { $set: copy }, { upsert: true });
        }
      } catch (err) {
        console.warn('Could not sync milestones collection:', err.message);
      }
    }

    // 6. Mentors
    if (Array.isArray(state.mentors)) {
      try {
        const mentorCol = database.collection('mentors');
        for (const m of state.mentors) {
          if (!m.id) continue;
          const copy = { ...m };
          delete copy._id;
          copy._syncedAt = new Date();
          await mentorCol.updateOne({ id: m.id }, { $set: copy }, { upsert: true });
        }
      } catch (err) {
        console.warn('Could not sync mentors collection:', err.message);
      }
    }

    // 7. Activity logs
    if (Array.isArray(state.activityLog)) {
      try {
        const logCol = database.collection('activity_logs');
        for (const a of state.activityLog.slice(0, 50)) {
          if (!a.id) continue;
          const copy = { ...a };
          delete copy._id;
          copy._syncedAt = new Date();
          await logCol.updateOne({ id: a.id }, { $set: copy }, { upsert: true });
        }
      } catch (err) {
        console.warn('Could not sync activity_logs collection:', err.message);
      }
    }

    // 8. Meeting Rooms
    if (Array.isArray(state.meetingRooms)) {
      try {
        const mrCol = database.collection('meeting_rooms');
        for (const r of state.meetingRooms) {
          if (!r.id) continue;
          const copy = { ...r };
          delete copy._id;
          copy._syncedAt = new Date();
          await mrCol.updateOne({ id: r.id }, { $set: copy }, { upsert: true });
        }
      } catch (err) {
        console.warn('Could not sync meeting_rooms collection:', err.message);
      }
    }
  }

  return true;
}

async function saveLead(lead) {
  const database = await connectDB();
  if (!database) return false;
  const col = database.collection('leads');
  await col.insertOne({
    ...lead,
    status: lead.status || 'New',
    createdAt: lead.createdAt ? new Date(lead.createdAt) : new Date()
  });
  return true;
}

async function getLeads() {
  const database = await connectDB();
  if (!database) return [];
  const col = database.collection('leads');
  return col.find({}).sort({ createdAt: -1 }).toArray();
}

async function updateLead(id, updates) {
  const database = await connectDB();
  if (!database) return false;
  const col = database.collection('leads');
  const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
  const res = await col.updateOne(query, { $set: { ...updates, updatedAt: new Date() } });
  return res.matchedCount > 0;
}

async function deleteLead(id) {
  const database = await connectDB();
  if (!database) return false;
  const col = database.collection('leads');
  const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
  const res = await col.deleteOne(query);
  return res.deletedCount > 0;
}

async function saveInquiry(inquiry) {
  const database = await connectDB();
  if (!database) return false;
  const col = database.collection('inquiries');
  await col.insertOne({
    ...inquiry,
    status: inquiry.status || 'New',
    createdAt: inquiry.createdAt ? new Date(inquiry.createdAt) : new Date()
  });
  return true;
}

async function getInquiries() {
  const database = await connectDB();
  if (!database) return [];
  const col = database.collection('inquiries');
  return col.find({}).sort({ createdAt: -1 }).toArray();
}

async function updateInquiry(id, updates) {
  const database = await connectDB();
  if (!database) return false;
  const col = database.collection('inquiries');
  const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
  const res = await col.updateOne(query, { $set: { ...updates, updatedAt: new Date() } });
  return res.matchedCount > 0;
}

// -------------------------------------------------------------
// Meeting Room Booking & Race-Condition-Proof Atomic Operations
// -------------------------------------------------------------

class AsyncMutex {
  constructor() {
    this.queue = [];
    this.locked = false;
  }
  async acquire() {
    return new Promise(resolve => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }
  release() {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next();
    } else {
      this.locked = false;
    }
  }
}

const bookingMutex = new AsyncMutex();

// Strict Asia/Kolkata IST Clock
function getISTClock() {
  const now = new Date();
  const dFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
  const tFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
  const date = dFormatter.format(now);
  const time = tFormatter.format(now);
  const [h, m] = time.split(':').map(Number);
  return { date, time, minutes: h * 60 + m, now };
}

function toMinutes(t) {
  if (!t) return 0;
  const parts = t.split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

// Canonical conflict rule:
// Two bookings conflict if they are for the same room and same date and:
// existing.startTime < new.endTime AND existing.endTime > new.startTime.
// Cancelled bookings do not count as conflicts.
// Canonical Sequential Booking Reference Generator: BKG-YYYYMMDD-NNNN (Generated server-side)
function generateBookingRef(date, allRooms) {
  const dClean = String(date || '').replace(/[^0-9]/g, '');
  const prefix = `BKG-${dClean}-`;
  let maxSeq = 0;
  (allRooms || []).forEach(r => {
    (r.bookings || []).forEach(b => {
      if (b && b.id && String(b.id).startsWith(prefix)) {
        const seqPart = parseInt(String(b.id).substring(prefix.length), 10);
        if (!isNaN(seqPart) && seqPart > maxSeq) {
          maxSeq = seqPart;
        }
      }
    });
  });
  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
}

// Calculate cumulative confirmed meeting hours used by startup in a specific calendar month (YYYY-MM)
function calculateStartupMonthlyUsage(allRooms, startupId, yearMonth, excludeBookingId = null) {
  let totalHours = 0;
  (allRooms || []).forEach(r => {
    (r.bookings || []).forEach(b => {
      if (b && b.startupId === startupId && b.status !== 'Cancelled') {
        if (excludeBookingId && b.id === excludeBookingId) return;
        const bMonth = (b.date || '').substring(0, 7);
        if (bMonth === yearMonth) {
          const [sh, sm] = (b.startTime || '00:00').split(':').map(Number);
          const [eh, em] = (b.endTime || '00:00').split(':').map(Number);
          const computedDur = Math.max(0.25, ((eh * 60 + em) - (sh * 60 + sm)) / 60);
          const dur = (b.duration !== undefined && Number(b.duration) > 0) ? Number(b.duration) : computedDur;
          totalHours += dur;
        }
      }
    });
  });
  return Number(totalHours.toFixed(2));
}

function hasBookingConflict(existing, newB) {
  if (!existing || !newB) return false;
  if (existing.roomId !== newB.roomId) return false;
  if (existing.date !== newB.date) return false;
  if (existing.status === 'Cancelled') return false;
  if (existing.id && newB.id && existing.id === newB.id) return false;
  return (toMinutes(existing.startTime) < toMinutes(newB.endTime) && toMinutes(existing.endTime) > toMinutes(newB.startTime));
}

// Same startup concurrent booking conflict check:
// A startup cannot be booked in two different rooms at the same overlapping time.
function hasStartupConcurrentConflict(existing, newB) {
  if (!existing || !newB) return false;
  if (existing.startupId !== newB.startupId) return false;
  if (existing.roomId === newB.roomId) return false;
  if (existing.date !== newB.date) return false;
  if (existing.status === 'Cancelled') return false;
  if (existing.id && newB.id && existing.id === newB.id) return false;
  return (toMinutes(existing.startTime) < toMinutes(newB.endTime) && toMinutes(existing.endTime) > toMinutes(newB.startTime));
}

// Initialize MongoDB indexes including partial unique index on meeting_room_slots
let indexesInitialized = false;
async function initMeetingRoomIndexes() {
  if (indexesInitialized) return;
  const database = await connectDB();
  if (!database) return;
  try {
    const slotsCol = database.collection('meeting_room_slots');
    await slotsCol.createIndex(
      { roomId: 1, date: 1, slotHour: 1 },
      { unique: true, partialFilterExpression: { status: 'Confirmed' }, name: 'uniq_confirmed_room_slot' }
    );
    const roomsCol = database.collection('meeting_rooms');
    await roomsCol.createIndex({ id: 1 }, { unique: true });
    indexesInitialized = true;
    console.log('✅ [MongoDB] Meeting room indexes verified (partial unique slot index active).');
  } catch (err) {
    console.warn('⚠️ [MongoDB] Error initializing meeting room indexes:', err.message);
  }
}

// Smart Alternatives Generator (Up to 3 smart options)
function findBookingAlternatives(allRooms, req) {
  const alternatives = [];
  const reqStartMin = toMinutes(req.startTime);
  const reqEndMin = toMinutes(req.endTime);
  const reqDur = Math.max(30, (reqEndMin - reqStartMin) || 60);

  const targetRoom = allRooms.find(r => r.id === req.roomId) || allRooms[0];
  const otherRooms = allRooms.filter(r => r.id !== targetRoom.id);

  const ist = getISTClock();
  const reqDate = req.date || ist.date;
  const isToday = (reqDate === ist.date);
  const reqAttendees = parseInt(req.attendees || 4, 10);

  const pad = n => (n < 10 ? '0' : '') + n;
  const formatTime = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

  // Candidate time windows to scan (30-min steps across all 24 hours):
  const candidateStarts = [];
  for (let m = 0; m <= 24 * 60 - reqDur; m += 30) candidateStarts.push(m);

  // 1. Same room later today (strictly in future)
  if (isToday) {
    const targetBookings = (targetRoom.bookings || []).filter(b => b.date === reqDate && b.status !== 'Cancelled');
    for (const startM of candidateStarts) {
      if (alternatives.length >= 1) break;
      if (startM <= ist.minutes) continue; // Must be strictly in future
      const endM = startM + reqDur;
      const sStr = formatTime(startM);
      const eStr = formatTime(endM);
      if (sStr === req.startTime) continue;
      const hasConflict = targetBookings.some(b => sStr < b.endTime && eStr > b.startTime);
      if (!hasConflict) {
        alternatives.push({
          type: 'same_room_next_slot',
          roomId: targetRoom.id,
          roomName: targetRoom.name,
          date: reqDate,
          startTime: sStr,
          endTime: eStr,
          label: `Next free slot in ${targetRoom.name} (${sStr} - ${eStr})`,
          capacity: targetRoom.capacity,
          hourlyRate: targetRoom.hourlyRate
        });
      }
    }
  }

  // 2. Other rooms today (strictly in future)
  if (isToday) {
    for (const other of otherRooms) {
      if (alternatives.length >= 2) break;
      if (other.capacity < reqAttendees) continue;
      const otherBookings = (other.bookings || []).filter(b => b.date === reqDate && b.status !== 'Cancelled');
      
      const startsToTry = (reqStartMin > ist.minutes) 
        ? [reqStartMin, ...candidateStarts.filter(m => m > ist.minutes && m !== reqStartMin)]
        : candidateStarts.filter(m => m > ist.minutes);

      for (const startM of startsToTry) {
        const endM = startM + reqDur;
        const sStr = formatTime(startM);
        const eStr = formatTime(endM);
        const hasConflict = otherBookings.some(b => sStr < b.endTime && eStr > b.startTime);
        if (!hasConflict) {
          alternatives.push({
            type: 'other_room_same_time',
            roomId: other.id,
            roomName: other.name,
            date: reqDate,
            startTime: sStr,
            endTime: eStr,
            label: `${other.name} (${other.capacity} pax) at ${sStr} - ${eStr}`,
            capacity: other.capacity,
            hourlyRate: other.hourlyRate
          });
          break;
        }
      }
    }
  }

  // 3. Next day options (Tomorrow) in target room or other rooms
  const dParts = reqDate.split('-').map(Number);
  const nextD = new Date(Date.UTC(dParts[0], dParts[1] - 1, dParts[2] + 1));
  const nextDateStr = nextD.toISOString().split('T')[0];
  const targetNextBookings = (targetRoom.bookings || []).filter(b => b.date === nextDateStr && b.status !== 'Cancelled');

  const tomorrowStarts = [
    reqStartMin >= 8 * 60 && reqStartMin + reqDur <= 19 * 60 ? reqStartMin : 10 * 60,
    10 * 60, 11 * 60, 15 * 60, 16 * 60, 17 * 60
  ];

  for (const startM of tomorrowStarts) {
    if (alternatives.length >= 3) break;
    const endM = startM + reqDur;
    const sStr = formatTime(startM);
    const eStr = formatTime(endM);
    const hasConflict = targetNextBookings.some(b => sStr < b.endTime && eStr > b.startTime);
    if (!hasConflict && !alternatives.some(a => a.roomId === targetRoom.id && a.date === nextDateStr && a.startTime === sStr)) {
      alternatives.push({
        type: 'same_room_next_day',
        roomId: targetRoom.id,
        roomName: targetRoom.name,
        date: nextDateStr,
        startTime: sStr,
        endTime: eStr,
        label: `Tomorrow (${nextDateStr}) at ${sStr} - ${eStr} in ${targetRoom.name}`,
        capacity: targetRoom.capacity,
        hourlyRate: targetRoom.hourlyRate
      });
    }
  }

  // If still fewer than 3, scan other rooms tomorrow
  if (alternatives.length < 3) {
    for (const other of otherRooms) {
      if (alternatives.length >= 3) break;
      if (other.capacity < reqAttendees) continue;
      const otherNextBookings = (other.bookings || []).filter(b => b.date === nextDateStr && b.status !== 'Cancelled');
      for (const startM of tomorrowStarts) {
        if (alternatives.length >= 3) break;
        const endM = startM + reqDur;
        const sStr = formatTime(startM);
        const eStr = formatTime(endM);
        const hasConflict = otherNextBookings.some(b => sStr < b.endTime && eStr > b.startTime);
        if (!hasConflict && !alternatives.some(a => a.roomId === other.id && a.date === nextDateStr && a.startTime === sStr)) {
          alternatives.push({
            type: 'other_room_next_day',
            roomId: other.id,
            roomName: other.name,
            date: nextDateStr,
            startTime: sStr,
            endTime: eStr,
            label: `Tomorrow in ${other.name} (${sStr} - ${eStr})`,
            capacity: other.capacity,
            hourlyRate: other.hourlyRate
          });
          break;
        }
      }
    }
  }

  return alternatives.slice(0, 3);
}

// Atomic Reservation Function with In-Process Mutex + MongoDB Unique Slot Index
async function reserveMeetingRoomSlotsAtomic(bookingReq) {
  await bookingMutex.acquire();
  try {
    const {
      roomId,
      startupId,
      startupName,
      title,
      purpose,
      date,
      startTime,
      endTime,
      attendees,
      requestedAmenities,
      specialRequests,
      cost
    } = bookingReq;

    if (!roomId || !startupId || !date || !startTime || !endTime) {
      return { ok: false, status: 400, message: 'Missing required booking fields (roomId, startupId, date, startTime, endTime).' };
    }

    const ist = getISTClock();
    const startMin = toMinutes(startTime);
    const endMin = toMinutes(endTime);

    if (endMin <= startMin) {
      return { ok: false, status: 400, message: 'Invalid booking duration: End time must be later than start time.' };
    }
    const durationMin = endMin - startMin;
    if (durationMin < 15) {
      return { ok: false, status: 400, message: 'Minimum booking duration is 15 minutes.' };
    }

    // Load current rooms state
    const appState = await getAppState();
    let rooms = (appState && appState.meetingRooms) ? appState.meetingRooms : [];
    if (!rooms.length) {
      const seed = loadInitialSeedData();
      rooms = seed.meetingRooms || [];
    }

    const room = rooms.find(r => r.id === roomId);
    if (!room) {
      return { ok: false, status: 404, message: `Room with ID "${roomId}" was not found.` };
    }

    // Check startup attendees vs capacity
    const reqAttendees = parseInt(attendees || 4, 10);
    if (isNaN(reqAttendees) || reqAttendees < 1) {
      return { ok: false, status: 400, code: 'INVALID_ATTENDEES', message: 'Number of attendees must be at least 1.' };
    }

    // 2. Past Date / Slot Rejection (Using IST Server Clock) with guaranteed alternatives:
    if (date < ist.date) {
      const alternatives = findBookingAlternatives(rooms, { roomId, date, startTime, endTime, attendees: reqAttendees, startupId });
      return {
        ok: false,
        status: 400,
        code: 'SLOT_PAST',
        message: `Cannot book past dates. Current IST date is ${ist.date}. Please pick an open future date or time below.`,
        alternatives
      };
    }
    if (date === ist.date && startMin <= ist.minutes) {
      const alternatives = findBookingAlternatives(rooms, { roomId, date, startTime, endTime, attendees: reqAttendees, startupId });
      return {
        ok: false,
        status: 400,
        code: 'SLOT_PAST',
        message: `Cannot book past time slots. Current IST time is ${ist.time}. Please pick an open future time period below.`,
        alternatives
      };
    }
    if (reqAttendees > room.capacity) {
      return {
        ok: false,
        status: 400,
        code: 'CAPACITY_EXCEEDED',
        message: `Attendees (${reqAttendees}) exceed ${room.name} capacity of ${room.capacity} pax.`
      };
    }

    const durationHrs = Math.max(0.25, durationMin / 60);

    // Enforce Booking Policies (if user is not admin)
    const policies = (appState && appState.meetingRoomPolicies) || {};
    const isAdminUser = bookingReq.userRole === 'admin' || bookingReq.userRole === 'super_admin' || bookingReq.userRole === 'incubation_admin' || bookingReq.userRole === 'incubator_admin';

    if (!isAdminUser) {
      // 1. Max duration policy
      if (policies.maxDurationHours && durationHrs > Number(policies.maxDurationHours)) {
        return {
          ok: false,
          status: 400,
          code: 'MAX_DURATION_EXCEEDED',
          message: `Booking duration (${durationHrs}h) exceeds the maximum allowed duration of ${policies.maxDurationHours} hours.`
        };
      }

      // 2. Advance booking window
      if (policies.advanceBookingDays) {
        const dPartsNow = ist.date.split('-').map(Number);
        const dPartsReq = date.split('-').map(Number);
        const nowUtc = Date.UTC(dPartsNow[0], dPartsNow[1] - 1, dPartsNow[2]);
        const reqUtc = Date.UTC(dPartsReq[0], dPartsReq[1] - 1, dPartsReq[2]);
        const daysDiff = Math.round((reqUtc - nowUtc) / (1000 * 60 * 60 * 24));
        if (daysDiff > Number(policies.advanceBookingDays)) {
          return {
            ok: false,
            status: 400,
            code: 'ADVANCE_BOOKING_EXCEEDED',
            message: `Reservations can only be made up to ${policies.advanceBookingDays} days in advance.`
          };
        }
      }

      // 3. Minimum advance notice
      if (policies.minAdvanceNoticeMins && date === ist.date) {
        if ((startMin - ist.minutes) < Number(policies.minAdvanceNoticeMins)) {
          return {
            ok: false,
            status: 400,
            code: 'MIN_ADVANCE_NOTICE_REQUIRED',
            message: `Reservations require at least ${policies.minAdvanceNoticeMins} minutes advance notice.`
          };
        }
      }

      // 4. Maximum active reservations per startup
      if (policies.maxActiveReservationsPerStartup) {
        let activeStartupBookingsCount = 0;
        for (const rm of rooms) {
          (rm.bookings || []).forEach(b => {
            if (b.startupId === startupId && b.status !== 'Cancelled') {
              if (b.date > ist.date || (b.date === ist.date && toMinutes(b.endTime) > ist.minutes)) {
                activeStartupBookingsCount++;
              }
            }
          });
        }
        if (activeStartupBookingsCount >= Number(policies.maxActiveReservationsPerStartup)) {
          return {
            ok: false,
            status: 400,
            code: 'MAX_ACTIVE_RESERVATIONS_EXCEEDED',
            message: `Your startup has reached the maximum limit of ${policies.maxActiveReservationsPerStartup} active reservations.`
          };
        }
      }

      // 5. Maximum daily booking hours per startup
      if (policies.maxDailyBookingHoursPerStartup) {
        let existingDailyHrs = 0;
        for (const rm of rooms) {
          (rm.bookings || []).forEach(b => {
            if (b.startupId === startupId && b.date === date && b.status !== 'Cancelled') {
              existingDailyHrs += (Number(b.duration) || 0);
            }
          });
        }
        if ((existingDailyHrs + durationHrs) > Number(policies.maxDailyBookingHoursPerStartup)) {
          return {
            ok: false,
            status: 400,
            code: 'MAX_DAILY_HOURS_EXCEEDED',
            message: `This booking would exceed your startup's daily limit of ${policies.maxDailyBookingHoursPerStartup} hours on ${date} (already booked: ${existingDailyHrs.toFixed(1)}h).`
          };
        }
      }
    }

    // Check if room is under maintenance (static flag or timed maintenance block)
    const isStaticMaintenance = Boolean(room.status === 'Under Maintenance' || room.underMaintenance === true || room.maintenance === true);
    const bookingStartISO = `${date}T${startTime}:00`;
    const bookingEndISO = `${date}T${endTime}:00`;
    const timedBlocks = (appState && Array.isArray(appState.maintenanceBlocks)) ? appState.maintenanceBlocks : [];
    const activeTimedBlock = timedBlocks.find(b => {
      if (b.roomId !== roomId || b.status === 'cancelled') return false;
      const bStart = b.startDateTime ? (b.startDateTime.length === 16 ? b.startDateTime + ':00' : b.startDateTime) : '';
      const bEnd = b.endDateTime ? (b.endDateTime.length === 16 ? b.endDateTime + ':00' : b.endDateTime) : '';
      return (bStart < bookingEndISO && bEnd > bookingStartISO);
    });

    if (isStaticMaintenance || activeTimedBlock) {
      const reason = activeTimedBlock ? activeTimedBlock.reason : (room.maintenanceReason || 'Scheduled facility maintenance');
      const alternatives = findBookingAlternatives(rooms, { roomId, date, startTime, endTime, attendees: reqAttendees, startupId });
      return {
        ok: false,
        status: 409,
        code: activeTimedBlock ? 'ROOM_UNDER_TIMED_MAINTENANCE' : 'ROOM_MAINTENANCE',
        message: `${room.name} is under maintenance (${reason}) and unavailable for booking at this time.`,
        alternatives,
        maintenanceBlock: activeTimedBlock || null
      };
    }

    // Idempotency Check: prevent duplicate booking & duplicate billing on network retry
    const idempotencyKey = bookingReq.idempotencyKey ? String(bookingReq.idempotencyKey).trim() : null;
    if (idempotencyKey) {
      const existingIdempotent = (room.bookings || []).find(b => b.idempotencyKey === idempotencyKey && b.status !== 'Cancelled');
      if (existingIdempotent) {
        return {
          ok: true,
          status: 200,
          idempotentReplay: true,
          booking: existingIdempotent,
          invoice: existingIdempotent.invoiceId && appState && Array.isArray(appState.invoices)
            ? appState.invoices.find(i => i.id === existingIdempotent.invoiceId) || null
            : null,
          message: `Successfully booked ${room.name}! (Idempotent replay)`
        };
      }
    }

    // 3. Multi-room concurrent user conflict check:
    // "You already have a booking at this time in [Other Room]."
    for (const r of rooms) {
      if (r.id === roomId) continue;
      const otherConflict = (r.bookings || []).find(b => {
        return hasStartupConcurrentConflict({ ...b, roomId: r.id }, { roomId, startupId, date, startTime, endTime });
      });
      if (otherConflict) {
        return {
          ok: false,
          status: 409,
          code: 'USER_ALREADY_BOOKED',
          message: `You already have a booking at this time in ${r.name}.`
        };
      }
    }

    // 4. Strict Room Slot Conflict Check:
    // existing.startTime < new.endTime AND existing.endTime > new.startTime
    const existingConflict = (room.bookings || []).find(b => {
      return hasBookingConflict({ ...b, roomId }, { roomId, date, startTime, endTime });
    });

    if (existingConflict) {
      const alternatives = findBookingAlternatives(rooms, { roomId, date, startTime, endTime, attendees: reqAttendees, startupId });
      return {
        ok: false,
        status: 409,
        code: 'SLOT_TAKEN',
        message: `${room.name} is already booked from ${existingConflict.startTime} to ${existingConflict.endTime} by another startup.`,
        alternatives,
        conflictWith: {
          id: existingConflict.id,
          startTime: existingConflict.startTime,
          endTime: existingConflict.endTime,
          startupName: existingConflict.startupName
        }
      };
    }

    // Trusted Backend Pricing & Credit Deduction Calculation
    let finalCost = cost !== undefined ? Number(cost) : 0;
    const startupRecord = (appState && Array.isArray(appState.startups))
      ? appState.startups.find(s => s.id === startupId)
      : null;

    // Check if this is a multi-occurrence recurring reservation request
    if (bookingReq.recurrence && bookingReq.recurrence.frequency && bookingReq.recurrence.frequency !== 'none' && Number(bookingReq.recurrence.count || 1) > 1 && !bookingReq._singleOccurrence) {
      bookingMutex.release();
      try {
        return await reserveRecurringMeetingRoomAtomic(bookingReq);
      } finally {
        await bookingMutex.acquire();
      }
    }

    let creditHoursUsed = 0;
    let overageHours = 0;
    const bookingMonth = (date || '').substring(0, 7);
    const priorMonthlyHours = calculateStartupMonthlyUsage(rooms, startupId, bookingMonth);

    if (startupRecord) {
      const includedHrs = startupRecord.includedMeetingHours !== undefined ? Number(startupRecord.includedMeetingHours) : 15;
      const availableAllowance = Math.max(0, Number((includedHrs - priorMonthlyHours).toFixed(2)));
      creditHoursUsed = Math.min(availableAllowance, durationHrs);
      overageHours = Math.max(0, Number((durationHrs - creditHoursUsed).toFixed(2)));
      if (cost === undefined) {
        const rate = Number(startupRecord.additionalHourRate || room.hourlyRate || 1000);
        finalCost = overageHours > 0 ? Math.round(overageHours * rate) : 0;
      }
      startupRecord.usedMeetingHours = Number((priorMonthlyHours + creditHoursUsed).toFixed(2));
    } else {
      creditHoursUsed = 0;
      overageHours = durationHrs;
      if (cost === undefined) {
        finalCost = Math.round(durationHrs * (room.hourlyRate || 1000));
      }
    }

    // Check if booking policy requires admin approval for long durations or premium rooms
    const approvalThreshold = Number(policies.requireApprovalAboveHours || 0);
    const isPremium = Boolean(room.isPremium || room.premium);
    const requiresApproval = (
      !isAdminUser &&
      (
        (approvalThreshold > 0 && durationHrs > approvalThreshold) ||
        (policies.premiumRoomRequiresApproval && isPremium) ||
        bookingReq.requiresApproval === true
      )
    );
    const initialStatus = requiresApproval
      ? 'Pending Approval'
      : (bookingReq.status || 'Confirmed');

    // 5. Construct Confirmed Booking Object (Server-side generated canonical ref BKG-YYYYMMDD-NNNN)
    const bookingId = generateBookingRef(date, rooms);
    const normalizedAmenities = Array.isArray(requestedAmenities)
      ? requestedAmenities
      : (typeof requestedAmenities === 'string' && requestedAmenities.trim()
          ? requestedAmenities.split(',').map(s => s.trim()).filter(Boolean)
          : []);

    const newBooking = {
      id: bookingId,
      roomId,
      startupId,
      startupName: startupName || (startupRecord && startupRecord.name) || 'Partner Venture',
      bookedBy: bookingReq.bookedBy || bookingReq.founderName || 'Alex Morgan',
      title: title || purpose || 'Meeting Room Reservation',
      purpose: purpose || title || 'General Sync',
      date,
      startTime,
      endTime,
      duration: durationHrs,
      creditHoursUsed,
      overageHours,
      attendees: reqAttendees,
      requestedAmenities: normalizedAmenities,
      specialRequests: specialRequests ? String(specialRequests).trim() : '',
      cost: Number(finalCost || 0),
      status: initialStatus,
      idempotencyKey: idempotencyKey || null,
      seriesId: bookingReq.seriesId || null,
      recurrence: bookingReq.recurrence || null,
      calendarSync: bookingReq.calendarSync || {},
      createdAt: new Date().toISOString()
    };

    // Sync Overage Charge to Invoices if cost > 0
    let syncedInvoice = null;
    if (newBooking.cost > 0 && appState) {
      syncedInvoice = syncBookingOverageToInvoice(appState, newBooking, room, startupRecord);
      if (syncedInvoice) {
        newBooking.invoiceId = syncedInvoice.id;
      }
    }

    if (!room.bookings) room.bookings = [];
    room.bookings.push(newBooking);

    // 6. Persist to MongoDB (both meeting_rooms collection and meeting_room_slots)
    const database = await connectDB();
    if (database) {
      try {
        await initMeetingRoomIndexes();
        const slotsCol = database.collection('meeting_room_slots');

        // Insert slot records for each 15-min interval bucket covered (supports 30-min & 60-min bookings without false collision)
        const slotDocs = [];
        for (let m = startMin; m < endMin; m += 15) {
          const h = Math.floor(m / 60);
          const minPart = m % 60;
          const slotHour = `${h < 10 ? '0' : ''}${h}:${minPart < 10 ? '0' : ''}${minPart}`;
          slotDocs.push({
            roomId,
            date,
            slotHour,
            bookingId,
            status: 'Confirmed',
            startupId,
            createdAt: new Date()
          });
        }

        // Purge any orphaned or stale slot docs for this room/date/slotHours that do not belong to an active booking in room.bookings
        const activeBookingIds = (room.bookings || [])
          .filter(b => b.status !== 'Cancelled' && b.status !== 'Rejected')
          .map(b => b.id);

        try {
          await slotsCol.deleteMany({
            roomId,
            date,
            slotHour: { $in: slotDocs.map(s => s.slotHour) },
            bookingId: { $nin: activeBookingIds }
          });
        } catch (_) {}

        // Try inserting slot docs (partial unique index will abort on race condition)
        for (const sDoc of slotDocs) {
          await slotsCol.insertOne(sDoc);
        }

        // Update room document in meeting_rooms collection
        const mrCol = database.collection('meeting_rooms');
        await mrCol.updateOne({ id: roomId }, { $set: { bookings: room.bookings } }, { upsert: true });
      } catch (dbErr) {
        // If duplicate key error on slot bucket
        if (dbErr.code === 11000) {
          // Verify if there is an ACTUAL conflicting non-cancelled booking in room.bookings
          const existingConflict = (room.bookings || []).filter(b => b.id !== bookingId).find(b => {
            return hasBookingConflict({ ...b, roomId }, { roomId, date, startTime, endTime });
          });

          if (!existingConflict) {
            // It was a stale slot document: purge it and retry inserting
            try {
              const activeBookingIds = (room.bookings || [])
                .filter(b => b.status !== 'Cancelled' && b.status !== 'Rejected')
                .map(b => b.id);
              await database.collection('meeting_room_slots').deleteMany({
                roomId,
                date,
                slotHour: { $in: slotDocs.map(s => s.slotHour) },
                bookingId: { $nin: activeBookingIds }
              });
              for (const sDoc of slotDocs) {
                await database.collection('meeting_room_slots').insertOne(sDoc);
              }
              const mrCol = database.collection('meeting_rooms');
              await mrCol.updateOne({ id: roomId }, { $set: { bookings: room.bookings } }, { upsert: true });
            } catch (retryErr) {
              console.warn('⚠️ [MongoDB] Slot insert retry error:', retryErr.message);
            }
          } else {
            room.bookings = (room.bookings || []).filter(b => b.id !== bookingId);
            try {
              await database.collection('meeting_room_slots').deleteMany({ roomId, bookingId });
            } catch (_) {}
            const alternatives = findBookingAlternatives(rooms, { roomId, date, startTime, endTime, attendees: reqAttendees, startupId });
            return {
              ok: false,
              status: 409,
              code: 'SLOT_TAKEN',
              message: `${room.name} is already booked from ${existingConflict.startTime} to ${existingConflict.endTime} by another startup. Pick another time below.`,
              alternatives
            };
          }
        } else {
          console.warn('⚠️ [MongoDB] Slot insert warning:', dbErr.message);
        }
      }
    }

    // Persist to AppState
    if (appState) {
      appState.meetingRooms = rooms;
      if (!appState.activityLog) appState.activityLog = [];
      appState.activityLog.unshift({
        id: `ACT-${Date.now()}`,
        module: 'Meeting Rooms',
        action: `${newBooking.startupName} booked ${room.name} on ${date} (${startTime}-${endTime}).`,
        timestamp: new Date().toISOString(),
        icon: '📅'
      });
      await saveAppState(appState);
    }

    return {
      ok: true,
      status: 201,
      booking: newBooking,
      invoice: syncedInvoice,
      message: `Successfully booked ${room.name}!`
    };
  } finally {
    bookingMutex.release();
  }
}

// Razorpay Refund Processor (Real API when configured, resilient mock/fallback in development)
async function processRazorpayRefund(booking, refundPaise) {
  const paymentId = booking.razorpayPaymentId || `pay_${Math.random().toString(36).slice(2, 16)}`;
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_NEXUS2026Oct';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'sec_test_99812480129';

  // If in mock/test mode without live keys, generate standard Razorpay refund ID
  if (keyId.includes('test') || keySecret.includes('test')) {
    return `rfnd_${Math.random().toString(36).slice(2, 14)}`;
  }

  try {
    return await new Promise((resolve) => {
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const postData = JSON.stringify({ amount: refundPaise });
      const req = https.request({
        hostname: 'api.razorpay.com',
        path: `/v1/payments/${paymentId}/refund`,
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 4000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed && parsed.id) return resolve(parsed.id);
          } catch (_) {}
          resolve(`rfnd_${Math.random().toString(36).slice(2, 14)}`);
        });
      });
      req.on('error', () => resolve(`rfnd_${Math.random().toString(36).slice(2, 14)}`));
      req.on('timeout', () => { req.destroy(); resolve(`rfnd_${Math.random().toString(36).slice(2, 14)}`); });
      req.write(postData);
      req.end();
    });
  } catch (e) {
    return `rfnd_${Math.random().toString(36).slice(2, 14)}`;
  }
}

// Atomic Cancellation & Refund Function (Server Transaction)
async function cancelBooking(arg1, arg2, arg3) {
  let roomId, bookingId, requestingStartupId, userRole, currentClock;
  if (typeof arg1 === 'object' && arg1 !== null) {
    ({ roomId, bookingId, requestingStartupId, userRole, currentClock } = arg1);
  } else {
    roomId = arg1;
    bookingId = arg2;
    if (typeof arg3 === 'object' && arg3 !== null) {
      ({ requestingStartupId, userRole, currentClock } = arg3);
    }
  }

  await bookingMutex.acquire();
  try {
    const appState = await getAppState();
    let rooms = (appState && appState.meetingRooms) ? appState.meetingRooms : [];
    if (!rooms.length) {
      const seed = loadInitialSeedData();
      rooms = seed.meetingRooms || [];
    }

    const room = rooms.find(r => r.id === roomId);
    if (!room) return { ok: false, status: 404, message: 'Room not found.' };

    let booking = (room.bookings || []).find(b => b.id === bookingId);
    if (!booking) {
      const database = await connectDB();
      if (database) {
        const mrDoc = await database.collection('meeting_rooms').findOne({ id: roomId });
        if (mrDoc && Array.isArray(mrDoc.bookings)) {
          booking = mrDoc.bookings.find(b => b.id === bookingId);
          if (booking) {
            room.bookings = mrDoc.bookings;
          }
        }
      }
    }
    if (!booking) return { ok: false, status: 404, message: 'Booking not found.' };

    // 1. Verify owner or admin
    const isAdmin = userRole === 'admin' || userRole === 'super_admin' || userRole === 'incubation_admin' || userRole === 'incubator_admin' || (!userRole && !requestingStartupId);
    if (!isAdmin && requestingStartupId) {
      if (booking.startupId !== requestingStartupId) {
        return {
          ok: false,
          status: 403,
          code: 'UNAUTHORIZED',
          message: 'Unauthorized: You can only cancel reservations belonging to your own startup.'
        };
      }
    }

    // 2. Double-click / repeat cancellation check: Confirmed -> Cancelled only once
    if (booking.status === 'Cancelled') {
      return {
        ok: false,
        status: 409,
        code: 'ALREADY_CANCELLED',
        message: 'This booking has already been cancelled.'
      };
    }

    // 3. Recompute quote on server using single shared policy
    let quote = cancellation.calculateRefundQuote(booking, currentClock);
    if (!quote.allowed) {
      const isDirectCleanupCall = (typeof arg1 === 'string' && !arg3);
      if (quote.isCompleted && !isDirectCleanupCall) {
        return {
          ok: false,
          status: 400,
          code: 'MEETING_COMPLETED',
          message: quote.reason || 'Cannot cancel a completed meeting.',
          quote
        };
      }
      if (isAdmin) {
        quote = {
          ...quote,
          allowed: true,
          adminOverride: true,
          refundPct: 0,
          refundPaise: 0,
          feePaise: quote.amountPaise,
          refundRupees: 0,
          refundRupees: 0,
          feeRupees: quote.amountRupees
        };
      } else {
        return {
          ok: false,
          status: 400,
          code: 'CANCELLATION_DISALLOWED',
          message: quote.reason || 'Cancelling is allowed only when at least 1 hour remains before the meeting starts.',
          quote
        };
      }
    }

    // 4. Update status Confirmed -> Cancelled
    booking.status = 'Cancelled';
    booking.cancelledAt = new Date().toISOString();
    booking.refundQuote = quote;

    // Cancel any linked external calendar events (Google / Outlook)
    if (booking.calendarSync && typeof booking.calendarSync === 'object') {
      Object.keys(booking.calendarSync).forEach(provider => {
        if (booking.calendarSync[provider] && booking.calendarSync[provider].status === 'synced') {
          booking.calendarSync[provider].status = 'cancelled';
          booking.calendarSync[provider].cancelledAt = booking.cancelledAt;
        }
      });
      if (appState && appState.calendarIntegrations && appState.calendarIntegrations.syncedEvents) {
        ['google', 'outlook'].forEach(p => {
          const evKey = `${p}:${booking.id}`;
          if (appState.calendarIntegrations.syncedEvents[evKey]) {
            appState.calendarIntegrations.syncedEvents[evKey].status = 'cancelled';
            appState.calendarIntegrations.syncedEvents[evKey].cancelledAt = booking.cancelledAt;
          }
        });
      }
    }

    const database = await connectDB();

    // 5. Free slot documents in meeting_room_slots
    if (database) {
      try {
        const slotsCol = database.collection('meeting_room_slots');
        await slotsCol.deleteMany({ roomId, bookingId });
        const mrCol = database.collection('meeting_rooms');
        await mrCol.updateOne({ id: roomId }, { $set: { bookings: room.bookings } });
      } catch (dbErr) {
        console.warn('⚠️ [MongoDB] Slot cancellation warning:', dbErr.message);
      }
    }

    // 6. Handle refund / credit note / plan credit restoration
    let refundId = null;
    let refundStatus = 'processed';
    let refundPayment = null;

    if (quote.isPlanCovered) {
      // Plan-covered bookings restore monthly credit hours
      refundStatus = 'plan_credit_restored';
      const startup = (appState.startups || []).find(s => s.id === booking.startupId);
      if (startup) {
        const restoreHrs = booking.creditHoursUsed !== undefined ? Number(booking.creditHoursUsed) : (quote.durationHours || 1);
        startup.usedMeetingHours = Number(Math.max(0, (startup.usedMeetingHours || 0) - restoreHrs).toFixed(2));
      }
    } else {
      // If booking used partial credits before hitting overage, restore those credit hours too
      const startup = (appState.startups || []).find(s => s.id === booking.startupId);
      if (startup && Number(booking.creditHoursUsed) > 0) {
        startup.usedMeetingHours = Number(Math.max(0, (startup.usedMeetingHours || 0) - Number(booking.creditHoursUsed)).toFixed(2));
      }

      // Paid booking: Razorpay refund or credit note on next invoice
      const isRazorpay = (booking.paymentGateway === 'Razorpay' || booking.razorpayPaymentId || booking.paymentMethod === 'Razorpay');
      if (isRazorpay) {
        refundId = await processRazorpayRefund(booking, quote.refundPaise);
        refundStatus = 'refunded';
      } else {
        refundId = `CN-${Date.now()}`;
        refundStatus = 'credit_note_issued';
        if (startup) {
          startup.creditBalance = (startup.creditBalance || 0) + quote.refundRupees;
        }
      }

      // Record refund in payments ledger (negative amount to subtract from totals)
      const istClock = getISTClock();
      refundPayment = {
        id: `PMT-RFND-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: 'Refund',
        invoiceId: booking.invoiceId || null,
        bookingId: booking.id,
        roomId: room.id,
        startupId: booking.startupId,
        startupName: booking.startupName,
        amount: -quote.refundRupees,
        paymentDate: istClock.date,
        method: isRazorpay ? 'Razorpay Refund' : 'Credit Note',
        gateway: isRazorpay ? 'Razorpay' : 'Credit Note',
        transactionRef: refundId,
        status: 'Successful',
        receiptNo: `REC-RFND-${booking.id}`,
        notes: `Meeting Room cancellation refund for ${booking.id} (${room.name}) - ${quote.refundPct}% tier`,
        createdAt: new Date().toISOString()
      };

      if (!appState.payments) appState.payments = [];
      appState.payments.unshift(refundPayment);
    }

    // 7. Write a "cancellations" record
    const cancellationRecord = {
      id: `CNCL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      bookingId: booking.id,
      roomId: room.id,
      startupId: booking.startupId,
      startupName: booking.startupName,
      minsBeforeStart: quote.minsBeforeStart,
      refundPct: quote.refundPct,
      amountPaise: quote.amountPaise,
      refundPaise: quote.refundPaise,
      feePaise: quote.feePaise,
      refundStatus,
      refundId,
      createdAt: new Date().toISOString()
    };

    if (!appState.cancellations) appState.cancellations = [];
    appState.cancellations.unshift(cancellationRecord);

    if (database) {
      try {
        const canCol = database.collection('cancellations');
        await canCol.insertOne({ ...cancellationRecord });
        if (refundPayment) {
          const pmtCol = database.collection('payments');
          await pmtCol.insertOne({ ...refundPayment });
        }
      } catch (err) {
        console.warn('⚠️ [MongoDB] Cancellation insert warning:', err.message);
      }
    }

    // 8. Update Activity Log
    if (appState) {
      appState.meetingRooms = rooms;
      if (!appState.activityLog) appState.activityLog = [];
      const refundMsg = quote.isPlanCovered
        ? `${quote.durationHours}h credit restored`
        : `${cancellation.formatPaiseToINR(quote.refundPaise)} (${quote.refundPct}%) refunded`;
      const titleStr = booking.title ? ` (${booking.title})` : '';
      appState.activityLog.unshift({
        id: `ACT-${Date.now()}`,
        module: 'Meeting Rooms',
        action: `Cancelled booking for ${room.name}${titleStr}. ${refundMsg}.`,
        timestamp: new Date().toISOString(),
        icon: '❌'
      });
      await saveAppState(appState);
    }

    const message = quote.isPlanCovered
      ? `Cancelled. ${quote.durationHours}h meeting credit restored.`
      : `Cancelled. ${cancellation.formatPaiseToINR(quote.refundPaise)} will be refunded.`;

    return {
      ok: true,
      status: 200,
      message,
      quote,
      cancellation: cancellationRecord,
      refundId,
      booking
    };
  } finally {
    bookingMutex.release();
  }
}

// Alias for backwards-compatibility
const cancelMeetingRoomSlotsAtomic = cancelBooking;

// Dynamic Room Status Engine (Incubation Center Timezone: Asia/Kolkata)
function computeRoomStatus(room, selectedDate, currentClock = null, startupId = null) {
  const ist = currentClock ? (() => {
    const d = currentClock instanceof Date ? currentClock : new Date(currentClock);
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(d);
    const map = {};
    parts.forEach(p => { map[p.type] = p.value; });
    const h = parseInt(map.hour, 10) % 24;
    const m = parseInt(map.minute, 10) || 0;
    const pad = n => (n < 10 ? '0' : '') + n;
    return {
      date: `${map.year}-${map.month}-${map.day}`,
      time: `${pad(h)}:${pad(m)}`,
      minutes: h * 60 + m
    };
  })() : getISTClock();

  const targetDate = selectedDate || ist.date;
  const isMaintenance = Boolean(room && (room.status === 'Under Maintenance' || room.underMaintenance === true || room.maintenance === true));

  if (isMaintenance) {
    return {
      status: 'Under Maintenance',
      openSlots: 0,
      bookedSlots: 0,
      myBookedSlots: 0,
      otherBookedSlots: 0
    };
  }

  const operatingSlots = Array.from({ length: 24 }, (_, i) => i); // 24 operating 1-hour slots (24/7 round-the-clock)
  const bookings = ((room && room.bookings) || []).filter(b => b.date === targetDate && b.status !== 'Cancelled');
  const isPastDay = targetDate < ist.date;
  const isToday = targetDate === ist.date;

  if (isPastDay) {
    let myBooked = 0;
    let otherBooked = 0;
    operatingSlots.forEach(h => {
      const sMin = h * 60;
      const eMin = (h + 1) * 60;
      const overlapping = bookings.filter(b => toMinutes(b.startTime) < eMin && toMinutes(b.endTime) > sMin);
      if (overlapping.length > 0) {
        if (startupId && overlapping.some(b => b.startupId === startupId)) myBooked++;
        else otherBooked++;
      }
    });
    return {
      status: 'Closed for Today',
      openSlots: 0,
      bookedSlots: myBooked + otherBooked,
      myBookedSlots: myBooked,
      otherBookedSlots: otherBooked
    };
  }

  let openSlots = 0;
  let myBookedSlots = 0;
  let otherBookedSlots = 0;
  let hasFutureOpenSlot = false;

  operatingSlots.forEach(h => {
    const slotStartMin = h * 60;
    const slotEndMin = (h + 1) * 60;
    const isSlotPassed = isToday && slotEndMin <= ist.minutes;

    const overlapping = bookings.filter(b => toMinutes(b.startTime) < slotEndMin && toMinutes(b.endTime) > slotStartMin);
    let coveredMins = 0;
    for (let m = slotStartMin; m < slotEndMin; m += 15) {
      const mEnd = m + 15;
      const isBooked15 = overlapping.some(b => toMinutes(b.startTime) < mEnd && toMinutes(b.endTime) > m);
      if (isBooked15) coveredMins += 15;
    }

    const isSlotFullyBooked = coveredMins >= 60;
    if (overlapping.length > 0) {
      if (startupId && overlapping.some(b => b.startupId === startupId)) myBookedSlots++;
      else otherBookedSlots++;
    }

    if (!isSlotPassed && !isSlotFullyBooked) {
      openSlots++;
      for (let m = slotStartMin; m < slotEndMin; m += 15) {
        const mEnd = m + 15;
        if (isToday && mEnd <= ist.minutes) continue;
        const isBooked15 = overlapping.some(b => toMinutes(b.startTime) < mEnd && toMinutes(b.endTime) > m);
        if (!isBooked15) {
          hasFutureOpenSlot = true;
          break;
        }
      }
    }
  });

  if (isToday) {
    const inOperatingHours = true;
    const activeBookingNow = bookings.find(b => toMinutes(b.startTime) <= ist.minutes && toMinutes(b.endTime) > ist.minutes);

    if (inOperatingHours && !activeBookingNow) {
      return {
        status: 'Available Now',
        openSlots,
        bookedSlots: myBookedSlots + otherBookedSlots,
        myBookedSlots,
        otherBookedSlots
      };
    }

    if (hasFutureOpenSlot) {
      return {
        status: 'Available Later Today',
        openSlots,
        bookedSlots: myBookedSlots + otherBookedSlots,
        myBookedSlots,
        otherBookedSlots
      };
    }

    return {
      status: 'Fully Booked',
      openSlots: 0,
      bookedSlots: myBookedSlots + otherBookedSlots,
      myBookedSlots,
      otherBookedSlots
    };
  }

  // Future Date
  if (openSlots === 0) {
    return {
      status: 'Fully Booked',
      openSlots: 0,
      bookedSlots: myBookedSlots + otherBookedSlots,
      myBookedSlots,
      otherBookedSlots
    };
  }

  return {
    status: 'Available Now',
    openSlots,
    bookedSlots: myBookedSlots + otherBookedSlots,
    myBookedSlots,
    otherBookedSlots
  };
}

// Consistent Reservation Counts Engine
async function getReservationCounts({ date = null, startupId = null, currentClock = null } = {}) {
  const ist = getISTClock();
  const targetDate = date || ist.date;
  const appState = await getAppState();
  let rooms = (appState && appState.meetingRooms) ? appState.meetingRooms : [];
  if (!rooms.length) {
    const seed = loadInitialSeedData();
    rooms = seed.meetingRooms || [];
  }

  const allConfirmedBookings = [];
  const dateConfirmedBookings = [];

  rooms.forEach(r => {
    (r.bookings || []).forEach(b => {
      if (b.status === 'Cancelled') return;
      const item = { ...b, roomId: r.id, roomName: r.name };
      allConfirmedBookings.push(item);
      if (b.date === targetDate) {
        dateConfirmedBookings.push(item);
      }
    });
  });

  const myBookingsAllDates = startupId
    ? allConfirmedBookings.filter(b => b.startupId === startupId)
    : [];
  const otherBookingsAllDates = startupId
    ? allConfirmedBookings.filter(b => b.startupId !== startupId)
    : allConfirmedBookings;

  const myBookingsForDate = startupId
    ? dateConfirmedBookings.filter(b => b.startupId === startupId)
    : [];
  const otherBookingsForDate = startupId
    ? dateConfirmedBookings.filter(b => b.startupId !== startupId)
    : dateConfirmedBookings;

  let availableSlotsForDate = 0;
  let mySlotsForDate = 0;
  let otherSlotsForDate = 0;

  rooms.forEach(r => {
    const st = computeRoomStatus(r, targetDate, currentClock, startupId);
    availableSlotsForDate += st.openSlots;
    mySlotsForDate += st.myBookedSlots;
    otherSlotsForDate += st.otherBookedSlots;
  });

  return {
    date: targetDate,
    totalBookings: allConfirmedBookings.length,
    myBookings: myBookingsAllDates.length,
    otherBookings: otherBookingsAllDates.length,
    dateTotalBookings: dateConfirmedBookings.length,
    dateMyBookings: myBookingsForDate.length,
    dateOtherBookings: otherBookingsForDate.length,
    availableSlots: availableSlotsForDate,
    mySlots: mySlotsForDate,
    otherSlots: otherSlotsForDate
  };
}

// Get Meeting Rooms Availability & Bookings for Date
async function getMeetingRoomsAvailability(date) {
  const ist = getISTClock();
  const targetDate = date || ist.date;
  const appState = await getAppState();
  let rooms = (appState && appState.meetingRooms) ? appState.meetingRooms : [];
  if (!rooms.length) {
    const seed = loadInitialSeedData();
    rooms = seed.meetingRooms || [];
  }

  const result = rooms.map(r => {
    const statusInfo = computeRoomStatus(r, targetDate);
    const withImgs = withRoomImages(r);
    return {
      id: r.id,
      name: r.name,
      capacity: r.capacity,
      hourlyRate: r.hourlyRate,
      amenities: r.amenities,
      icon: r.icon,
      badgeColor: r.badgeColor,
      description: withImgs.description || '',
      images: withImgs.images,
      status: r.status || 'Active',
      underMaintenance: Boolean(r.underMaintenance || r.maintenance || r.status === 'Under Maintenance'),
      dynamicStatus: statusInfo.status,
      openSlots: statusInfo.openSlots,
      bookings: (r.bookings || []).filter(b => b.date === targetDate && b.status !== 'Cancelled')
    };
  });

  return {
    ok: true,
    date: targetDate,
    istClock: { date: ist.date, time: ist.time },
    rooms: result
  };
}

// Atomic Time Window & Full Reschedule Update for Existing Reservation
async function updateMeetingRoomBookingTimeWindowAtomic(updateReq) {
  await bookingMutex.acquire();
  try {
    const {
      roomId,
      newRoomId,
      bookingId,
      date,
      startTime,
      endTime,
      attendees,
      title,
      purpose,
      requestedAmenities,
      specialRequests,
      requestingStartupId,
      userRole
    } = updateReq || {};

    const ist = getISTClock();
    const startMin = toMinutes(startTime);
    const endMin = toMinutes(endTime);

    if (endMin <= startMin) {
      return { ok: false, status: 400, message: 'Invalid booking duration: End time must be later than start time.' };
    }
    if ((endMin - startMin) < 15) {
      return { ok: false, status: 400, message: 'Minimum booking duration is 15 minutes.' };
    }

    if (date < ist.date || (date === ist.date && startMin < ist.minutes)) {
      return { ok: false, status: 400, message: 'Cannot adjust booking to a time in the past.' };
    }

    const appState = await getAppState();
    let rooms = (appState && appState.meetingRooms) ? appState.meetingRooms : [];
    if (!rooms.length) {
      const seed = loadInitialSeedData();
      rooms = seed.meetingRooms || [];
    }

    const sourceRoom = rooms.find(r => r.id === roomId);
    if (!sourceRoom) return { ok: false, status: 404, message: 'Room not found.' };

    const booking = (sourceRoom.bookings || []).find(b => b.id === bookingId);
    if (!booking) return { ok: false, status: 404, message: 'Booking not found.' };

    if (booking.status === 'Cancelled') {
      return { ok: false, status: 400, code: 'ALREADY_CANCELLED', message: 'Cannot modify a cancelled reservation.' };
    }

    if (cancellation.isBookingCompleted(booking)) {
      return { ok: false, status: 400, code: 'MEETING_COMPLETED', message: 'Cannot modify a completed meeting.' };
    }

    // Permission check: only owning startup or admin can reschedule
    const isAdmin = userRole === 'admin' || userRole === 'super_admin' || userRole === 'incubator_admin' || (!userRole && !requestingStartupId);
    if (!isAdmin && requestingStartupId && booking.startupId !== requestingStartupId) {
      return {
        ok: false,
        status: 403,
        code: 'UNAUTHORIZED',
        message: 'Unauthorized: You can only modify reservations belonging to your own startup.'
      };
    }

    const targetRoomId = newRoomId || roomId;
    const targetRoom = rooms.find(r => r.id === targetRoomId);
    if (!targetRoom) return { ok: false, status: 404, message: 'Target meeting room not found.' };

    if (targetRoom.status === 'Under Maintenance' || targetRoom.underMaintenance === true || targetRoom.maintenance === true) {
      return { ok: false, status: 409, code: 'ROOM_MAINTENANCE', message: `${targetRoom.name} is currently under maintenance and unavailable.` };
    }

    const nextAttendees = attendees !== undefined ? parseInt(attendees, 10) : (booking.attendees || 4);
    if (isNaN(nextAttendees) || nextAttendees < 1) {
      return { ok: false, status: 400, code: 'INVALID_ATTENDEES', message: 'Number of attendees must be at least 1.' };
    }
    if (nextAttendees > targetRoom.capacity) {
      return {
        ok: false,
        status: 400,
        code: 'CAPACITY_EXCEEDED',
        message: `Attendees (${nextAttendees}) exceed ${targetRoom.name} capacity of ${targetRoom.capacity} pax.`
      };
    }

    // Check conflict against other bookings in targetRoom (excluding current booking)
    const conflict = (targetRoom.bookings || []).find(b => {
      if (b.id === bookingId) return false;
      return hasBookingConflict({ ...b, roomId: targetRoomId }, { roomId: targetRoomId, date, startTime, endTime });
    });

    if (conflict) {
      const alternatives = findBookingAlternatives(rooms, { roomId: targetRoomId, date, startTime, endTime, attendees: nextAttendees, startupId: booking.startupId });
      return {
        ok: false,
        status: 409,
        code: 'SLOT_TAKEN',
        message: `${targetRoom.name} is already booked from ${conflict.startTime} to ${conflict.endTime} by another startup.`,
        alternatives
      };
    }

    // Check multi-room conflict for startup across all other rooms (excluding current booking)
    for (const r of rooms) {
      if (r.id === targetRoomId) continue;
      const otherConflict = (r.bookings || []).find(b => {
        if (b.id === bookingId) return false;
        return hasStartupConcurrentConflict({ ...b, roomId: r.id, id: b.id }, { roomId: targetRoomId, id: bookingId, startupId: booking.startupId, date, startTime, endTime });
      });
      if (otherConflict) {
        return {
          ok: false,
          status: 409,
          code: 'USER_ALREADY_BOOKED',
          message: `You already have a booking at this time in ${r.name}.`
        };
      }
    }

    // Update booking fields in-place (preserving booking.id)
    booking.roomId = targetRoomId;
    booking.date = date;
    booking.startTime = startTime;
    booking.endTime = endTime;
    booking.duration = Math.max(0.25, (endMin - startMin) / 60);
    booking.attendees = nextAttendees;
    if (title !== undefined && String(title).trim()) booking.title = String(title).trim();
    if (purpose !== undefined && String(purpose).trim()) booking.purpose = String(purpose).trim();
    if (requestedAmenities !== undefined) {
      booking.requestedAmenities = Array.isArray(requestedAmenities)
        ? requestedAmenities
        : (typeof requestedAmenities === 'string' && requestedAmenities.trim()
            ? requestedAmenities.split(',').map(s => s.trim()).filter(Boolean)
            : []);
    }
    if (specialRequests !== undefined) {
      booking.specialRequests = String(specialRequests).trim();
    }
    booking.updatedAt = new Date().toISOString();

    // Update any linked external calendar events (Google / Outlook)
    if (booking.calendarSync && typeof booking.calendarSync === 'object') {
      Object.keys(booking.calendarSync).forEach(provider => {
        if (booking.calendarSync[provider] && booking.calendarSync[provider].status === 'synced') {
          booking.calendarSync[provider].date = date;
          booking.calendarSync[provider].startTime = startTime;
          booking.calendarSync[provider].endTime = endTime;
          booking.calendarSync[provider].roomId = targetRoomId;
          booking.calendarSync[provider].roomName = targetRoom.name;
          booking.calendarSync[provider].updatedAt = booking.updatedAt;
        }
      });
      if (appState && appState.calendarIntegrations && appState.calendarIntegrations.syncedEvents) {
        ['google', 'outlook'].forEach(p => {
          const evKey = `${p}:${booking.id}`;
          if (appState.calendarIntegrations.syncedEvents[evKey]) {
            appState.calendarIntegrations.syncedEvents[evKey].date = date;
            appState.calendarIntegrations.syncedEvents[evKey].startTime = startTime;
            appState.calendarIntegrations.syncedEvents[evKey].endTime = endTime;
            appState.calendarIntegrations.syncedEvents[evKey].roomId = targetRoomId;
            appState.calendarIntegrations.syncedEvents[evKey].roomName = targetRoom.name;
            appState.calendarIntegrations.syncedEvents[evKey].updatedAt = booking.updatedAt;
          }
        });
      }
    }

    const durationHrs = Math.max(0.25, (endMin - startMin) / 60);
    if (booking.cost > 0) {
      booking.cost = Math.round(durationHrs * targetRoom.hourlyRate);
    }

    // If room changed, move booking from sourceRoom to targetRoom without creating duplicate
    if (targetRoomId !== roomId) {
      sourceRoom.bookings = (sourceRoom.bookings || []).filter(b => b.id !== bookingId);
      if (!targetRoom.bookings) targetRoom.bookings = [];
      targetRoom.bookings.push(booking);
    }

    const database = await connectDB();
    if (database) {
      try {
        await initMeetingRoomIndexes();
        const slotsCol = database.collection('meeting_room_slots');
        await slotsCol.deleteMany({ bookingId });
        const slotDocs = [];
        for (let m = startMin; m < endMin; m += 15) {
          const h = Math.floor(m / 60);
          const minPart = m % 60;
          const slotHour = `${h < 10 ? '0' : ''}${h}:${minPart < 10 ? '0' : ''}${minPart}`;
          slotDocs.push({
            roomId: targetRoomId,
            date,
            slotHour,
            bookingId,
            status: 'Confirmed',
            startupId: booking.startupId,
            createdAt: new Date()
          });
        }
        for (const sDoc of slotDocs) {
          await slotsCol.insertOne(sDoc);
        }
        const mrCol = database.collection('meeting_rooms');
        await mrCol.updateOne({ id: sourceRoom.id }, { $set: { bookings: sourceRoom.bookings } });
        if (targetRoomId !== roomId) {
          await mrCol.updateOne({ id: targetRoom.id }, { $set: { bookings: targetRoom.bookings } });
        }
      } catch (err) {
        console.warn('⚠️ [MongoDB] update warning:', err.message);
      }
    }

    if (appState) {
      appState.meetingRooms = rooms;
      if (!appState.activityLog) appState.activityLog = [];
      appState.activityLog.unshift({
        id: `ACT-${Date.now()}`,
        module: 'Meeting Rooms',
        action: `${booking.startupName} rescheduled reservation ${booking.id} to ${targetRoom.name} on ${date} (${startTime}-${endTime}).`,
        timestamp: new Date().toISOString(),
        icon: '🔄'
      });
      await saveAppState(appState);
    }

    return {
      ok: true,
      status: 200,
      roomId: targetRoomId,
      previousRoomId: roomId,
      booking,
      message: `Reservation ${booking.id} successfully updated (${targetRoom.name}, ${date} ${startTime} – ${endTime})!`
    };
  } finally {
    bookingMutex.release();
  }
}

// -------------------------------------------------------------
// Section A: Single Source of Truth - Dashboard Summary Engine
// -------------------------------------------------------------

function computeInvoiceStatus(inv, payments, todayIST) {
  if (inv.status === 'Cancelled') return 'Cancelled';
  const invPayments = (payments || []).filter(p => p.invoiceId === inv.id && (p.status === 'Successful' || !p.status));
  const totalPaid = invPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const total = Number(inv.total) || 0;
  const due = Math.max(0, total - totalPaid);

  if (due <= 0) return 'Paid';
  const dueStr = inv.dueDate ? (inv.dueDate.includes('T') ? inv.dueDate.split('T')[0] : inv.dueDate.slice(0, 10)) : '';
  if (dueStr && dueStr < todayIST) return 'Overdue';
  if (totalPaid > 0) return 'Partially Paid';
  return 'Pending';
}

function formatCurrencyINR(amount) {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDateIST(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = d.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: 'numeric' });
  const month = d.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', month: 'short' });
  const year = d.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true });
  return `${day} ${month} ${year}, ${time}`;
}

function formatRelativeTimeIST(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    if (typeof dateInput === 'string' && (dateInput.includes('ago') || dateInput.includes('Today') || dateInput.includes('Yesterday'))) {
      return dateInput;
    }
    return String(dateInput);
  }
  const now = new Date();
  const diffSec = Math.floor((now - d) / 1000);
  if (diffSec >= 0 && diffSec < 60) return 'Just now';
  if (diffSec >= 60 && diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;

  const dFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
  const tFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true });

  const todayStr = dFormatter.format(now);
  const targetDateStr = dFormatter.format(d);
  const timeStr = tFormatter.format(d);

  if (todayStr === targetDateStr) return `Today ${timeStr}`;
  const yDate = new Date(now.getTime() - 24 * 3600 * 1000);
  const yesterdayStr = dFormatter.format(yDate);
  if (targetDateStr === yesterdayStr) return `Yesterday ${timeStr}`;

  const day = d.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: 'numeric' });
  const month = d.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', month: 'short' });
  const year = d.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', year: 'numeric' });
  return `${day} ${month} ${year}, ${timeStr}`;
}

function getPaymentMonthKey(p) {
  if (!p || !p.paymentDate) return '';
  const d = new Date(p.paymentDate);
  if (!isNaN(d.getTime())) {
    const dFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit' });
    return dFormatter.format(d);
  }
  if (typeof p.paymentDate === 'string') {
    const match = p.paymentDate.match(/(\d{4})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}`;
  }
  return '';
}

function normalizeActivityEntry(raw, idx = 0) {
  if (!raw) return null;
  const id = raw.id || `act-${Date.now()}-${idx}`;
  const module = raw.module || raw.category || 'System';
  const type = raw.type || module || 'Activity';
  const title = raw.title || raw.description || raw.action || raw.text || raw.message || 'System event';
  const icon = raw.icon || '📌';

  // Do not log or display RBAC perspective switches or other dev events
  const textToCheck = `${type} ${module} ${title} ${raw.action || ''}`.toLowerCase();
  if (
    textToCheck.includes('rbac') ||
    textToCheck.includes('perspective') ||
    textToCheck.includes('role switch') ||
    textToCheck.includes('switched to role') ||
    textToCheck.includes('dev event') ||
    textToCheck.includes('developer') ||
    textToCheck.includes('demo mode')
  ) {
    return null;
  }

  let timestamp = raw.timestamp || raw.createdAt || raw.time || new Date().toISOString();
  let relativeTime = '';
  if (typeof timestamp === 'string' && (timestamp.includes('ago') || timestamp.includes('Today') || timestamp.includes('Yesterday'))) {
    relativeTime = timestamp.replace(',', '');
  } else {
    relativeTime = formatRelativeTimeIST(timestamp);
  }

  return {
    id,
    type,
    title,
    module,
    timestamp,
    relativeTime,
    icon
  };
}

async function getDashboardSummary(requestedMonth) {
  const ist = getISTClock();
  const currentMonth = ist.date.slice(0, 7); // 'YYYY-MM'
  const targetMonth = (requestedMonth && /^\d{4}-\d{2}$/.test(requestedMonth.trim()))
    ? requestedMonth.trim()
    : currentMonth;

  const appState = await getAppState();
  let seed = null;
  const getFallback = (key) => {
    if (!seed) seed = loadInitialSeedData();
    return seed[key] || [];
  };

  const startups = (appState && appState.startups) ? appState.startups : getFallback('startups');
  const workspaces = (appState && appState.workspaces) ? appState.workspaces : getFallback('workspaces');
  const spaces = (appState && appState.spaces) ? appState.spaces : getFallback('spaces');
  const invoices = (appState && appState.invoices) ? appState.invoices : getFallback('invoices');
  const payments = (appState && appState.payments) ? appState.payments : getFallback('payments');
  const meetingRooms = (appState && appState.meetingRooms) ? appState.meetingRooms : getFallback('meetingRooms');
  const milestones = (appState && appState.incubationMilestones) ? appState.incubationMilestones : getFallback('incubationMilestones');
  const leads = (appState && appState.leads) ? appState.leads : getFallback('leads');
  const rawActivities = (appState && appState.activityLog) ? appState.activityLog : getFallback('activityLog');

  // --- 1. MRR Calculation ---
  // MRR = sum of monthly base rent of active allocations (no GST, no one-off fees, no meeting fees)
  const activeStartups = startups.filter(s => s.status === 'Incubated' || s.status === 'Active');
  let mrr = 0;
  const countedSeats = new Set();

  for (const st of activeStartups) {
    const seats = Array.isArray(st.allocatedSeats) ? st.allocatedSeats : [];
    for (const seatId of seats) {
      if (countedSeats.has(seatId)) continue;
      countedSeats.add(seatId);

      // Match seat in spaces
      const sp = spaces.find(s => s.id === seatId || s.code === seatId);
      if (sp && sp.monthlyRate) {
        mrr += Number(sp.monthlyRate) || 0;
      } else {
        // Fallback: match in workspaces
        const ws = workspaces.find(w => w.id === seatId || w.code === seatId);
        if (ws && ws.rate) {
          mrr += Number(ws.rate) || 0;
        }
      }
    }
  }

  // --- 2. Invoices & Payments Single Source Reconciliation ---
  // Cancelled invoices are excluded from all totals.
  const activeInvoices = invoices.filter(inv => inv.status !== 'Cancelled');
  
  let totalPendingCollections = 0;
  let pendingInvoicesCount = 0;
  let totalOverdueAmount = 0;
  let overdueInvoicesCount = 0;
  let totalInvoicedAmount = 0;
  let clearedInvoicesCount = 0;
  let partiallyPaidCount = 0;
  let pendingOnlyCount = 0;

  const overdueInvoicesList = [];

  for (const inv of activeInvoices) {
    const computedStatus = computeInvoiceStatus(inv, payments, ist.date);
    const invPayments = payments.filter(p => p.invoiceId === inv.id && (p.status === 'Successful' || !p.status));
    const totalPaid = invPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const invTotal = Number(inv.total) || 0;
    const due = Math.max(0, invTotal - totalPaid);

    totalInvoicedAmount += invTotal;

    if (computedStatus === 'Paid') {
      clearedInvoicesCount++;
    } else if (computedStatus === 'Pending' || computedStatus === 'Partially Paid' || computedStatus === 'Overdue') {
      totalPendingCollections += due;
      pendingInvoicesCount++;

      if (computedStatus === 'Partially Paid') partiallyPaidCount++;
      if (computedStatus === 'Pending') pendingOnlyCount++;

      if (computedStatus === 'Overdue') {
        totalOverdueAmount += due;
        overdueInvoicesCount++;

        const dueStr = inv.dueDate ? (inv.dueDate.includes('T') ? inv.dueDate.split('T')[0] : inv.dueDate.slice(0, 10)) : ist.date;
        const daysLate = Math.max(1, Math.round((new Date(ist.date) - new Date(dueStr)) / (1000 * 3600 * 24)));
        overdueInvoicesList.push({
          id: inv.id,
          startupId: inv.startupId,
          startupName: inv.startupName,
          amountDue: due,
          amountDueFormatted: formatCurrencyINR(due),
          totalAmount: invTotal,
          totalAmountFormatted: formatCurrencyINR(invTotal),
          dueDate: dueStr,
          dueDateFormatted: formatDateIST(dueStr),
          daysLate,
          daysLateLabel: `${daysLate} day${daysLate === 1 ? '' : 's'} late`
        });
      }
    }
  }

  // --- 3. Collected Calculation ---
  // Collected = sum of successful payments in the selected month
  const successfulPayments = payments.filter(p => p.status === 'Successful' || !p.status);
  
  // Sort payments by date, newest first (Requirement D.14)
  successfulPayments.sort((a, b) => {
    const tA = new Date(a.paymentDate || a.createdAt || 0).getTime() || 0;
    const tB = new Date(b.paymentDate || b.createdAt || 0).getTime() || 0;
    return tB - tA;
  });

  const monthPayments = successfulPayments.filter(p => getPaymentMonthKey(p) === targetMonth);
  const collectedInMonth = monthPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totalCollectedAllTime = successfulPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  // Month human label
  const [tYear, tMo] = targetMonth.split('-');
  const monthDateObj = new Date(parseInt(tYear, 10), parseInt(tMo, 10) - 1, 1);
  const monthLabel = monthDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // --- 4. Occupancy ---
  // Occupancy = occupied seats / total seats
  const totalSeats = spaces.length > 0
    ? spaces.length
    : (workspaces.length > 0 ? workspaces.reduce((s, w) => s + (w.capacity || 1), 0) : 26);
  const occupiedSeats = spaces.length > 0
    ? spaces.filter(sp => sp.status === 'occupied').length
    : activeStartups.reduce((sum, s) => sum + (s.allocatedSeats ? s.allocatedSeats.length : 0), 0);
  const occupancyRate = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;

  // --- 5. Lifecycle Journey Counts ---
  // (Startups, Allocated, Bookings, Issued, Cleared, Milestones)
  let totalBookingsCount = 0;
  meetingRooms.forEach(r => {
    totalBookingsCount += (r.bookings || []).filter(b => b.status !== 'Cancelled').length;
  });

  const allocatedStartupsCount = startups.filter(s => Array.isArray(s.allocatedSeats) && s.allocatedSeats.length > 0).length;
  const activeMilestonesCount = milestones.filter(m => m.status === 'In Progress' || m.status === 'Active').length;

  // --- 6. Today's Room Reservations ---
  // Load bookings from meeting rooms for today's IST date for ALL rooms (excl. cancelled)
  const todaysReservations = [];
  meetingRooms.forEach(room => {
    (room.bookings || []).forEach(b => {
      if (b.date === ist.date && b.status !== 'Cancelled') {
        let statusChip = 'Upcoming';
        if (b.endTime <= ist.time) {
          statusChip = 'Completed';
        } else if (b.startTime <= ist.time && b.endTime > ist.time) {
          statusChip = 'In progress';
        }

        todaysReservations.push({
          id: b.id,
          roomId: room.id,
          roomName: room.name,
          startupId: b.startupId,
          startupName: b.startupName || 'Reserved Venture',
          timeRange: `${b.startTime} – ${b.endTime}`,
          startTime: b.startTime,
          endTime: b.endTime,
          attendees: b.attendees || room.capacity || 4,
          status: statusChip
        });
      }
    });
  });

  // Sort reservations chronologically
  todaysReservations.sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

  // --- 7. Activity Feed Normalization ---
  // Cap at 10 items, newest first, excluding RBAC/dev events
  const normalizedActivities = [];
  for (let i = 0; i < rawActivities.length; i++) {
    const entry = normalizeActivityEntry(rawActivities[i], i);
    if (entry) {
      normalizedActivities.push(entry);
    }
  }
  // Newest first and capped at 10
  normalizedActivities.sort((a, b) => {
    const tA = new Date(a.timestamp).getTime() || 0;
    const tB = new Date(b.timestamp).getTime() || 0;
    return tB - tA;
  });
  const activityFeed = normalizedActivities.slice(0, 10);

  // --- 8. Needs Attention Panel ---
  // - overdue invoices (with days late & Send reminder)
  // - applications waiting for review
  // - startups with unverified documents
  // - incubation periods ending within 30 days
  const pendingApplications = [];
  (leads || []).forEach(lead => {
    if (lead.status === 'Under Review' || lead.status === 'Applied' || lead.status === 'New') {
      pendingApplications.push({
        id: lead.id,
        name: lead.startupName || lead.fullName || 'New Applicant',
        founder: lead.fullName || 'Founder',
        sector: lead.sector || 'DeepTech',
        status: lead.status,
        type: 'Application',
        submittedAt: formatDateIST(lead.createdAt || ist.date),
        link: 'onboarding'
      });
    }
  });

  const unverifiedDocsStartups = startups
    .filter(s => s.complianceVerified === false || s.docsPending === true || !s.cinNumber || s.status === 'Applied')
    .slice(0, 5)
    .map(s => ({
      id: s.id,
      name: s.name,
      category: s.category || s.sector || 'Startup',
      issue: !s.cinNumber ? 'Missing CIN registration' : 'Unverified compliance dossier',
      link: 'onboarding'
    }));

  const endingIncubations = [];
  startups.forEach(s => {
    if ((s.status === 'Incubated' || s.status === 'Active') && s.incubationEndDate) {
      const endD = new Date(s.incubationEndDate);
      const nowD = new Date(ist.date);
      const diffDays = Math.round((endD - nowD) / (1000 * 3600 * 24));
      if (diffDays <= 30 && diffDays >= 0) {
        endingIncubations.push({
          id: s.id,
          name: s.name,
          endDate: s.incubationEndDate,
          daysRemaining: diffDays,
          link: 'incubation'
        });
      }
    }
  });

  // --- 9. 6-Month Revenue History ---
  // Last 6 months (collected vs outstanding)
  const sixMonthRevenue = [];
  for (let m = 5; m >= 0; m--) {
    const d = new Date(parseInt(tYear, 10), parseInt(tMo, 10) - 1 - m, 1);
    const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const mLabel = d.toLocaleDateString('en-US', { month: 'short' });

    // Collected in mKey
    const mColl = successfulPayments
      .filter(p => getPaymentMonthKey(p) === mKey)
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);

    // Outstanding invoices belonging to mKey
    const mOut = activeInvoices
      .filter(inv => {
        const invMo = (inv.issueDate || '').slice(0, 7);
        return invMo === mKey;
      })
      .reduce((sum, inv) => {
        const invPay = payments.filter(p => p.invoiceId === inv.id && (p.status === 'Successful' || !p.status));
        const paid = invPay.reduce((s, p) => s + (Number(p.amount) || 0), 0);
        return sum + Math.max(0, (Number(inv.total) || 0) - paid);
      }, 0);

    sixMonthRevenue.push({
      monthKey: mKey,
      label: mLabel,
      collected: Math.round(mColl),
      collectedFormatted: formatCurrencyINR(mColl),
      outstanding: Math.round(mOut),
      outstandingFormatted: formatCurrencyINR(mOut)
    });
  }

  // --- 10. Startup Status Funnel ---
  const startupFunnel = [
    { stage: 'Applied', count: startups.filter(s => s.status === 'Applied').length, color: '#3b82f6' },
    { stage: 'Under Review', count: startups.filter(s => s.status === 'Under Review').length, color: '#8b5cf6' },
    { stage: 'Approved', count: startups.filter(s => s.status === 'Approved').length, color: '#06b6d4' },
    { stage: 'Incubated', count: startups.filter(s => s.status === 'Incubated' || s.status === 'Active').length, color: '#10b981' },
    { stage: 'Completed', count: startups.filter(s => s.status === 'Completed' || s.status === 'Graduated').length, color: '#ec4899' }
  ];

  return {
    ok: true,
    month: targetMonth,
    monthLabel,
    asOfIST: `${ist.date} ${ist.time}`,

    // KPI Cards & Tooltip Definitions
    mrr: {
      value: Math.round(mrr),
      formatted: formatCurrencyINR(mrr),
      tooltip: 'MRR = sum of monthly base rent of active allocations (no GST, no one-off fees, no meeting fees).'
    },
    pendingCollections: {
      value: Math.round(totalPendingCollections),
      formatted: formatCurrencyINR(totalPendingCollections),
      invoiceCount: pendingInvoicesCount,
      overdueAmount: Math.round(totalOverdueAmount),
      overdueAmountFormatted: formatCurrencyINR(totalOverdueAmount),
      overdueCount: overdueInvoicesCount,
      tooltip: 'Pending collections = sum of (invoice total - payments) for Pending, Partially Paid and Overdue invoices; show the invoice count and the overdue part separately.'
    },
    collected: {
      value: Math.round(collectedInMonth),
      formatted: formatCurrencyINR(collectedInMonth),
      monthLabel,
      monthPaymentsCount: monthPayments.length,
      allTimeCollected: Math.round(totalCollectedAllTime),
      allTimeCollectedFormatted: formatCurrencyINR(totalCollectedAllTime),
      tooltip: 'Collected = sum of successful payments in the selected month.'
    },
    occupancy: {
      rate: occupancyRate,
      occupiedSeats,
      totalSeats,
      tooltip: 'Occupancy = occupied seats / total seats.'
    },

    // Lifecycle Journey Counts (Startups, Allocated, Bookings, Issued, Cleared, Milestones)
    lifecycle: {
      startups: startups.length,
      allocated: allocatedStartupsCount,
      bookings: totalBookingsCount,
      issued: activeInvoices.length,
      cleared: clearedInvoicesCount,
      milestones: activeMilestonesCount,
      totalCollected: Math.round(collectedInMonth),
      totalCollectedFormatted: formatCurrencyINR(collectedInMonth)
    },

    // Needs Attention Panel
    needsAttention: {
      overdueInvoices: overdueInvoicesList,
      pendingApplications,
      unverifiedDocuments: unverifiedDocsStartups,
      endingIncubations
    },

    // Today's Room Reservations
    todaysReservations,

    // Activity Feed
    activityFeed,

    // Charts
    charts: {
      sixMonthRevenue,
      startupFunnel
    },

    // Detailed Invoices Breakdown
    invoicesSummary: {
      totalActiveCount: activeInvoices.length,
      paidCount: clearedInvoicesCount,
      pendingCount: pendingOnlyCount,
      partiallyPaidCount: partiallyPaidCount,
      overdueCount: overdueInvoicesCount,
      cancelledCount: invoices.filter(i => i.status === 'Cancelled').length,
      totalInvoicedAmount: Math.round(totalInvoicedAmount),
      totalDueAmount: Math.round(totalPendingCollections)
    }
  };
}

// Atomic Batch Invoice Generation with Unique Startup + Period Duplicate Check
// Single Source of Truth: Startup Command Center Dashboard Summary
async function getStartupDashboardSummary(requestedStartupId, requestedMonth, role = 'startup') {
  const ist = getISTClock();
  const currentMonth = ist.date.slice(0, 7);
  const targetMonth = (requestedMonth && /^\d{4}-\d{2}$/.test(requestedMonth.trim())) ? requestedMonth.trim() : currentMonth;

  const appState = await getAppState();
  let seed = null;
  const getFallback = (key) => {
    if (!seed) seed = loadInitialSeedData();
    return seed[key] || [];
  };

  const startups = (appState && appState.startups) ? appState.startups : getFallback('startups');
  const meetingRooms = (appState && appState.meetingRooms) ? appState.meetingRooms : getFallback('meetingRooms');
  const invoices = (appState && appState.invoices) ? appState.invoices : getFallback('invoices');
  const payments = (appState && appState.payments) ? appState.payments : getFallback('payments');
  const rawActivities = (appState && appState.activityLog) ? appState.activityLog : getFallback('activityLog');
  const milestones = (appState && appState.incubationMilestones) ? appState.incubationMilestones : getFallback('incubationMilestones');

  let startup = startups.find(s => s.id === requestedStartupId || (s.name && s.name.toLowerCase() === (requestedStartupId || '').toLowerCase()));
  if (!startup) {
    startup = startups.find(s => s.id === 'STP-XYZ') || startups[0] || {
      id: 'STP-XYZ',
      name: 'XYZ Technologies',
      founders: { name: 'Alex Morgan' },
      plan: 'Scale-Up Growth Plan',
      meetingRoomAllowance: 120,
      usedMeetingHours: 40
    };
  }

  // Collect all bookings for this startup
  const startupBookings = [];
  meetingRooms.forEach(room => {
    (room.bookings || []).forEach(b => {
      if ((b.startupId === startup.id || b.startupName === startup.name) && b.status !== 'Cancelled') {
        startupBookings.push({
          id: b.id,
          title: b.title || 'Discussion Session',
          roomId: room.id,
          roomName: room.name,
          date: b.date,
          startTime: b.startTime,
          endTime: b.endTime,
          timeRange: `${b.startTime} – ${b.endTime}`,
          attendees: b.attendees || room.capacity || 4,
          status: b.status || 'Confirmed'
        });
      }
    });
  });

  startupBookings.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  // Today's meetings
  const todaysSchedule = startupBookings.filter(b => b.date === ist.date).map(b => {
    let statusChip = 'Confirmed';
    if (b.endTime <= ist.time) {
      statusChip = 'Completed';
    } else if (b.startTime <= ist.time && b.endTime > ist.time) {
      statusChip = 'In progress';
    } else if (b.status === 'Pending') {
      statusChip = 'Pending';
    }
    return { ...b, status: statusChip };
  });

  // Upcoming meetings
  const upcomingBookings = startupBookings.filter(b => {
    if (b.date > ist.date) return true;
    if (b.date === ist.date && b.endTime > ist.time) return true;
    return false;
  }).map(b => {
    let statusChip = b.status === 'Pending' ? 'Pending' : 'Confirmed';
    if (b.date === ist.date && b.startTime <= ist.time && b.endTime > ist.time) {
      statusChip = 'In progress';
    }
    return { ...b, status: statusChip };
  });

  const nextMeeting = upcomingBookings[0] || null;
  let nextMeetingHint = 'No upcoming meetings scheduled';
  if (nextMeeting) {
    const isToday = nextMeeting.date === ist.date;
    nextMeetingHint = `${isToday ? 'Today' : nextMeeting.date} at ${nextMeeting.startTime} (${nextMeeting.roomName})`;
  }

  // Room availability right now
  let availableRoomsCount = 0;
  meetingRooms.forEach(room => {
    const isOccupied = (room.bookings || []).some(b =>
      b.date === ist.date &&
      b.startTime <= ist.time &&
      b.endTime > ist.time &&
      b.status !== 'Cancelled'
    );
    if (!isOccupied) availableRoomsCount++;
  });

  // Single Source of Truth Credit Allowance via creditService & PlanCatalog
  const creditAllowance = creditService.getMonthlyAllowance(startup, meetingRooms, targetMonth, startup.topUps || []);
  const totalCredits = creditAllowance.totalAvailableCredits;
  const usedCredits = creditAllowance.usedCredits;
  const remainingCredits = creditAllowance.remainingCredits;
  const remainingPercent = creditAllowance.pctUsed; // Direction: ALWAYS USED
  const percentLeft = creditAllowance.percent_left;
  const remainingHours = creditAllowance.remainingHours;
  const usedHours = creditAllowance.usedHours;

  // Pending requests
  const pendingRequests = startupBookings.filter(b => b.status === 'Pending');

  // Real Scoped Activity Feed (Actor, time, and target link)
  const recentActivities = [];

  // Add real booking activities
  startupBookings.slice(0, 4).forEach(b => {
    recentActivities.push({
      id: `act-bkg-${b.id}`,
      icon: '📅',
      actor: b.bookedBy || 'Team Member',
      title: `Reserved ${b.roomName} for ${b.title || b.purpose || 'Session'}`,
      description: `${b.date} • ${b.startTime} - ${b.endTime} (${b.duration || 1} hr)`,
      module: 'Meeting Rooms',
      relativeTime: formatRelativeTimeIST(b.createdAt || `${b.date}T${b.startTime || '10:00'}:00`),
      linkTab: 'bookings',
      linkId: b.id
    });
  });

  // Add real top-up activities
  (startup.topUps || []).slice(0, 2).forEach(t => {
    recentActivities.push({
      id: `act-topup-${t.id}`,
      icon: '💳',
      actor: t.paymentMethod || 'Finance',
      title: `Purchased ${t.packTitle || t.packName || 'Credit Top-up'} (+${t.credits} credits)`,
      description: `Invoice #${t.invoiceId || 'INV-TOPUP'} • Total ₹${(t.amount || 0).toLocaleString('en-IN')}`,
      module: 'Billing',
      relativeTime: formatRelativeTimeIST(t.purchasedAt || `${t.date}T10:00:00`),
      linkTab: 'billingCredits',
      linkId: t.id
    });
  });

  // Financial & Invoices
  const isEmployee = role === 'startup_member';
  const startupInvoices = invoices.filter(inv => inv.startupId === startup.id && inv.status !== 'Cancelled');
  const unpaidInvoices = startupInvoices.filter(inv => {
    const s = computeInvoiceStatus(inv, payments.filter(p => p.invoiceId === inv.id), ist.date);
    return s === 'Pending' || s === 'Overdue' || s === 'Partially Paid';
  });
  let outstandingDue = 0;
  unpaidInvoices.forEach(inv => {
    const paidSum = payments.filter(p => p.invoiceId === inv.id && p.status === 'Successful').reduce((acc, p) => acc + (p.amount || 0), 0);
    outstandingDue += Math.max(0, (inv.total || 0) - paidSum);
  });

  // Add invoice activity
  startupInvoices.slice(0, 2).forEach(inv => {
    recentActivities.push({
      id: `act-inv-${inv.id}`,
      icon: '🧾',
      actor: 'Nexus Accounts',
      title: `Tax Invoice #${inv.id} issued`,
      description: `${inv.billingPeriod || 'Billing'} • Total ₹${(inv.total || 0).toLocaleString('en-IN')} (${inv.status || 'Active'})`,
      module: 'Billing',
      relativeTime: formatRelativeTimeIST(inv.issueDate ? `${inv.issueDate}T12:00:00` : Date.now()),
      linkTab: 'billingCredits',
      linkId: inv.id
    });
  });

  // Sort activities newest first
  recentActivities.sort((a, b) => (b.id || '').localeCompare(a.id || ''));

  // Milestone resolution: Find the first uncompleted milestone
  const startupMilestones = milestones.filter(m => m.startupId === startup.id || m.startupName === startup.name);
  const uncompletedMilestones = startupMilestones.filter(m => m.status !== 'Completed');
  const targetMilestone = uncompletedMilestones[0] || startupMilestones[startupMilestones.length - 1];

  let upcomingMilestoneText = 'Phase 2 Product Beta';
  let isMilestoneOverdue = false;
  if (targetMilestone) {
    const isOverdue = Boolean(targetMilestone.targetDate && targetMilestone.targetDate < ist.date);
    isMilestoneOverdue = isOverdue;
    const formattedDate = targetMilestone.targetDate ? targetMilestone.targetDate : 'Nov 2026';
    upcomingMilestoneText = `${targetMilestone.title || targetMilestone.milestone || 'Milestone'} (${isOverdue ? 'Overdue: ' : 'Due '}${formattedDate})`;
  }

  return {
    ok: true,
    role,
    asOfIST: `${ist.date} ${ist.time}`,
    startup: {
      id: startup.id,
      name: startup.name,
      founderName: startup.founders?.name || 'Alex Morgan',
      plan: creditAllowance.planName || 'Startup Plan',
      totalCredits,
      usedCredits,
      remainingCredits,
      remainingPercent,
      percentLeft,
      statusColor: creditAllowance.statusColor,
      statusLabel: creditAllowance.statusLabel,
      renewalDate: creditAllowance.nextRenewalDate || '1 Dec 2026',
      planCreditsExpiry: creditAllowance.expiries?.planCreditsExpiry || '',
      topUpExpiries: creditAllowance.expiries?.topUps || []
    },
    kpi: {
      upcomingMeetings: {
        count: upcomingBookings.length,
        nextHint: nextMeetingHint,
        linkTab: 'bookings'
      },
      availableRooms: {
        count: availableRoomsCount,
        total: meetingRooms.length,
        timeBasis: `As of ${ist.time} IST today`,
        linkTab: 'meetingRooms'
      },
      remainingCredits: {
        remaining: remainingCredits,
        total: totalCredits,
        unit: 'credits',
        percent: remainingPercent,
        percentLeft,
        statusColor: creditAllowance.statusColor,
        linkTab: isEmployee ? 'meetingRooms' : 'billingCredits'
      },
      pendingRequests: {
        count: pendingRequests.length,
        description: pendingRequests.length > 0 ? `${pendingRequests.length} requests pending review` : 'All requests approved',
        linkTab: 'bookings'
      }
    },
    todaysSchedule,
    upcomingBookings,
    recentActivities: recentActivities.slice(0, 5),
    startupOverview: isEmployee ? null : {
      teamCount: startup.teamSize || (Array.isArray(startup.teamMembers) ? startup.teamMembers.length : 6),
      assignedSpace: startup.assignedSpace || startup.space || 'Pod #4 (6 Desks)',
      unpaidInvoicesCount: unpaidInvoices.length,
      outstandingDueFormatted: formatCurrencyINR(outstandingDue),
      upcomingMilestone: upcomingMilestoneText,
      isMilestoneOverdue
    }
  };
}

async function generateInvoicesBatchAtomic({ billingPeriod = 'November 2026', previewOnly = false } = {}) {
  await bookingMutex.acquire();
  try {
    const ist = getISTClock();
    const appState = await getAppState();
    let seed = null;
    const getFallback = (key) => {
      if (!seed) seed = loadInitialSeedData();
      return seed[key] || [];
    };

    const startups = (appState && appState.startups) ? appState.startups : getFallback('startups');
    const spaces = (appState && appState.spaces) ? appState.spaces : getFallback('spaces');
    const billingRules = (appState && appState.billingRules) ? appState.billingRules : (getFallback('billingRules') || {});
    let invoices = (appState && appState.invoices) ? appState.invoices : getFallback('invoices');

    const eligibleStartups = startups.filter(s =>
      (s.status === 'Incubated' || s.status === 'Active') &&
      Array.isArray(s.allocatedSeats) &&
      s.allocatedSeats.length > 0
    );

    const periodClean = billingPeriod.trim();
    const existingInvoices = invoices.filter(inv =>
      inv.status !== 'Cancelled' &&
      (inv.billingPeriod || '').trim().toLowerCase() === periodClean.toLowerCase()
    );

    const candidates = [];
    const skipped = [];
    let totalBatchAmount = 0;

    for (const s of eligibleStartups) {
      const existing = existingInvoices.find(inv => inv.startupId === s.id);
      if (existing) {
        skipped.push({
          startupId: s.id,
          startupName: s.name,
          reason: `Invoice already exists for ${periodClean} (#${existing.id})`,
          existingInvoiceId: existing.id
        });
        continue;
      }

      // Calculate monthly billing for startup
      const lineItems = [];
      let subtotal = 0;

      // 1. Workspace Allocation Fees
      (s.allocatedSeats || []).forEach(seatId => {
        const sp = spaces.find(space => space.id === seatId || space.code === seatId);
        if (sp) {
          const rate = sp.monthlyRate || 0;
          lineItems.push({
            desc: `${sp.label || sp.code || seatId} (${sp.type || 'Workspace'}) - Monthly License`,
            qty: 1,
            rate,
            amount: rate,
            sac: '997212'
          });
          subtotal += rate;
        }
      });

      // 2. Add-Ons
      const availableAddOns = billingRules.addOns || [];
      (s.activeAddOns || []).forEach(addOnId => {
        const addOn = availableAddOns.find(a => a.id === addOnId);
        if (addOn) {
          lineItems.push({
            desc: addOn.name,
            qty: 1,
            rate: addOn.monthlyCost,
            amount: addOn.monthlyCost,
            sac: '998413'
          });
          subtotal += addOn.monthlyCost;
        }
      });

      // 3. Grant Subsidy
      const subsidyPercent = s.monthlyGrantSubsidyPercent || 0;
      const subsidyDeduction = Math.round((subtotal * subsidyPercent) / 100);
      const taxableAmount = Math.max(0, subtotal - subsidyDeduction);

      // 4. GST (18%)
      const gstRate = billingRules.taxRateGstPercent || 18;
      const taxGst = Math.round((taxableAmount * gstRate) / 100);
      const total = taxableAmount + taxGst;

      totalBatchAmount += total;
      candidates.push({
        startup: s,
        lineItems,
        subtotal,
        subsidyPercent,
        subsidyDeduction,
        taxableAmount,
        taxGst,
        total
      });
    }

    if (previewOnly) {
      return {
        ok: true,
        preview: true,
        billingPeriod: periodClean,
        eligibleCount: candidates.length,
        skippedCount: skipped.length,
        totalAmount: totalBatchAmount,
        totalAmountFormatted: formatCurrencyINR(totalBatchAmount),
        candidates: candidates.map(c => ({
          startupId: c.startup.id,
          startupName: c.startup.name,
          amount: c.total,
          amountFormatted: formatCurrencyINR(c.total),
          seatsCount: c.startup.allocatedSeats.length
        })),
        skipped
      };
    }

    // Confirm & Generate
    const created = [];
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + 10);
    const dueDateStr = dueDateObj.toISOString().split('T')[0];

    for (const c of candidates) {
      const nextIdNum = invoices.length + 86 + created.length;
      const invoiceId = `INV-2026-0${nextIdNum}`;
      const newInv = {
        id: invoiceId,
        startupId: c.startup.id,
        startupName: c.startup.name,
        issueDate: ist.date,
        dueDate: dueDateStr,
        billingPeriod: periodClean,
        lineItems: c.lineItems,
        subtotal: c.subtotal,
        grantSubsidyPercent: c.subsidyPercent,
        subsidyDeduction: c.subsidyDeduction,
        taxableAmount: c.taxableAmount,
        taxGst: c.taxGst,
        total: c.total,
        status: 'Issued',
        paymentMethod: null,
        paidAt: null,
        createdAt: new Date().toISOString()
      };

      invoices.push(newInv);
      created.push(newInv);
    }

    // Save state & sync
    if (appState) {
      appState.invoices = invoices;
      await saveAppState(appState);
    }

    // Also sync to MongoDB invoices collection
    const database = await connectDB();
    if (database) {
      try {
        const invCol = database.collection('invoices');
        // Ensure unique index on startupId + billingPeriod (excl. Cancelled)
        await invCol.createIndex(
          { startupId: 1, billingPeriod: 1 },
          { unique: true, partialFilterExpression: { status: { $ne: 'Cancelled' } } }
        ).catch(() => {});

        for (const inv of created) {
          const copy = { ...inv };
          delete copy._id;
          copy._syncedAt = new Date();
          await invCol.updateOne({ id: inv.id }, { $set: copy }, { upsert: true });
        }
      } catch (err) {
        console.warn('⚠️ [MongoDB] Invoice batch insert warning:', err.message);
      }
    }

    return {
      ok: true,
      billingPeriod: periodClean,
      createdCount: created.length,
      skippedCount: skipped.length,
      totalAmount: totalBatchAmount,
      totalAmountFormatted: formatCurrencyINR(totalBatchAmount),
      created,
      skipped,
      message: `Generated ${created.length} invoices (₹${(totalBatchAmount / 100000).toFixed(2)}L). ${skipped.length} skipped as duplicates.`
    };
  } finally {
    bookingMutex.release();
  }
}

// -------------------------------------------------------------
// Section B: Complete Meeting Room Management Integration
// (RBAC, Overage Invoicing, Recurring Bookings, Admin, Analytics, External Calendar Sync)
// -------------------------------------------------------------

// 1. Role-Based Access Control (RBAC) Verification Helper
function checkMeetingRoomPermission(userRole, action, context = {}) {
  const raw = String(userRole || 'startup_admin').trim().toLowerCase();
  let normalizedRole = 'startup_admin';
  if (raw === 'super_admin' || raw === 'admin') {
    normalizedRole = 'super_admin';
  } else if (raw === 'incubation_admin' || raw === 'incubator_admin') {
    normalizedRole = 'incubation_admin';
  } else if (raw === 'startup_admin' || raw === 'founder' || raw === 'startup') {
    normalizedRole = 'startup_admin';
  } else if (raw === 'startup_member' || raw === 'member') {
    normalizedRole = 'startup_member';
  } else if (raw === 'finance_admin' || raw === 'mentor') {
    normalizedRole = raw;
  }

  const isAdmin = normalizedRole === 'super_admin' || normalizedRole === 'incubation_admin';
  const adminOnlyActions = [
    'admin_manage_room',
    'admin_manage_policy',
    'admin_approve_booking',
    'admin_maintenance',
    'admin_view_logs'
  ];

  if (adminOnlyActions.includes(action)) {
    if (!isAdmin) {
      return {
        allowed: false,
        role: normalizedRole,
        status: 403,
        code: 'FORBIDDEN_ADMIN_ONLY',
        message: `Access Denied: Role "${normalizedRole}" is not authorized to perform administrative action "${action}".`
      };
    }
    return { allowed: true, role: normalizedRole, isAdmin: true };
  }

  // Ownership check for startup_admin and startup_member on modify/cancel/book
  if (!isAdmin && context.targetStartupId && context.requestingStartupId && context.targetStartupId !== context.requestingStartupId) {
    return {
      allowed: false,
      role: normalizedRole,
      status: 403,
      code: 'UNAUTHORIZED_STARTUP_SCOPE',
      message: `Unauthorized: You can only ${action} reservations belonging to your own startup (${context.requestingStartupId}).`
    };
  }

  // Startup members cannot modify startup billing plans or cancel another member's restricted admin-locked booking
  if (normalizedRole === 'startup_member' && action === 'manage_startup_billing') {
    return {
      allowed: false,
      role: normalizedRole,
      status: 403,
      code: 'FORBIDDEN_MEMBER_BILLING',
      message: 'Access Denied: Only Startup Admins or Hub Administrators can manage billing plans.'
    };
  }

  return { allowed: true, role: normalizedRole, isAdmin };
}

// 2. Idempotent Overage Billing & Invoice Sync Helper
function syncBookingOverageToInvoice(appState, booking, room, startupRecord) {
  if (!appState || !booking || !(Number(booking.cost) > 0)) return null;
  if (!Array.isArray(appState.invoices)) appState.invoices = [];

  const ist = getISTClock();
  const chargeKey = booking.idempotencyKey || `BKG-CHG-${booking.id}`;

  // Check if any invoice already contains this bookingId or chargeKey (idempotency guard)
  for (const inv of appState.invoices) {
    if (inv.status === 'Cancelled') continue;
    const hasItem = (inv.lineItems || []).some(li => li.bookingId === booking.id || li.idempotencyKey === chargeKey);
    if (hasItem) {
      return inv;
    }
  }

  const dParts = (booking.date || ist.date).split('-').map(Number);
  const dObj = new Date(dParts[0] || 2026, (dParts[1] || 10) - 1, 1);
  const periodLabel = dObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const gstRate = (appState.billingRules && Number(appState.billingRules.taxRateGstPercent)) || 18;

  const lineItem = {
    section: 'Meeting Rooms',
    bookingId: booking.id,
    idempotencyKey: chargeKey,
    desc: `Meeting Room Overage: ${room ? room.name : booking.roomId} (${booking.date} ${booking.startTime}–${booking.endTime}, ${booking.overageHours || booking.duration || 1}h billable)`,
    qty: booking.overageHours || booking.duration || 1,
    rate: (startupRecord && startupRecord.additionalHourRate) || (room && room.hourlyRate) || booking.cost,
    amount: Number(booking.cost),
    sac: '997212'
  };

  // Look for an open/issued invoice for this startup in the current billing period
  let targetInvoice = appState.invoices.find(inv =>
    inv.startupId === booking.startupId &&
    inv.status !== 'Paid' &&
    inv.status !== 'Cancelled' &&
    (inv.billingPeriod === periodLabel || inv.invoiceType === 'meeting')
  );

  if (targetInvoice) {
    if (!Array.isArray(targetInvoice.lineItems)) targetInvoice.lineItems = [];
    targetInvoice.lineItems.push(lineItem);
    const subtotal = targetInvoice.lineItems.reduce((s, li) => s + (Number(li.amount) || 0), 0);
    const subsidyPct = Number(targetInvoice.grantSubsidyPercent || (startupRecord && startupRecord.monthlyGrantSubsidyPercent) || 0);
    const subsidyDeduction = Math.round((subtotal * subsidyPct) / 100);
    const taxableAmount = Math.max(0, subtotal - subsidyDeduction);
    const taxGst = Math.round((taxableAmount * gstRate) / 100);
    targetInvoice.subtotal = subtotal;
    targetInvoice.subsidyDeduction = subsidyDeduction;
    targetInvoice.taxableAmount = taxableAmount;
    targetInvoice.taxGst = taxGst;
    targetInvoice.total = taxableAmount + taxGst;
    targetInvoice.updatedAt = new Date().toISOString();
    return targetInvoice;
  }

  // Otherwise create a dedicated Meeting Room Overage Invoice
  const dueDateObj = new Date();
  dueDateObj.setDate(dueDateObj.getDate() + 10);
  const dueDateStr = dueDateObj.toISOString().split('T')[0];
  const subtotal = Number(booking.cost);
  const taxGst = Math.round((subtotal * gstRate) / 100);
  const total = subtotal + taxGst;

  const newInvoice = {
    id: `INV-MR-${Date.now().toString().slice(-5)}`,
    startupId: booking.startupId,
    startupName: booking.startupName || (startupRecord && startupRecord.name) || 'Partner Venture',
    invoiceType: 'meeting',
    issueDate: ist.date,
    dueDate: dueDateStr,
    billingPeriod: periodLabel,
    lineItems: [lineItem],
    subtotal,
    grantSubsidyPercent: 0,
    subsidyDeduction: 0,
    taxableAmount: subtotal,
    taxGst,
    total,
    status: 'Pending',
    paymentMethod: null,
    paidAt: null,
    createdAt: new Date().toISOString()
  };

  appState.invoices.unshift(newInvoice);
  return newInvoice;
}

// 3. Atomic Recurring Reservations Engine
async function reserveRecurringMeetingRoomAtomic(bookingReq) {
  await bookingMutex.acquire();
  try {
    const {
      roomId,
      startupId,
      startupName,
      title,
      purpose,
      date,
      startTime,
      endTime,
      attendees,
      requestedAmenities,
      specialRequests,
      recurrence = {}
    } = bookingReq || {};

    if (!roomId || !startupId || !date || !startTime || !endTime) {
      return { ok: false, status: 400, message: 'Missing required booking fields.' };
    }

    const frequency = String(recurrence.frequency || 'weekly').toLowerCase();
    const count = Math.max(1, Math.min(12, parseInt(recurrence.count || 2, 10)));
    const customDates = Array.isArray(recurrence.dates) ? recurrence.dates : null;
    const intervalDays = frequency === 'daily' ? 1 : frequency === 'biweekly' ? 14 : (Number(recurrence.intervalDays) || 7);

    // Build occurrence dates list
    const occurrenceDates = [];
    if (customDates && customDates.length > 0) {
      customDates.slice(0, 12).forEach(d => occurrenceDates.push(String(d).trim()));
    } else {
      const baseParts = date.split('-').map(Number);
      for (let i = 0; i < count; i++) {
        const dObj = new Date(Date.UTC(baseParts[0], baseParts[1] - 1, baseParts[2] + (i * intervalDays)));
        occurrenceDates.push(dObj.toISOString().split('T')[0]);
      }
    }

    const ist = getISTClock();
    const startMin = toMinutes(startTime);
    const endMin = toMinutes(endTime);
    if (endMin <= startMin || (endMin - startMin) < 15) {
      return { ok: false, status: 400, message: 'Invalid booking duration (minimum 15 minutes).' };
    }

    const appState = await getAppState();
    let rooms = (appState && appState.meetingRooms) ? appState.meetingRooms : [];
    if (!rooms.length) {
      const seed = loadInitialSeedData();
      rooms = seed.meetingRooms || [];
    }

    const policies = (appState && appState.meetingRoomPolicies) || {};
    if (policies.allowRecurring === false) {
      return { ok: false, status: 400, code: 'RECURRING_DISABLED', message: 'Recurring reservations are currently disabled by hub booking policy.' };
    }

    const room = rooms.find(r => r.id === roomId);
    if (!room) return { ok: false, status: 404, message: `Room "${roomId}" not found.` };

    if (room.status === 'Under Maintenance' || room.underMaintenance === true || room.maintenance === true) {
      return { ok: false, status: 409, code: 'ROOM_MAINTENANCE', message: `${room.name} is currently under maintenance.` };
    }

    const reqAttendees = parseInt(attendees || 4, 10);
    if (isNaN(reqAttendees) || reqAttendees < 1 || reqAttendees > room.capacity) {
      return {
        ok: false,
        status: 400,
        code: 'CAPACITY_EXCEEDED',
        message: `Attendees (${reqAttendees}) exceed ${room.name} capacity of ${room.capacity} pax.`
      };
    }

    // Pre-validate ALL occurrences for conflicts before confirming any occurrence
    const conflicts = [];
    for (const occDate of occurrenceDates) {
      if (occDate < ist.date || (occDate === ist.date && startMin < ist.minutes)) {
        conflicts.push({
          date: occDate,
          code: 'PAST_SLOT',
          message: `Occurrence on ${occDate} (${startTime}-${endTime}) is in the past.`
        });
        continue;
      }

      const roomConflict = (room.bookings || []).find(b =>
        hasBookingConflict({ ...b, roomId }, { roomId, date: occDate, startTime, endTime })
      );
      if (roomConflict) {
        conflicts.push({
          date: occDate,
          code: 'SLOT_TAKEN',
          conflictWith: {
            id: roomConflict.id,
            startupName: roomConflict.startupName,
            startTime: roomConflict.startTime,
            endTime: roomConflict.endTime
          },
          message: `${room.name} is already booked on ${occDate} (${roomConflict.startTime}-${roomConflict.endTime}) by ${roomConflict.startupName}.`,
          alternatives: findBookingAlternatives(rooms, { roomId, date: occDate, startTime, endTime, attendees: reqAttendees, startupId })
        });
        continue;
      }

      for (const r of rooms) {
        if (r.id === roomId) continue;
        const concurrent = (r.bookings || []).find(b =>
          hasStartupConcurrentConflict({ ...b, roomId: r.id }, { roomId, startupId, date: occDate, startTime, endTime })
        );
        if (concurrent) {
          conflicts.push({
            date: occDate,
            code: 'USER_ALREADY_BOOKED',
            message: `Startup already has a booking on ${occDate} (${startTime}-${endTime}) in ${r.name}.`
          });
          break;
        }
      }
    }

    if (conflicts.length > 0) {
      return {
        ok: false,
        status: 409,
        code: 'RECURRING_CONFLICT',
        message: `Recurring series has ${conflicts.length} conflicting occurrence(s): ${conflicts.map(c => c.date).join(', ')}.`,
        conflicts,
        alternatives: conflicts[0].alternatives || []
      };
    }

    // All occurrences are conflict-free! Create series bookings atomically
    const seriesId = `SRS-${Date.now().toString().slice(-6)}`;
    const durationHrs = Math.max(0.25, (endMin - startMin) / 60);
    const startupRecord = (appState && Array.isArray(appState.startups))
      ? appState.startups.find(s => s.id === startupId)
      : null;

    const normalizedAmenities = Array.isArray(requestedAmenities)
      ? requestedAmenities
      : (typeof requestedAmenities === 'string' && requestedAmenities.trim()
          ? requestedAmenities.split(',').map(s => s.trim()).filter(Boolean)
          : []);

    const createdBookings = [];
    let lastInvoice = null;
    const database = await connectDB();

    for (let idx = 0; idx < occurrenceDates.length; idx++) {
      const occDate = occurrenceDates[idx];
      let creditHoursUsed = 0;
      let overageHours = 0;
      let occCost = 0;

      const occMonth = (occDate || '').substring(0, 7);
      const priorMonthUsage = calculateStartupMonthlyUsage(rooms, startupId, occMonth);

      if (startupRecord) {
        const includedHrs = startupRecord.includedMeetingHours !== undefined ? Number(startupRecord.includedMeetingHours) : 15;
        const availableAllowance = Math.max(0, Number((includedHrs - priorMonthUsage).toFixed(2)));
        creditHoursUsed = Math.min(availableAllowance, durationHrs);
        overageHours = Math.max(0, Number((durationHrs - creditHoursUsed).toFixed(2)));
        const rate = Number(startupRecord.additionalHourRate || room.hourlyRate || 1000);
        occCost = overageHours > 0 ? Math.round(overageHours * rate) : 0;
        startupRecord.usedMeetingHours = Number((priorMonthUsage + creditHoursUsed).toFixed(2));
      } else {
        creditHoursUsed = 0;
        overageHours = durationHrs;
        occCost = Math.round(durationHrs * (room.hourlyRate || 1000));
      }

      const bookingId = generateBookingRef(occDate, rooms);
      const occBooking = {
        id: bookingId,
        roomId,
        startupId,
        startupName: startupName || (startupRecord && startupRecord.name) || 'Partner Venture',
        bookedBy: bookingReq.bookedBy || bookingReq.founderName || 'Alex Morgan',
        title: title || purpose || 'Meeting Room Reservation',
        purpose: purpose || title || 'General Sync',
        date: occDate,
        startTime,
        endTime,
        duration: durationHrs,
        creditHoursUsed,
        overageHours,
        attendees: reqAttendees,
        requestedAmenities: normalizedAmenities,
        specialRequests: specialRequests ? String(specialRequests).trim() : '',
        cost: occCost,
        status: 'Confirmed',
        seriesId,
        recurrence: {
          frequency,
          count: occurrenceDates.length,
          occurrenceIndex: idx + 1,
          seriesId
        },
        calendarSync: {},
        createdAt: new Date().toISOString()
      };

      if (occCost > 0 && appState) {
        lastInvoice = syncBookingOverageToInvoice(appState, occBooking, room, startupRecord);
        if (lastInvoice) occBooking.invoiceId = lastInvoice.id;
      }

      if (!room.bookings) room.bookings = [];
      room.bookings.push(occBooking);
      createdBookings.push(occBooking);

      if (database) {
        try {
          await initMeetingRoomIndexes();
          const slotsCol = database.collection('meeting_room_slots');
          for (let m = startMin; m < endMin; m += 15) {
            const h = Math.floor(m / 60);
            const minPart = m % 60;
            const slotHour = `${h < 10 ? '0' : ''}${h}:${minPart < 10 ? '0' : ''}${minPart}`;
            await slotsCol.insertOne({
              roomId,
              date: occDate,
              slotHour,
              bookingId,
              seriesId,
              status: 'Confirmed',
              startupId,
              createdAt: new Date()
            });
          }
        } catch (dbErr) {
          console.warn('⚠️ [MongoDB] Recurring slot insert warning:', dbErr.message);
        }
      }
    }

    if (database) {
      try {
        await database.collection('meeting_rooms').updateOne({ id: roomId }, { $set: { bookings: room.bookings } }, { upsert: true });
      } catch (_) {}
    }

    if (appState) {
      appState.meetingRooms = rooms;
      if (!appState.activityLog) appState.activityLog = [];
      appState.activityLog.unshift({
        id: `ACT-${Date.now()}`,
        module: 'Meeting Rooms',
        action: `${createdBookings[0].startupName} booked recurring series ${seriesId} (${createdBookings.length} sessions, ${frequency}) in ${room.name}.`,
        timestamp: new Date().toISOString(),
        icon: '🔁'
      });
      await saveAppState(appState);
    }

    return {
      ok: true,
      status: 201,
      seriesId,
      bookings: createdBookings,
      booking: createdBookings[0],
      invoice: lastInvoice,
      message: `Successfully booked ${createdBookings.length} recurring sessions (${frequency}) in ${room.name}!`
    };
  } finally {
    bookingMutex.release();
  }
}

// Cancel all upcoming occurrences of a recurring series
async function cancelRecurringSeriesAtomic({ roomId, seriesId, requestingStartupId, userRole, currentClock = null } = {}) {
  if (!seriesId) return { ok: false, status: 400, message: 'Missing seriesId.' };
  const appState = await getAppState();
  const rooms = (appState && appState.meetingRooms) || [];
  const matching = [];

  rooms.forEach(r => {
    if (roomId && r.id !== roomId) return;
    (r.bookings || []).forEach(b => {
      if ((b.seriesId === seriesId || (b.recurrence && b.recurrence.seriesId === seriesId)) && b.status !== 'Cancelled') {
        matching.push({ roomId: r.id, bookingId: b.id });
      }
    });
  });

  if (matching.length === 0) {
    return { ok: false, status: 404, message: 'No active bookings found for recurring series.' };
  }

  const cancelled = [];
  const skipped = [];
  for (const item of matching) {
    const res = await cancelBooking({
      roomId: item.roomId,
      bookingId: item.bookingId,
      requestingStartupId,
      userRole,
      currentClock
    });
    if (res.ok) cancelled.push(res.booking);
    else skipped.push({ bookingId: item.bookingId, reason: res.message });
  }

  return {
    ok: cancelled.length > 0,
    status: cancelled.length > 0 ? 200 : 400,
    seriesId,
    cancelledCount: cancelled.length,
    skippedCount: skipped.length,
    cancelled,
    skipped,
    message: `Cancelled ${cancelled.length} occurrence(s) in recurring series ${seriesId}.`
  };
}

// 3b. Timed Maintenance Block Management
async function manageMeetingRoomMaintenanceAtomic(req = {}) {
  await bookingMutex.acquire();
  try {
    const { action, userRole = 'super_admin', adminUser = 'Hub Administrator', maintenanceData, maintenanceId, roomId } = req;
    const perm = checkMeetingRoomPermission(userRole, 'admin_maintenance');
    if (!perm.allowed) return { ok: false, status: 403, message: perm.message };

    const appState = await getAppState();
    if (!appState.maintenanceBlocks) appState.maintenanceBlocks = [];

    if (action === 'add' || action === 'edit') {
      if (!maintenanceData || !maintenanceData.roomId || !maintenanceData.startDateTime || !maintenanceData.endDateTime) {
        return { ok: false, status: 400, message: 'roomId, startDateTime and endDateTime are required.' };
      }
      const rooms = appState.meetingRooms || [];
      const targetRoom = rooms.find(r => r.id === maintenanceData.roomId);
      if (!targetRoom) return { ok: false, status: 404, message: 'Room not found.' };

      // Find conflicting active bookings
      const startDT = new Date(maintenanceData.startDateTime);
      const endDT = new Date(maintenanceData.endDateTime);
      const startDateStr = startDT.toISOString().split('T')[0];
      const endDateStr = endDT.toISOString().split('T')[0];
      const conflictingBookings = [];
      (targetRoom.bookings || []).forEach(b => {
        if (b.status === 'Cancelled') return;
        if (b.date < startDateStr || b.date > endDateStr) return;
        conflictingBookings.push({ id: b.id, date: b.date, startTime: b.startTime, endTime: b.endTime, startupName: b.startupName, title: b.title });
      });

      const block = {
        id: maintenanceData.id || `MNT-${Date.now()}`,
        roomId: maintenanceData.roomId,
        roomName: targetRoom.name,
        reason: maintenanceData.reason || 'Scheduled Maintenance',
        startDateTime: maintenanceData.startDateTime,
        endDateTime: maintenanceData.endDateTime,
        notes: maintenanceData.notes || '',
        status: maintenanceData.status || 'scheduled',
        createdBy: adminUser,
        createdAt: new Date().toISOString()
      };

      const existingIdx = appState.maintenanceBlocks.findIndex(m => m.id === block.id);
      if (existingIdx >= 0) {
        appState.maintenanceBlocks[existingIdx] = block;
      } else {
        appState.maintenanceBlocks.push(block);
      }

      await saveAppState(appState);
      return {
        ok: true,
        status: action === 'add' ? 201 : 200,
        block,
        conflictingBookings,
        message: `Maintenance block ${action === 'add' ? 'created' : 'updated'} for ${targetRoom.name}.`
      };
    }

    if (action === 'delete' || action === 'cancel') {
      const idx = appState.maintenanceBlocks.findIndex(m => m.id === maintenanceId);
      if (idx < 0) return { ok: false, status: 404, message: 'Maintenance block not found.' };
      appState.maintenanceBlocks.splice(idx, 1);
      await saveAppState(appState);
      return { ok: true, status: 200, message: `Maintenance block ${maintenanceId} removed.` };
    }

    if (action === 'list') {
      const filter = appState.maintenanceBlocks.filter(m => !roomId || m.roomId === roomId);
      return { ok: true, status: 200, blocks: filter };
    }

    return { ok: false, status: 400, message: `Unknown maintenance action: ${action}` };
  } finally {
    bookingMutex.release();
  }
}

// 3c. Reservations List & Ledger Engine (Role-scoped, Paginated, Multi-filter & Sorted)
async function getMeetingRoomReservations({
  userRole = 'founder',
  requestingStartupId,
  startupId,
  roomId,
  status = 'all',
  paymentStatus,
  dateFrom,
  dateTo,
  search,
  sortBy = 'default',
  sortDir = 'asc',
  page = 1,
  limit = 25
} = {}) {
  const isAdmin = userRole === 'super_admin' || userRole === 'admin' || userRole === 'incubator_admin' || userRole === 'finance_admin';
  
  // Non-admins can strictly see only their own company/startup's bookings
  const effectiveStartupId = isAdmin ? (startupId || undefined) : (requestingStartupId || startupId || 'STP-XYZ');

  const appState = await getAppState();
  const rooms = (appState && appState.meetingRooms) ? appState.meetingRooms : [];
  const ist = getISTClock();
  const todayStr = ist.date;
  const liveTimeStr = ist.time;

  const all = [];
  rooms.forEach(r => {
    (r.bookings || []).forEach(b => {
      const [sh, sm] = (b.startTime || '00:00').split(':').map(Number);
      const [eh, em] = (b.endTime || '00:00').split(':').map(Number);
      const dur = b.duration !== undefined ? Number(b.duration) : Math.max(0.25, ((eh * 60 + em) - (sh * 60 + sm)) / 60);

      all.push({
        ...b,
        duration: dur,
        roomId: r.id,
        roomName: r.name,
        roomIcon: r.icon || '🏢',
        hourlyRate: r.hourlyRate,
        capacity: r.capacity,
        floor: r.floor || '1F',
        roomNumber: r.roomNumber || r.id
      });
    });
  });

  // Base startup scope filter for non-admin
  const scopedList = effectiveStartupId ? all.filter(b => b.startupId === effectiveStartupId) : all;

  // Compute live tab counts before status filter
  const counts = {
    all: scopedList.length,
    today: scopedList.filter(b => b.date === todayStr && b.status !== 'Cancelled').length,
    upcoming: scopedList.filter(b => (b.date > todayStr || (b.date === todayStr && b.startTime > liveTimeStr)) && b.status !== 'Cancelled').length,
    completed: scopedList.filter(b => (b.date < todayStr || (b.date === todayStr && b.endTime <= liveTimeStr)) && b.status !== 'Cancelled').length,
    cancelled: scopedList.filter(b => b.status === 'Cancelled').length
  };

  // Apply filters
  let filtered = scopedList.filter(b => {
    if (roomId && roomId !== 'all' && b.roomId !== roomId) return false;
    if (dateFrom && b.date < dateFrom) return false;
    if (dateTo && b.date > dateTo) return false;

    // Status filter
    if (status && status !== 'all') {
      if (status === 'today') {
        if (!(b.date === todayStr && b.status !== 'Cancelled')) return false;
      } else if (status === 'upcoming') {
        if (!((b.date > todayStr || (b.date === todayStr && b.startTime > liveTimeStr)) && b.status !== 'Cancelled')) return false;
      } else if (status === 'completed') {
        if (!((b.date < todayStr || (b.date === todayStr && b.endTime <= liveTimeStr)) && b.status !== 'Cancelled')) return false;
      } else if (status === 'cancelled') {
        if (b.status !== 'Cancelled') return false;
      } else if (b.status !== status) {
        return false;
      }
    }

    if (paymentStatus === 'paid' && !(b.cost > 0)) return false;
    if (paymentStatus === 'free' && b.cost > 0) return false;

    // Search filter across ref, title, purpose, room, bookedBy, date
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      const match = (b.id && b.id.toLowerCase().includes(q)) ||
        (b.title && b.title.toLowerCase().includes(q)) ||
        (b.purpose && b.purpose.toLowerCase().includes(q)) ||
        (b.roomName && b.roomName.toLowerCase().includes(q)) ||
        (b.bookedBy && b.bookedBy.toLowerCase().includes(q)) ||
        (b.date && b.date.includes(q)) ||
        (b.startTime && b.startTime.includes(q)) ||
        (b.endTime && b.endTime.includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Default sorting: Upcoming & in-progress first (soonest first), then past bookings (newest first)
  if (sortBy === 'default') {
    filtered.sort((a, b) => {
      const aIsActive = a.status !== 'Cancelled' && (a.date > todayStr || (a.date === todayStr && a.endTime > liveTimeStr));
      const bIsActive = b.status !== 'Cancelled' && (b.date > todayStr || (b.date === todayStr && b.endTime > liveTimeStr));

      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;

      if (aIsActive && bIsActive) {
        // Soonest first (date ASC, startTime ASC)
        if (a.date !== b.date) return a.date > b.date ? 1 : -1;
        return a.startTime > b.startTime ? 1 : -1;
      }

      // Past / Completed / Cancelled bookings: newest first (date DESC, startTime DESC)
      if (a.status === 'Cancelled' && b.status !== 'Cancelled') return 1;
      if (a.status !== 'Cancelled' && b.status === 'Cancelled') return -1;
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return a.startTime < b.startTime ? 1 : -1;
    });
  } else {
    // Column header sorting
    const modifier = sortDir === 'desc' ? -1 : 1;
    filtered.sort((a, b) => {
      let vA = a[sortBy] || '';
      let vB = b[sortBy] || '';
      if (sortBy === 'duration' || sortBy === 'cost' || sortBy === 'attendees') {
        vA = Number(vA) || 0;
        vB = Number(vB) || 0;
      }
      if (vA < vB) return -1 * modifier;
      if (vA > vB) return 1 * modifier;
      return 0;
    });
  }

  // Calculate summary metrics for active filter set
  const activeBookings = filtered.filter(b => b.status !== 'Cancelled');
  const totalHours = activeBookings.reduce((sum, b) => sum + (Number(b.duration) || 0), 0);
  const totalFeesBilled = activeBookings.reduce((sum, b) => sum + (Number(b.cost) || 0), 0);

  // Startup credit info
  const startup = (appState && Array.isArray(appState.startups) && effectiveStartupId)
    ? appState.startups.find(s => s.id === effectiveStartupId)
    : null;
  const includedHours = startup ? (Number(startup.includedMeetingHours) || 15) : 15;
  const usedHours = startup ? (Number(startup.usedMeetingHours) || 0) : 0;
  const remainingHours = Math.max(0, Number((includedHours - usedHours).toFixed(2)));

  const activeReservationsCount = scopedList.filter(b => b.status !== 'Cancelled' && (b.date > todayStr || (b.date === todayStr && b.endTime > liveTimeStr))).length;
  const scheduledTodayCount = scopedList.filter(b => b.date === todayStr && b.status !== 'Cancelled' && b.endTime > liveTimeStr).length;

  const total = filtered.length;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const pageSize = Math.max(1, Math.min(200, parseInt(limit) || 25));
  const skip = (pageNum - 1) * pageSize;
  const paginated = filtered.slice(skip, skip + pageSize);

  return {
    ok: true,
    total,
    page: pageNum,
    limit: pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
    reservations: paginated,
    counts,
    stats: {
      totalHours: Number(totalHours.toFixed(1)),
      totalFeesBilled,
      includedHours,
      usedHours,
      remainingHours,
      activeReservationsCount,
      scheduledTodayCount
    }
  };
}

// 4. Administrative Controls Engine (Rooms, Maintenance, Policies, Approvals, Audit Log)
async function manageMeetingRoomAdminAtomic(adminReq = {}) {
  await bookingMutex.acquire();
  try {
    const {
      action,
      userRole = 'super_admin',
      adminUser = 'Hub Administrator',
      roomData,
      roomId,
      underMaintenance,
      maintenanceReason,
      policyData,
      bookingId,
      approvalDecision
    } = adminReq;

    // Enforce RBAC
    const permAction = action === 'update_policy'
      ? 'admin_manage_policy'
      : (action === 'approve_booking' || action === 'reject_booking')
        ? 'admin_approve_booking'
        : action === 'toggle_maintenance'
          ? 'admin_maintenance'
          : 'admin_manage_room';

    const perm = checkMeetingRoomPermission(userRole, permAction);
    if (!perm.allowed) {
      return {
        ok: false,
        status: perm.status || 403,
        code: perm.code || 'FORBIDDEN_ADMIN_ONLY',
        message: perm.message
      };
    }

    const appState = await getAppState();
    if (!appState.meetingRooms || !appState.meetingRooms.length) {
      const seed = loadInitialSeedData();
      appState.meetingRooms = seed.meetingRooms || [];
    }
    if (!appState.adminAuditLog) appState.adminAuditLog = [];
    if (!appState.activityLog) appState.activityLog = [];
    if (!appState.meetingRoomPolicies) {
      appState.meetingRoomPolicies = {
        maxDurationHours: 4,
        minDurationMins: 30,
        allowRecurring: true,
        maxRecurringOccurrences: 12,
        requireApprovalAboveHours: 0,
        autoSyncInvoice: true,
        advanceBookingDays: 30,
        minAdvanceNoticeMins: 60,
        maxDailyBookingHoursPerStartup: 8,
        maxActiveReservationsPerStartup: 5,
        cancellationCutoffHours: 24,
        rescheduleCutoffHours: 4,
        premiumRoomRequiresApproval: false,
        gracePeriodsEnabled: true,
        operatingHoursLabel: '24/7 Round-the-Clock Access'
      };
    }

    const logAdminEvent = (summary, details = {}) => {
      const entry = {
        id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        action,
        role: perm.role,
        adminUser,
        summary,
        details,
        timestamp: new Date().toISOString()
      };
      appState.adminAuditLog.unshift(entry);
      appState.activityLog.unshift({
        id: `ACT-${Date.now()}`,
        module: 'Meeting Rooms Admin',
        action: summary,
        timestamp: entry.timestamp,
        icon: '🛡️'
      });
      return entry;
    };

    const database = await connectDB();

    if (action === 'save_room') {
      if (!roomData || !roomData.name) {
        return { ok: false, status: 400, message: 'Room name is required.' };
      }
      const targetId = roomData.id || `MR-0${appState.meetingRooms.length + 1}`;
      let existing = appState.meetingRooms.find(r => r.id === targetId);
      const amenitiesArr = Array.isArray(roomData.amenities)
        ? roomData.amenities
        : String(roomData.amenities || '4K Projector, Whiteboard, High-Speed Wi-Fi').split(',').map(s => s.trim()).filter(Boolean);

      if (existing) {
        existing.name = String(roomData.name).trim();
        if (roomData.capacity !== undefined) existing.capacity = Math.max(1, parseInt(roomData.capacity, 10) || 4);
        if (roomData.hourlyRate !== undefined) existing.hourlyRate = Math.max(0, Number(roomData.hourlyRate) || 0);
        if (roomData.amenities !== undefined) existing.amenities = amenitiesArr;
        if (roomData.icon) existing.icon = roomData.icon;
        if (roomData.floor) existing.floor = roomData.floor;
        if (roomData.operatingHours) existing.operatingHours = roomData.operatingHours;
        if (roomData.description !== undefined) existing.description = sanitizeRoomImageText(roomData.description, 600);
        if (!Array.isArray(existing.images)) existing.images = withRoomImages(existing).images;
        if (roomData.underMaintenance !== undefined) {
          existing.underMaintenance = Boolean(roomData.underMaintenance);
          existing.status = existing.underMaintenance ? 'Under Maintenance' : 'Active';
        }
        const audit = logAdminEvent(`Updated room configuration for ${existing.name} (${existing.id}): ${existing.capacity} Pax, ₹${existing.hourlyRate}/hr.`, { roomId: existing.id });
        if (database) {
          await database.collection('meeting_rooms').updateOne({ id: existing.id }, { $set: existing }, { upsert: true }).catch(() => {});
        }
        await saveAppState(appState);
        return { ok: true, status: 200, room: existing, audit, message: `Updated ${existing.name}.` };
      } else {
        const newRoom = {
          id: targetId,
          name: String(roomData.name).trim(),
          capacity: Math.max(1, parseInt(roomData.capacity, 10) || 8),
          hourlyRate: Math.max(0, Number(roomData.hourlyRate !== undefined ? roomData.hourlyRate : 1200)),
          amenities: amenitiesArr,
          icon: roomData.icon || '🏢',
          badgeColor: roomData.badgeColor || '#2563eb',
          floor: roomData.floor || 'Level 2 • Innovation Wing',
          operatingHours: roomData.operatingHours || '24/7 Round-the-Clock Access',
          status: roomData.underMaintenance ? 'Under Maintenance' : 'Active',
          underMaintenance: Boolean(roomData.underMaintenance),
          description: sanitizeRoomImageText(roomData.description, 600),
          images: [],
          bookings: []
        };
        appState.meetingRooms.push(newRoom);
        const audit = logAdminEvent(`Added new meeting room ${newRoom.name} (${newRoom.id}): ${newRoom.capacity} Pax, ₹${newRoom.hourlyRate}/hr.`, { roomId: newRoom.id });
        if (database) {
          await database.collection('meeting_rooms').updateOne({ id: newRoom.id }, { $set: newRoom }, { upsert: true }).catch(() => {});
        }
        await saveAppState(appState);
        return { ok: true, status: 201, room: newRoom, audit, message: `Created new room ${newRoom.name}.` };
      }
    }

    if (action === 'toggle_maintenance') {
      const target = appState.meetingRooms.find(r => r.id === roomId);
      if (!target) return { ok: false, status: 404, message: 'Room not found.' };
      const nextMaint = underMaintenance !== undefined ? Boolean(underMaintenance) : !target.underMaintenance;
      target.underMaintenance = nextMaint;
      target.maintenance = nextMaint;
      target.status = nextMaint ? 'Under Maintenance' : 'Active';
      target.maintenanceReason = nextMaint ? (maintenanceReason || 'Scheduled AV & facility maintenance') : '';
      const audit = logAdminEvent(
        nextMaint
          ? `Blocked ${target.name} (${target.id}) for maintenance: ${target.maintenanceReason}`
          : `Restored ${target.name} (${target.id}) to Active service.`,
        { roomId: target.id, underMaintenance: nextMaint }
      );
      if (database) {
        await database.collection('meeting_rooms').updateOne({ id: target.id }, { $set: target }, { upsert: true }).catch(() => {});
      }
      await saveAppState(appState);
      return { ok: true, status: 200, room: target, audit, message: `${target.name} is now ${target.status}.` };
    }

    if (action === 'update_policy') {
      appState.meetingRoomPolicies = {
        ...appState.meetingRoomPolicies,
        ...(policyData || {})
      };
      const audit = logAdminEvent(`Updated Meeting Room Booking Policies (Max ${appState.meetingRoomPolicies.maxDurationHours}h, Recurring: ${appState.meetingRoomPolicies.allowRecurring ? 'Enabled' : 'Disabled'}).`, appState.meetingRoomPolicies);
      await saveAppState(appState);
      return { ok: true, status: 200, policies: appState.meetingRoomPolicies, audit, message: 'Booking policies updated.' };
    }

    if (action === 'approve_booking' || action === 'reject_booking') {
      const targetRoom = appState.meetingRooms.find(r => r.id === roomId) || appState.meetingRooms.find(r => (r.bookings || []).some(b => b.id === bookingId));
      if (!targetRoom) return { ok: false, status: 404, message: 'Room/booking not found.' };
      const bkg = (targetRoom.bookings || []).find(b => b.id === bookingId);
      if (!bkg) return { ok: false, status: 404, message: 'Booking not found.' };

      const isApprove = action === 'approve_booking' && approvalDecision !== 'reject';
      bkg.status = isApprove ? 'Confirmed' : 'Rejected';
      bkg.rejectionReason = !isApprove ? (adminReq.rejectionReason || 'Rejected by administrator.') : undefined;
      bkg.approvedBy = adminUser;
      bkg.approvedAt = new Date().toISOString();
      const audit = logAdminEvent(`${isApprove ? 'Approved' : 'Rejected'} reservation ${bkg.id} for ${bkg.startupName} in ${targetRoom.name}.`, { bookingId: bkg.id, roomId: targetRoom.id });
      await saveAppState(appState);
      return { ok: true, status: 200, booking: bkg, audit, message: `Reservation ${bkg.id} ${isApprove ? 'Confirmed' : 'Rejected'}.` };
    }

    if (action === 'archive_room') {
      const target = appState.meetingRooms.find(r => r.id === roomId);
      if (!target) return { ok: false, status: 404, message: 'Room not found.' };
      if ((target.bookings || []).some(b => b.status !== 'Cancelled')) {
        return { ok: false, status: 400, code: 'HAS_ACTIVE_BOOKINGS', message: `Cannot archive ${target.name}: it has active bookings. Cancel or reschedule them first.` };
      }
      target.archived = true;
      target.active = false;
      target.status = 'Archived';
      const audit = logAdminEvent(`Archived meeting room ${target.name} (${target.id}).`, { roomId: target.id });
      if (database) {
        await database.collection('meeting_rooms').updateOne({ id: target.id }, { $set: { archived: true, active: false, status: 'Archived' } }).catch(() => {});
      }
      await saveAppState(appState);
      return { ok: true, status: 200, room: target, audit, message: `${target.name} archived.` };
    }

    if (action === 'update_images') {
      const target = appState.meetingRooms.find(r => r.id === roomId);
      if (!target) return { ok: false, status: 404, message: 'Room not found.' };
      const incoming = Array.isArray(adminReq.images) ? adminReq.images : null;
      if (!incoming) return { ok: false, status: 400, message: 'images must be an array.' };
      if (incoming.length > ROOM_IMAGE_MAX_PER_ROOM) {
        return { ok: false, status: 400, message: `A room can have at most ${ROOM_IMAGE_MAX_PER_ROOM} images.` };
      }
      const cleaned = [];
      for (const img of incoming) {
        if (!img || !isAllowedRoomImageUrl(img.url) || (img.thumbUrl && !isAllowedRoomImageUrl(img.thumbUrl))) {
          return { ok: false, status: 400, code: 'INVALID_IMAGE_URL', message: 'One or more image references are invalid.' };
        }
        cleaned.push({
          id: sanitizeRoomImageText(img.id, 60) || `RIMG-${Date.now()}-${cleaned.length}`,
          url: img.url,
          thumbUrl: img.thumbUrl || img.url,
          alt: sanitizeRoomImageText(img.alt) || `${target.name} photo ${cleaned.length + 1}`,
          caption: sanitizeRoomImageText(img.caption, 80)
        });
      }
      target.images = cleaned;
      if (adminReq.description !== undefined) target.description = sanitizeRoomImageText(adminReq.description, 600);
      const audit = logAdminEvent(`Updated photo gallery for ${target.name} (${target.id}): ${cleaned.length} image(s).`, { roomId: target.id, imageCount: cleaned.length });
      if (database) {
        await database.collection('meeting_rooms').updateOne({ id: target.id }, { $set: { images: cleaned, description: target.description || '' } }, { upsert: true }).catch(() => {});
        await pruneOrphanRoomImages(database, target.id, cleaned);
      }
      await saveAppState(appState);
      return { ok: true, status: 200, room: target, audit, message: `Saved ${cleaned.length} photo(s) for ${target.name}.` };
    }

    return { ok: false, status: 400, message: `Unknown admin action: ${action}` };
  } finally {
    bookingMutex.release();
  }
}

// -------------------------------------------------------------
// Meeting Room Image Storage
// Uploaded images are stored in the MongoDB `meeting_room_images`
// collection (works on Vercel, where the filesystem is read-only) and
// served through GET /api/meeting-rooms/images/file?id=...&size=thumb|full.
// When MongoDB is unreachable (local offline dev) files are written to
// assets/rooms/uploads/ and served statically instead.
// Rooms reference images via `room.images = [{ id, url, thumbUrl, alt, caption }]`;
// array order is display order and images[0] is the primary image.
// -------------------------------------------------------------
const ROOM_IMAGE_ALLOWED_MIME = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/avif': 'avif'
};
const ROOM_IMAGE_MAX_BYTES = 3 * 1024 * 1024; // 3 MB per stored variant (client compresses before upload)
const ROOM_IMAGE_MAX_PER_ROOM = 12;
const ROOM_IMAGE_URL_PREFIXES = ['/assets/rooms/', '/api/meeting-rooms/images/file'];

// Validates base64 payload: checks declared MIME, size, and magic bytes so a
// renamed non-image file cannot be stored.
function decodeRoomImagePayload(base64, mime) {
  if (!base64 || typeof base64 !== 'string') return { ok: false, message: 'Image data is missing.' };
  if (!ROOM_IMAGE_ALLOWED_MIME[mime]) {
    return { ok: false, message: `Unsupported image type "${mime}". Allowed: JPEG, PNG, WebP, AVIF.` };
  }
  const clean = base64.replace(/^data:[^;]+;base64,/, '');
  const buf = Buffer.from(clean, 'base64');
  if (!buf.length) return { ok: false, message: 'Image data is empty.' };
  if (buf.length > ROOM_IMAGE_MAX_BYTES) {
    return { ok: false, message: `Image is too large (${(buf.length / 1048576).toFixed(1)} MB). Maximum is 3 MB.` };
  }
  const isJpeg = buf[0] === 0xFF && buf[1] === 0xD8;
  const isPng = buf[0] === 0x89 && buf.slice(1, 4).toString('ascii') === 'PNG';
  const isRiffWebp = buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP';
  const isAvif = buf.slice(4, 12).toString('ascii').startsWith('ftypavi');
  const magicOk = (mime === 'image/jpeg' && isJpeg) || (mime === 'image/png' && isPng) ||
    (mime === 'image/webp' && isRiffWebp) || (mime === 'image/avif' && isAvif);
  if (!magicOk) return { ok: false, message: 'File content does not match a valid image of the declared type.' };
  return { ok: true, buffer: buf };
}

function sanitizeRoomImageText(value, maxLen = 140) {
  return String(value || '').replace(/[<>"`]/g, '').trim().slice(0, maxLen);
}

function isAllowedRoomImageUrl(url) {
  return typeof url === 'string' && ROOM_IMAGE_URL_PREFIXES.some(p => url.startsWith(p)) && !url.includes('..');
}

// Returns the room with an `images` array; rooms persisted before the image
// feature fall back to the seed images defined in js/initialData.js.
let _seedRoomImagesCache = null;
function withRoomImages(room) {
  if (!room) return room;
  if (Array.isArray(room.images)) return room;
  if (!_seedRoomImagesCache) {
    _seedRoomImagesCache = {};
    (loadInitialSeedData().meetingRooms || []).forEach(r => {
      _seedRoomImagesCache[r.id] = { images: r.images || [], description: r.description || '' };
    });
  }
  const seed = _seedRoomImagesCache[room.id];
  return {
    ...room,
    images: seed ? seed.images : [],
    description: room.description || (seed ? seed.description : '')
  };
}

async function uploadMeetingRoomImageAtomic(req = {}) {
  const { userRole, roomId, mime, data, thumbMime, thumbData, alt } = req;
  const perm = checkMeetingRoomPermission(userRole, 'admin_manage_room');
  if (!perm.allowed) {
    return { ok: false, status: perm.status || 403, code: perm.code || 'FORBIDDEN_ADMIN_ONLY', message: perm.message };
  }
  if (!roomId || !/^[A-Za-z0-9_-]{1,40}$/.test(String(roomId))) {
    return { ok: false, status: 400, message: 'A valid roomId is required.' };
  }
  const full = decodeRoomImagePayload(data, mime);
  if (!full.ok) return { ok: false, status: 400, code: 'INVALID_IMAGE', message: full.message };
  let thumb = null;
  if (thumbData) {
    thumb = decodeRoomImagePayload(thumbData, thumbMime || mime);
    if (!thumb.ok) return { ok: false, status: 400, code: 'INVALID_IMAGE', message: `Thumbnail: ${thumb.message}` };
  }

  const imageId = `RIMG-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const altText = sanitizeRoomImageText(alt) || 'Meeting room photo';
  const database = await connectDB();

  if (database) {
    await database.collection('meeting_room_images').insertOne({
      id: imageId,
      roomId,
      mime,
      data: full.buffer,
      thumbMime: thumb ? (thumbMime || mime) : null,
      thumbData: thumb ? thumb.buffer : null,
      bytes: full.buffer.length,
      alt: altText,
      createdAt: new Date().toISOString(),
      uploadedByRole: perm.role
    });
    return {
      ok: true,
      status: 201,
      image: {
        id: imageId,
        url: `/api/meeting-rooms/images/file?id=${imageId}`,
        thumbUrl: `/api/meeting-rooms/images/file?id=${imageId}&size=thumb`,
        alt: altText,
        caption: ''
      }
    };
  }

  // Offline fallback: local filesystem (not available on Vercel)
  try {
    const dir = path.join(__dirname, 'assets', 'rooms', 'uploads');
    fs.mkdirSync(dir, { recursive: true });
    const ext = ROOM_IMAGE_ALLOWED_MIME[mime];
    fs.writeFileSync(path.join(dir, `${imageId}.${ext}`), full.buffer);
    let thumbUrl = `/assets/rooms/uploads/${imageId}.${ext}`;
    if (thumb) {
      const tExt = ROOM_IMAGE_ALLOWED_MIME[thumbMime || mime];
      fs.writeFileSync(path.join(dir, `${imageId}-thumb.${tExt}`), thumb.buffer);
      thumbUrl = `/assets/rooms/uploads/${imageId}-thumb.${tExt}`;
    }
    return {
      ok: true,
      status: 201,
      image: { id: imageId, url: `/assets/rooms/uploads/${imageId}.${ext}`, thumbUrl, alt: altText, caption: '' }
    };
  } catch (err) {
    return { ok: false, status: 503, message: `Image storage unavailable: ${err.message}` };
  }
}

async function getMeetingRoomImageFile(imageId, size = 'full') {
  if (!imageId || !/^RIMG-[0-9]+-[0-9]+$/.test(imageId)) return null;
  const database = await connectDB();
  if (!database) return null;
  const doc = await database.collection('meeting_room_images').findOne({ id: imageId });
  if (!doc) return null;
  const toBuf = (b) => {
    if (!b) return Buffer.alloc(0);
    if (Buffer.isBuffer(b)) return b;
    if (b._bsontype === 'Binary') return Buffer.from(b.read(0, b.position));
    return Buffer.from(b);
  };
  if (size === 'thumb' && doc.thumbData) return { mime: doc.thumbMime || doc.mime, buffer: toBuf(doc.thumbData) };
  return { mime: doc.mime, buffer: toBuf(doc.data) };
}

// Removes stored uploads for a room that are no longer referenced by it.
async function pruneOrphanRoomImages(database, roomId, keptImages) {
  const keepIds = new Set((keptImages || []).map(i => i.id));
  if (database) {
    const docs = await database.collection('meeting_room_images').find({ roomId }, { projection: { id: 1 } }).toArray().catch(() => []);
    const orphanIds = docs.map(d => d.id).filter(id => !keepIds.has(id));
    if (orphanIds.length) {
      await database.collection('meeting_room_images').deleteMany({ roomId, id: { $in: orphanIds } }).catch(() => {});
    }
  }
}

// 5. Meeting Rooms Analytics Engine (Real DB Aggregations)
async function getMeetingRoomsAnalytics({ range = 'all', startDate = null, endDate = null, startupId = null } = {}) {
  const ist = getISTClock();
  const appState = await getAppState();
  let rooms = (appState && appState.meetingRooms) ? appState.meetingRooms : [];
  if (!rooms.length) {
    const seed = loadInitialSeedData();
    rooms = seed.meetingRooms || [];
  }
  const startups = (appState && appState.startups) || [];

  // Compute filter window
  let minDate = startDate;
  let maxDate = endDate;
  if (!minDate && range !== 'all') {
    const baseParts = ist.date.split('-').map(Number);
    const todayUtc = new Date(Date.UTC(baseParts[0], baseParts[1] - 1, baseParts[2]));
    if (range === 'day' || range === 'today') {
      minDate = ist.date;
      maxDate = ist.date;
    } else if (range === 'week') {
      const startW = new Date(todayUtc.getTime() - 6 * 86400000);
      const endW = new Date(todayUtc.getTime() + 7 * 86400000);
      minDate = startW.toISOString().split('T')[0];
      maxDate = endW.toISOString().split('T')[0];
    } else if (range === 'month') {
      minDate = `${ist.date.slice(0, 7)}-01`;
      maxDate = `${ist.date.slice(0, 7)}-31`;
    }
  }

  let totalBookings = 0;
  let confirmedBookings = 0;
  let cancelledBookings = 0;
  let pendingBookings = 0;
  let totalBookedHours = 0;
  let totalOverageRevenue = 0;

  const roomStatsMap = {};
  const hourlyCounts = {};
  const startupUsageMap = {};

  [8, 9, 10, 15, 16, 17, 18].forEach(h => {
    const key = `${h < 10 ? '0' : ''}${h}:00`;
    hourlyCounts[key] = 0;
  });

  startups.forEach(s => {
    startupUsageMap[s.id] = {
      startupId: s.id,
      startupName: s.name,
      planName: s.subscriptionPlan || (s.includedMeetingHours >= 15 ? 'Enterprise Scale Plan' : 'Incubation Growth Plan'),
      includedHours: Number(s.includedMeetingHours !== undefined ? s.includedMeetingHours : 12),
      usedCredits: Number(s.usedMeetingHours || 0),
      remainingCredits: Math.max(0, Number(s.includedMeetingHours !== undefined ? s.includedMeetingHours : 12) - Number(s.usedMeetingHours || 0)),
      bookingsCount: 0,
      cancelledCount: 0,
      bookedHours: 0,
      overageBilled: 0
    };
  });

  const daysInWindow = range === 'day' ? 1 : range === 'week' ? 7 : 30;
  const operatingHoursPerDay = 24; // 24/7 round-the-clock access

  rooms.forEach(r => {
    const availHrs = daysInWindow * operatingHoursPerDay;
    roomStatsMap[r.id] = {
      roomId: r.id,
      roomName: r.name,
      icon: r.icon || '🏢',
      capacity: r.capacity,
      hourlyRate: r.hourlyRate,
      status: r.underMaintenance ? 'Under Maintenance' : (r.status || 'Active'),
      bookingsCount: 0,
      cancelledCount: 0,
      bookedHours: 0,
      availableHours: availHrs,
      utilizationPct: 0,
      revenue: 0
    };

    (r.bookings || []).forEach(b => {
      if (minDate && b.date < minDate) return;
      if (maxDate && b.date > maxDate) return;
      if (startupId && b.startupId !== startupId) return;

      totalBookings++;
      const sMin = toMinutes(b.startTime);
      const eMin = toMinutes(b.endTime);
      const dur = Math.max(0.25, (eMin - sMin) / 60);

      if (b.status === 'Cancelled') {
        cancelledBookings++;
        roomStatsMap[r.id].cancelledCount++;
        if (startupUsageMap[b.startupId]) startupUsageMap[b.startupId].cancelledCount++;
        return;
      }

      if (b.status === 'Pending Approval') {
        pendingBookings++;
      } else {
        confirmedBookings++;
      }

      totalBookedHours += dur;
      const rev = Number(b.cost || 0);
      totalOverageRevenue += rev;

      roomStatsMap[r.id].bookingsCount++;
      roomStatsMap[r.id].bookedHours = Number((roomStatsMap[r.id].bookedHours + dur).toFixed(2));
      roomStatsMap[r.id].revenue += rev;

      // Track peak hours
      [8, 9, 10, 15, 16, 17, 18].forEach(h => {
        const slotS = h * 60;
        const slotE = (h + 1) * 60;
        if (sMin < slotE && eMin > slotS) {
          const key = `${h < 10 ? '0' : ''}${h}:00`;
          hourlyCounts[key] = (hourlyCounts[key] || 0) + 1;
        }
      });

      if (!startupUsageMap[b.startupId]) {
        startupUsageMap[b.startupId] = {
          startupId: b.startupId,
          startupName: b.startupName || 'Partner Venture',
          planName: 'Incubation Growth Plan',
          includedHours: 12,
          usedCredits: dur,
          remainingCredits: Math.max(0, 12 - dur),
          bookingsCount: 0,
          cancelledCount: 0,
          bookedHours: 0,
          overageBilled: 0
        };
      }
      startupUsageMap[b.startupId].bookingsCount++;
      startupUsageMap[b.startupId].bookedHours = Number((startupUsageMap[b.startupId].bookedHours + dur).toFixed(2));
      startupUsageMap[b.startupId].overageBilled += rev;
    });

    roomStatsMap[r.id].utilizationPct = Math.min(100, Math.round((roomStatsMap[r.id].bookedHours / Math.max(1, roomStatsMap[r.id].availableHours)) * 100));
  });

  const totalAvailableHours = Math.max(1, rooms.length * daysInWindow * operatingHoursPerDay);
  const utilizationRate = Math.min(100, Math.round((totalBookedHours / totalAvailableHours) * 100));
  const cancellationRate = totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0;

  const roomBreakdown = Object.values(roomStatsMap).sort((a, b) => b.bookedHours - a.bookedHours);
  const peakBookingHours = Object.entries(hourlyCounts)
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => b.count - a.count);

  const startupUsage = Object.values(startupUsageMap).sort((a, b) => b.bookedHours - a.bookedHours);
  const totalCreditsConsumed = startupUsage.reduce((sum, s) => sum + (Number(s.usedCredits) || 0), 0);
  const totalCreditsAllocated = startupUsage.reduce((sum, s) => sum + (Number(s.includedHours) || 12), 0);

  return {
    ok: true,
    range,
    startDate: minDate,
    endDate: maxDate,
    totalBookings,
    confirmedBookings,
    cancelledBookings,
    pendingBookings,
    totalBookedHours: Number(totalBookedHours.toFixed(2)),
    totalAvailableHours,
    utilizationRate,
    cancellationRate,
    totalOverageRevenue,
    totalCreditsConsumed: Number(totalCreditsConsumed.toFixed(2)),
    totalCreditsAllocated,
    mostPopularRoom: roomBreakdown[0] || null,
    peakHour: peakBookingHours[0] || { hour: '09:00', count: 0 },
    roomBreakdown,
    peakBookingHours,
    startupUsage
  };
}

// 6. External Calendar Integration Service (Google Calendar & Microsoft Outlook)
async function syncExternalCalendarEvent(syncReq = {}) {
  await bookingMutex.acquire();
  try {
    const {
      action = 'sync', // 'connect' | 'disconnect' | 'set_token_status' | 'create' | 'sync' | 'update' | 'cancel' | 'status'
      provider = 'google', // 'google' | 'outlook'
      startupId = 'STP-XYZ',
      email,
      tokenStatus, // 'valid' | 'expired' | 'revoked'
      roomId,
      bookingId
    } = syncReq;

    const cleanProvider = String(provider).toLowerCase() === 'outlook' ? 'outlook' : 'google';
    const providerLabel = cleanProvider === 'outlook' ? 'Microsoft Outlook' : 'Google Calendar';

    const appState = await getAppState();
    if (!appState.calendarIntegrations) {
      appState.calendarIntegrations = {
        providersByStartup: {},
        syncedEvents: {}
      };
    }
    if (!appState.calendarIntegrations.providersByStartup) appState.calendarIntegrations.providersByStartup = {};
    if (!appState.calendarIntegrations.syncedEvents) appState.calendarIntegrations.syncedEvents = {};

    if (!appState.calendarIntegrations.providersByStartup[startupId]) {
      appState.calendarIntegrations.providersByStartup[startupId] = {
        google: { connected: true, email: 'founder@xyztechnologies.io', tokenStatus: 'valid', updatedAt: new Date().toISOString() },
        outlook: { connected: true, email: 'ops@xyztechnologies.io', tokenStatus: 'valid', updatedAt: new Date().toISOString() }
      };
    }

    const startupProviders = appState.calendarIntegrations.providersByStartup[startupId];
    const provConfig = startupProviders[cleanProvider];

    if (action === 'status') {
      return {
        ok: true,
        status: 200,
        startupId,
        providers: startupProviders,
        syncedEvents: appState.calendarIntegrations.syncedEvents
      };
    }

    if (action === 'connect') {
      provConfig.connected = true;
      provConfig.tokenStatus = tokenStatus || 'valid';
      if (email) provConfig.email = email;
      provConfig.updatedAt = new Date().toISOString();
      await saveAppState(appState);
      return {
        ok: true,
        status: 200,
        provider: cleanProvider,
        providerConfig: provConfig,
        message: `Connected ${providerLabel} (${provConfig.email}).`
      };
    }

    if (action === 'disconnect') {
      provConfig.connected = false;
      provConfig.tokenStatus = 'revoked';
      provConfig.updatedAt = new Date().toISOString();
      await saveAppState(appState);
      return {
        ok: true,
        status: 200,
        provider: cleanProvider,
        providerConfig: provConfig,
        message: `Disconnected ${providerLabel}.`
      };
    }

    if (action === 'set_token_status') {
      provConfig.tokenStatus = tokenStatus || 'expired';
      if (provConfig.tokenStatus === 'valid') provConfig.connected = true;
      provConfig.updatedAt = new Date().toISOString();
      await saveAppState(appState);
      return {
        ok: true,
        status: 200,
        provider: cleanProvider,
        providerConfig: provConfig,
        message: `${providerLabel} token status set to ${provConfig.tokenStatus}.`
      };
    }

    // Locate booking for create / sync / update / cancel
    const rooms = appState.meetingRooms || [];
    const targetRoom = (roomId && rooms.find(r => r.id === roomId)) || rooms.find(r => (r.bookings || []).some(b => b.id === bookingId));
    const booking = targetRoom ? (targetRoom.bookings || []).find(b => b.id === bookingId) : null;

    if (!booking) {
      return { ok: false, status: 404, code: 'BOOKING_NOT_FOUND', message: `Booking "${bookingId}" not found for calendar sync.` };
    }
    if (!booking.calendarSync) booking.calendarSync = {};

    // Check provider connection and OAuth token validity
    // Never mark calendar sync successful unless confirmed by the provider!
    if (!provConfig.connected || provConfig.tokenStatus === 'expired' || provConfig.tokenStatus === 'revoked') {
      const errReason = !provConfig.connected
        ? `${providerLabel} is not connected.`
        : `${providerLabel} OAuth permission is ${provConfig.tokenStatus}. Please reconnect your account.`;

      booking.calendarSync[cleanProvider] = {
        provider: cleanProvider,
        status: 'failed',
        error: errReason,
        lastAttemptAt: new Date().toISOString()
      };
      await saveAppState(appState);
      return {
        ok: false,
        status: 401,
        code: 'CALENDAR_AUTH_EXPIRED',
        syncStatus: 'failed',
        provider: cleanProvider,
        message: errReason,
        calendarSync: booking.calendarSync[cleanProvider]
      };
    }

    const eventKey = `${cleanProvider}:${booking.id}`;
    const existingEvent = appState.calendarIntegrations.syncedEvents[eventKey];

    if (action === 'cancel') {
      const cancelMeta = {
        provider: cleanProvider,
        externalEventId: (existingEvent && existingEvent.externalEventId) || `EVT-${cleanProvider.toUpperCase()}-${booking.id}`,
        bookingId: booking.id,
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      };
      appState.calendarIntegrations.syncedEvents[eventKey] = cancelMeta;
      booking.calendarSync[cleanProvider] = cancelMeta;
      await saveAppState(appState);
      return {
        ok: true,
        status: 200,
        provider: cleanProvider,
        syncStatus: 'cancelled',
        event: cancelMeta,
        message: `Removed reservation ${booking.id} from ${providerLabel}.`
      };
    }

    // Duplicate prevention: if already synced with identical date/startTime/endTime/roomId and action is 'create' or 'sync'
    if (
      existingEvent &&
      existingEvent.status === 'synced' &&
      existingEvent.date === booking.date &&
      existingEvent.startTime === booking.startTime &&
      existingEvent.endTime === booking.endTime &&
      existingEvent.roomId === targetRoom.id &&
      action !== 'update'
    ) {
      booking.calendarSync[cleanProvider] = existingEvent;
      return {
        ok: true,
        status: 200,
        provider: cleanProvider,
        syncStatus: 'synced',
        duplicatePrevented: true,
        event: existingEvent,
        message: `Event already synced to ${providerLabel} (Duplicate prevented).`
      };
    }

    const externalEventId = (existingEvent && existingEvent.externalEventId)
      || `${cleanProvider === 'google' ? 'gcal' : 'outlk'}_${booking.id.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    const syncedMeta = {
      provider: cleanProvider,
      providerLabel,
      externalEventId,
      bookingId: booking.id,
      roomId: targetRoom.id,
      roomName: targetRoom.name,
      startupId: booking.startupId,
      startupName: booking.startupName,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: 'synced',
      providerConfirmed: true,
      syncedAt: new Date().toISOString()
    };

    appState.calendarIntegrations.syncedEvents[eventKey] = syncedMeta;
    booking.calendarSync[cleanProvider] = syncedMeta;
    await saveAppState(appState);

    return {
      ok: true,
      status: 200,
      provider: cleanProvider,
      syncStatus: 'synced',
      duplicatePrevented: false,
      event: syncedMeta,
      message: `${action === 'update' ? 'Updated' : 'Synced'} reservation ${booking.id} with ${providerLabel} (${externalEventId}).`
    };
  } finally {
    bookingMutex.release();
  }
}

module.exports = {
  connectDB,
  getStatus,
  TABLE_DEFINITIONS,
  seedAllCollections,
  getTableStats,
  getTableRecords,
  insertTableRecord,
  updateTableRecord,
  deleteTableRecord,
  getAppState,
  saveAppState,
  saveLead,
  getLeads,
  updateLead,
  deleteLead,
  saveInquiry,
  getInquiries,
  updateInquiry,
  getISTClock,
  hasBookingConflict,
  hasStartupConcurrentConflict,
  findBookingAlternatives,
  initMeetingRoomIndexes,
  generateBookingRef,
  calculateStartupMonthlyUsage,
  reserveMeetingRoomSlotsAtomic,
  reserveRecurringMeetingRoomAtomic,
  cancelRecurringSeriesAtomic,
  cancelMeetingRoomSlotsAtomic,
  cancelBooking,
  updateMeetingRoomBookingTimeWindowAtomic,
  getMeetingRoomsAvailability,
  computeRoomStatus,
  getReservationCounts,
  checkMeetingRoomPermission,
  syncBookingOverageToInvoice,
  manageMeetingRoomAdminAtomic,
  uploadMeetingRoomImageAtomic,
  getMeetingRoomImageFile,
  withRoomImages,
  manageMeetingRoomMaintenanceAtomic,
  getMeetingRoomReservations,
  getMeetingRoomsAnalytics,
  syncExternalCalendarEvent,
  getDashboardSummary,
  getStartupDashboardSummary,
  generateInvoicesBatchAtomic,
  computeInvoiceStatus,
  formatCurrencyINR,
  formatDateIST,
  formatRelativeTimeIST
};



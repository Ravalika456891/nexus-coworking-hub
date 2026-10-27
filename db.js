// MongoDB Connection & Data Layer
require('dotenv').config();
const dns = require('dns');
const path = require('path');
const fs = require('fs');
const vm = require('vm');

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
  { name: 'activity_logs', label: 'Activity & Audit Log', icon: '📜', sourceKey: 'activityLog', description: 'System audit logs, automated triggers & event history' }
];

async function connectDB() {
  if (!MONGODB_URI || MONGODB_URI.includes('<db_username>')) {
    lastError = 'MongoDB URI contains placeholder <db_username>. Please provide your database username.';
    console.warn(`⚠️ [MongoDB] ${lastError}`);
    return null;
  }

  try {
    if (client && isConnected) return db;

    client = new MongoClient(MONGODB_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: false,
        deprecationErrors: true,
      },
      serverSelectionTimeoutMS: 8000
    });

    await client.connect();
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
  const database = await connectDB();
  if (!database) return { ok: false, error: 'Database disconnected' };

  const validTable = TABLE_DEFINITIONS.find(t => t.name === tableName);
  if (!validTable) return { ok: false, error: `Invalid table: ${tableName}` };

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
// Existing Helpers Preserved
// -------------------------------------------------------------
async function getAppState() {
  const database = await connectDB();
  if (!database) return null;
  const col = database.collection('app_state');
  const doc = await col.findOne({ _id: 'current_state' });
  return doc ? doc.state : null;
}

async function saveAppState(state) {
  const database = await connectDB();
  if (!database) return false;
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
function hasBookingConflict(existing, newB) {
  if (!existing || !newB) return false;
  if (existing.roomId !== newB.roomId) return false;
  if (existing.date !== newB.date) return false;
  if (existing.status === 'Cancelled') return false;
  if (existing.id && newB.id && existing.id === newB.id) return false;
  return (existing.startTime < newB.endTime && existing.endTime > newB.startTime);
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
  return (existing.startTime < newB.endTime && existing.endTime > newB.startTime);
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
  const startMin = toMinutes(req.startTime);
  const endMin = toMinutes(req.endTime);

  const targetRoom = allRooms.find(r => r.id === req.roomId) || allRooms[0];
  const otherRooms = allRooms.filter(r => r.id !== targetRoom.id);

  const ist = getISTClock();
  const reqDate = req.date || ist.date;
  const isToday = (reqDate === ist.date);

  // Standard slot candidates:
  const standardSlots = [
    { start: '08:00', end: '09:00' },
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '15:00', end: '16:00' },
    { start: '16:00', end: '17:00' },
    { start: '17:00', end: '18:00' },
    { start: '18:00', end: '19:00' }
  ];

  // 1. Next free slot in the same room on the same day
  const targetBookings = (targetRoom.bookings || []).filter(b => b.date === reqDate && b.status !== 'Cancelled');
  for (const s of standardSlots) {
    if (alternatives.length >= 1) break;
    if (s.start === req.startTime) continue;
    if (isToday && toMinutes(s.start) <= ist.minutes) continue;

    const conflicts = targetBookings.some(b => s.start < b.endTime && s.end > b.startTime);
    if (!conflicts) {
      alternatives.push({
        type: 'same_room_next_slot',
        roomId: targetRoom.id,
        roomName: targetRoom.name,
        date: reqDate,
        startTime: s.start,
        endTime: s.end,
        label: `Next free slot in ${targetRoom.name} (${s.start} - ${s.end})`,
        capacity: targetRoom.capacity,
        hourlyRate: targetRoom.hourlyRate
      });
    }
  }

  // 2. Free slot at the same time in other room (if capacity fits attendees)
  const reqAttendees = parseInt(req.attendees || 4, 10);
  for (const other of otherRooms) {
    if (alternatives.length >= 2) break;
    if (other.capacity >= reqAttendees) {
      const otherBookings = (other.bookings || []).filter(b => b.date === reqDate && b.status !== 'Cancelled');
      const conflicts = otherBookings.some(b => req.startTime < b.endTime && req.endTime > b.startTime);
      if (!conflicts) {
        alternatives.push({
          type: 'other_room_same_time',
          roomId: other.id,
          roomName: other.name,
          date: reqDate,
          startTime: req.startTime,
          endTime: req.endTime,
          label: `${other.name} (${other.capacity} pax) at ${req.startTime} - ${req.endTime}`,
          capacity: other.capacity,
          hourlyRate: other.hourlyRate
        });
      }
    }
  }

  // 3. Same slot on the next day
  if (alternatives.length < 3) {
    const dParts = reqDate.split('-').map(Number);
    const nextD = new Date(Date.UTC(dParts[0], dParts[1] - 1, dParts[2] + 1));
    const nextDateStr = nextD.toISOString().split('T')[0];
    const nextDayBookings = (targetRoom.bookings || []).filter(b => b.date === nextDateStr && b.status !== 'Cancelled');
    const conflictsNextDay = nextDayBookings.some(b => req.startTime < b.endTime && req.endTime > b.startTime);

    if (!conflictsNextDay) {
      alternatives.push({
        type: 'same_room_next_day',
        roomId: targetRoom.id,
        roomName: targetRoom.name,
        date: nextDateStr,
        startTime: req.startTime,
        endTime: req.endTime,
        label: `Tomorrow (${nextDateStr}) at ${req.startTime} - ${req.endTime} in ${targetRoom.name}`,
        capacity: targetRoom.capacity,
        hourlyRate: targetRoom.hourlyRate
      });
    }
  }

  // Fallback: fill up to 3 with any available slot on same or next day
  if (alternatives.length < 3) {
    for (const s of standardSlots) {
      if (alternatives.length >= 3) break;
      if (alternatives.some(a => a.roomId === targetRoom.id && a.date === reqDate && a.startTime === s.start)) continue;
      if (isToday && toMinutes(s.start) <= ist.minutes) continue;
      const conflicts = targetBookings.some(b => s.start < b.endTime && s.end > b.startTime);
      if (!conflicts) {
        alternatives.push({
          type: 'same_room_additional_slot',
          roomId: targetRoom.id,
          roomName: targetRoom.name,
          date: reqDate,
          startTime: s.start,
          endTime: s.end,
          label: `${targetRoom.name} at ${s.start} - ${s.end}`,
          capacity: targetRoom.capacity,
          hourlyRate: targetRoom.hourlyRate
        });
      }
    }
  }

  return alternatives.slice(0, 3);
}

// Atomic Reservation Function with In-Process Mutex + MongoDB Unique Slot Index
async function reserveMeetingRoomSlotsAtomic(bookingReq) {
  await bookingMutex.acquire();
  try {
    const { roomId, startupId, startupName, title, date, startTime, endTime, attendees, cost } = bookingReq;

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

    // 2. Past Date / Slot Rejection (Using IST Server Clock):
    if (date < ist.date) {
      return { ok: false, status: 400, message: `Cannot book past dates. Current IST date is ${ist.date}.` };
    }
    if (date === ist.date && startMin < ist.minutes) {
      return { ok: false, status: 400, message: `Cannot book past time slots. Current IST time is ${ist.time}.` };
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
    if (reqAttendees > room.capacity) {
      return { ok: false, status: 400, message: `Attendees (${reqAttendees}) exceed ${room.name} capacity of ${room.capacity} pax.` };
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

    // 5. Construct Confirmed Booking Object:
    const bookingId = `BKG-${Math.floor(100 + Math.random() * 900)}`;
    const newBooking = {
      id: bookingId,
      startupId,
      startupName: startupName || 'Partner Venture',
      title: title || 'Strategic Planning Session',
      date,
      startTime,
      endTime,
      attendees: reqAttendees,
      cost: Number(cost || 0),
      status: 'Confirmed',
      createdAt: new Date().toISOString()
    };

    if (!room.bookings) room.bookings = [];
    room.bookings.push(newBooking);

    // 6. Persist to MongoDB (both meeting_rooms collection and meeting_room_slots)
    const database = await connectDB();
    if (database) {
      try {
        await initMeetingRoomIndexes();
        const slotsCol = database.collection('meeting_room_slots');

        // Insert slot records for each 1-hr interval bucket covered
        const startH = Math.floor(startMin / 60);
        const endH = Math.ceil(endMin / 60);
        const slotDocs = [];
        for (let h = startH; h < endH; h++) {
          const slotHour = `${h < 10 ? '0' : ''}${h}:00`;
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

        // Try inserting slot docs (partial unique index will abort on race condition)
        for (const sDoc of slotDocs) {
          await slotsCol.insertOne(sDoc);
        }

        // Update room document in meeting_rooms collection
        const mrCol = database.collection('meeting_rooms');
        await mrCol.updateOne({ id: roomId }, { $set: { bookings: room.bookings } }, { upsert: true });
      } catch (dbErr) {
        // If duplicate key error on slot hour
        if (dbErr.code === 11000) {
          const alternatives = findBookingAlternatives(rooms, { roomId, date, startTime, endTime, attendees: reqAttendees, startupId });
          return {
            ok: false,
            status: 409,
            code: 'SLOT_TAKEN',
            message: 'This slot was just booked by another startup. Pick another time below.',
            alternatives
          };
        }
        console.warn('⚠️ [MongoDB] Slot insert warning:', dbErr.message);
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
      message: `Successfully booked ${room.name}!`
    };
  } finally {
    bookingMutex.release();
  }
}

// Atomic Cancellation Function
async function cancelMeetingRoomSlotsAtomic(roomId, bookingId) {
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

    const booking = (room.bookings || []).find(b => b.id === bookingId);
    if (!booking) return { ok: false, status: 404, message: 'Booking not found.' };

    booking.status = 'Cancelled';
    booking.cancelledAt = new Date().toISOString();

    const database = await connectDB();
    if (database) {
      try {
        const slotsCol = database.collection('meeting_room_slots');
        await slotsCol.updateMany({ roomId, bookingId }, { $set: { status: 'Cancelled' } });
        const mrCol = database.collection('meeting_rooms');
        await mrCol.updateOne({ id: roomId }, { $set: { bookings: room.bookings } });
      } catch (dbErr) {
        console.warn('⚠️ [MongoDB] Slot cancellation warning:', dbErr.message);
      }
    }

    if (appState) {
      appState.meetingRooms = rooms;
      if (!appState.activityLog) appState.activityLog = [];
      appState.activityLog.unshift({
        id: `ACT-${Date.now()}`,
        module: 'Meeting Rooms',
        action: `Cancelled booking for ${room.name} (${booking.title}).`,
        timestamp: new Date().toISOString(),
        icon: '❌'
      });
      await saveAppState(appState);
    }

    return { ok: true, status: 200, message: 'Booking cancelled successfully.' };
  } finally {
    bookingMutex.release();
  }
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

  const result = rooms.map(r => ({
    id: r.id,
    name: r.name,
    capacity: r.capacity,
    hourlyRate: r.hourlyRate,
    amenities: r.amenities,
    icon: r.icon,
    badgeColor: r.badgeColor,
    bookings: (r.bookings || []).filter(b => b.date === targetDate && b.status !== 'Cancelled')
  }));

  return {
    ok: true,
    date: targetDate,
    istClock: { date: ist.date, time: ist.time },
    rooms: result
  };
}

// Atomic Time Window Update for Existing Reservation
async function updateMeetingRoomBookingTimeWindowAtomic({ roomId, bookingId, date, startTime, endTime }) {
  await bookingMutex.acquire();
  try {
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

    const room = rooms.find(r => r.id === roomId);
    if (!room) return { ok: false, status: 404, message: 'Room not found.' };

    const booking = (room.bookings || []).find(b => b.id === bookingId);
    if (!booking) return { ok: false, status: 404, message: 'Booking not found.' };

    // Check conflict against other bookings in this room (excluding current booking)
    const conflict = (room.bookings || []).find(b => {
      if (b.id === bookingId) return false;
      return hasBookingConflict({ ...b, roomId }, { roomId, date, startTime, endTime });
    });

    if (conflict) {
      const alternatives = findBookingAlternatives(rooms, { roomId, date, startTime, endTime, attendees: booking.attendees, startupId: booking.startupId });
      return {
        ok: false,
        status: 409,
        code: 'SLOT_TAKEN',
        message: `${room.name} is already booked from ${conflict.startTime} to ${conflict.endTime} by another startup.`,
        alternatives
      };
    }

    // Check multi-room conflict for startup
    for (const r of rooms) {
      if (r.id === roomId) continue;
      const otherConflict = (r.bookings || []).find(b => {
        return hasStartupConcurrentConflict({ ...b, roomId: r.id }, { roomId, startupId: booking.startupId, date, startTime, endTime });
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

    // Update booking time window
    booking.date = date;
    booking.startTime = startTime;
    booking.endTime = endTime;
    booking.updatedAt = new Date().toISOString();

    const durationHrs = Math.max(0.25, (endMin - startMin) / 60);
    if (booking.cost > 0) {
      booking.cost = Math.round(durationHrs * room.hourlyRate);
    }

    const database = await connectDB();
    if (database) {
      try {
        const mrCol = database.collection('meeting_rooms');
        await mrCol.updateOne({ id: roomId }, { $set: { bookings: room.bookings } });
      } catch (err) {
        console.warn('⚠️ [MongoDB] update warning:', err.message);
      }
    }

    if (appState) {
      appState.meetingRooms = rooms;
      await saveAppState(appState);
    }

    return {
      ok: true,
      status: 200,
      booking,
      message: `Time window successfully updated to ${startTime} – ${endTime}!`
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
  reserveMeetingRoomSlotsAtomic,
  cancelMeetingRoomSlotsAtomic,
  updateMeetingRoomBookingTimeWindowAtomic,
  getMeetingRoomsAvailability,
  getDashboardSummary,
  generateInvoicesBatchAtomic,
  computeInvoiceStatus,
  formatCurrencyINR,
  formatDateIST,
  formatRelativeTimeIST
};



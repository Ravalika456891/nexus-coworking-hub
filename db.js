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
  updateInquiry
};

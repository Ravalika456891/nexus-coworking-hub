// MongoDB Connection & Data Layer
require('dotenv').config();
const dns = require('dns');

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

const MONGODB_URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.MONGODB_DB_NAME || 'nexus_hub';

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
    error: lastError
  };
}

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

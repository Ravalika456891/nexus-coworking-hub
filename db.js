// MongoDB Connection & Data Layer
require('dotenv').config();
const dns = require('dns');

// On Windows, ensure Atlas SRV resolution works across ISP/local DNS
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if custom DNS cannot be set
}

const { MongoClient, ServerApiVersion } = require('mongodb');

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
  await col.insertOne({ ...lead, createdAt: new Date() });
  return true;
}

async function saveInquiry(inquiry) {
  const database = await connectDB();
  if (!database) return false;
  const col = database.collection('inquiries');
  await col.insertOne({ ...inquiry, createdAt: new Date() });
  return true;
}

module.exports = {
  connectDB,
  getStatus,
  getAppState,
  saveAppState,
  saveLead,
  saveInquiry
};

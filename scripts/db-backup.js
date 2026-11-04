const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}
require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'nexus_hub';

async function backup() {
  console.log(`📦 [DB-Backup] Connecting to MongoDB Atlas: ${DB_NAME}...`);
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db = client.db(DB_NAME);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups', `atlas-backup-${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  const collections = await db.listCollections().toArray();
  console.log(`📦 Found ${collections.length} collections to dump.`);

  const metadata = {
    timestamp: new Date().toISOString(),
    sourceDatabase: DB_NAME,
    collections: {}
  };

  for (const c of collections) {
    const colName = c.name;
    const docs = await db.collection(colName).find({}).toArray();
    const filePath = path.join(backupDir, `${colName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf8');
    metadata.collections[colName] = docs.length;
    console.log(`  ✓ Dumped ${colName}: ${docs.length} documents -> ${filePath}`);
  }

  fs.writeFileSync(path.join(backupDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf8');
  console.log(`\n✅ [DB-Backup] Full Atlas backup successfully completed at: ${backupDir}`);
  await client.close();
}

backup().catch(err => {
  console.error('❌ [DB-Backup] Backup failed:', err);
  process.exit(1);
});


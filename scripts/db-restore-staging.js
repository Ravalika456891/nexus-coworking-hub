const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}
require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
const STAGING_DB = 'nexus_hub_staging';

async function restoreToStaging() {
  console.log(`🚀 [Staging Setup] Connecting to MongoDB Atlas: ${STAGING_DB}...`);
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db = client.db(STAGING_DB);

  // Find latest backup
  const backupsRoot = path.join(__dirname, '..', 'backups');
  const dirs = fs.readdirSync(backupsRoot)
    .filter(d => d.startsWith('atlas-backup-'))
    .sort();
  if (dirs.length === 0) throw new Error('No backups found');
  const latestBackupDir = path.join(backupsRoot, dirs[dirs.length - 1]);
  console.log(`📦 Using backup: ${latestBackupDir}`);

  const files = fs.readdirSync(latestBackupDir).filter(f => f.endsWith('.json') && f !== 'metadata.json');

  for (const f of files) {
    const colName = f.replace('.json', '');
    const data = JSON.parse(fs.readFileSync(path.join(latestBackupDir, f), 'utf8'));
    const col = db.collection(colName);
    await col.deleteMany({});
    if (data.length > 0) {
      await col.insertMany(data);
    }
    console.log(`  ✓ Restored to staging: ${colName} (${data.length} docs)`);
  }

  console.log(`\n✅ [Staging Setup] Successfully cloned staging database: ${STAGING_DB}`);
  await client.close();
}

restoreToStaging().catch(err => {
  console.error('❌ [Staging Setup] Failed:', err);
  process.exit(1);
});


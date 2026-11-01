const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pub = path.join(root, 'public');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function copyFile(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

// 1. Sync directories
copyDir(path.join(root, 'css'), path.join(pub, 'css'));
copyDir(path.join(root, 'js'), path.join(pub, 'js'));
copyDir(path.join(root, 'assets'), path.join(pub, 'assets'));

// 2. Sync root files
copyFile(path.join(root, 'app.html'), path.join(pub, 'app.html'));
copyFile(path.join(root, 'meeting-rooms.html'), path.join(pub, 'meeting-rooms.html'));
copyFile(path.join(root, 'meeting-rooms.html'), path.join(pub, 'index.html'));
copyFile(path.join(root, 'index.html'), path.join(pub, 'landing.html'));
copyFile(path.join(root, 'cancellation.js'), path.join(pub, 'cancellation.js'));

// Remove conflicting directory folders if they exist to prevent cleanUrls loops
const appDir = path.join(pub, 'app');
if (fs.existsSync(appDir)) {
  fs.rmSync(appDir, { recursive: true, force: true });
}
const mrDir = path.join(pub, 'meeting-rooms');
if (fs.existsSync(mrDir)) {
  fs.rmSync(mrDir, { recursive: true, force: true });
}

console.log('✅ [sync-public] Successfully synchronized all static assets to public/');

const fs = require('fs');
const s = fs.readFileSync('js/store.js', 'utf8');

const idx = s.indexOf('getWorkspaces()');
console.log(s.slice(idx, idx + 1200));

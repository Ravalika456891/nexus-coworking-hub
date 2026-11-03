const fs = require('fs');
const html = fs.readFileSync('app.html', 'utf8');
const lines = html.split('\n');
lines.forEach((l, i) => {
  if (l.includes('meetingRooms') || l.includes('calendar') || l.includes('Calendar')) {
    if (l.includes('data-tab') || l.includes('nav-') || l.includes('switchTab')) {
      console.log((i+1) + ': ' + l.trim());
    }
  }
});


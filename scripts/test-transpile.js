const fs = require('fs');
const html = fs.readFileSync('meeting-rooms.html', 'utf8');
const scriptMatch = html.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('No script found');
  process.exit(1);
}
console.log('Script length:', scriptMatch[1].length);

// Let's check for any unterminated template strings or syntax issues
const lines = scriptMatch[1].split('\n');
console.log('Total lines in script:', lines.length);

// Check if there are unescaped backticks or missing brackets
let openBraces = 0;
let openParens = 0;
let openBrackets = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // naive check
}
console.log('Done naive check');


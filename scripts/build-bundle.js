const fs = require('fs');
const path = require('path');
const vm = require('vm');

async function build() {
  console.log('Building meeting-rooms bundle...');
  const babelRes = await fetch('https://unpkg.com/@babel/standalone/babel.min.js');
  const babelCode = await babelRes.text();

  const sandbox = {
    window: {},
    navigator: { userAgent: 'node' },
    console: console,
    location: { href: 'http://localhost' }
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(babelCode, sandbox);

  const Babel = sandbox.Babel || sandbox.window.Babel;

  const html = fs.readFileSync('meeting-rooms.html', 'utf8');
  const scriptMatch = html.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);

  if (!scriptMatch) {
    console.error('No script found in meeting-rooms.html');
    process.exit(1);
  }

  const jsxCode = scriptMatch[1];
  console.log('Compiling JSX of size:', jsxCode.length);

  const output = Babel.transform(jsxCode, {
    presets: ['react', 'env'],
    filename: 'meeting-rooms.jsx'
  });

  const bundleCode = output.code + '\nwindow._nexusHubMounted = true;\n';
  console.log('Compiled JS bundle size:', bundleCode.length);

  // Write to both js/ and public/js/
  fs.mkdirSync('js', { recursive: true });
  fs.mkdirSync('public/js', { recursive: true });
  fs.writeFileSync('js/meeting-rooms-bundle.js', bundleCode, 'utf8');
  fs.writeFileSync('public/js/meeting-rooms-bundle.js', bundleCode, 'utf8');

  console.log('✅ Created js/meeting-rooms-bundle.js successfully!');
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});

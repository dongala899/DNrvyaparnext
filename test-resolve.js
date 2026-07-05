const fs = require('fs');
const resolved = require.resolve('electron');
fs.writeFileSync('test-resolve.log', JSON.stringify({
  resolved,
  exists: fs.existsSync(resolved),
  isFile: fs.existsSync(resolved) ? fs.statSync(resolved).isFile() : false,
}, null, 2));

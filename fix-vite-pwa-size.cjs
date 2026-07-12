const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');

code = code.replace("manifest: {", "workbox: {\n          maximumFileSizeToCacheInBytes: 5000000\n        },\n        manifest: {");

fs.writeFileSync('vite.config.ts', code);
console.log("Fixed vite.config.ts for PWA size limit");

const http = require('http');

http.get('http://localhost:3000/api/submissions/JA-2026-UNKNOWN', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
});

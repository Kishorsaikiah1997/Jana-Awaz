const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

if (!code.includes('theme-color')) {
  code = code.replace('<title>Jana Awaz - Citizen Grievance Portal</title>', 
  '<title>Jana Awaz - Citizen Grievance Portal</title>\n    <meta name="theme-color" content="#FFFEF7">\n    <meta name="apple-mobile-web-app-capable" content="yes">\n    <meta name="apple-mobile-web-app-status-bar-style" content="default">');
  
  fs.writeFileSync('index.html', code);
  console.log("Fixed index.html");
}

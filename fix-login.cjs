const fs = require('fs');
let code = fs.readFileSync('src/LoginPage.tsx', 'utf8');

code = code.replace(
  'placeholder="name@sansad.nic.in"',
  'placeholder="mp@example.com"'
);

fs.writeFileSync('src/LoginPage.tsx', code);
console.log("Fixed placeholder in LoginPage.tsx");

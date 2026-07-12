const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const divStart = code.indexOf('<div className="flex flex-col items-center gap-3" data-html2canvas-ignore>');
if (divStart > -1) {
  const divEnd = code.indexOf('</div>', divStart) + 6;
  code = code.substring(0, divStart) + code.substring(divEnd);
}

// Remove Download icon import
code = code.replace(/  Download, \n/g, "");

fs.writeFileSync('src/App.tsx', code);
console.log("Fixed App JSX and imports");

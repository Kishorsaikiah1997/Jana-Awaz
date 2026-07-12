const fs = require('fs');
let code = fs.readFileSync('src/Dashboard.tsx', 'utf8');

const buttonStart = code.indexOf('<button \n                 onClick={async () => {\n                   try {\n                     const dataUrl = await htmlToImage.toPng');
if (buttonStart > -1) {
  const buttonEnd = code.indexOf('</button>', buttonStart) + 9;
  code = code.substring(0, buttonStart) + code.substring(buttonEnd);
}

// Remove htmlToImage import
code = code.replace(/import \* as htmlToImage from 'html-to-image';\n/g, "");
// Remove Download from lucide-react
code = code.replace(/, Download /g, "");

fs.writeFileSync('src/Dashboard.tsx', code);
console.log("Fixed Dashboard.tsx");

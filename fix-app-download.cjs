const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove imports
code = code.replace(/import \{ jsPDF \} from "jspdf";\n/g, "");
code = code.replace(/import \* as htmlToImage from "html-to-image";\n/g, "");

// Remove Download icon if possible, but let's just do text replacements for functions

// 1. Remove handleDownloadReceipt and handleDownloadPDF
const func1Start = code.indexOf('  const handleDownloadReceipt = () => {');
if (func1Start > -1) {
  const func1End = code.indexOf('  };', func1Start) + 4;
  code = code.substring(0, func1Start) + code.substring(func1End);
}

const func2Start = code.indexOf('  const handleDownloadPDF = async () => {');
if (func2Start > -1) {
  // Find the end of handleDownloadPDF
  const func2End = code.indexOf('  const handleSubmit = ', func2Start);
  if (func2End > -1) {
    code = code.substring(0, func2Start) + code.substring(func2End);
  }
}

// 2. Remove Download Page Button (header)
const btnStart = code.indexOf('{/* Download Page Button */}');
if (btnStart > -1) {
  const btnEnd = code.indexOf('</button>', btnStart) + 9;
  if (btnEnd > btnStart) {
    code = code.substring(0, btnStart) + code.substring(btnEnd);
  }
}

// 3. Remove isDownloadingScreen state
const stateStart = code.indexOf('const [isDownloadingScreen, setIsDownloadingScreen] = useState(false);');
if (stateStart > -1) {
  code = code.replace('  const [isDownloadingScreen, setIsDownloadingScreen] = useState(false);\n', '');
}

fs.writeFileSync('src/App.tsx', code);
console.log("Fixed App.tsx functions and header button");

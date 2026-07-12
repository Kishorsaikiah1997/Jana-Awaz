const fs = require('fs');
let code = fs.readFileSync('src/ReceiptPage.tsx', 'utf8');

const funcStart = code.indexOf('  const handleDownloadPDF = async () => {');
if (funcStart > -1) {
  const funcEnd = code.indexOf('  const handlePrint = () => {');
  if (funcEnd > -1) {
    // If handlePrint exists, we just replace it. Let's check if it exists.
  } else {
    // We will replace handleDownloadPDF with a simple window.print() 
    const endStr = '    } finally {\n      setIsGeneratingPdf(false);\n    }\n  };';
    const endPos = code.indexOf(endStr, funcStart) + endStr.length;
    if (endPos > funcStart) {
      const newFunc = `  const handleDownloadPDF = () => {
    window.print();
  };`;
      code = code.substring(0, funcStart) + newFunc + code.substring(endPos);
    }
  }
}

fs.writeFileSync('src/ReceiptPage.tsx', code);
console.log("Fixed ReceiptPage.tsx");

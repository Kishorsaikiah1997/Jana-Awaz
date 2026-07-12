const fs = require('fs');
let code = fs.readFileSync('src/ReceiptPage.tsx', 'utf8');

if (!code.includes('import { QRCodeSVG } from "qrcode.react";')) {
  code = code.replace("import { db } from './firebase';", "import { db } from './firebase';\nimport { QRCodeSVG } from 'qrcode.react';");
}

let trackingUrl = 'const trackingUrl = window.location.origin + "/?track=" + refId;';
if (!code.includes('const trackingUrl =')) {
  code = code.replace("const refId = submission.formatted_tracking_id || submission.id;", trackingUrl + "\n  const refId = submission.formatted_tracking_id || submission.id;");
}

let qrCodeBox = `
        <div className="flex-1 flex justify-center">
          <div className="border border-black p-2 text-center w-[120px] flex flex-col items-center">
            <div className="text-[7pt] font-bold mb-1">SCAN TO TRACK</div>
            <QRCodeSVG value={trackingUrl} size={70} level="M" />
            <div className="text-[6pt] mt-1 font-bold">{refId}</div>
          </div>
        </div>`;

code = code.replace(
  /<div className="flex-1 flex justify-center">\s*<div className="border border-black p-2 text-center w-\[120px\]">\s*<div className="text-\[7pt\] font-bold mb-1">REF ID<\/div>\s*<div className="font-bold text-\[9pt\]">\{refId\.split\('-'\)\.pop\(\)\}<\/div>\s*<div className="text-\[6pt\] mt-1">Quote this number<\/div>\s*<\/div>\s*<\/div>/,
  qrCodeBox
);

fs.writeFileSync('src/ReceiptPage.tsx', code);
console.log("Fixed ReceiptPage with QRCode");

const fs = require('fs');
let code = fs.readFileSync('src/components/Receipt.tsx', 'utf8');

if (!code.includes('import { QRCodeSVG } from "qrcode.react";')) {
  code = code.replace('import React from "react";', 'import React from "react";\nimport { QRCodeSVG } from "qrcode.react";');
}

let trackingUrl = 'const trackingUrl = window.location.origin + "/?track=" + generatedId;';
if (!code.includes('const trackingUrl =')) {
  code = code.replace("const currentDateTime = ", trackingUrl + "\n  const currentDateTime = ");
}

let qrCodeBox = `
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '1px solid black', width: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto', padding: '4px' }}>
            <div style={{ fontSize: '7pt', fontWeight: 'bold', marginBottom: '4px' }}>SCAN TO TRACK</div>
            <QRCodeSVG value={trackingUrl} size={70} level="M" />
            <div style={{ fontSize: '7pt', fontWeight: 'bold', marginTop: '4px' }}>{generatedId}</div>
          </div>
        </div>`;

code = code.replace(
  /<div style=\{\{ textAlign: 'center' \}\}>\s*<div style=\{\{ border: '1px solid black', width: '70px', height: '70px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto', padding: '2px' \}\}>\s*<div style=\{\{ fontSize: '7pt', fontWeight: 'bold' \}\}>REQUEST ID<\/div>\s*<div style=\{\{ fontSize: '9pt', fontWeight: 'bold', margin: '4px 0' \}\}>\{generatedId\}<\/div>\s*<div style=\{\{ fontSize: '7pt' \}\}>Use to Track<\/div>\s*<\/div>\s*<\/div>/,
  qrCodeBox
);

fs.writeFileSync('src/components/Receipt.tsx', code);
console.log("Fixed Receipt.tsx with QRCode");

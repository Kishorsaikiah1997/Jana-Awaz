const fs = require('fs');

// Fix ReceiptPage.tsx
let rp = fs.readFileSync('src/ReceiptPage.tsx', 'utf8');
rp = rp.replace(
  'const trackingUrl = window.location.origin + "/?track=" + refId;\n  const refId = submission.formatted_tracking_id || submission.id;',
  'const refId = submission.formatted_tracking_id || submission.id;\n  const trackingUrl = window.location.origin + "/?track=" + refId;'
);
fs.writeFileSync('src/ReceiptPage.tsx', rp);
console.log("Fixed ReceiptPage.tsx");

// Fix Receipt.tsx
let rc = fs.readFileSync('src/components/Receipt.tsx', 'utf8');
if (!rc.includes('QRCodeSVG')) {
  rc = rc.replace("import React from 'react';", "import React from 'react';\nimport { QRCodeSVG } from 'qrcode.react';");
  fs.writeFileSync('src/components/Receipt.tsx', rc);
  console.log("Fixed Receipt.tsx imports");
} else {
  // It might include QRCodeSVG in the JSX but not in the import. Let's check imports
  if (!rc.includes('import { QRCodeSVG }')) {
    rc = rc.replace("import React from 'react';", "import React from 'react';\nimport { QRCodeSVG } from 'qrcode.react';");
    fs.writeFileSync('src/components/Receipt.tsx', rc);
    console.log("Fixed Receipt.tsx imports");
  }
}


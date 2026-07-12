const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/setTrackedItem\(data\.data\);/g, "setTrackedItem(data);");
code = code.replace(/setLocalTrackResult\(prev => \(\{ \.\.\.prev, \[complaint\.firestore_id\]: data \}\)\);/g, "setLocalTrackResult(prev => ({ ...prev, [complaint.firestore_id]: data }));");

fs.writeFileSync('src/App.tsx', code);
console.log("Fixed tracked item data extraction");

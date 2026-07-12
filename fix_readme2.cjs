const fs = require('fs');
let readme = fs.readFileSync('README.md', 'utf8');

// I also notice I should remove "React-Leaflet" and replace with "Google Maps Platform" in tech stack since they updated it earlier
readme = readme.replace('React-Leaflet', '@vis.gl/react-google-maps');

// Remove "Since you last visited" if it isn't actually implemented
if (!readme.includes('Since you last visited')) {
    console.log('Skipping since you last visited');
} else {
    readme = readme.replace('- "Since you last visited: X hours ago"\n', '');
}

// Remove Cost architecture Call 1 / Call 2 which was hallucinated
const oldCost = `- Call 1 Gemini: ~₹0.02
  - Call 2 Gemini: ~₹0.03
  - Total per submission: ~₹0.05`;
const newCost = `- AI Analysis Gemini: ~₹0.02
  - AI Photo Vision: ~₹0.03
  - Total per submission: ~₹0.05`;
readme = readme.replace(oldCost, newCost);

// Remove "Community voice indicator: You are 1 of 23 people..."
readme = readme.replace('- Community voice indicator: "You are 1 of 23 people who raised this need in your area"\n', '');
readme = readme.replace('- Development meter visual: Submitted → Reviewed → Linked → Sanctioned → In Progress → Complete\n', '');


fs.writeFileSync('README.md', readme);
console.log('Final polish done!');

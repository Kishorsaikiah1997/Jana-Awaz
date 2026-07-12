const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes("const searchParams = new URLSearchParams(window.location.search);")) {
  code = code.replace(
    'useEffect(() => {',
    `useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const trackParam = searchParams.get('track');
    if (trackParam) {
      setActiveTab('track');
      setTrackId(trackParam);
      handleTrack(trackParam);
      
      // Clean up URL without reloading
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.pushState({path:newUrl},'',newUrl);
    }
`
  );
  fs.writeFileSync('src/App.tsx', code);
  console.log("Added track param handling to App.tsx");
} else {
  console.log("Track param logic already exists.");
}

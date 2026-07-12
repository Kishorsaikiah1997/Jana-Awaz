const fs = require('fs');

const files = ['src/MapTab.tsx', 'src/components/LocationPicker.tsx'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const oldCode = `  const getApiKey = () => {
    if (typeof process !== 'undefined' && process.env && process.env.GOOGLE_MAPS_PLATFORM_KEY) return process.env.GOOGLE_MAPS_PLATFORM_KEY;
    if ((import.meta as any).env && (import.meta as any).env.VITE_GOOGLE_MAPS_PLATFORM_KEY) return (import.meta as any).env.VITE_GOOGLE_MAPS_PLATFORM_KEY;
    if (typeof globalThis !== 'undefined' && (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY) return (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY;
    return '';
  };`;

  const newCode = `  const getApiKey = () => {
    try { if (process.env.GOOGLE_MAPS_PLATFORM_KEY) return process.env.GOOGLE_MAPS_PLATFORM_KEY; } catch(e) {}
    try { if ((import.meta as any).env && (import.meta as any).env.VITE_GOOGLE_MAPS_PLATFORM_KEY) return (import.meta as any).env.VITE_GOOGLE_MAPS_PLATFORM_KEY; } catch(e) {}
    try { if (typeof globalThis !== 'undefined' && (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY) return (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY; } catch(e) {}
    return '';
  };`;

  content = content.replace(oldCode, newCode);
  fs.writeFileSync(file, content);
});
console.log("Done");

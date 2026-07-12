const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');

if (!code.includes('VitePWA')) {
  code = code.replace("import {defineConfig} from 'vite';", "import {defineConfig} from 'vite';\nimport { VitePWA } from 'vite-plugin-pwa';");
  code = code.replace("plugins: [react(), tailwindcss()],", `plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        manifest: {
          name: 'Jan Awaaz',
          short_name: 'Jan Awaaz',
          description: 'Citizen engagement and MP command center',
          theme_color: '#FFFEF7',
          background_color: '#FFFEF7',
          display: 'standalone',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],`);
  
  fs.writeFileSync('vite.config.ts', code);
  console.log("Fixed vite.config.ts for PWA");
} else {
  console.log("VitePWA already present");
}

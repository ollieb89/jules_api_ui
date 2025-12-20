# Setup Service Worker for Offline

**Tags:** PWA, Offline, Service Worker, Performance, Images, Optimization, +1, Backend, Caching, Performance, +1, Performance, API, React, +1, PWA, Web Development, Service Workers, Agentic AI, Reasoning, Planning, Agentic AI, Prompt Engineering, LLM

description: Enable offline functionality

1. **Install Workbox**:
   // turbo
   - Run npm install next-pwa

2. **Configure**:
   const withPWA = require('next-pwa')({
   dest: 'public'
   });
   module.exports = withPWA({});

3. **Create Manifest**:
   {
   "name": "My App",
   "short_name": "App",
   "start_url": "/",
   "display": "standalone"
   }

4. **Pro Tips**:
   - Test in Chrome DevTools.
   - Cache static assets.

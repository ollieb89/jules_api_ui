# Reduce Bundle Size

**Tags:** Performance, Bundle, Optimization, Performance, Images, Optimization, +1, Performance, API, React, +1, Backend, Caching, Performance, +1, Agentic AI, Performance, Optimization, Performance, Web Vitals, Optimization, Next.js, Performance, Optimization

description: Analyze and reduce JS bundle

1. **Analyze Bundle**:
   // turbo
   - Run npm install @next/bundle-analyzer
     // turbo
   - Run ANALYZE=true npm run build

2. **Replace Heavy Libraries**:
   - moment.js → date-fns
   - lodash → Native JS

3. **Use Dynamic Imports**:
   const Chart = dynamic(() => import('@/components/Chart'), {
   ssr: false
   });

4. **Pro Tips**:
   - Aim for <200KB initial bundle.
   - Use npm dedupe.

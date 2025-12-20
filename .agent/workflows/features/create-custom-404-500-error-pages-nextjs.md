---
description: UX, Next.js, Error Handling, i18n, Next.js, Localization, React, Productivity, Scaffolding, UI, Tailwind, Theming, Next.js, App Router, Routing, Next.js, Performance, Optimization, Next.js, Authentication, Security
---

# Custom 404/500 Pages

**Tags:** UX, Next.js, Error Handling, i18n, Next.js, Localization, React, Productivity, Scaffolding, UI, Tailwind, Theming, Next.js, App Router, Routing, Next.js, Performance, Optimization, Next.js, Authentication, Security

description: Create branded error pages

1. **Create Not Found**:
   - Create src/app/not-found.tsx.
     import Link from 'next/link';
     export default function NotFound() {
     return (
     <div>
     <h2>Not Found</h2>
     <p>Could not find requested resource</p>
     <Link href="/">Return Home</Link>
     </div>
     );
     }

2. **Create Error Page**:
   - Create src/app/error.tsx for generic server errors.

3. **Pro Tips**:
   - Add a search bar or helpful links to your 404 page to keep users engaged.

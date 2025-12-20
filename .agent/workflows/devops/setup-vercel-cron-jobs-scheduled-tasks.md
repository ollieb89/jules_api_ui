---
description: Vercel, Cron, Automation, Vercel, Deployment, CI/CD, Versioning, Releases, Git, +1, Performance, Next.js, Optimization, Python, Automation, Scripting, Python, DevOps, Infrastructure, Automation, Testing, Architecture
---

# Setup Vercel Cron Jobs

**Tags:** Vercel, Cron, Automation, Vercel, Deployment, CI/CD, Versioning, Releases, Git, +1, Performance, Next.js, Optimization, Python, Automation, Scripting, Python, DevOps, Infrastructure, Automation, Testing, Architecture

description: Create and test scheduled tasks in Next.js

1.  **Create Cron Config**:
    - Add crons to vercel.json.
      {
      "crons": [
      {
      "path": "/api/cron/daily-report",
      "schedule": "0 10 * * *"
      }
      ]
      }

2.  **Create API Route**:
    - Create the endpoint at src/app/api/cron/daily-report/route.ts.
      import { NextResponse } from 'next/server';

    export async function GET(request: Request) {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== Bearer ${process.env.CRON_SECRET}) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

        // Your cron job logic here
        console.log('Daily report cron executed');

        return NextResponse.json({ success: true });

    }

3.  **Set Environment Variable**:
    - Add CRON_SECRET to your .env.local and Vercel project settings.
    - Generate a secure random string: openssl rand -base64 32

4.  **Pro Tips**:
    - Vercel sends an Authorization: Bearer <token> header with cron requests.
    - Test locally by manually calling the endpoint with the correct header.
    - Cron expressions use UTC timezone.

# CRON Setup Instructions

This document explains how to set up the CRON job to process scheduled notifications.

## Option 1: Using GitHub Actions (Recommended)

Create `.github/workflows/cron-notifications.yml`:

```yaml
name: Process Notification Jobs

on:
  schedule:
    # Run every minute
    - cron: '* * * * *'
  workflow_dispatch: # Allow manual triggering

jobs:
  process-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Edge Function
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            "${{ secrets.SUPABASE_URL }}/functions/v1/process-cron-jobs"
```

Add these secrets to your GitHub repository:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

## Option 2: Using External CRON Service

### Using cron-job.org:
1. Go to https://cron-job.org
2. Create a new cron job
3. Set URL to: `https://your-project.supabase.co/functions/v1/process-cron-jobs`
4. Set schedule to run every minute: `* * * * *`
5. Add header: `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`

### Using EasyCron:
1. Go to https://www.easycron.com
2. Create a new cron job
3. Set URL and schedule as above

## Option 3: Using Server CRON

If you have a server, add this to your crontab:

```bash
# Edit crontab
crontab -e

# Add this line to run every minute
* * * * * curl -X POST -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" -H "Content-Type: application/json" "https://your-project.supabase.co/functions/v1/process-cron-jobs"
```

## Option 4: Using Vercel Cron Jobs

If deploying to Vercel, create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-notifications",
      "schedule": "* * * * *"
    }
  ]
}
```

Then create `pages/api/cron/process-notifications.ts`:

```typescript
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-cron-jobs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const result = await response.json()
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({ error: 'Failed to process cron jobs' })
  }
}
```

## Testing the CRON Job

You can manually test the cron job by calling:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  "https://your-project.supabase.co/functions/v1/process-cron-jobs"
```

## Monitoring

The system logs all cron job executions in the `cron_jobs` table. You can monitor:
- Pending jobs: `status = 'pending'`
- Completed jobs: `status = 'completed'`
- Failed jobs: `status = 'failed'`

Failed jobs will include error messages for debugging.
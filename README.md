# Quiet Hours Scheduler

A Next.js application that allows authenticated users to create silent-study time blocks with automated email notifications.

## Features

- User authentication with Supabase Auth
- Create and manage quiet study time blocks
- Automated email notifications 10 minutes before each session
- CRON-based scheduling with overlap prevention
- Real-time updates using Supabase row-level events
- MongoDB integration for enhanced data management

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, Database, Real-time)
- **Database**: MongoDB (supplementary data)
- **Email**: Supabase Edge Functions with email triggers
- **Scheduling**: CRON jobs with overlap detection

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/1234-ad/quiet-hours-scheduler.git
cd quiet-hours-scheduler
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`

5. Run the development server:
```bash
npm run dev
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
MONGODB_URI=your_mongodb_connection_string
RESEND_API_KEY=your_resend_api_key
```

## Project Structure

```
├── app/                    # Next.js app directory
├── components/            # React components
├── lib/                   # Utility functions and configurations
├── supabase/             # Supabase configurations and migrations
├── types/                # TypeScript type definitions
└── utils/                # Helper functions
```

## License

MIT License
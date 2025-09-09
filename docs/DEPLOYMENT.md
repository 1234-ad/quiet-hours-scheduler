# Deployment Guide

This guide covers deploying the Quiet Hours Scheduler to various platforms.

## Prerequisites

1. **Supabase Project**: Create a project at [supabase.com](https://supabase.com)
2. **MongoDB Database**: Set up a MongoDB instance (Atlas recommended)
3. **Email Service**: Set up Resend account for email notifications
4. **Domain** (optional): For custom email domain

## Environment Variables

Create these environment variables in your deployment platform:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quiet-hours

# Email
RESEND_API_KEY=re_your_resend_api_key

# App
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

## Vercel Deployment (Recommended)

1. **Connect Repository**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

2. **Configure Environment Variables**:
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all required environment variables

3. **Set up Cron Jobs**:
   - Add `vercel.json` with cron configuration (see scripts/setup-cron.md)
   - Create API route for cron processing

## Netlify Deployment

1. **Build Settings**:
   ```bash
   # Build command
   npm run build
   
   # Publish directory
   .next
   ```

2. **Environment Variables**:
   - Go to Site Settings → Environment Variables
   - Add all required variables

3. **Functions**:
   - Use Netlify Functions for cron processing
   - Create `netlify/functions/process-cron.js`

## Railway Deployment

1. **Connect Repository**:
   - Go to [railway.app](https://railway.app)
   - Connect your GitHub repository

2. **Environment Variables**:
   - Add variables in Railway dashboard

3. **Cron Setup**:
   - Use Railway's cron service or external cron

## Docker Deployment

1. **Create Dockerfile**:
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and Run**:
   ```bash
   docker build -t quiet-hours-scheduler .
   docker run -p 3000:3000 --env-file .env quiet-hours-scheduler
   ```

## Supabase Setup

1. **Run Migrations**:
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login and link project
   supabase login
   supabase link --project-ref your-project-ref
   
   # Run migrations
   supabase db push
   ```

2. **Deploy Edge Functions**:
   ```bash
   # Deploy notification function
   supabase functions deploy send-notification
   
   # Deploy cron processor
   supabase functions deploy process-cron-jobs
   ```

3. **Configure Authentication**:
   - Enable email authentication
   - Set up email templates
   - Configure redirect URLs

## MongoDB Setup

1. **MongoDB Atlas**:
   - Create cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
   - Create database user
   - Whitelist IP addresses
   - Get connection string

2. **Local MongoDB**:
   ```bash
   # Install MongoDB
   brew install mongodb/brew/mongodb-community
   
   # Start service
   brew services start mongodb/brew/mongodb-community
   ```

## Email Configuration

1. **Resend Setup**:
   - Sign up at [resend.com](https://resend.com)
   - Verify your domain
   - Get API key

2. **Custom Domain**:
   - Add DNS records for your domain
   - Verify domain in Resend dashboard

## Post-Deployment Checklist

- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] Edge functions deployed
- [ ] Cron jobs configured
- [ ] Email service working
- [ ] Authentication flows tested
- [ ] SSL certificate active
- [ ] Domain configured
- [ ] Monitoring set up

## Monitoring and Maintenance

1. **Logs**:
   - Monitor Vercel/Netlify function logs
   - Check Supabase logs
   - Monitor email delivery

2. **Database**:
   - Regular backups
   - Monitor performance
   - Clean up old records

3. **Updates**:
   - Keep dependencies updated
   - Monitor security advisories
   - Test before deploying

## Troubleshooting

### Common Issues:

1. **CORS Errors**:
   - Check Supabase URL configuration
   - Verify environment variables

2. **Database Connection**:
   - Check MongoDB connection string
   - Verify network access

3. **Email Not Sending**:
   - Verify Resend API key
   - Check domain verification
   - Monitor rate limits

4. **Cron Jobs Not Running**:
   - Verify cron service setup
   - Check function logs
   - Test manual execution

For more help, check the logs and error messages in your deployment platform's dashboard.
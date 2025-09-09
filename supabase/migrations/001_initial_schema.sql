-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  notification_preferences JSONB DEFAULT '{"email": true, "push": false}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_sessions table
CREATE TABLE public.study_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  notification_sent BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure end_time is after start_time
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  -- Ensure duration matches the time range
  CONSTRAINT valid_duration CHECK (duration_minutes = EXTRACT(EPOCH FROM (end_time - start_time)) / 60)
);

-- Create notification_logs table
CREATE TABLE public.notification_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.study_sessions(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('reminder', 'start', 'end')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_status TEXT DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cron_jobs table for scheduling
CREATE TABLE public.cron_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.study_sessions(id) ON DELETE CASCADE NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('notification')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX idx_study_sessions_start_time ON public.study_sessions(start_time);
CREATE INDEX idx_study_sessions_active ON public.study_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX idx_notification_logs_session_id ON public.notification_logs(session_id);
CREATE INDEX idx_cron_jobs_scheduled_time ON public.cron_jobs(scheduled_time);
CREATE INDEX idx_cron_jobs_status ON public.cron_jobs(status) WHERE status = 'pending';

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_sessions_updated_at BEFORE UPDATE ON public.study_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to prevent overlapping sessions for the same user
CREATE OR REPLACE FUNCTION check_session_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for overlapping sessions
  IF EXISTS (
    SELECT 1 FROM public.study_sessions 
    WHERE user_id = NEW.user_id 
    AND id != COALESCE(NEW.id, uuid_generate_v4())
    AND is_active = TRUE
    AND (
      (NEW.start_time >= start_time AND NEW.start_time < end_time) OR
      (NEW.end_time > start_time AND NEW.end_time <= end_time) OR
      (NEW.start_time <= start_time AND NEW.end_time >= end_time)
    )
  ) THEN
    RAISE EXCEPTION 'Session overlaps with existing session';
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to prevent overlapping sessions
CREATE TRIGGER prevent_session_overlap 
  BEFORE INSERT OR UPDATE ON public.study_sessions
  FOR EACH ROW EXECUTE FUNCTION check_session_overlap();

-- Function to automatically create cron job for notifications
CREATE OR REPLACE FUNCTION create_notification_job()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification job 10 minutes before session starts
  INSERT INTO public.cron_jobs (user_id, session_id, scheduled_time, job_type)
  VALUES (
    NEW.user_id,
    NEW.id,
    NEW.start_time - INTERVAL '10 minutes',
    'notification'
  );
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically create notification jobs
CREATE TRIGGER create_notification_job_trigger
  AFTER INSERT ON public.study_sessions
  FOR EACH ROW EXECUTE FUNCTION create_notification_job();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own sessions" ON public.study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON public.study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.study_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON public.study_sessions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notification logs" ON public.notification_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own cron jobs" ON public.cron_jobs
  FOR SELECT USING (auth.uid() = user_id);
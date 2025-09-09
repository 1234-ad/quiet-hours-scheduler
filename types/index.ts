export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface StudySession {
  id: string
  user_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  duration_minutes: number
  notification_sent: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface NotificationLog {
  id: string
  user_id: string
  session_id: string
  notification_type: 'reminder' | 'start' | 'end'
  sent_at: string
  email_status: 'pending' | 'sent' | 'failed'
  error_message?: string
}

export interface CreateSessionData {
  title: string
  description?: string
  start_time: string
  duration_minutes: number
}

export interface SessionFilters {
  date?: string
  status?: 'upcoming' | 'active' | 'completed'
  limit?: number
  offset?: number
}

export interface CronJob {
  id: string
  user_id: string
  session_id: string
  scheduled_time: string
  job_type: 'notification'
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  executed_at?: string
}
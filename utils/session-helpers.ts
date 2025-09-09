import { StudySession, CreateSessionData } from '@/types'

export function validateSessionData(data: CreateSessionData): string[] {
  const errors: string[] = []

  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required')
  }

  if (!data.start_time) {
    errors.push('Start time is required')
  }

  if (!data.duration_minutes || data.duration_minutes < 15) {
    errors.push('Duration must be at least 15 minutes')
  }

  if (data.duration_minutes > 480) {
    errors.push('Duration cannot exceed 8 hours')
  }

  const startTime = new Date(data.start_time)
  const now = new Date()

  if (startTime <= now) {
    errors.push('Start time must be in the future')
  }

  return errors
}

export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const start = new Date(startTime)
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
  return end.toISOString()
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) {
    return `${mins} minutes`
  } else if (mins === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`
  } else {
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`
  }
}

export function getSessionStatus(session: StudySession): 'upcoming' | 'active' | 'completed' {
  const now = new Date()
  const start = new Date(session.start_time)
  const end = new Date(session.end_time)

  if (now < start) {
    return 'upcoming'
  } else if (now >= start && now <= end) {
    return 'active'
  } else {
    return 'completed'
  }
}

export function getTimeUntilSession(startTime: string): string {
  const now = new Date()
  const start = new Date(startTime)
  const diffMs = start.getTime() - now.getTime()

  if (diffMs <= 0) {
    return 'Started'
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`
  } else {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`
  }
}

export function checkSessionOverlap(
  newSession: { start_time: string; end_time: string },
  existingSessions: StudySession[],
  excludeId?: string
): boolean {
  const newStart = new Date(newSession.start_time)
  const newEnd = new Date(newSession.end_time)

  return existingSessions.some(session => {
    if (excludeId && session.id === excludeId) {
      return false
    }

    if (!session.is_active) {
      return false
    }

    const existingStart = new Date(session.start_time)
    const existingEnd = new Date(session.end_time)

    // Check for overlap
    return (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    )
  })
}

export function generateSessionSummary(sessions: StudySession[]): {
  totalSessions: number
  totalMinutes: number
  upcomingSessions: number
  completedSessions: number
  averageDuration: number
} {
  const now = new Date()
  
  const totalSessions = sessions.length
  const totalMinutes = sessions.reduce((sum, session) => sum + session.duration_minutes, 0)
  
  const upcomingSessions = sessions.filter(session => 
    new Date(session.start_time) > now && session.is_active
  ).length
  
  const completedSessions = sessions.filter(session => 
    new Date(session.end_time) <= now
  ).length
  
  const averageDuration = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0

  return {
    totalSessions,
    totalMinutes,
    upcomingSessions,
    completedSessions,
    averageDuration
  }
}
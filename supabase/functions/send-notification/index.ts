import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  sessionId: string
  userId: string
  type: 'reminder' | 'start' | 'end'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { sessionId, userId, type }: NotificationRequest = await req.json()

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('study_sessions')
      .select('*, profiles(email, full_name)')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      throw new Error('Session not found')
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, notification_preferences')
      .eq('id', userId)
      .single()

    if (!profile || !profile.notification_preferences?.email) {
      console.log('Email notifications disabled for user')
      return new Response(
        JSON.stringify({ success: false, message: 'Email notifications disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare email content based on notification type
    let subject = ''
    let htmlContent = ''
    
    const startTime = new Date(session.start_time).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    switch (type) {
      case 'reminder':
        subject = `Reminder: "${session.title}" starts in 10 minutes`
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">Quiet Hours Reminder</h2>
            <p>Hello ${profile.full_name || 'there'},</p>
            <p>This is a friendly reminder that your study session "<strong>${session.title}</strong>" is starting in 10 minutes.</p>
            <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Session Details:</h3>
              <p><strong>Title:</strong> ${session.title}</p>
              ${session.description ? `<p><strong>Description:</strong> ${session.description}</p>` : ''}
              <p><strong>Start Time:</strong> ${startTime}</p>
              <p><strong>Duration:</strong> ${session.duration_minutes} minutes</p>
            </div>
            <p>Get ready to focus and make the most of your quiet study time!</p>
            <p>Best regards,<br>Quiet Hours Scheduler</p>
          </div>
        `
        break
      case 'start':
        subject = `Your study session "${session.title}" is starting now`
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Study Session Started</h2>
            <p>Hello ${profile.full_name || 'there'},</p>
            <p>Your study session "<strong>${session.title}</strong>" is starting now. Time to focus!</p>
            <p>Duration: ${session.duration_minutes} minutes</p>
            <p>Good luck with your studies!</p>
          </div>
        `
        break
      case 'end':
        subject = `Study session "${session.title}" completed`
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7C3AED;">Session Completed</h2>
            <p>Hello ${profile.full_name || 'there'},</p>
            <p>Great job! You've completed your study session "<strong>${session.title}</strong>".</p>
            <p>Keep up the excellent work with your studies!</p>
          </div>
        `
        break
    }

    // Send email using Resend (you can replace with your preferred email service)
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Quiet Hours <noreply@yourdomain.com>',
        to: [profile.email],
        subject: subject,
        html: htmlContent,
      }),
    })

    const emailResult = await emailResponse.json()
    const emailStatus = emailResponse.ok ? 'sent' : 'failed'

    // Log the notification
    await supabase
      .from('notification_logs')
      .insert({
        user_id: userId,
        session_id: sessionId,
        notification_type: type,
        email_status: emailStatus,
        error_message: emailStatus === 'failed' ? JSON.stringify(emailResult) : null
      })

    // Update session notification status if it's a reminder
    if (type === 'reminder') {
      await supabase
        .from('study_sessions')
        .update({ notification_sent: true })
        .eq('id', sessionId)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        emailStatus 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending notification:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
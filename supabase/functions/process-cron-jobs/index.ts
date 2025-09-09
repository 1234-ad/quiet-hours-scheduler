import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const now = new Date()
    console.log(`Processing cron jobs at ${now.toISOString()}`)

    // Get all pending cron jobs that should be executed now
    const { data: jobs, error: jobsError } = await supabase
      .from('cron_jobs')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_time', now.toISOString())
      .order('scheduled_time', { ascending: true })

    if (jobsError) {
      throw new Error(`Failed to fetch cron jobs: ${jobsError.message}`)
    }

    console.log(`Found ${jobs?.length || 0} jobs to process`)

    const results = []

    for (const job of jobs || []) {
      try {
        console.log(`Processing job ${job.id} for session ${job.session_id}`)

        // Mark job as being processed
        await supabase
          .from('cron_jobs')
          .update({ 
            status: 'completed',
            executed_at: now.toISOString()
          })
          .eq('id', job.id)

        // Call the notification function
        const notificationResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-notification`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId: job.session_id,
              userId: job.user_id,
              type: 'reminder'
            }),
          }
        )

        const notificationResult = await notificationResponse.json()

        if (!notificationResponse.ok) {
          throw new Error(`Notification failed: ${JSON.stringify(notificationResult)}`)
        }

        results.push({
          jobId: job.id,
          sessionId: job.session_id,
          status: 'success',
          message: 'Notification sent successfully'
        })

        console.log(`Successfully processed job ${job.id}`)

      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error)

        // Mark job as failed
        await supabase
          .from('cron_jobs')
          .update({ 
            status: 'failed',
            executed_at: now.toISOString(),
            error_message: error.message
          })
          .eq('id', job.id)

        results.push({
          jobId: job.id,
          sessionId: job.session_id,
          status: 'failed',
          error: error.message
        })
      }
    }

    // Clean up old completed/failed jobs (older than 7 days)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    await supabase
      .from('cron_jobs')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('executed_at', weekAgo.toISOString())

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} jobs`,
        results: results,
        timestamp: now.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in process-cron-jobs:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
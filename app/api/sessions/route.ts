import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateSessionData, calculateEndTime, checkSessionOverlap } from '@/utils/session-helpers'
import { CreateSessionData } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time', { ascending: true })
      .range(offset, offset + limit - 1)

    // Filter by status if provided
    if (status === 'upcoming') {
      query = query.gt('start_time', new Date().toISOString()).eq('is_active', true)
    } else if (status === 'completed') {
      query = query.lt('end_time', new Date().toISOString())
    } else if (status === 'active') {
      const now = new Date().toISOString()
      query = query.lte('start_time', now).gte('end_time', now).eq('is_active', true)
    }

    const { data: sessions, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sessions })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateSessionData = await request.json()

    // Validate input data
    const validationErrors = validateSessionData(body)
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationErrors 
      }, { status: 400 })
    }

    // Calculate end time
    const endTime = calculateEndTime(body.start_time, body.duration_minutes)

    // Check for overlapping sessions
    const { data: existingSessions } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (existingSessions && checkSessionOverlap(
      { start_time: body.start_time, end_time: endTime },
      existingSessions
    )) {
      return NextResponse.json({ 
        error: 'Session overlaps with existing session' 
      }, { status: 409 })
    }

    // Create the session
    const { data: session, error } = await supabase
      .from('study_sessions')
      .insert({
        user_id: user.id,
        title: body.title,
        description: body.description,
        start_time: body.start_time,
        end_time: endTime,
        duration_minutes: body.duration_minutes,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
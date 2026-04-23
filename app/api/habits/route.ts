import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerUser } from '@/lib/auth'

export async function POST(req: Request) {
  const authUser = getServerUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      type,
      goal_text,
      main_trigger,
      past_failure_reason,
      preferred_time,
      alternative_action,
      difficulty_level,
      user_tone,
    } = body

    if (!type || !goal_text || !main_trigger) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const habit = db.habits.create({
      userId: authUser.userId,
      type,
      goal_text,
      main_trigger: main_trigger || '',
      past_failure_reason: past_failure_reason || '',
      preferred_time: preferred_time || '',
      alternative_action: alternative_action || '',
      difficulty_level: Number(difficulty_level) || 3,
    })

    // Mark user onboarding complete and save tone preference
    db.users.update(authUser.userId, {
      onboarding_completed: true,
      user_tone: user_tone || 'Gentle',
    })

    return NextResponse.json({
      habit,
      userId: authUser.userId,
      message: 'Habit saved successfully',
    })
  } catch (err) {
    console.error('POST /api/habits error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  const authUser = getServerUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const habits = db.habits.byUser(authUser.userId)
  return NextResponse.json({ habits })
}

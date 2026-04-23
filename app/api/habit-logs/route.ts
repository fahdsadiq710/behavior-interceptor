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
    const { habit_id, status, user_response_time } = body

    if (!habit_id || !status) {
      return NextResponse.json({ error: 'Missing habit_id or status' }, { status: 400 })
    }

    const habit = db.habits.findById(habit_id)
    if (!habit || habit.userId !== authUser.userId) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    const now = new Date()
    const log = db.habitLogs.create({
      habit_id,
      userId: authUser.userId,
      date: now.toISOString().split('T')[0],
      status,
      user_response_time: Number(user_response_time) || 0,
      hour: now.getHours(),
      day_of_week: now.getDay(),
    })

    return NextResponse.json({ log })
  } catch (err) {
    console.error('POST /api/habit-logs error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

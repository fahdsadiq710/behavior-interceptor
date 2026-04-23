import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateInterventionMessage } from '@/services/aiMessageGenerator'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const CRON_SECRET = process.env.CRON_SECRET

async function sendTelegramMessage(
  chatId: string,
  text: string,
  inlineKeyboard?: { text: string; callback_data: string }[][]
) {
  const body: Record<string, unknown> = { chat_id: chatId, text }
  if (inlineKeyboard) body.reply_markup = { inline_keyboard: inlineKeyboard }

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json() as Promise<{ ok: boolean; result?: { message_id: number } }>
}

export async function GET(req: Request) {
  // Verify this is called by Vercel Cron (or locally with the secret)
  const authHeader = req.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const today = now.toISOString().split('T')[0]

  const allHabits = db.habits.all()
  const matching = allHabits.filter(h => h.preferred_time === currentTime)

  const results: string[] = []

  for (const habit of matching) {
    const user = db.users.findById(habit.userId)
    if (!user?.telegram_chat_id) continue

    const alreadySent = db.habitLogs
      .byUser(habit.userId)
      .some(l => l.habit_id === habit.id && l.date === today && l.status === 'PENDING')
    if (alreadySent) continue

    const message = await generateInterventionMessage(user, habit)

    const inlineKeyboard = [[
      { text: '✅ التزمت', callback_data: `confirm:${habit.id}` },
      { text: '❌ لم أستطع', callback_data: `skip:${habit.id}` },
    ]]

    const sent = await sendTelegramMessage(user.telegram_chat_id, message, inlineKeyboard)
    const telegramMsgId = sent?.result?.message_id ? String(sent.result.message_id) : undefined

    db.habitLogs.create({
      habit_id: habit.id,
      userId: user.id,
      date: today,
      status: 'PENDING',
      user_response_time: 0,
      hour: now.getHours(),
      day_of_week: now.getDay(),
      telegram_message_id: telegramMsgId,
    })

    results.push(`Sent to ${user.email} for habit "${habit.goal_text}"`)
  }

  return NextResponse.json({
    ok: true,
    time: currentTime,
    dispatched: results.length,
    details: results,
  })
}

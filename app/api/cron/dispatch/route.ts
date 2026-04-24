/**
 * Vercel Cron Job endpoint — triggered every minute via vercel.json.
 * Vercel automatically injects `Authorization: Bearer <CRON_SECRET>` on each call.
 *
 * Responsibilities:
 *  1. Verify the caller is authorised (CRON_SECRET check)
 *  2. Find habits whose preferred_time matches the current HH:MM
 *  3. Generate a personalised Arabic message via Gemini (with 5-s fallback)
 *  4. Send it to the user over Telegram with inline action buttons
 *  5. Create a PENDING HabitLog entry for interaction tracking
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateInterventionMessage } from '@/services/aiMessageGenerator'

const BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN  ?? ''
const CRON_SECRET = process.env.CRON_SECRET         ?? ''

// ── Telegram helper ──────────────────────────────────────────────────────────

async function sendTelegramMessage(
  chatId: string,
  text: string,
  inlineKeyboard: { text: string; callback_data: string }[][]
): Promise<{ ok: boolean; result?: { message_id: number } }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: { inline_keyboard: inlineKeyboard },
      }),
    })
    return res.json()
  } catch (err) {
    console.error('[cron/dispatch] Telegram send error:', err)
    return { ok: false }
  }
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  // ── Auth: Vercel Cron sends "Authorization: Bearer <CRON_SECRET>"
  if (CRON_SECRET) {
    const auth = req.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const now         = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const today       = now.toISOString().split('T')[0]

  // Find habits scheduled for this exact minute
  const matching = db.habits.all().filter(h => h.preferred_time === currentTime)

  if (matching.length === 0) {
    return NextResponse.json({ ok: true, time: currentTime, dispatched: 0 })
  }

  const dispatched: string[] = []
  const skipped:    string[] = []

  for (const habit of matching) {
    const user = db.users.findById(habit.userId)

    if (!user?.telegram_chat_id) {
      skipped.push(`${habit.userId} — no telegram_chat_id`)
      continue
    }

    // Deduplicate: skip if a PENDING log already exists for this habit today
    const alreadySent = db.habitLogs
      .byUser(habit.userId)
      .some(l => l.habit_id === habit.id && l.date === today && l.status === 'PENDING')

    if (alreadySent) {
      skipped.push(`${habit.goal_text} — already sent today`)
      continue
    }

    // Generate message (Gemini with 5-second timeout → Arabic fallback)
    const message = await generateInterventionMessage(user, habit)

    // Inline keyboard for one-tap response
    const inlineKeyboard = [[
      { text: '✅ التزمت',  callback_data: `confirm:${habit.id}` },
      { text: '❌ لم أستطع', callback_data: `skip:${habit.id}`    },
    ]]

    const sent = await sendTelegramMessage(user.telegram_chat_id, message, inlineKeyboard)
    const telegramMsgId = sent?.result?.message_id
      ? String(sent.result.message_id)
      : undefined

    // Log PENDING — updated to SUCCESS/FAILED via /api/telegram/webhook
    db.habitLogs.create({
      habit_id:            habit.id,
      userId:              user.id,
      date:                today,
      status:              'PENDING',
      user_response_time:  0,
      hour:                now.getHours(),
      day_of_week:         now.getDay(),
      telegram_message_id: telegramMsgId,
    })

    dispatched.push(`${user.email} → "${habit.goal_text}"`)
  }

  return NextResponse.json({
    ok:         true,
    time:       currentTime,
    dispatched: dispatched.length,
    skipped:    skipped.length,
    details:    { dispatched, skipped },
  })
}

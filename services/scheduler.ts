import cron from 'node-cron'
import { db } from '@/lib/db'
import { generateInterventionMessage } from './aiMessageGenerator'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''

// ── Telegram helpers ─────────────────────────────────────────────────────────

interface TelegramSendResult {
  ok: boolean
  result?: { message_id: number }
}

async function sendTelegramMessage(
  chatId: string,
  text: string,
  inlineKeyboard?: { text: string; callback_data: string }[][]
): Promise<TelegramSendResult> {
  const body: Record<string, unknown> = { chat_id: chatId, text }
  if (inlineKeyboard) {
    body.reply_markup = { inline_keyboard: inlineKeyboard }
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return res.json() as Promise<TelegramSendResult>
  } catch (err) {
    console.error('[scheduler] Telegram send failed:', err)
    return { ok: false }
  }
}

// ── Core dispatch logic ──────────────────────────────────────────────────────

async function dispatchScheduledMessages(): Promise<void> {
  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const today = now.toISOString().split('T')[0]

  const allHabits = db.habits.all()
  const matching = allHabits.filter(h => h.preferred_time === currentTime)

  if (matching.length === 0) return

  console.log(`[scheduler] ${currentTime} — dispatching ${matching.length} habit alert(s)`)

  for (const habit of matching) {
    const user = db.users.findById(habit.userId)

    // Skip if no Telegram account linked
    if (!user?.telegram_chat_id) {
      console.warn(`[scheduler] User ${habit.userId} has no telegram_chat_id, skipping`)
      continue
    }

    // Skip if already sent today to avoid duplicate alerts
    const alreadySentToday = db.habitLogs
      .byUser(habit.userId)
      .some(l => l.habit_id === habit.id && l.date === today && l.status === 'PENDING')
    if (alreadySentToday) continue

    // 1. Generate message (with fallback built in)
    const message = await generateInterventionMessage(user, habit)

    // 2. Send with inline action buttons
    const inlineKeyboard = [[
      { text: '✅ التزمت', callback_data: `confirm:${habit.id}` },
      { text: '❌ لم أستطع', callback_data: `skip:${habit.id}` },
    ]]

    const sent = await sendTelegramMessage(user.telegram_chat_id, message, inlineKeyboard)
    const telegramMsgId = sent?.result?.message_id
      ? String(sent.result.message_id)
      : undefined

    // 3. Create PENDING log entry
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

    console.log(`[scheduler] Sent alert to ${user.email} for habit "${habit.goal_text}"`)
  }
}

// ── Public initialiser ───────────────────────────────────────────────────────

let started = false

export function startScheduler(): void {
  if (started) return
  started = true

  // Run every minute
  cron.schedule('* * * * *', () => {
    dispatchScheduledMessages().catch(err =>
      console.error('[scheduler] Unhandled dispatch error:', err)
    )
  })

  console.log('✅ [scheduler] Behavior Interceptor cron started (every 1 min)')
}

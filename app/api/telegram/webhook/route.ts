import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

// ── Telegram API helpers ─────────────────────────────────────────────────────

async function sendMessage(chatId: number | string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text: text ?? '' }),
  })
}

async function editMessageReplyMarkup(chatId: number | string, messageId: number) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageReplyMarkup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } }),
  })
}

// ── Webhook handler ──────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const update = await req.json()

    // ── Inline button press (callback_query) ──────────────────────────────
    if (update.callback_query) {
      const cq = update.callback_query
      const callbackId: string = cq.id
      const data: string = cq.data ?? ''
      const chatId: number = cq.message?.chat?.id
      const messageId: number = cq.message?.message_id
      const sentAt: number = cq.message?.date ?? 0 // Unix timestamp when message was sent

      // Parse callback data: "confirm:<habitId>" or "skip:<habitId>"
      const [action, habitId] = data.split(':')

      if ((action === 'confirm' || action === 'skip') && habitId) {
        const log = db.habitLogs.findPendingByHabit(habitId)

        if (log) {
          const responseTime = sentAt > 0
            ? Math.round(Date.now() / 1000 - sentAt)
            : 0

          const newStatus = action === 'confirm' ? 'SUCCESS' : 'FAILED'
          db.habitLogs.updateStatus(log.id, newStatus, responseTime)

          const replyText = action === 'confirm'
            ? '✅ ممتاز! تم تسجيل الالتزام. استمر!'
            : '📌 تم التسجيل. لا بأس، غداً فرصة جديدة.'

          await answerCallbackQuery(callbackId, replyText)
          // Remove the buttons from the original message after response
          await editMessageReplyMarkup(chatId, messageId)
          await sendMessage(chatId, replyText)
        } else {
          await answerCallbackQuery(callbackId, 'لم يتم العثور على السجل.')
        }
      }

      return NextResponse.json({ ok: true })
    }

    // ── Regular message ───────────────────────────────────────────────────
    const message = update?.message
    if (!message) return NextResponse.json({ ok: true })

    const chatId = message.chat?.id
    const text: string = message.text ?? ''

    // /start <UUID>
    const startMatch = text.match(/^\/start\s+(.+)$/)
    if (startMatch) {
      const userId = startMatch[1].trim()
      const user = db.users.findById(userId)

      if (!user) {
        await sendMessage(chatId, 'لم يتم العثور على حسابك. تأكد من الرابط وأعد المحاولة.')
        return NextResponse.json({ ok: true })
      }

      if (user.telegram_chat_id) {
        await sendMessage(chatId, 'حسابك مرتبط بالفعل ✅')
        return NextResponse.json({ ok: true })
      }

      db.users.update(userId, { telegram_chat_id: String(chatId) })
      await sendMessage(chatId, 'تم الربط بنجاح! سيتم متابعة أدائك بدقة من الآن 🫡')
      return NextResponse.json({ ok: true })
    }

    // /start (no UUID)
    if (text === '/start') {
      await sendMessage(
        chatId,
        'مرحباً! 👋\nافتح تطبيق Behavior Interceptor وانقر على "ربط Telegram" للبدء.'
      )
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Telegram webhook error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: 'Behavior Interceptor Telegram Webhook' })
}

import { NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

// Reads the active ngrok tunnel URL from ngrok's local API
async function getNgrokUrl(): Promise<string | null> {
  try {
    const res = await fetch('http://127.0.0.1:4040/api/tunnels', {
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    // Find the HTTPS tunnel
    const tunnel = (data.tunnels as { public_url: string; proto: string }[])
      .find(t => t.proto === 'https')
    return tunnel?.public_url ?? null
  } catch {
    return null
  }
}

// GET /api/setup/webhook
// Call this in the browser after starting: npx ngrok http <PORT>
// It auto-detects the ngrok URL and registers it with Telegram.
export async function GET() {
  // 1. Get the ngrok public URL
  const ngrokUrl = await getNgrokUrl()
  if (!ngrokUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: 'ngrok not running',
        hint: 'شغّل ngrok أولاً: npx ngrok http 3003  (أو البورت الذي يعمل عليه الخادم)',
      },
      { status: 400 }
    )
  }

  const webhookUrl = `${ngrokUrl}/api/telegram/webhook`

  // 2. Register with Telegram
  const tgRes = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query'],
      }),
    }
  )
  const tgData = await tgRes.json()

  // 3. Verify current webhook info
  const infoRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`)
  const infoData = await infoRes.json()

  return NextResponse.json({
    ok: tgData.ok,
    webhookUrl,
    telegramResponse: tgData,
    webhookInfo: infoData.result,
    message: tgData.ok
      ? `✅ تم الربط! تيليجرام سيرسل الرسائل إلى: ${webhookUrl}`
      : '❌ فشل الربط — تحقق من TELEGRAM_BOT_TOKEN',
  })
}

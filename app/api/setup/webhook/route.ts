import { NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

async function getNgrokUrl(): Promise<string | null> {
  try {
    const res = await fetch('http://127.0.0.1:4040/api/tunnels')
    const data = await res.json()
    const tunnel = (data.tunnels as { public_url: string; proto: string }[])
      .find(t => t.proto === 'https')
    return tunnel?.public_url ?? null
  } catch {
    return null
  }
}

// GET /api/setup/webhook
// Works both locally (reads ngrok) and on Vercel (uses request host).
export async function GET(req: Request) {
  const reqUrl  = new URL(req.url)
  const origin  = `${reqUrl.protocol}//${reqUrl.host}`

  // Try ngrok first (local dev), otherwise use the current host (Vercel)
  const ngrokUrl   = await getNgrokUrl()
  const baseUrl    = ngrokUrl ?? origin
  const webhookUrl = `${baseUrl}/api/telegram/webhook`

  // Register with Telegram
  const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query'],
    }),
  })
  const tgData = await tgRes.json()

  // Confirm current webhook info
  const infoRes  = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`)
  const infoData = await infoRes.json()

  return NextResponse.json({
    ok:              tgData.ok,
    source:          ngrokUrl ? 'ngrok' : 'vercel-host',
    baseUrl,
    webhookUrl,
    telegramResponse: tgData,
    webhookInfo:     infoData.result,
    message: tgData.ok
      ? `✅ تم الربط! تيليجرام سيرسل إلى: ${webhookUrl}`
      : '❌ فشل — تحقق من TELEGRAM_BOT_TOKEN',
  })
}

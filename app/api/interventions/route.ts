import { NextResponse } from 'next/server'
import { generateIntervention, generateMicroAction } from '@/lib/gemini'

export async function POST(req: Request) {
  try {
    const { goal, sessionCount } = await req.json()
    const now = new Date()

    const [message, microAction] = await Promise.all([
      generateIntervention({
        goal: goal || 'productivity',
        hour: now.getHours(),
        dayOfWeek: now.getDay(),
        sessionCount: sessionCount || 0,
      }),
      generateMicroAction(goal || 'productivity'),
    ])

    return NextResponse.json({ message, microAction })
  } catch {
    return NextResponse.json({
      message: 'غالباً تضيع وقتك الآن... نبدأ 3 دقائق؟',
      microAction: 'افتح ملفك وانظر إليه فقط',
    })
  }
}

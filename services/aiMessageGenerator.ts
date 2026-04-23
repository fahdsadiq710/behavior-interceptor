import { GoogleGenerativeAI } from '@google/generative-ai'
import type { User, Habit } from '@/lib/db'

const FALLBACK_MESSAGE = 'حان وقت هدفك الآن، التزم بقرارك!'
const TIMEOUT_MS = 5000

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

function buildPrompt(user: User, habit: Habit): string {
  const typeLabel = habit.type === 'BUILD_DISCIPLINE' ? 'build' : 'eliminate'
  const streak = 0 // streak is computed live from logs; defaults to 0 here

  return (
    `You are a behavioral coach. User wants to ${typeLabel} the habit: ${habit.goal_text}. ` +
    `Trigger: ${habit.main_trigger}. Tone: ${user.user_tone ?? 'Gentle'}. Streak: ${streak} days.\n` +
    `Task: Write ONE short, punchy Telegram message (max 2 sentences) in Arabic to send right now. ` +
    `Be direct, human, and strictly adhere to their preferred tone. ` +
    `Do not use hashtags, emojis unless necessary, or introductory fluff.`
  )
}

async function callGemini(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()
  return text || FALLBACK_MESSAGE
}

export async function generateInterventionMessage(user: User, habit: Habit): Promise<string> {
  try {
    const prompt = buildPrompt(user, habit)

    // Race Gemini call against a hard 5-second timeout
    const text = await Promise.race<string>([
      callGemini(prompt),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini timeout')), TIMEOUT_MS)
      ),
    ])

    return text
  } catch (err) {
    console.warn('[aiMessageGenerator] Gemini failed, using fallback:', (err as Error).message)
    return FALLBACK_MESSAGE
  }
}

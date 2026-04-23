import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const INTERVENTION_PROMPT = `
أنت مساعد سلوكي ذكي يتحدث العربية فقط. مهمتك هي توليد رسائل تدخل قصيرة وفعّالة
لمساعدة المستخدم على البدء بعمله عند الشعور بالتشتت.

قواعد مهمة:
- الرسالة يجب أن تكون قصيرة جداً (جملة واحدة أو جملتان)
- أسلوب ودود، مشجع، غير حكيم
- تضمّن اقتراحاً لمهمة صغيرة (2-5 دقائق فقط)
- تنوّع الرسائل دائماً

أمثلة:
"غالباً تتوه الآن... جرّب تفتح الكتاب فقط ل3 دقائق؟"
"اللحظة دي صعبة، لكن خطوة صغيرة تكفي. نبدأ؟"
"دماغك محتاج حركة بسيطة. شوف رسالة واحدة في قائمتك."
`

export async function generateIntervention(context: {
  goal: string
  hour: number
  dayOfWeek: number
  sessionCount: number
}): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `
${INTERVENTION_PROMPT}

السياق:
- هدف المستخدم: ${context.goal}
- الساعة الحالية: ${context.hour}:00
- يوم الأسبوع: ${context.dayOfWeek}
- عدد الجلسات السابقة: ${context.sessionCount}

اكتب رسالة تدخل واحدة فقط:
`
    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text().trim()
  } catch (err) {
    // Fallback messages if API fails
    const fallbacks = [
      'غالباً تضيع وقتك الآن... نبدأ 3 دقائق؟',
      'خطوة صغيرة تكفي. ابدأ الآن.',
      'دماغك جاهز أكثر مما تظن. جرّب!',
      'وقتك أثمن من التردد. هيّا!',
      'رجعة قوية تبدأ من قرار واحد الآن.',
    ]
    return fallbacks[Math.floor(Math.random() * fallbacks.length)]
  }
}

export async function generateMicroAction(goal: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    const result = await model.generateContent(`
${INTERVENTION_PROMPT}
اقترح مهمة صغيرة جداً (2-3 دقائق) لهدف: "${goal}". جملة واحدة فقط.
`)
    return (await result.response).text().trim()
  } catch {
    const microActions = {
      productivity: 'افتح ملفك وانظر إليه فقط',
      learning: 'اقرأ صفحة واحدة فقط',
      exercise: 'اعمل 5 قفزات الآن',
      default: 'خذ نفساً عميقاً وابدأ بخطوة واحدة',
    }
    return microActions[goal as keyof typeof microActions] || microActions.default
  }
}

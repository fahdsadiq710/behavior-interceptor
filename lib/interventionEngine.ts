/* Rule-based intervention engine — runs client-side */

import { InterventionRecord, SessionRecord } from '@/lib/userProfile'

export interface InterventionContext {
  goalText: string
  hour: number                       // current hour 0-23
  dayOfWeek: number                  // 0=Sun
  sessionCount: number
  totalMinutes: number
  lastSessionDate: string | null
  interventionHistory: InterventionRecord[]
  sessionHistory: SessionRecord[]
  lastDismissedAt: number | null
  retryCount: number
}

export interface InterventionDecision {
  shouldIntervene: boolean
  urgency: 'low' | 'medium' | 'high'
  reason: string
  retried: boolean
}

const HIGH_RISK_HOURS = [21, 22, 23, 0, 1]     // late night — common failure window
const DISTRACTION_HOURS = [14, 15, 16]           // post-lunch dip
const MORNING_POWER = [8, 9, 10]                 // best focus window

export function evaluateIntervention(ctx: InterventionContext): InterventionDecision {
  const {
    hour, lastDismissedAt, retryCount, interventionHistory,
    sessionCount, lastSessionDate, totalMinutes,
  } = ctx

  // Never retry more than 3 times
  if (retryCount >= 3) {
    return { shouldIntervene: false, urgency: 'low', reason: 'max-retries', retried: false }
  }

  // Retry after 10 min of ignoring
  if (lastDismissedAt && retryCount < 3) {
    const minsSinceDismiss = (Date.now() - lastDismissedAt) / 60000
    if (minsSinceDismiss >= 10) {
      return { shouldIntervene: true, urgency: 'high', reason: 'retry-after-ignore', retried: true }
    }
  }

  // High-risk time window (late night)
  if (HIGH_RISK_HOURS.includes(hour)) {
    const recentFails = interventionHistory
      .filter(iv => HIGH_RISK_HOURS.includes(iv.hour) && !iv.accepted)
      .length
    if (recentFails >= 1) {
      return { shouldIntervene: true, urgency: 'high', reason: 'high-risk-window', retried: false }
    }
  }

  // Post-lunch dip
  if (DISTRACTION_HOURS.includes(hour) && sessionCount > 0) {
    return { shouldIntervene: true, urgency: 'medium', reason: 'post-lunch-dip', retried: false }
  }

  // User hasn't started today
  const today = new Date().toDateString()
  if (lastSessionDate !== today && hour >= 9 && sessionCount > 0) {
    return { shouldIntervene: true, urgency: 'medium', reason: 'no-session-today', retried: false }
  }

  // First-time user nudge (never had a session)
  if (sessionCount === 0 && hour >= 8) {
    return { shouldIntervene: true, urgency: 'low', reason: 'first-nudge', retried: false }
  }

  return { shouldIntervene: false, urgency: 'low', reason: 'ok', retried: false }
}

export function buildInterventionMessage(
  decision: InterventionDecision,
  ctx: InterventionContext
): { message: string; microAction: string } {
  const goal = ctx.goalText || 'هدفك'
  const name = ''

  const messages: Record<string, { message: string; microAction: string }[]> = {
    'retry-after-ignore': [
      { message: `لا تزال هناك فرصة. ${goal} ينتظرك.`, microAction: 'افتح ما تحتاج وابدأ ٣ دقائق فقط' },
      { message: 'ما زال بإمكانك البدء. الوقت لا يزال مناسباً.', microAction: 'خطوة واحدة صغيرة الآن' },
    ],
    'high-risk-window': [
      { message: 'هذا الوقت عادةً صعب عليك... لكن أنت تعرف ذلك.', microAction: `افعل شيئاً واحداً يخص ${goal}` },
      { message: 'تأخر الليل لا يعني إضاعة الوقت. ٣ دقائق؟', microAction: 'حدد الخطوة التالية واكتبها' },
    ],
    'post-lunch-dip': [
      { message: 'الطاقة تنخفض بعد الغداء — هذا طبيعي. لكن ٣ دقائق تكسر الجمود.', microAction: 'افتح ملف العمل أو التطبيق وانظر إليه' },
    ],
    'no-session-today': [
      { message: `لم تبدأ اليوم بعد. ${goal} في انتظارك.`, microAction: 'ابدأ بمهمة بسيطة جداً' },
      { message: 'يوم كامل ولم تبدأ... هل تبدأ الآن؟', microAction: `خطوة واحدة نحو ${goal}` },
    ],
    'first-nudge': [
      { message: 'هل أنت مستعد لأول خطوة؟', microAction: `ابدأ بـ ${goal} لمدة ٣ دقائق فقط` },
    ],
  }

  const pool = messages[decision.reason] || [
    { message: 'غالباً تضيع وقتك الآن... نبدأ ٣ دقائق؟', microAction: 'افتح ملفك وانظر إليه فقط' },
  ]

  return pool[Math.floor(Math.random() * pool.length)]
}

// Analytics computations
export function computeAnalytics(
  interventions: InterventionRecord[],
  sessions: SessionRecord[],
  totalMinutes: number
) {
  const accepted = interventions.filter(i => i.accepted)
  const ignored = interventions.filter(i => i.ignored)
  const total = interventions.length

  // 1. Best productivity hour
  const hourCounts: Record<number, number> = {}
  sessions.forEach(s => {
    hourCounts[s.hourOfDay] = (hourCounts[s.hourOfDay] || 0) + s.duration
  })
  const bestHour = Object.entries(hourCounts).sort((a, b) => +b[1] - +a[1])[0]
  const bestHourStr = bestHour ? formatHour(+bestHour[0]) : '—'

  // 2. Most common failure hour
  const failHours: Record<number, number> = {}
  ignored.forEach(i => {
    failHours[i.hour] = (failHours[i.hour] || 0) + 1
  })
  const failHour = Object.entries(failHours).sort((a, b) => +b[1] - +a[1])[0]
  const failHourStr = failHour ? formatHour(+failHour[0]) : '—'

  // 3. Average start delay (time from first intervention to acceptance)
  const delays: number[] = []
  accepted.forEach(a => {
    const session = sessions.find(s => Math.abs(s.startedAt - a.timestamp) < 120000)
    if (session) delays.push((session.startedAt - a.timestamp) / 60000)
  })
  const avgDelay = delays.length ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length) : 0

  // 4. Energy pattern
  const morningMin = sessions.filter(s => s.hourOfDay >= 6 && s.hourOfDay < 12).reduce((a, s) => a + s.duration, 0)
  const eveningMin = sessions.filter(s => s.hourOfDay >= 18).reduce((a, s) => a + s.duration, 0)
  const energyPattern = morningMin >= eveningMin ? 'شخص صباحي' : 'شخص مسائي'

  // 5. Intervention acceptance rate
  const acceptRate = total ? Math.round((accepted.length / total) * 100) : 0

  // 6. Intervention ignore rate
  const ignoreRate = total ? Math.round((ignored.length / total) * 100) : 0

  // 7. Recovery rate (accepted after having previously ignored)
  const retriedAndAccepted = interventions.filter(i => i.retried && i.accepted).length
  const totalRetried = interventions.filter(i => i.retried).length
  const recoveryRate = totalRetried ? Math.round((retriedAndAccepted / totalRetried) * 100) : 0

  // 8. Consistency level
  const completedSessions = sessions.filter(s => s.completed).length
  const consistencyRate = sessions.length ? Math.round((completedSessions / sessions.length) * 100) : 0

  // 9. Overachievement rate (extended sessions)
  const extendedCount = sessions.filter(s => s.extended).length
  const overachievementRate = sessions.length ? Math.round((extendedCount / sessions.length) * 100) : 0

  // 10. Risk pattern detection
  const lateNightFails = ignored.filter(i => HIGH_RISK_HOURS.includes(i.hour)).length
  const riskPattern = lateNightFails >= 3
    ? 'خطر مرتفع في المساء'
    : lateNightFails >= 1
    ? 'تشتت متوسط في المساء'
    : 'نمط صحي'

  return {
    bestHour: bestHourStr,
    failHour: failHourStr,
    avgDelay,
    energyPattern,
    acceptRate,
    ignoreRate,
    recoveryRate,
    consistencyRate,
    overachievementRate,
    riskPattern,
    totalSessions: sessions.length,
    totalInterventions: total,
  }
}

function formatHour(h: number): string {
  const suffix = h < 12 ? 'ص' : 'م'
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${display}:00 ${suffix}`
}

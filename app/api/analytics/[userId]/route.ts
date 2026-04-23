import { NextResponse } from 'next/server'
import { db, HabitLog } from '@/lib/db'
import { getServerUser } from '@/lib/auth'

const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

function formatHour(h: number): string {
  const period = h < 12 ? 'ص' : 'م'
  const display = h % 12 === 0 ? 12 : h % 12
  return `${display}:00 ${period}`
}

// ── Metric helpers ──────────────────────────────────────────────────────────

function computeCurrentStreak(logs: HabitLog[]): number {
  const successDatesSet = logs.filter(l => l.status === 'SUCCESS').map(l => l.date)
  const successDates = successDatesSet.filter((d, i) => successDatesSet.indexOf(d) === i).sort().reverse()

  if (successDates.length === 0) return 0

  let streak = 0
  let cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  for (const date of successDates) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    const diffDays = Math.round((cursor.getTime() - d.getTime()) / 86400000)
    if (diffDays > 1) break
    streak++
    cursor = d
  }
  return streak
}

function computeLongestStreak(logs: HabitLog[]): number {
  const raw = logs.filter(l => l.status === 'SUCCESS').map(l => l.date)
  const successDates = raw.filter((d, i) => raw.indexOf(d) === i).sort()

  if (successDates.length === 0) return 0

  let longest = 1
  let current = 1

  for (let i = 1; i < successDates.length; i++) {
    const prev = new Date(successDates[i - 1])
    const curr = new Date(successDates[i])
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000)
    if (diff === 1) {
      current++
      longest = Math.max(longest, current)
    } else {
      current = 1
    }
  }
  return longest
}

function computeSuccessRate(logs: HabitLog[]): number {
  if (logs.length === 0) return 0
  const successes = logs.filter(l => l.status === 'SUCCESS').length
  return Math.round((successes / logs.length) * 100)
}

function mostVulnerableDay(logs: HabitLog[]): string {
  const failures = logs.filter(l => l.status === 'FAILED' || l.status === 'IGNORED')
  if (failures.length === 0) return 'لا يوجد بيانات كافية'

  const counts = new Array(7).fill(0)
  failures.forEach(l => counts[l.day_of_week]++)
  const maxDay = counts.indexOf(Math.max(...counts))
  return DAYS_AR[maxDay]
}

function mostVulnerableTime(logs: HabitLog[]): string {
  const failures = logs.filter(l => l.status === 'FAILED' || l.status === 'IGNORED')
  if (failures.length === 0) return 'لا يوجد بيانات كافية'

  const counts = new Array(24).fill(0)
  failures.forEach(l => counts[l.hour]++)
  const maxHour = counts.indexOf(Math.max(...counts))
  return formatHour(maxHour)
}

function botInteractionRate(logs: HabitLog[]): number {
  // Interaction = any log where user responded (SUCCESS or FAILED with response time > 0)
  const total = logs.length
  if (total === 0) return 0
  const responded = logs.filter(l => l.status !== 'IGNORED' || l.user_response_time > 0).length
  return Math.round((responded / total) * 100)
}

function triggerFrequency(userId: string): Record<string, number> {
  const habits = db.habits.byUser(userId)
  const logs = db.habitLogs.byUser(userId)
  const failedLogs = logs.filter(l => l.status === 'FAILED' || l.status === 'IGNORED')

  // Map habit_id → trigger, count failures per trigger
  const habitTriggers: Record<string, string> = {}
  habits.forEach(h => { habitTriggers[h.id] = h.main_trigger })

  const counts: Record<string, number> = {}
  failedLogs.forEach(l => {
    const trigger = habitTriggers[l.habit_id] || 'unknown'
    counts[trigger] = (counts[trigger] || 0) + 1
  })
  return counts
}

function toneEffectiveness(userId: string, logs: HabitLog[]): { tone: string; successRate: number } {
  const user = db.users.findById(userId)
  const tone = user?.user_tone || 'Gentle'
  const successRate = computeSuccessRate(logs)
  return { tone, successRate }
}

function relapseRecoverySpeed(logs: HabitLog[]): number {
  // Average days from a FAILED/IGNORED to the next SUCCESS
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date))
  const recoveries: number[] = []

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].status === 'FAILED' || sorted[i].status === 'IGNORED') {
      // Find next SUCCESS
      for (let j = i + 1; j < sorted.length; j++) {
        if (sorted[j].status === 'SUCCESS') {
          const failDate = new Date(sorted[i].date)
          const successDate = new Date(sorted[j].date)
          const days = Math.round((successDate.getTime() - failDate.getTime()) / 86400000)
          if (days >= 0) recoveries.push(days)
          break
        }
      }
    }
  }

  if (recoveries.length === 0) return 0
  return Math.round(recoveries.reduce((a, b) => a + b, 0) / recoveries.length)
}

function habitConsistencyScore(streak: number, interactionRate: number, successRate: number): number {
  // Custom score: 40% streak (capped at 30 days), 30% interaction rate, 30% success rate
  const streakScore = Math.min(streak / 30, 1) * 40
  const interactionScore = (interactionRate / 100) * 30
  const successScore = (successRate / 100) * 30
  return Math.round(streakScore + interactionScore + successScore)
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  const authUser = getServerUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only allow self-access or admin
  if (authUser.userId !== params.userId && !authUser.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const userId = params.userId
  const logs = db.habitLogs.byUser(userId)
  const user = db.users.findById(userId)

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const currentStreak = computeCurrentStreak(logs)
  const longestStreak = computeLongestStreak(logs)
  const successRate = computeSuccessRate(logs)
  const vulnerableDay = mostVulnerableDay(logs)
  const vulnerableTime = mostVulnerableTime(logs)
  const interactionRate = botInteractionRate(logs)
  const triggerMap = triggerFrequency(userId)
  const topTrigger = Object.entries(triggerMap).sort((a, b) => b[1] - a[1])[0]
  const toneData = toneEffectiveness(userId, logs)
  const recoverySpeed = relapseRecoverySpeed(logs)
  const consistencyScore = habitConsistencyScore(currentStreak, interactionRate, successRate)

  return NextResponse.json({
    userId,
    totalLogs: logs.length,
    metrics: {
      // 1
      currentStreak: {
        value: currentStreak,
        label: 'السلسلة الحالية',
        unit: 'يوم',
      },
      // 2
      longestStreak: {
        value: longestStreak,
        label: 'أطول سلسلة',
        unit: 'يوم',
      },
      // 3
      overallSuccessRate: {
        value: successRate,
        label: 'معدل النجاح الإجمالي',
        unit: '%',
      },
      // 4
      mostVulnerableDay: {
        value: vulnerableDay,
        label: 'أضعف يوم في الأسبوع',
        unit: '',
      },
      // 5
      mostVulnerableTime: {
        value: vulnerableTime,
        label: 'أضعف وقت في اليوم',
        unit: '',
      },
      // 6
      botInteractionRate: {
        value: interactionRate,
        label: 'معدل التفاعل مع البوت',
        unit: '%',
      },
      // 7
      triggerFrequency: {
        value: topTrigger ? topTrigger[0] : 'غير محدد',
        count: topTrigger ? topTrigger[1] : 0,
        allTriggers: triggerMap,
        label: 'المحفز الأكثر تأثيراً على الفشل',
        unit: '',
      },
      // 8
      toneEffectiveness: {
        tone: toneData.tone,
        successRate: toneData.successRate,
        label: 'فاعلية أسلوب التواصل',
        unit: '%',
      },
      // 9
      relapseRecoverySpeed: {
        value: recoverySpeed,
        label: 'متوسط التعافي بعد الانتكاسة',
        unit: recoverySpeed === 1 ? 'يوم' : 'أيام',
      },
      // 10
      habitConsistencyScore: {
        value: consistencyScore,
        label: 'مؤشر الثبات العادي',
        unit: '/ 100',
      },
    },
  })
}

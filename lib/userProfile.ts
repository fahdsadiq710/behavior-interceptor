/* User profile — collected at onboarding + updated from learned behavior */

export type HabitType = 'build' | 'quit'
export type TriggerType = 'phone' | 'fatigue' | 'procrastination' | 'social' | 'boredom' | 'other'
export type ToneType = 'gentle' | 'direct' | 'motivational'
export type PreferredTime = 'morning' | 'afternoon' | 'evening' | 'night' | null
export type RetryPreference = 'soon' | 'later' | 'ask'

export interface UserProfile {
  goalText: string
  habitType: HabitType
  preferredTime: PreferredTime
  mainTrigger: TriggerType
  tone: ToneType
  preferredDuration: 1 | 3 | 5
  retryPreference: RetryPreference
  onboardingComplete: boolean

  // Learned / adapted fields (updated over time)
  learnedFailureHour: number | null     // most common hour user fails
  learnedSuccessHour: number | null     // most common hour user succeeds
  detectedTrigger: TriggerType | null   // AI-confirmed trigger
  confidenceScore: number               // 0-100, how well we know the user
  followUpsDone: string[]               // IDs of answered follow-up questions
}

export const DEFAULT_PROFILE: UserProfile = {
  goalText: '',
  habitType: 'build',
  preferredTime: null,
  mainTrigger: 'procrastination',
  tone: 'gentle',
  preferredDuration: 3,
  retryPreference: 'ask',
  onboardingComplete: false,
  learnedFailureHour: null,
  learnedSuccessHour: null,
  detectedTrigger: null,
  confidenceScore: 0,
  followUpsDone: [],
}

// Time labels for each preference
export const TIME_LABELS: Record<NonNullable<PreferredTime>, string> = {
  morning: 'الصباح',
  afternoon: 'بعد الظهر',
  evening: 'المساء',
  night: 'الليل',
}

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  phone: 'الجوال',
  fatigue: 'التعب',
  procrastination: 'التسويف',
  social: 'الانشغال الاجتماعي',
  boredom: 'الملل',
  other: 'أسباب أخرى',
}

export const TONE_LABELS: Record<ToneType, string> = {
  gentle: 'لطيف',
  direct: 'مباشر',
  motivational: 'تحفيزي',
}

// ── Shared record types (used by store + messageEngine to avoid circular imports) ──

export interface InterventionRecord {
  id: string
  message: string
  microAction: string
  timestamp: number
  hour: number
  accepted: boolean
  ignored: boolean
  retried: boolean
}

export interface SessionRecord {
  id: string
  startedAt: number
  endedAt?: number
  duration: number
  completed: boolean
  extended: boolean
  hourOfDay: number
}

// Compute preferred time from hour
export function hourToTimeOfDay(h: number): PreferredTime {
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  if (h >= 17 && h < 21) return 'evening'
  return 'night'
}

// Arabic label for current hour context
export function hourContextLabel(h: number): string {
  if (h >= 5 && h < 9) return 'الصبح الباكر'
  if (h >= 9 && h < 12) return 'الضحى'
  if (h >= 12 && h < 14) return 'الظهر'
  if (h >= 14 && h < 17) return 'بعد الظهر'
  if (h >= 17 && h < 20) return 'المساء'
  if (h >= 20 && h < 23) return 'الليل'
  return 'وقت متأخر'
}

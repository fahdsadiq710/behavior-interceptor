/*
  Personalized message engine.
  All messages are built from templates + user profile + behavior memory.
  Never static. Always contextual.
*/

import { UserProfile, HabitType, ToneType, hourContextLabel, TRIGGER_LABELS, InterventionRecord, SessionRecord } from './userProfile'

export interface BehaviorSnapshot {
  sessionCount: number
  streak: number
  lastSessionDate: string | null
  consecutiveIgnores: number       // interventions ignored in a row
  consecutiveSuccesses: number     // sessions completed in a row
  hadSessionYesterday: boolean
  wasCloseYesterday: boolean       // had an intervention yesterday but didn't start
  mostFailHour: number | null
  mostSuccessHour: number | null
  totalIgnored: number
  totalAccepted: number
  lastSessionDuration: number      // minutes
}

// ── Tone modifiers ──────────────────────────────────────────────────────────

const TONE_OPENERS: Record<ToneType, string[]> = {
  gentle: [
    'خلها خطوة بسيطة...',
    'ما في ضغط، بس خطوة صغيرة',
    'روّق وابدأ بهدوء',
    'كل شيء يبدأ بخطوة',
  ],
  direct: [
    'ابدأ الآن بدون تفكير',
    'وقت التنفيذ',
    'لا تأجيل. الآن.',
    'افعلها الآن',
  ],
  motivational: [
    'خطوة صغيرة اليوم = فرق كبير',
    'أنت قادر أكثر مما تظن',
    'كل بداية انتصار',
    'اليوم مختلف',
  ],
}

const TONE_CLOSERS: Record<ToneType, string[]> = {
  gentle:      ['تبغى نحاول؟', 'كيف تشوف؟', 'دقيقتين بس؟'],
  direct:      ['ابدأ الآن.', 'افعلها.', 'لا أعذار.'],
  motivational:['هيّا نبدأ!', 'قرار الآن.', 'أنت تستاهل أفضل من التسويف.'],
}

// ── Context-aware message templates ────────────────────────────────────────

interface MessageContext {
  profile: UserProfile
  snap: BehaviorSnapshot
  hour: number
  reason: string          // why intervention triggered
  retried: boolean
}

export function buildPersonalizedMessage(ctx: MessageContext): {
  message: string
  microAction: string
} {
  const { profile, snap, hour, reason, retried } = ctx
  const { tone, goalText, mainTrigger, preferredDuration, habitType } = profile
  const timeCtx = hourContextLabel(hour)
  const triggerLabel = TRIGGER_LABELS[mainTrigger]

  // ── Pick the right template based on reason + history ──────────────────

  let message = ''
  let microAction = ''

  // 1. RETRY — user dismissed before
  if (retried) {
    const opts = {
      gentle: [
        `لا بأس إنك أجّلت. لكن ${timeCtx} لا يزال مناسباً. ${pick(TONE_OPENERS.gentle)}`,
        `ما زلنا هنا. خطوة صغيرة كافية الآن.`,
      ],
      direct: [
        `أجّلت قبل شوي — الآن الوقت المناسب. ابدأ.`,
        `لا مزيد من التأجيل. ${timeCtx}. ابدأ.`,
      ],
      motivational: [
        `رجعنا! كل بداية ثانية أقوى من الأولى.`,
        `التأجيل انتهى. هذه الخطوة تكسر الجمود.`,
      ],
    }
    message = pick(opts[tone])
  }

  // 2. RETURN — was close yesterday / missed yesterday
  else if (snap.wasCloseYesterday || (snap.consecutiveIgnores >= 2)) {
    const opts = {
      gentle: [
        `أمس كنت قريب تبدأ… نكمل اليوم؟`,
        `أمس صعبة، لكن اليوم فرصة جديدة.`,
      ],
      direct: [
        `أمس راحت. اليوم لا.`,
        `يومان بدون بداية كافية. ابدأ الآن.`,
      ],
      motivational: [
        `أمس كنت قريب — اليوم تكمل! هيّا.`,
        `رجعة قوية تبدأ من قرار واحد الآن.`,
      ],
    }
    message = pick(opts[tone])
  }

  // 3. PATTERN-BASED — user typically fails at this hour
  else if (reason === 'high-risk-window' || reason === 'pattern-failure') {
    const opts = {
      gentle: [
        `عادةً ${timeCtx} يكون صعب عليك بسبب ${triggerLabel}… تبغى نبدأ ${preferredDuration} دقائق فقط؟`,
        `${timeCtx} وقت التحدي. لكن أنت تعرف ذلك. نبدأ بهدوء؟`,
      ],
      direct: [
        `${timeCtx} هو وقت الفشل المعتاد. اكسر النمط الآن.`,
        `${triggerLabel} يسيطر عليك هنا عادةً. أثبت العكس.`,
      ],
      motivational: [
        `هذا الوقت كان عدوك… اجعله حليفك اليوم!`,
        `عادةً ${timeCtx} تتشتت — لكن اليوم مختلف. هيّا!`,
      ],
    }
    message = pick(opts[tone])
  }

  // 4. FIRST NUDGE — new user
  else if (snap.sessionCount === 0) {
    const opts = {
      gentle: [
        `أول خطوة دائماً الأصعب. نبدأ بـ ${preferredDuration} دقائق فقط؟`,
        `البداية الصغيرة تغير كل شيء. هل أنت مستعد؟`,
      ],
      direct: [
        `لا شيء يتغير بدون بداية. ابدأ الآن.`,
        `${preferredDuration} دقائق. الآن. ابدأ.`,
      ],
      motivational: [
        `أول خطوة نحو ${goalText.slice(0, 20)} تبدأ اليوم!`,
        `هذه اللحظة ستتذكرها. ابدأ.`,
      ],
    }
    message = pick(opts[tone])
  }

  // 5. NO-SESSION-TODAY — knows user, first nudge for the day
  else if (reason === 'no-session-today') {
    const hadStreak = snap.streak > 2
    const opts = {
      gentle: [
        hadStreak
          ? `${snap.streak} أيام متتالية — لا تكسر السلسلة اليوم. خطوة صغيرة؟`
          : `لم تبدأ اليوم بعد. ما زال الوقت مناسباً.`,
      ],
      direct: [
        hadStreak
          ? `${snap.streak} أيام. لا تكسرها. ابدأ الآن.`
          : `يوم كامل ولم تبدأ. الآن أو لا.`,
      ],
      motivational: [
        hadStreak
          ? `${snap.streak} أيام قوية! واحد أكثر اليوم؟`
          : `اليوم يمكن أن يكون بداية سلسلتك. هيّا!`,
      ],
    }
    message = pick(opts[tone])
  }

  // 6. FOCUSED TIME — user's preferred time
  else {
    const opts = {
      gentle: [
        `${timeCtx} وقتك المفضل. نبدأ بهدوء؟`,
        `الظروف مثالية الآن. خطوة واحدة بس.`,
      ],
      direct: [
        `هذا وقتك. لا تضيّعه. ابدأ.`,
        `الآن أفضل وقت. ابدأ.`,
      ],
      motivational: [
        `${timeCtx} — وقتك الذهبي! استغله.`,
        `هذا الوقت صنعت فيه أفضل جلساتك. هيّا!`,
      ],
    }
    message = pick(opts[tone])
  }

  // ── Micro action based on goal + trigger ───────────────────────────────

  microAction = buildMicroAction(profile, habitType)

  return { message, microAction }
}

function buildMicroAction(profile: UserProfile, habitType: HabitType): string {
  const { mainTrigger, goalText, preferredDuration } = profile
  const goal = goalText.slice(0, 25)

  const triggerActions: Record<string, string[]> = {
    phone: [
      `ضع الجوال بعيداً عنك الآن`,
      `اقلب الجوال وضعه على الطاولة`,
      `فعّل وضع عدم الإزعاج`,
    ],
    fatigue: [
      `خذ نفساً عميقاً ثلاث مرات`,
      `اشرب كوب ماء وابدأ`,
      `قف وتمدد لثانية، ثم ابدأ`,
    ],
    procrastination: [
      `افتح الملف أو التطبيق فقط`,
      `اكتب جملة واحدة أو خطوة واحدة`,
      `ابدأ من آخر نقطة توقفت عندها`,
    ],
    social: [
      `أغلق المحادثات لـ ${preferredDuration} دقائق`,
      `ضع الهاتف في الصامت الكامل`,
    ],
    boredom: [
      `اختر الجزء الأكثر إثارة من ${goal}`,
      `غيّر مكانك وابدأ`,
    ],
    other: [
      `خطوة واحدة صغيرة نحو ${goal}`,
      `ابدأ بأسهل جزء`,
    ],
  }

  const quitActions: Record<string, string[]> = {
    phone: [`اشغل يديك بشيء آخر ${preferredDuration} دقائق`],
    fatigue: [`ارح جسمك بطريقة صحية: تمدد، لا جوال`],
    procrastination: [`بدّل النشاط بشيء مفيد الآن`],
    social: [`ابتعد عن محفّز العادة ${preferredDuration} دقائق`],
    boredom: [`استبدل العادة بنشاط بديل بسيط`],
    other: [`تجنّب المحفّز الآن وابدأ بديلاً`],
  }

  const pool = habitType === 'quit' ? quitActions[mainTrigger] : triggerActions[mainTrigger]
  return pick(pool || [`ابدأ بـ ${preferredDuration} دقائق من ${goal}`])
}

// ── Personalized reward messages ────────────────────────────────────────────

export function buildRewardMessage(
  type: 'start' | 'exceed' | 'return' | 'streak',
  profile: UserProfile,
  snap: BehaviorSnapshot
): string {
  const { tone, goalText } = profile
  const goal = goalText.slice(0, 20)

  const pools = {
    start: {
      gentle: [
        `بدأت — وهذا أهم من الكمال`,
        `الخطوة الأولى كانت الأصعب وفعلتها`,
        `بدأت اليوم. هذا يكفي.`,
      ],
      direct: [
        `بدأت. واصل.`,
        `قرار صح. استمر.`,
      ],
      motivational: [
        `بدأت اليوم — وهذا يغيّر كل شيء`,
        `أول خطوة نحو ${goal}. مبروك!`,
        snap.consecutiveSuccesses > 1
          ? `${snap.consecutiveSuccesses} جلسات متتالية! أنت في القمة.`
          : `بداية قوية. واصل.`,
      ],
    },
    exceed: {
      gentle: [`تجاوزت الهدف — ما شاء الله عليك`],
      direct:  [`تجاوزت. واضح أنك جاهز.`],
      motivational: [
        `أداء ممتاز! أثبتت إنك أكثر من المتوقع`,
        `واضح أنك تتحسن — استمر!`,
      ],
    },
    return: {
      gentle: [
        `رجعت رغم أنك تجاهلت قبل… وهذا تقدم`,
        `الرجوع دائماً أصعب من الاستمرار. مبروك.`,
      ],
      direct: [`رجعت. هذا يكفي. واصل.`],
      motivational: [
        `رجعة قوية — هذا هو الفرق بين من يتقدم ومن لا`,
        `رجعت. أنت قوي.`,
      ],
    },
    streak: {
      gentle:      [`${snap.streak} أيام متتالية. ما شاء الله.`],
      direct:      [`${snap.streak} أيام. لا تكسر السلسلة.`],
      motivational:[`${snap.streak} أيام! أنت تبني عادة حقيقية.`],
    },
  }

  return pick(pools[type][tone] || pools[type].gentle)
}

// ── Insight personalization ──────────────────────────────────────────────────

export function buildInsightText(
  key: string,
  value: string | number,
  profile: UserProfile,
  snap: BehaviorSnapshot
): string {
  const { tone, goalText } = profile

  const templates: Record<string, string[]> = {
    bestHour: [
      `أنت تمشي أفضل لما تبدأ وقت ${value} 👀`,
      `${value} هو وقتك الذهبي — استغله`,
    ],
    failHour: [
      `${value} هو وقت تعثّرك الأكثر. نتجنّبه؟`,
      `لاحظنا إنك تتشتت عادةً حوالي ${value}`,
    ],
    energyPattern: [
      `${value} — هذا واضح من سلوكك`,
      `بناءً على جلساتك: أنت ${value}`,
    ],
    acceptRate: [
      `${value}٪ من رسائلنا تبدأ بعدها — ${+value > 60 ? 'ممتاز!' : 'نقدر نتحسن'}`,
      `كل ${Math.round(100 / Math.max(+value, 1))} رسائل تبدأ مرة — ${+value > 50 ? 'جيد' : 'نشتغل عليه'}`,
    ],
    recoveryRate: [
      `${value}٪ من المرات ترجع بعد التجاهل — ${+value > 50 ? 'قوي' : 'نحتاج نفهم سببه'}`,
    ],
    consistencyRate: [
      `${value}٪ من جلساتك تكملها — ${+value > 70 ? 'رائع 🔥' : 'نحن نشتغل على هذا'}`,
    ],
    riskPattern: [
      `نمط الخطر عندك: ${value}`,
    ],
  }

  return pick(templates[key] || [`${value}`])
}

// ── Follow-up questions ──────────────────────────────────────────────────────

export interface FollowUpQuestion {
  id: string
  question: string
  context: string    // why we're asking
  options: { label: string; value: string; profileUpdate: Record<string, unknown> }[]
  triggeredAfterSessions: number
  triggeredAfterDays: number
}

export const FOLLOW_UP_QUESTIONS: FollowUpQuestion[] = [
  {
    id: 'fq-failure-time',
    question: 'لاحظنا إن الوقت هذا صعب عليك… صح؟',
    context: 'بناءً على سجل تشتّتك',
    triggeredAfterSessions: 3,
    triggeredAfterDays: 2,
    options: [
      { label: 'أيوه صح', value: 'confirmed', profileUpdate: { confidenceScore: 20 } },
      { label: 'مو دائماً', value: 'partial', profileUpdate: {} },
      { label: 'لأ مو صح', value: 'denied', profileUpdate: { learnedFailureHour: null } },
    ],
  },
  {
    id: 'fq-trigger-confirm',
    question: 'يبدو إن الجوال هو السبب الرئيسي… توافق؟',
    context: 'ملاحظة من سلوكك',
    triggeredAfterSessions: 5,
    triggeredAfterDays: 3,
    options: [
      { label: 'أيوه الجوال', value: 'phone', profileUpdate: { mainTrigger: 'phone', detectedTrigger: 'phone', confidenceScore: 15 } },
      { label: 'لأ، التعب', value: 'fatigue', profileUpdate: { detectedTrigger: 'fatigue' } },
      { label: 'التسويف أكثر', value: 'procrastination', profileUpdate: { detectedTrigger: 'procrastination' } },
    ],
  },
  {
    id: 'fq-tone-adjust',
    question: 'هل تفضّل نكون أكثر صرامة أو نخليها خفيفة؟',
    context: 'نريد التكيّف معك',
    triggeredAfterSessions: 7,
    triggeredAfterDays: 5,
    options: [
      { label: 'أكثر صرامة', value: 'direct', profileUpdate: { tone: 'direct' } },
      { label: 'تحفيزي أكثر', value: 'motivational', profileUpdate: { tone: 'motivational' } },
      { label: 'ابقى خفيف', value: 'gentle', profileUpdate: { tone: 'gentle' } },
    ],
  },
  {
    id: 'fq-duration',
    question: 'كم دقيقة تحس فيها إنها مناسبة لك؟',
    context: 'نضبط مدة الجلسة',
    triggeredAfterSessions: 4,
    triggeredAfterDays: 3,
    options: [
      { label: 'دقيقة واحدة', value: '1', profileUpdate: { preferredDuration: 1 } },
      { label: '٣ دقائق', value: '3', profileUpdate: { preferredDuration: 3 } },
      { label: '٥ دقائق', value: '5', profileUpdate: { preferredDuration: 5 } },
    ],
  },
  {
    id: 'fq-retry',
    question: 'لما تتجاهل التذكير، متى تبغى نرجع نذكّرك؟',
    context: 'نحسّن توقيت الرسائل',
    triggeredAfterSessions: 6,
    triggeredAfterDays: 4,
    options: [
      { label: 'بعد ٥ دقائق', value: 'soon', profileUpdate: { retryPreference: 'soon' } },
      { label: 'بعد ربع ساعة', value: 'later', profileUpdate: { retryPreference: 'later' } },
      { label: 'اسألني أنا', value: 'ask', profileUpdate: { retryPreference: 'ask' } },
    ],
  },
]

// ── Behavior snapshot computation ────────────────────────────────────────────

export function computeBehaviorSnapshot(
  interventions: InterventionRecord[],
  sessions: SessionRecord[],
  streak: number,
  sessionCount: number,
  lastSessionDate: string | null
): BehaviorSnapshot {
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  const hadSessionYesterday = sessions.some(
    s => new Date(s.startedAt).toDateString() === yesterday
  )

  const yesterdayInterventions = interventions.filter(
    iv => new Date(iv.timestamp).toDateString() === yesterday
  )
  const wasCloseYesterday = yesterdayInterventions.length > 0 && !hadSessionYesterday

  // Consecutive ignores
  let consecutiveIgnores = 0
  for (const iv of interventions) {
    if (iv.ignored) consecutiveIgnores++
    else break
  }

  // Consecutive successes
  let consecutiveSuccesses = 0
  for (const s of sessions) {
    if (s.completed) consecutiveSuccesses++
    else break
  }

  // Most fail / success hour
  const failHours: Record<number, number> = {}
  interventions.filter(iv => iv.ignored).forEach(iv => {
    failHours[iv.hour] = (failHours[iv.hour] || 0) + 1
  })
  const mostFailEntry = Object.entries(failHours).sort((a, b) => +b[1] - +a[1])[0]

  const successHours: Record<number, number> = {}
  sessions.filter(s => s.completed).forEach(s => {
    successHours[s.hourOfDay] = (successHours[s.hourOfDay] || 0) + 1
  })
  const mostSuccessEntry = Object.entries(successHours).sort((a, b) => +b[1] - +a[1])[0]

  return {
    sessionCount,
    streak,
    lastSessionDate,
    consecutiveIgnores,
    consecutiveSuccesses,
    hadSessionYesterday,
    wasCloseYesterday,
    mostFailHour: mostFailEntry ? +mostFailEntry[0] : null,
    mostSuccessHour: mostSuccessEntry ? +mostSuccessEntry[0] : null,
    totalIgnored: interventions.filter(iv => iv.ignored).length,
    totalAccepted: interventions.filter(iv => iv.accepted).length,
    lastSessionDuration: sessions[0]?.duration ?? 0,
  }
}

// ── Adaptive profile update from behavior ────────────────────────────────────

export function adaptProfileFromBehavior(
  profile: UserProfile,
  snap: BehaviorSnapshot
): Partial<UserProfile> {
  const updates: Partial<UserProfile> = {}

  // Learn failure hour
  if (snap.mostFailHour !== null && profile.learnedFailureHour !== snap.mostFailHour) {
    updates.learnedFailureHour = snap.mostFailHour
  }

  // Learn success hour
  if (snap.mostSuccessHour !== null && profile.learnedSuccessHour !== snap.mostSuccessHour) {
    updates.learnedSuccessHour = snap.mostSuccessHour
  }

  // Boost confidence score as we learn more
  const newConf = Math.min(100,
    (snap.sessionCount * 2) + (snap.totalAccepted * 3) + (snap.consecutiveSuccesses * 5)
  )
  if (newConf > profile.confidenceScore) {
    updates.confidenceScore = newConf
  }

  return updates
}

// ── Utils ────────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

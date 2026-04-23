import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserProfile, DEFAULT_PROFILE, InterventionRecord, SessionRecord } from '@/lib/userProfile'
import { adaptProfileFromBehavior, computeBehaviorSnapshot } from '@/lib/messageEngine'

export type { InterventionRecord, SessionRecord }

export type MindState = 'distracted' | 'focused' | 'starting' | 'idle'
export type UserLevel = 'Starter' | 'Consistent' | 'Focused' | 'Disciplined'

const LEVELS: UserLevel[] = ['Starter', 'Consistent', 'Focused', 'Disciplined']
const LEVEL_THRESHOLDS = [0, 80, 250, 600]

export interface ChatMessage {
  id: string
  text: string
  type: 'system' | 'ai' | 'reward' | 'followup'
  ts: number
  followUpId?: string
}

interface AppState {
  // Auth
  user: { id: string; name: string; email: string; isAdmin: boolean; status: string } | null
  token: string | null

  // ── User Profile (onboarding + learned) ──
  profile: UserProfile

  // ── Sessions ──
  activeSession: { id: string; startedAt: number; targetMinutes: number } | null
  sessionHistory: SessionRecord[]
  sessionCount: number
  totalMinutes: number

  // ── Mind State ──
  mindState: MindState
  setMindState: (state: MindState) => void

  // ── Intervention engine ──
  currentIntervention: InterventionRecord | null
  showIntervention: boolean
  interventionHistory: InterventionRecord[]
  lastDismissedAt: number | null
  retryCount: number

  // ── Chat ──
  chatMessages: ChatMessage[]

  // ── Progress ──
  points: number
  level: UserLevel
  streak: number
  lastSessionDate: string | null

  // ── Follow-up tracking ──
  pendingFollowUp: string | null   // question ID currently shown

  // ── Push ──
  pushEnabled: boolean

  // ── Actions ──
  setUser: (user: AppState['user'], token: string) => void
  logout: () => void

  updateProfile: (updates: Partial<UserProfile>) => void
  completeOnboarding: (profile: Partial<UserProfile>) => void

  startSession: (targetMinutes?: number) => void
  endSession: (extended?: boolean) => void

  triggerIntervention: (message: string, microAction: string, retried?: boolean) => void
  acceptIntervention: () => void
  dismissIntervention: () => void

  addChatMessage: (text: string, type?: ChatMessage['type'], followUpId?: string) => void
  clearChat: () => void

  answerFollowUp: (questionId: string, profileUpdate: Record<string, unknown>) => void
  setPendingFollowUp: (id: string | null) => void

  addPoints: (amount: number) => void
  setPushEnabled: (v: boolean) => void

  // Sync: update learned profile from behavior (call periodically)
  syncLearnedProfile: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      profile: DEFAULT_PROFILE,
      activeSession: null,
      sessionHistory: [],
      sessionCount: 0,
      totalMinutes: 0,
      mindState: 'idle',
      currentIntervention: null,
      showIntervention: false,
      interventionHistory: [],
      lastDismissedAt: null,
      retryCount: 0,
      chatMessages: [],
      points: 0,
      level: 'Starter',
      streak: 0,
      lastSessionDate: null,
      pendingFollowUp: null,
      pushEnabled: false,

      setMindState: (state) => set({ mindState: state }),

      setUser: (user, token) => set({ user, token }),

      logout: () => set({
        user: null,
        token: null,
        profile: DEFAULT_PROFILE,
        activeSession: null,
        currentIntervention: null,
        showIntervention: false,
        chatMessages: [],
        pendingFollowUp: null,
      }),

      updateProfile: (updates) =>
        set((s) => ({ profile: { ...s.profile, ...updates } })),

      completeOnboarding: (partial) =>
        set((s) => ({
          profile: {
            ...s.profile,
            ...partial,
            onboardingComplete: true,
            goalText: partial.goalText || s.profile.goalText,
          },
          chatMessages: [],
        })),

      startSession: (targetMinutes) => {
        const { profile } = get()
        const mins = targetMinutes ?? profile.preferredDuration
        const session = {
          id: `sess-${Date.now()}`,
          startedAt: Date.now(),
          targetMinutes: mins,
        }
        set((s) => ({
          activeSession: session,
          mindState: 'starting',
          showIntervention: false,
          currentIntervention: null,
          sessionCount: s.sessionCount + 1,
          retryCount: 0,
        }))
        setTimeout(() => get().setMindState('focused'), 2500)
      },

      endSession: (extended = false) => {
        const { activeSession, totalMinutes, addPoints, lastSessionDate, streak } = get()
        if (!activeSession) return

        const duration = Math.max(0, Math.round((Date.now() - activeSession.startedAt) / 60000))
        const record: SessionRecord = {
          id: activeSession.id,
          startedAt: activeSession.startedAt,
          endedAt: Date.now(),
          duration,
          completed: duration >= activeSession.targetMinutes,
          extended,
          hourOfDay: new Date().getHours(),
        }

        const today = new Date().toDateString()
        const yesterday = new Date(Date.now() - 86400000).toDateString()
        const newStreak =
          lastSessionDate === yesterday ? streak + 1
          : lastSessionDate === today ? streak
          : 1

        set((s) => ({
          activeSession: null,
          mindState: 'idle',
          totalMinutes: totalMinutes + duration,
          lastSessionDate: today,
          streak: newStreak,
          sessionHistory: [record, ...s.sessionHistory].slice(0, 100),
        }))

        addPoints(duration >= activeSession.targetMinutes ? 20 : 10)

        // Auto-adapt profile from new behavior data
        setTimeout(() => get().syncLearnedProfile(), 500)
      },

      triggerIntervention: (message, microAction, retried = false) => {
        const iv: InterventionRecord = {
          id: `iv-${Date.now()}`,
          message,
          microAction,
          timestamp: Date.now(),
          hour: new Date().getHours(),
          accepted: false,
          ignored: false,
          retried,
        }
        set((s) => ({
          currentIntervention: iv,
          showIntervention: true,
          mindState: 'distracted',
          retryCount: retried ? s.retryCount + 1 : 0,
        }))
      },

      acceptIntervention: () => {
        const { currentIntervention, addPoints } = get()
        if (!currentIntervention) return
        const updated: InterventionRecord = { ...currentIntervention, accepted: true }
        set((s) => ({
          showIntervention: false,
          currentIntervention: null,
          interventionHistory: [updated, ...s.interventionHistory].slice(0, 100),
        }))
        addPoints(15)
        get().startSession()
      },

      dismissIntervention: () => {
        const { currentIntervention } = get()
        if (!currentIntervention) return
        const updated: InterventionRecord = { ...currentIntervention, ignored: true }
        set((s) => ({
          showIntervention: false,
          currentIntervention: null,
          lastDismissedAt: Date.now(),
          interventionHistory: [updated, ...s.interventionHistory].slice(0, 100),
          mindState: 'distracted',
        }))
      },

      addChatMessage: (text, type = 'ai', followUpId) => {
        const msg: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          text,
          type,
          ts: Date.now(),
          followUpId,
        }
        set((s) => ({ chatMessages: [...s.chatMessages.slice(-24), msg] }))
      },

      clearChat: () => set({ chatMessages: [] }),

      answerFollowUp: (questionId, profileUpdate) => {
        set((s) => ({
          profile: {
            ...s.profile,
            ...profileUpdate,
            followUpsDone: [...s.profile.followUpsDone, questionId],
            confidenceScore: Math.min(100, s.profile.confidenceScore + 10),
          },
          pendingFollowUp: null,
        }))
      },

      setPendingFollowUp: (id) => set({ pendingFollowUp: id }),

      addPoints: (amount) => {
        set((s) => {
          const newPoints = s.points + amount
          const idx = LEVEL_THRESHOLDS.reduce((best, t, i) => newPoints >= t ? i : best, 0)
          return {
            points: newPoints,
            level: LEVELS[Math.min(idx, LEVELS.length - 1)],
          }
        })
      },

      setPushEnabled: (v) => set({ pushEnabled: v }),

      syncLearnedProfile: () => {
        const { profile, interventionHistory, sessionHistory, streak, sessionCount, lastSessionDate } = get()
        const snap = computeBehaviorSnapshot(
          interventionHistory, sessionHistory, streak, sessionCount, lastSessionDate
        )
        const updates = adaptProfileFromBehavior(profile, snap)
        if (Object.keys(updates).length > 0) {
          set((s) => ({ profile: { ...s.profile, ...updates } }))
        }
      },
    }),
    {
      name: 'behavior-interceptor-v3',
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        profile: s.profile,
        sessionCount: s.sessionCount,
        totalMinutes: s.totalMinutes,
        points: s.points,
        level: s.level,
        streak: s.streak,
        lastSessionDate: s.lastSessionDate,
        interventionHistory: s.interventionHistory,
        sessionHistory: s.sessionHistory,
        pushEnabled: s.pushEnabled,
      }),
    }
  )
)

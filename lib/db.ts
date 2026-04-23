/* Simple in-memory store — swap for Supabase/Postgres in production */

export type UserTone = 'Gentle' | 'Direct' | 'Strict'
export type HabitType = 'BUILD_DISCIPLINE' | 'ELIMINATE_DISTRACTION'
export type LogStatus = 'SUCCESS' | 'FAILED' | 'IGNORED' | 'PENDING'

export interface User {
  id: string
  name: string
  email: string
  password: string
  status: 'pending' | 'approved' | 'rejected'
  isAdmin: boolean
  createdAt: string
  goal?: string
  level?: number
  points?: number
  // New fields
  telegram_chat_id?: string | null
  user_tone?: UserTone
  onboarding_completed?: boolean
}

export interface Session {
  id: string
  userId: string
  startedAt: string
  duration?: number
  completed: boolean
}

export interface Intervention {
  id: string
  userId: string
  triggeredAt: string
  accepted: boolean
  message: string
}

export interface Reward {
  id: string
  userId: string
  type: 'start' | 'exceed' | 'return'
  awardedAt: string
}

export interface Habit {
  id: string
  userId: string
  type: HabitType
  goal_text: string
  main_trigger: string
  past_failure_reason: string
  preferred_time: string
  alternative_action: string
  difficulty_level: number // 1-5
  createdAt: string
}

export interface HabitLog {
  id: string
  habit_id: string
  userId: string
  date: string // ISO date string YYYY-MM-DD
  status: LogStatus
  user_response_time: number // seconds until user responded
  hour: number // 0-23 for time analytics
  day_of_week: number // 0=Sun … 6=Sat
  telegram_message_id?: string // Telegram message ID for inline-button tracking
  createdAt: string
}

// In-memory store (resets on server restart)
const store = {
  users: [
    {
      id: 'admin-001',
      name: 'المدير',
      email: 'admin@interceptor.ai',
      password: '$2a$10$o785Cr6PX1NIQjhc0rWrxeZfkuO8IpayQc5OmOTwhcEC.28VX/Cqy', // "admin123"
      status: 'approved' as const,
      isAdmin: true,
      createdAt: new Date().toISOString(),
      level: 10,
      points: 9999,
      onboarding_completed: true,
    },
  ] as User[],
  sessions: [] as Session[],
  interventions: [] as Intervention[],
  rewards: [] as Reward[],
  habits: [] as Habit[],
  habitLogs: [] as HabitLog[],
}

export const db = {
  users: {
    findByEmail: (email: string) => store.users.find(u => u.email === email),
    findById: (id: string) => store.users.find(u => u.id === id),
    findByTelegramChatId: (chatId: string) =>
      store.users.find(u => u.telegram_chat_id === chatId),
    create: (user: Omit<User, 'id' | 'createdAt'>) => {
      const newUser: User = {
        ...user,
        id: `user-${Date.now()}`,
        createdAt: new Date().toISOString(),
        level: 1,
        points: 0,
        onboarding_completed: false,
      }
      store.users.push(newUser)
      return newUser
    },
    update: (id: string, data: Partial<User>) => {
      const idx = store.users.findIndex(u => u.id === id)
      if (idx === -1) return null
      store.users[idx] = { ...store.users[idx], ...data }
      return store.users[idx]
    },
    list: () => store.users,
    pending: () => store.users.filter(u => u.status === 'pending'),
  },

  sessions: {
    create: (userId: string) => {
      const session: Session = {
        id: `sess-${Date.now()}`,
        userId,
        startedAt: new Date().toISOString(),
        completed: false,
      }
      store.sessions.push(session)
      return session
    },
    complete: (id: string, duration: number) => {
      const idx = store.sessions.findIndex(s => s.id === id)
      if (idx === -1) return null
      store.sessions[idx] = { ...store.sessions[idx], duration, completed: true }
      return store.sessions[idx]
    },
    byUser: (userId: string) => store.sessions.filter(s => s.userId === userId),
  },

  interventions: {
    create: (userId: string, message: string) => {
      const iv: Intervention = {
        id: `iv-${Date.now()}`,
        userId,
        triggeredAt: new Date().toISOString(),
        accepted: false,
        message,
      }
      store.interventions.push(iv)
      return iv
    },
    accept: (id: string) => {
      const idx = store.interventions.findIndex(i => i.id === id)
      if (idx === -1) return null
      store.interventions[idx].accepted = true
      return store.interventions[idx]
    },
    byUser: (userId: string) => store.interventions.filter(i => i.userId === userId),
  },

  rewards: {
    create: (userId: string, type: Reward['type']) => {
      const reward: Reward = {
        id: `rw-${Date.now()}`,
        userId,
        type,
        awardedAt: new Date().toISOString(),
      }
      store.rewards.push(reward)
      return reward
    },
    byUser: (userId: string) => store.rewards.filter(r => r.userId === userId),
  },

  habits: {
    all: () => store.habits,
    create: (data: Omit<Habit, 'id' | 'createdAt'>) => {
      const habit: Habit = {
        ...data,
        id: `habit-${Date.now()}`,
        createdAt: new Date().toISOString(),
      }
      store.habits.push(habit)
      return habit
    },
    byUser: (userId: string) => store.habits.filter(h => h.userId === userId),
    findById: (id: string) => store.habits.find(h => h.id === id),
    latest: (userId: string) => {
      const userHabits = store.habits.filter(h => h.userId === userId)
      return userHabits[userHabits.length - 1] ?? null
    },
  },

  habitLogs: {
    create: (data: Omit<HabitLog, 'id' | 'createdAt'>) => {
      const now = new Date()
      const log: HabitLog = {
        ...data,
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: now.toISOString(),
      }
      store.habitLogs.push(log)
      return log
    },
    byHabit: (habitId: string) => store.habitLogs.filter(l => l.habit_id === habitId),
    byUser: (userId: string) => store.habitLogs.filter(l => l.userId === userId),
    byUserAndDate: (userId: string, date: string) =>
      store.habitLogs.filter(l => l.userId === userId && l.date === date),
    findPendingByHabit: (habitId: string) =>
      store.habitLogs
        .filter(l => l.habit_id === habitId && l.status === 'PENDING')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null,
    findPendingByTelegramMessageId: (msgId: string) =>
      store.habitLogs.find(l => l.telegram_message_id === msgId && l.status === 'PENDING') ?? null,
    updateStatus: (logId: string, status: LogStatus, responseTime?: number) => {
      const idx = store.habitLogs.findIndex(l => l.id === logId)
      if (idx === -1) return null
      store.habitLogs[idx] = {
        ...store.habitLogs[idx],
        status,
        user_response_time: responseTime ?? store.habitLogs[idx].user_response_time,
      }
      return store.habitLogs[idx]
    },
  },
}

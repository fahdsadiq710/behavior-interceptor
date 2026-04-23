/* Browser push notification helpers */

export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false

  const perm = await Notification.requestPermission()
  return perm === 'granted'
}

export function sendPushNotification(title: string, body: string, tag?: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  try {
    const n = new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: tag || 'behavior-interceptor',
      silent: false,
      dir: 'rtl',
      lang: 'ar',
    })
    // Auto-close after 8 seconds
    setTimeout(() => n.close(), 8000)
    return n
  } catch {
    // Notification API may be restricted in some contexts
  }
}

export function scheduleInterventionNotification(delayMs: number, goalText: string) {
  if (Notification.permission !== 'granted') return null

  const t = setTimeout(() => {
    sendPushNotification(
      'Behavior Interceptor',
      `وقت البدء بـ "${goalText.slice(0, 30)}" — ٣ دقائق تكفي`,
      'intervention'
    )
  }, delayMs)

  return t
}

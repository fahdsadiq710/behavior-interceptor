// Next.js 14 instrumentation hook — runs once when the server boots.
// Enabled via `experimental.instrumentationHook` in next.config.js.
export async function register() {
  // Only run in the Node.js runtime (not Edge), and only server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startScheduler } = await import('./services/scheduler')
    startScheduler()
  }
}

import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/users — admin: list all users
export async function GET() {
  const caller = getServerUser()
  if (!caller?.isAdmin) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const users = db.users.list().map(({ password: _, ...u }) => u)
  return NextResponse.json({ users })
}

// PATCH /api/users — admin: approve or reject user
export async function PATCH(req: Request) {
  const caller = getServerUser()
  if (!caller?.isAdmin) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const { userId, status } = await req.json()
  if (!userId || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 })
  }

  const updated = db.users.update(userId, { status })
  if (!updated) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })

  const { password: _, ...safeUser } = updated
  return NextResponse.json({ user: safeUser })
}

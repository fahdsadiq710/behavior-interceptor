import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { signToken } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    const user = db.users.findByEmail(email)
    if (!user) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 })
    }

    if (user.status === 'pending') {
      return NextResponse.json({ error: 'pending', message: 'حسابك قيد المراجعة' }, { status: 403 })
    }

    if (user.status === 'rejected') {
      return NextResponse.json({ error: 'rejected', message: 'تم رفض حسابك' }, { status: 403 })
    }

    const token = signToken({ userId: user.id, email: user.email, isAdmin: user.isAdmin })
    const { password: _, ...safeUser } = user

    const response = NextResponse.json({ user: safeUser, token })
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })
    return response
  } catch {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

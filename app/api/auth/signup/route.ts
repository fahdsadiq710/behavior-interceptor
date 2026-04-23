import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    if (db.users.findByEmail(email)) {
      return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = db.users.create({
      name,
      email,
      password: hashed,
      status: 'pending',
      isAdmin: false,
    })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...safeUser } = user
    return NextResponse.json({ user: safeUser, message: 'تم التسجيل. بانتظار موافقة الإدارة.' }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}

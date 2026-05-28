import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ ok: false })
  try {
    await prisma.activeSession.delete({ where: { usuarioId: parseInt(session.user.id) } })
  } catch { /* already deleted */ }
  return NextResponse.json({ ok: true })
}

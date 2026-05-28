import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// Update last activity (called periodically from client)
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ ok: false })
  try {
    await prisma.activeSession.update({
      where: { usuarioId: parseInt(session.user.id) },
      data: { lastActivity: new Date() },
    })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ ok: false }) }
}

// Admin: get all active sessions
export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const sessions = await prisma.activeSession.findMany({ orderBy: { lastActivity: 'desc' } })
    const usuarios = await prisma.usuario.findMany({ select: { id: true, nombre: true, rol: true, usuario: true } })
    const result = sessions.map(s => ({
      ...s,
      usuario: usuarios.find(u => u.id === s.usuarioId),
    }))
    return NextResponse.json(result)
  } catch { return NextResponse.json([]) }
}

// Admin: force close a session
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const usuarioId = searchParams.get('usuario_id')
  if (!usuarioId) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  try {
    await prisma.activeSession.delete({ where: { usuarioId: Number(usuarioId) } })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ ok: true }) }
}

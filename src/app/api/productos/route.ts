import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const buscar = searchParams.get('buscar') || ''
  const categoria = searchParams.get('categoria') || ''

  const where: any = { activo: true }
  if (buscar) {
    where.OR = [
      { nombre: { contains: buscar, mode: 'insensitive' } },
      { codigo: { contains: buscar, mode: 'insensitive' } },
      { descripcion: { contains: buscar, mode: 'insensitive' } },
    ]
  }
  if (categoria) where.categoria = categoria

  const productos = await prisma.producto.findMany({ where, orderBy: { nombre: 'asc' } })
  return NextResponse.json(productos)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { id, nombre, codigo, descripcion, precio, costo, stock, stockMinimo, categoria, unidad, imagenUrl } = body

  if (!nombre) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

  if (id) {
    const prod = await prisma.producto.update({
      where: { id: Number(id) },
      data: { nombre, codigo, descripcion, precio: +precio || 0, costo: +costo || 0, stock: +stock || 0, stockMinimo: +stockMinimo || 5, categoria: categoria || 'General', unidad: unidad || 'unidad', imagenUrl: imagenUrl || null },
    })
    return NextResponse.json({ ok: true, producto: prod })
  }

  const prod = await prisma.producto.create({
    data: { nombre, codigo, descripcion, precio: +precio || 0, costo: +costo || 0, stock: +stock || 0, stockMinimo: +stockMinimo || 5, categoria: categoria || 'General', unidad: unidad || 'unidad', imagenUrl: imagenUrl || null },
  })
  return NextResponse.json({ ok: true, producto: prod })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  await prisma.producto.update({ where: { id: Number(id) }, data: { activo: false } })
  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const buscar = searchParams.get('buscar') || ''
    const categoria = searchParams.get('categoria') || ''
    const where: any = { activo: true }
    if (buscar) where.OR = [
      { nombre: { contains: buscar, mode: 'insensitive' } },
      { codigo: { contains: buscar, mode: 'insensitive' } },
      { descripcion: { contains: buscar, mode: 'insensitive' } },
    ]
    if (categoria) where.categoria = categoria
    const productos = await prisma.producto.findMany({ where, orderBy: { nombre: 'asc' } })
    return NextResponse.json(productos)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const body = await req.json()
    const { id, nombre, codigo, descripcion, precio, costo, stock, stockMinimo, categoria, unidad, imagenUrl } = body

    if (!nombre) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

    let codigoFinal = codigo

    // Auto-generate codigo if empty
    if (!codigoFinal || codigoFinal.trim() === '') {
      const cfg = await prisma.config.findUnique({ where: { clave: 'producto_prefijo' } })
      const prefix = cfg?.valor || 'WSP'
      const count = await prisma.producto.count()
      codigoFinal = `${prefix}-${String(count + 1).padStart(4, '0')}`
      // Ensure unique
      let exists = await prisma.producto.findFirst({ where: { codigo: codigoFinal } })
      let n = count + 2
      while (exists) {
        codigoFinal = `${prefix}-${String(n).padStart(4, '0')}`
        exists = await prisma.producto.findFirst({ where: { codigo: codigoFinal } })
        n++
      }
    }

    if (id) {
      const p = await prisma.producto.update({
        where: { id: Number(id) },
        data: { nombre, codigo: codigoFinal, descripcion, precio: +precio || 0, costo: +costo || 0, stock: +stock || 0, stockMinimo: +stockMinimo || 5, categoria: categoria || 'General', unidad: unidad || 'unidad', imagenUrl: imagenUrl || null },
      })
      return NextResponse.json({ ok: true, producto: p })
    }

    const p = await prisma.producto.create({
      data: { nombre, codigo: codigoFinal, descripcion, precio: +precio || 0, costo: +costo || 0, stock: +stock || 0, stockMinimo: +stockMinimo || 5, categoria: categoria || 'General', unidad: unidad || 'unidad', imagenUrl: imagenUrl || null },
    })
    return NextResponse.json({ ok: true, producto: p, codigoGenerado: codigoFinal })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    await prisma.producto.update({ where: { id: Number(id) }, data: { activo: false } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

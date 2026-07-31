import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Usuarios
  const adminPass = await bcrypt.hash('admin123', 12)
  const cajeroPass = await bcrypt.hash('cajero123', 12)

  await prisma.usuario.upsert({
    where: { usuario: 'admin' },
    update: {},
    create: { nombre: 'Administrador', usuario: 'admin', password: adminPass, rol: 'admin' },
  })
  await prisma.usuario.upsert({
    where: { usuario: 'cajero' },
    update: {},
    create: { nombre: 'Cajero', usuario: 'cajero', password: cajeroPass, rol: 'cajero' },
  })

  // Config defaults
  const defaults: [string, string][] = [
    ['empresa_nombre', 'Mi Tienda'],
    ['empresa_nit', 'CF'],
    ['empresa_direccion', ''],
    ['empresa_telefono', ''],
    ['empresa_email', ''],
    ['ticket_mensaje', '¡Gracias por su compra!'],
    ['iva_porcentaje', '5'],
    ['numero_siguiente', '1'],
    ['numero_siguiente_compra', '1'],
    ['moneda_simbolo', 'Q'],
    ['logo_base64', ''],
  ]
  for (const [clave, valor] of defaults) {
    await prisma.config.upsert({ where: { clave }, update: {}, create: { clave, valor } })
  }

  // Sample products
  const productos = [
    { codigo: 'P001', nombre: 'Coca Cola 350ml', precio: 5.50, costo: 3.50, stock: 50, categoria: 'Bebidas' },
    { codigo: 'P002', nombre: 'Agua Pura 500ml', precio: 3.00, costo: 1.50, stock: 100, categoria: 'Bebidas' },
    { codigo: 'P003', nombre: 'Pan Francés', precio: 1.50, costo: 0.75, stock: 30, categoria: 'Panadería' },
    { codigo: 'P004', nombre: 'Arroz 1 libra', precio: 4.00, costo: 2.50, stock: 80, categoria: 'Abarrotes' },
    { codigo: 'P005', nombre: 'Frijol 1 libra', precio: 5.00, costo: 3.00, stock: 60, categoria: 'Abarrotes' },
  ]
  for (const p of productos) {
    const exists = await prisma.producto.findFirst({ where: { codigo: p.codigo } })
    if (!exists) await prisma.producto.create({ data: p })
  }

  console.log('✅ Seed complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

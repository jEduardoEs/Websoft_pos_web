import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    return NextResponse.json({ error: 'Cloudinary no configurado. Agrega CLOUDINARY_CLOUD_NAME y CLOUDINARY_UPLOAD_PRESET en .env' }, { status: 500 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })

  // Upload to Cloudinary directly via REST API (unsigned upload)
  const cloudFormData = new FormData()
  cloudFormData.append('file', file)
  cloudFormData.append('upload_preset', uploadPreset)
  cloudFormData.append('folder', 'ws-pos/productos')

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: cloudFormData,
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('Cloudinary API Error:', err)
      return NextResponse.json({ error: err.error?.message || 'Error al subir imagen' }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ ok: true, url: data.secure_url, publicId: data.public_id })
  } catch (error: any) {
    console.error('Cloudinary fetch error:', error)
    return NextResponse.json({ error: error.message || 'Error de conexión con Cloudinary' }, { status: 500 })
  }
}

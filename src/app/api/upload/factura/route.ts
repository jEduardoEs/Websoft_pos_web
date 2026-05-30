import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      return NextResponse.json({ error: 'Cloudinary no configurado' }, { status: 500 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })

    const cloudFormData = new FormData()
    cloudFormData.append('file', file)
    cloudFormData.append('upload_preset', uploadPreset)
    cloudFormData.append('folder', 'ws-pos/facturas')
    // Allow PDF
    cloudFormData.append('resource_type', 'auto')

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST', body: cloudFormData,
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.error?.message || 'Error al subir' }, { status: 500 })
    }

    const data = await res.json()
    // Make PDF downloadable by adding fl_attachment to URL
    let url = data.secure_url
    if (data.resource_type === 'raw' || url.includes('.pdf')) {
      url = url.replace('/upload/', '/upload/fl_attachment/')
    }
    return NextResponse.json({ ok: true, url, publicId: data.public_id, tipo: data.resource_type })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 })
  }
}

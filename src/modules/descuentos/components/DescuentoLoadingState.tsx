'use client'
import React from 'react'
import { Skeleton } from '@/ui'

export function DescuentoLoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
      <Skeleton height={30} />
      <Skeleton height={25} />
      <Skeleton height={25} />
      <Skeleton height={25} />
    </div>
  )
}

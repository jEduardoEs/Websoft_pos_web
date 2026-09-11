'use client'
import React from 'react'

export interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: number
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 4 }: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: '#e2e8f0',
        opacity: 0.7,
      }}
    />
  )
}

'use client'
import React from 'react'

export interface TabItem {
  id: string
  label: string
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: 16, marginBottom: 16 }}>
      {tabs.map(t => {
        const isActive = t.id === activeTab
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#2563eb' : '#64748b',
              borderBottom: `2px solid ${isActive ? '#2563eb' : 'transparent'}`,
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

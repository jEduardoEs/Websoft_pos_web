'use client'
import Link from 'next/link'

export interface NavItem {
  href: string
  label: string
  modulo: string
  icon: string
  roles?: string[]
}

export interface NavGroup {
  id: string
  label: string
  icon: string
  roles?: string[]
  items: NavItem[]
}

interface SidebarViewProps {
  pathname: string
  groups: NavGroup[]
  openGroups: Record<string, boolean>
  onToggleGroup: (id: string) => void
  canSeeGroup: (group: NavGroup) => boolean
  canSeeItem: (item: NavItem) => boolean
}

export default function SidebarView({ pathname, groups, openGroups, onToggleGroup, canSeeGroup, canSeeItem }: SidebarViewProps) {
  return (
    <aside style={{ width: 210, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100%' }}>
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 7, marginBottom: 6, background: pathname === '/dashboard' ? '#eff6ff' : 'transparent', color: pathname === '/dashboard' ? '#2563eb' : '#475569', fontSize: 13, fontWeight: pathname === '/dashboard' ? 700 : 500, transition: 'all .12s' }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ color: pathname === '/dashboard' ? '#2563eb' : '#94a3b8', flexShrink: 0 }}>
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </div>
        </Link>

        {groups.map((group) => {
          if (!canSeeGroup(group)) return null
          const isOpen = openGroups[group.id]
          const hasActive = group.items.some((item) => pathname === item.href || pathname.startsWith(item.href))

          return (
            <div key={group.id} style={{ marginBottom: 2 }}>
              <button onClick={() => onToggleGroup(group.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', background: hasActive && !isOpen ? '#eff6ff' : 'transparent', color: hasActive ? '#2563eb' : '#374151', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all .12s', textAlign: 'left' }}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ color: hasActive ? '#2563eb' : '#94a3b8', flexShrink: 0 }}>
                  <path d={group.icon} />
                </svg>
                <span style={{ flex: 1 }}>{group.label}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#94a3b8', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform .2s', flexShrink: 0 }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {isOpen && (
                <div style={{ paddingLeft: 12, marginTop: 2 }}>
                  {group.items.map((item) => {
                    if (!canSeeItem(item)) return null
                    const active = pathname === item.href || pathname.startsWith(item.href)
                    return (
                      <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 9px', borderRadius: 6, marginBottom: 1, background: active ? '#eff6ff' : 'transparent', color: active ? '#2563eb' : '#64748b', fontSize: 12, fontWeight: active ? 600 : 400, borderLeft: `2px solid ${active ? '#2563eb' : 'transparent'}`, transition: 'all .12s' }}>
                          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ color: active ? '#2563eb' : '#94a3b8', flexShrink: 0 }}>
                            <path d={item.icon} />
                          </svg>
                          {item.label}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div style={{ padding: '10px 12px', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: 9, color: '#cbd5e1', textAlign: 'center', letterSpacing: 0.5 }}>WebSoft Solutions · Guastatoya</div>
      </div>
    </aside>
  )
}

'use client'
import { ReactNode } from 'react'
import Sidebar from '@/components/Sidebar'

interface MobileLayoutViewProps {
  sidebarOpen: boolean
  onToggle: () => void
  onClose: () => void
  pathname: string
  children: ReactNode
}

export default function MobileLayoutView({ sidebarOpen, onToggle, onClose, pathname, children }: MobileLayoutViewProps) {
  return (
    <>
      {sidebarOpen && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 98, display: 'none' }}
          className="mobile-overlay"
        />
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div className={`sidebar-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <Sidebar />
        </div>

        <main style={{ flex: 1, overflowY: 'auto', background: '#f4f3ef', minWidth: 0 }}>
          <button
            onClick={onToggle}
            className="hamburger-btn"
            aria-label="Menú"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              {sidebarOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
              }
            </svg>
          </button>
          {children}
        </main>
      </div>

      <style>{`
        .sidebar-wrapper {
          flex-shrink: 0;
        }
        .hamburger-btn {
          display: none;
        }
        .mobile-overlay {
          display: none !important;
        }

        @media (max-width: 768px) {
          .sidebar-wrapper {
            position: fixed;
            top: 56px;
            left: -220px;
            bottom: 0;
            width: 220px;
            z-index: 99;
            transition: left .25s cubic-bezier(.4,0,.2,1);
            box-shadow: none;
          }
          .sidebar-wrapper.sidebar-open {
            left: 0;
            box-shadow: 4px 0 20px rgba(0,0,0,.15);
          }
          .mobile-overlay {
            display: block !important;
          }
          .hamburger-btn {
            display: flex;
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 97;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: #18181b;
            color: #fff;
            border: none;
            cursor: pointer;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(0,0,0,.3);
          }
        }
      `}</style>
    </>
  )
}

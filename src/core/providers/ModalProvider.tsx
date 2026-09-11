'use client'
import React, { createContext, useContext, useState } from 'react'

interface ModalContextType {
  activeModal: string | null
  modalData: unknown
  openModal: (id: string, data?: unknown) => void
  closeModal: () => void
}

const ModalContext = createContext<ModalContextType>({
  activeModal: null,
  modalData: null,
  openModal: () => {},
  closeModal: () => {},
})

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [modalData, setModalData] = useState<unknown>(null)

  const openModal = (id: string, data?: unknown) => {
    setActiveModal(id)
    setModalData(data ?? null)
  }

  const closeModal = () => {
    setActiveModal(null)
    setModalData(null)
  }

  return (
    <ModalContext.Provider value={{ activeModal, modalData, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  )
}

export const useGlobalModal = () => useContext(ModalContext)

'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useCompras } from '@/modules/compras/hooks/use-compras';
import { ComprasTable } from '@/modules/compras/components/ComprasTable';
import { CompraFormModal } from '@/modules/compras/components/CompraFormModal';
import { CompraDetalleModal } from '@/modules/compras/components/CompraDetalleModal';
import { Compra } from '@/modules/compras/types/compra';

export function ComprasModule() {
  const comprasHook = useCompras();
  
  const [showModal, setShowModal] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [selected, setSelected] = useState<Compra | null>(null);
  
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);

  useEffect(() => {
    comprasHook.fetchCompras();
    
    // Fetch dependencies
    Promise.all([
      fetch('/api/proveedores').then(r => r.json()),
      fetch('/api/productos').then(r => r.json())
    ]).then(([p, pr]) => {
      setProveedores(Array.isArray(p) ? p : []);
      setProductos(Array.isArray(pr) ? pr : []);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (comprasHook.error) {
    toast.error(comprasHook.error);
  }

  return (
    <div className="page-wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Compras e Ingresos</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>Historial de compras a proveedores e ingresos a inventario.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => comprasHook.fetchCompras()} className="btn-secondary" disabled={comprasHook.loading}>
            {comprasHook.loading ? '...' : '↻ Actualizar'}
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Registrar Compra
          </button>
        </div>
      </div>

      <ComprasTable 
        compras={comprasHook.compras} 
        onView={(c) => {
          setSelected(c);
          setShowDetalle(true);
        }} 
      />

      {showModal && (
        <CompraFormModal
          onClose={() => setShowModal(false)}
          onSuccess={() => setShowModal(false)}
          proveedores={proveedores}
          productos={productos}
          comprasHook={comprasHook}
        />
      )}

      {showDetalle && selected && (
        <CompraDetalleModal
          compra={selected}
          onClose={() => {
            setShowDetalle(false);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
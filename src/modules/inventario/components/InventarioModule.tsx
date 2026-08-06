'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Producto } from '@/modules/productos/types/producto';
import { useProductos, useDeleteProducto } from '@/modules/productos/hooks/use-productos';
import { ProductosTable } from '@/modules/productos/components/ProductosTable';
import { ProductoFormModal } from '@/modules/productos/components/ProductoFormModal';
import { KardexModal } from '@/modules/inventario/components/KardexModal';
import { toast } from 'sonner';

const CATS_DEFAULT = ['General', 'CCTV', 'Periféricos', 'Componentes PC', 'Cables', 'Accesorios', 'Redes', 'Servicios', 'Herramientas'];

export function InventarioModule() {
  const { productos, fetchProductos } = useProductos();
  const { deleteProducto } = useDeleteProducto();
  
  const [buscar, setBuscar] = useState('');
  const [filtCat, setFiltCat] = useState('');
  
  const [showFormModal, setShowFormModal] = useState(false);
  const [formProducto, setFormProducto] = useState<Producto | null>(null);
  
  const [kardexModalProducto, setKardexModalProducto] = useState<Producto | null>(null);

  useEffect(() => {
    fetchProductos({ buscar, categoria: filtCat || undefined });
  }, [buscar, filtCat]);

  const categorias = useMemo(() => {
    return Array.from(new Set([...CATS_DEFAULT, ...productos.map(p => p.categoria || '')])).filter(Boolean).sort();
  }, [productos]);

  const openNew = () => {
    setFormProducto(null);
    setShowFormModal(true);
  };

  const openEdit = (p: Producto) => {
    setFormProducto(p);
    setShowFormModal(true);
  };

  const del = async (p: Producto) => {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
    try {
      await deleteProducto(p.id);
      toast.success('Producto eliminado');
      fetchProductos({ buscar, categoria: filtCat || undefined });
    } catch (e: any) {
      toast.error(e.message || 'Error al eliminar');
    }
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    fetchProductos({ buscar, categoria: filtCat || undefined });
  };

  const handleKardexSuccess = () => {
    fetchProductos({ buscar, categoria: filtCat || undefined });
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Inventario</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>{productos.length} productos listados</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Nuevo Producto</button>
      </div>

      {/* Filtros */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="input" placeholder="Buscar producto..." value={buscar} onChange={e => setBuscar(e.target.value)} style={{ flex: 1 }} />
          <select className="input" value={filtCat} onChange={e => setFiltCat(e.target.value)} style={{ width: 180 }}>
            <option value="">Todas las categorias</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Tabla de Productos */}
      <ProductosTable 
        productos={productos}
        onEdit={openEdit}
        onKardex={setKardexModalProducto}
        onDelete={del}
      />

      {/* Modales */}
      {showFormModal && (
        <ProductoFormModal 
          producto={formProducto} 
          categorias={categorias}
          onClose={() => setShowFormModal(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      {kardexModalProducto && (
        <KardexModal 
          producto={kardexModalProducto}
          onClose={() => setKardexModalProducto(null)}
          onSuccess={handleKardexSuccess}
        />
      )}
    </div>
  );
}

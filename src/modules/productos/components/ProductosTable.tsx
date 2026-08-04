'use client';

import React from 'react';
import { Producto } from '../types/producto';
import { fmt } from '@/lib/utils'; // Assuming this exists, I'll check it or recreate it inline if needed

interface ProductosTableProps {
  productos: Producto[];
  onEdit: (producto: Producto) => void;
  onKardex: (producto: Producto) => void;
  onDelete: (producto: Producto) => void;
}

export function ProductosTable({ productos, onEdit, onKardex, onDelete }: ProductosTableProps) {
  const thS: React.CSSProperties = { background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #f1f5f9' };
  const tdS: React.CSSProperties = { padding: '12px 16px', fontSize: 13, borderBottom: '1px solid #f1f5f9' };

  // Fallback formatter if fmt is not exported correctly
  const formatMoney = (val: any) => {
    if (typeof val !== 'number') return `Q0.00`;
    return `Q${val.toFixed(2)}`;
  };

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>{['ID','Info','Categoria','Precio','Costo','Stock','Min.','Ud.','Acciones'].map(h => (
              <th key={h} style={thS}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No hay productos encontrados.</td></tr>
            ) : productos.map(p => (
              <tr key={p.id} style={{ transition: 'background .2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ ...tdS, color: '#94a3b8', fontSize: 11 }}>#{p.id}</td>
                <td style={tdS}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {p.imagenUrl ? (
                      <img src={p.imagenUrl} alt={p.nombre} style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 8, border: '1px solid #f1f5f9' }} />
                    ) : (
                      <div style={{ width: 40, height: 40, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#94a3b8' }}>Sin img</div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.nombre}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{p.codigo}</div>
                    </div>
                  </div>
                </td>
                <td style={tdS}>
                  <span style={{ display: 'inline-block', padding: '2px 8px', background: '#eef2ff', color: '#4f46e5', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                    {p.categoria}
                  </span>
                </td>
                <td style={{ ...tdS, fontWeight: 700 }}>{formatMoney(p.precio)}</td>
                <td style={{ ...tdS, color: '#64748b' }}>{formatMoney(p.costo)}</td>
                <td style={tdS}>
                  <span style={{ fontWeight: 700, color: p.stock <= (p.stockMinimo || 0) ? '#dc2626' : p.stock <= (p.stockMinimo || 0) * 2 ? '#d97706' : '#16a34a' }}>
                    {p.stock}
                  </span>
                </td>
                <td style={{ ...tdS, color: '#64748b' }}>{p.stockMinimo}</td>
                <td style={{ ...tdS, color: '#64748b', fontSize: 12 }}>{p.unidad}</td>
                <td style={tdS}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button className="btn-ghost btn-sm" onClick={() => onEdit(p)}>
                      Editar
                    </button>
                    <button className="btn-ghost btn-sm" onClick={() => onKardex(p)} style={{ color: '#7c3aed', borderColor: '#ddd6fe' }}>
                      Kardex
                    </button>
                    <button className="btn-danger btn-sm" onClick={() => onDelete(p)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

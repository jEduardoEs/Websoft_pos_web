'use client';

import React from 'react';
import { Producto } from '../types/producto';
import { fmt } from '@/lib/utils';

interface ProductosTableProps {
  productos: Producto[];
  onEdit: (producto: Producto) => void;
  onKardex: (producto: Producto) => void;
  onDelete: (producto: Producto) => void;
}

export function ProductosTable({ productos, onEdit, onKardex, onDelete }: ProductosTableProps) {
  const formatMoney = (val: any) => {
    if (typeof val !== 'number') return 'Q0.00';
    return `Q${val.toFixed(2)}`;
  };

  return (
    <div className="table-card">
      <div className="table-card-inner">
        <table>
          <thead>
            <tr>
              <th style={{ width: 50 }}>ID</th>
              <th>Producto</th>
              <th>Categoria</th>
              <th style={{ textAlign: 'right' }}>Precio</th>
              <th style={{ textAlign: 'right' }}>Costo</th>
              <th style={{ textAlign: 'right' }}>Stock</th>
              <th style={{ textAlign: 'right' }}>Min.</th>
              <th>Ud.</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 48, color: '#8a887e' }}>
                  No hay productos encontrados.
                </td>
              </tr>
            ) : (
              productos.map(p => (
                <tr key={p.id}>
                  <td style={{ color: '#8a887e', fontSize: 11 }}>#{p.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {p.imagenUrl ? (
                        <img src={p.imagenUrl} alt={p.nombre} style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 4, border: '1.5px solid #d8d6cd' }} />
                      ) : (
                        <div style={{ width: 36, height: 36, background: '#f4f3ef', borderRadius: 4, border: '1.5px solid #d8d6cd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#8a887e' }}>IMG</div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: '#18181b' }}>{p.nombre}</div>
                        <div style={{ fontSize: 11, color: '#8a887e', marginTop: 1 }}>{p.codigo}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge-gray" style={{ textTransform: 'capitalize' }}>{p.categoria}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatMoney(p.precio)}</td>
                  <td style={{ textAlign: 'right', color: '#52524d' }}>{formatMoney(p.costo)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: p.stock <= (p.stockMinimo || 0) ? '#b13a2e' : p.stock <= (p.stockMinimo || 0) * 2 ? '#b87410' : '#2f6b3a' }}>
                      {p.stock}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', color: '#52524d' }}>{p.stockMinimo}</td>
                  <td style={{ color: '#52524d', fontSize: 12 }}>{p.unidad}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                      <button className="btn-ghost btn-sm" onClick={() => onEdit(p)}>Editar</button>
                      <button className="btn-ghost btn-sm" onClick={() => onKardex(p)} style={{ color: '#7c3aed', borderColor: '#ddd6fe', background: '#f5f3ff' }}>Kardex</button>
                      <button className="btn-ghost btn-sm" onClick={() => onDelete(p)} style={{ color: '#b13a2e', borderColor: '#e3c3bd', background: '#f8eeec' }}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

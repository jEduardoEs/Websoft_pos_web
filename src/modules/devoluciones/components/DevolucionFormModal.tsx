"use client";
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { fmt } from '@/lib/utils';
import { Venta } from '../../ventas/types/venta';

/**
 * DevolucionFormModal – a premium‑styled modal for creating a new devolucion.
 * It mirrors the behaviour from the original page implementation but is
 * isolated as a reusable component.
 */
export function DevolucionFormModal({ open, onClose, onSuccess }) {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [ventaId, setVentaId] = useState('');
  const [ventaDetalle, setVentaDetalle] = useState<Venta | null>(null);

  const [motivo, setMotivo] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // Load completed sales when the modal is opened
  useEffect(() => {
    if (!open) return;
    const loadVentas = async () => {
      try {
        const res = await fetch('/api/ventas?estado=completada');
        const data: Venta[] = await res.json();
        setVentas(data);
      } catch {
        toast.error('No se pudieron cargar las facturas');
      }
    };
    loadVentas();
  }, [open]);

  // When a venta is selected, find its details and reset the product selection
  const handleVentaSelect = (id) => {
    setVentaId(id);
    if (!id) {
      setVentaDetalle(null);
      setSelectedItems({});
      return;
    }
    const v = ventas.find((x: Venta) => x.id === Number(id));
    setVentaDetalle(v || null);
    setSelectedItems({});
  };

  // Calculate total amount to be returned based on selected quantities
  const totalDev = Object.entries(selectedItems as Record<string, number>).reduce((s, [idx, qty]) => {
    const item = ventaDetalle?.items?.[Number(idx)];
    return s + (item ? item.precioUnitario * qty : 0);
  }, 0);

  const handleSave = async () => {
    if (!motivo) return toast.error('Motivo requerido');
    if (!ventaDetalle) return toast.error('Seleccione una factura');
    if (!ventaDetalle.items) return toast.error('La factura no tiene items');
    const items = Object.entries(selectedItems as Record<string, number>)
      .filter(([, q]) => q > 0)
      .map(([idx, qty]) => {
        const it = ventaDetalle.items![Number(idx)];
        return {
          productoId: it.productoId,
          nombre: it.nombre,
          cantidad: qty,
          precioUnitario: it.precioUnitario,
          subtotal: it.precioUnitario * qty,
        };
      });
    if (items.length === 0) return toast.error('Selecciona al menos un producto');
    setLoading(true);
    try {
      const res = await fetch('/api/devoluciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ventaId: ventaDetalle?.id,
          ventaNumero: ventaDetalle?.numero,
          motivo,
          items,
          totalDevuelto: totalDev,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast.success('Devolución registrada');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Error al crear la devolución');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Nueva Devolución</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        {/* --- Factura selector --- */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Factura de venta</label>
          <select
            className="w-full border rounded-md p-2"
            value={ventaId}
            onChange={(e) => handleVentaSelect(e.target.value)}
          >
            <option value="">Seleccionar factura…</option>
            {ventas.map((v) => (
              <option key={v.id} value={v.id}>
                {v.numero} — {v.clienteNombre} — {fmt(v.total)}
              </option>
            ))}
          </select>
        </div>
        {/* --- Motivo --- */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
          <input
            className="w-full border rounded-md p-2"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Razón de la devolución"
          />
        </div>
        {/* --- Productos a devolver --- */}
        {ventaDetalle && (
          <div className="mb-4">
            <p className="font-medium text-gray-700 mb-2">Seleccionar productos a devolver</p>
            {(ventaDetalle.items ?? []).map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b">
                <div>
                  <div className="font-medium text-gray-800">{item.nombre}</div>
                  <div className="text-xs text-gray-500">
                    Cant. comprada: {item.cantidad} — {fmt(item.precioUnitario)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Devolver:</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    max={item.cantidad}
                    className="w-16 border rounded-md p-1 text-center"
                    value={selectedItems[i] || 0}
                    onChange={(e) => {
                      const val = Math.min(item.cantidad, Math.max(0, Number(e.target.value)));
                      setSelectedItems((prev) => ({ ...prev, [i]: val }));
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        {/* --- Total a devolver --- */}
        {totalDev > 0 && (
          <div className="bg-red-50 rounded-md p-3 mb-4">
            <div className="flex justify-between font-bold text-red-600">
              <span>Total a devolver:</span>
              <span>{fmt(totalDev)}</span>
            </div>
          </div>
        )}
        {/* --- Actions --- */}
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Guardando…' : 'Registrar Devolución'}
          </button>
        </div>
      </div>
    </div>
  );
}

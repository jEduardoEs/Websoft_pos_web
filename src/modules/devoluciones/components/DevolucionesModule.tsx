'use client';

import { useDevoluciones } from '@/modules/devoluciones/hooks/useDevoluciones';
import { DevolucionesTable } from '@/modules/devoluciones/components/DevolucionesTable';
import { DevolucionFormModal } from '@/modules/devoluciones/components/DevolucionFormModal';
import { DevolucionDetailModal } from '@/modules/devoluciones/components/DevolucionDetailModal';
import { toast } from 'sonner';
import { fmtDateTime } from '@/lib/utils';

export function DevolucionesModule() {
  const {
    state: { devoluciones, loading, showFormModal, selected, detailModal },
    setters: { setShowFormModal, setSelected, setDetailModal },
    actions: { loadDevoluciones, aprobar, anular, reactivar },
  } = useDevoluciones();

  const isAdmin = true; // TODO: derive from session/role

  const handleView = (d) => {
    setDetailModal(d);
  };

  const handleAprobar = async (id) => {
    await aprobar(id);
  };

  const handleAnular = async (id) => {
    await anular(id);
  };

  const handleReactivar = async (id) => {
    await reactivar(id);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Devoluciones</h1>
        <p className="text-sm text-gray-600">{devoluciones.length} devoluciones registradas</p>
        <button
          className="btn-primary"
          onClick={() => {
            setSelected(null);
            setShowFormModal(true);
          }}
        >
          + Nueva Devolución
        </button>
      </header>

      <DevolucionesTable
        devoluciones={devoluciones}
        loading={loading}
        isAdmin={isAdmin}
        onView={handleView}
        onAprobar={handleAprobar}
        onAnular={handleAnular}
        onReactivar={handleReactivar}
      />

      {showFormModal && (
        <DevolucionFormModal
          open={showFormModal}
          onClose={() => setShowFormModal(false)}
          onSuccess={() => {
            toast.success('Devolución registrada');
            setShowFormModal(false);
            loadDevoluciones();
          }}
        />
      )}

      {detailModal && (
        <DevolucionDetailModal
          devolucion={detailModal}
          onClose={() => setDetailModal(null)}
        />
      )}
    </div>
  );
}

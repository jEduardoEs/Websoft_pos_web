// src/modules/marcas/components/MarcasTable.tsx

'use client';

import React from 'react';
import { Table } from '@/ui/tables/Table';
import { Marca } from '../types/marca';
import { useMarcas } from '../hooks/use-marcas';
import { TableColumn } from '@/types/table.types';

export function MarcasTable() {
  const { marcas, loading, error } = useMarcas();

  const columns: TableColumn<Marca>[] = [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'activo', label: 'Activo', render: (item) => (item.activo ? 'Sí' : 'No') },
  ];

  if (loading) return <p>Cargando marcas...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <Table
      columns={columns}
      data={marcas}
      keyExtractor={(m) => m.id}
    />
  );
}

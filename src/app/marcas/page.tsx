// src/app/marcas/page.tsx

import React from 'react';
import { MarcasTable } from '@/modules/marcas/components/MarcasTable';

export default function MarcasPage() {
  return (
    <section className="p-6">
      <h1 className="text-2xl font-bold mb-4">Marcas</h1>
      <MarcasTable />
    </section>
  );
}

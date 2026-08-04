// src/modules/categorias/hooks/use-categorias.ts

import { useEffect, useState } from 'react';
import { Categoria } from '../types/categoria';

export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/categorias')
      .then((r) => r.json())
      .then(setCategorias)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { categorias, loading, error };
}

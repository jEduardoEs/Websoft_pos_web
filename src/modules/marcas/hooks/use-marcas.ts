// src/modules/marcas/hooks/use-marcas.ts

import { useEffect, useState } from 'react';
import { Marca } from '../types/marca';

export function useMarcas() {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/marcas')
      .then((r) => r.json())
      .then(setMarcas)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { marcas, loading, error };
}

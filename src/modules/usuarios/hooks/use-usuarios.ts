// src/modules/usuarios/hooks/use-usuarios.ts

import { useEffect, useState } from 'react';
import { Usuario } from '../types/usuario';

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/usuarios')
      .then((r) => r.json())
      .then(setUsuarios)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { usuarios, loading, error };
}

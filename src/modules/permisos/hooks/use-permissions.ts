// src/modules/permisos/hooks/use-permissions.ts
import { useEffect, useState } from 'react';
import { Permission } from '@/modules/permisos/types/permission.types';

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPermissions() {
      try {
        const res = await fetch('/api/permisos');
        if (!res.ok) throw new Error('Failed to fetch permissions');
        const data: Permission[] = await res.json();
        setPermissions(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPermissions();
  }, []);

  return { permissions, loading, error };
}

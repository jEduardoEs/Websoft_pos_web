import { useState, useEffect, useCallback } from 'react';
import { RolDef } from '../types/role';
import { toast } from 'sonner';

export const useRoles = () => {
  const [roles, setRoles] = useState<RolDef[]>([]);
  const [loading, setLoading] = useState(false);
  const [usuariosPorRol, setUsuariosPorRol] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/roles');
      if (!res.ok) throw new Error('Error en API');
      const all = await res.json();
      setRoles(all);
      // Fetch user counts from legacy endpoint for now (will be replaced later)
      const usersRes = await fetch('/api/usuarios');
      if (usersRes.ok) {
        const usuarios = await usersRes.json();
        const counts: Record<string, number> = {};
        if (Array.isArray(usuarios)) {
          usuarios.forEach((u: any) => {
            counts[u.rol] = (counts[u.rol] || 0) + 1;
          });
        }
        setUsuariosPorRol(counts);
      }
    } catch (e) {
      toast.error('Error al cargar roles');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (nuevaLista: RolDef[]) => {
    setLoading(true);
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaLista),
      });
      if (!res.ok) throw new Error('Error al guardar');
      setRoles(nuevaLista);
      toast.success('Roles actualizados');
    } catch (e) {
      toast.error('Error al guardar roles');
    } finally {
      setLoading(false);
    }
  };

  return { roles, usuariosPorRol, loading, load, save };
};

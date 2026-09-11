import { useState, useEffect, useCallback } from 'react';

export function useDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/dashboard');
      if (!res.ok) {
        throw new Error('Error al cargar el dashboard');
      }
      const result = await res.json();
      if (result.error) {
        throw new Error(result.error);
      }
      setData(result);
    } catch (err: any) {
      console.error('[useDashboard] Error loading dashboard:', err);
      setError(err.message || 'Error al obtener dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    loading,
    error,
    refresh: fetchDashboardData
  };
}

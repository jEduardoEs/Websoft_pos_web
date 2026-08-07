import { useState, useEffect } from 'react';
import { DashboardService } from '../services/dashboard.service';

export function useDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Pass a mock user context; adjust as needed for real authentication
      const result = await DashboardService.getDashboardData({ role: 'admin', id: '0' } as any);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Error al obtener dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    data,
    loading,
    error,
    refresh: fetchDashboardData
  };
}

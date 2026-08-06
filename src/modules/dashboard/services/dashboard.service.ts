export class DashboardService {
  async getDashboardData(): Promise<any> {
    const res = await fetch('/api/dashboard');
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Error al cargar dashboard');
    }
    return res.json();
  }
}

export const dashboardService = new DashboardService();

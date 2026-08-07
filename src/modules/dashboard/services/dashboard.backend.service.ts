import { DashboardService } from '@/modules/dashboard/services/dashboard.service';

export class DashboardBackendService {
  static async getDashboardData(user: any) {
    return DashboardService.getDashboardData(user);
  }
}

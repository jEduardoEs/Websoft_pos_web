import { container } from './Container'

export class ServiceRegistry {
  public static registerService<T>(key: string, service: T): void {
    container.register<T>(key, service)
  }

  public static getService<T>(key: string): T {
    return container.resolve<T>(key)
  }
}

/**
 * Contenedor IoC / DI Liviano para la Arquitectura V2 del ERP
 */
export class Container {
  private static instance: Container
  private dependencies = new Map<string, unknown>()

  private constructor() {}

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container()
    }
    return Container.instance
  }

  public register<T>(key: string, dependency: T): void {
    this.dependencies.set(key, dependency)
  }

  public resolve<T>(key: string): T {
    const dep = this.dependencies.get(key)
    if (!dep) {
      throw new Error(`[Container] Dependencia no registrada: ${key}`)
    }
    return dep as T
  }

  public has(key: string): boolean {
    return this.dependencies.has(key)
  }

  public clear(): void {
    this.dependencies.clear()
  }
}

export const container = Container.getInstance()

/**
 * Clase Base para ViewModels de Presentación en la Arquitectura V2
 */
export abstract class BaseViewModel<TState = unknown> {
  protected state: TState

  constructor(initialState: TState) {
    this.state = initialState
  }

  public getState(): TState {
    return this.state
  }

  protected setState(newState: Partial<TState>): void {
    this.state = {
      ...this.state,
      ...newState,
    }
  }
}

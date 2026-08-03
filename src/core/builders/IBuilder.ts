export interface IBuilder<T> {
  build(): T
  reset(): this
}

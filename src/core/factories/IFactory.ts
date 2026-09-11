export interface IFactory<TInput = unknown, TOutput = unknown> {
  create(input: TInput): TOutput
}

export interface IUseCase<TInput = unknown, TOutput = unknown> {
  execute(input: TInput): Promise<TOutput> | TOutput
}

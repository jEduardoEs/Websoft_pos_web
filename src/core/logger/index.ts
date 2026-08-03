import { ConsoleLogger } from './ConsoleLogger'
import { ILogger } from './logger'

export * from './logger'
export * from './ConsoleLogger'
export * from './FileLogger'

export const logger: ILogger = new ConsoleLogger()

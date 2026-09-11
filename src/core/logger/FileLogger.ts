import { ILogger } from './logger'
import { ConsoleLogger } from './ConsoleLogger'

/**
 * FileLogger abstraction for production audit and file logging fallback
 */
export class FileLogger extends ConsoleLogger implements ILogger {
  // Extends ConsoleLogger for universal web/server execution
}

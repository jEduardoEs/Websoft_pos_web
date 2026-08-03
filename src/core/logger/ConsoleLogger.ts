import { ILogger, LogEntry, LogLevel } from './logger'

export class ConsoleLogger implements ILogger {
  private format(entry: LogEntry): string {
    const ctx = entry.context ? `[${entry.context}]` : ''
    return `${entry.timestamp} ${entry.level.toUpperCase()} ${ctx}: ${entry.message}`
  }

  private log(level: LogLevel, message: string, context?: string, data?: unknown) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      data,
    }
    const formatted = this.format(entry)

    switch (level) {
      case 'debug':
        if (process.env.NODE_ENV === 'development') console.debug(formatted, data ?? '')
        break
      case 'info':
        console.info(formatted, data ?? '')
        break
      case 'warn':
        console.warn(formatted, data ?? '')
        break
      case 'error':
        console.error(formatted, data ?? '')
        break
    }
  }

  debug(message: string, context?: string, data?: unknown): void {
    this.log('debug', message, context, data)
  }

  info(message: string, context?: string, data?: unknown): void {
    this.log('info', message, context, data)
  }

  warn(message: string, context?: string, data?: unknown): void {
    this.log('warn', message, context, data)
  }

  error(message: string, context?: string, data?: unknown): void {
    this.log('error', message, context, data)
  }
}

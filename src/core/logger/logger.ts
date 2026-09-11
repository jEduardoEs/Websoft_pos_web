export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: string
  data?: unknown
}

export interface ILogger {
  debug(message: string, context?: string, data?: unknown): void
  info(message: string, context?: string, data?: unknown): void
  warn(message: string, context?: string, data?: unknown): void
  error(message: string, context?: string, data?: unknown): void
}

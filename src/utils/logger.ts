/**
 * Logger utility for development and production environments
 * In production, only error logs are shown
 * In development, all logs are shown
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

class Logger {
  private isDev = import.meta.env.DEV

  private shouldLog(level: LogLevel): boolean {
    if (this.isDev) return true
    // In production, only show errors
    return level === 'error'
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(message, ...args)
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(message, ...args)
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(message, ...args)
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(message, ...args)
    }
  }
}

export const logger = new Logger()

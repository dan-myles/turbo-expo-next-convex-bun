import { env } from "./env"

export type LogLevel = "info" | "error" | "warn" | "debug"

// Base interface for the context object that users provide
// Using 'unknown' as default for values is safer than 'any'
export interface BaseLogContext {
  [key: string]: unknown
}

// This interface describes the final object that will be logged,
// combining the logger's internal fields with the user's context.
// T is the specific context type provided by the user (or BaseLogContext by default).
export type FinalLogEntry<T extends BaseLogContext = BaseLogContext> = {
  timestamp: string
  level: string // The level as an uppercase string (e.g., "INFO", "ERROR")
  message: string
} & T

class Logger {
  private readonly _logLevelPriorities: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  }

  private _currentLevel: LogLevel = "info"

  constructor() {
    this._initializeLogLevelFromEnv()
  }

  private _initializeLogLevelFromEnv(): void {
    const envLogLevel = env.LOG_LEVEL
    if (envLogLevel && this._logLevelPriorities[envLogLevel] !== undefined) {
      this._currentLevel = envLogLevel
    } else {
      console.log(
        `LOG_LEVEL environment variable not set or invalid. Defaulting to: ${this._currentLevel.toUpperCase()}`,
      )
    }
  }

  public setLogLevel(level: LogLevel): void {
    if (this._logLevelPriorities[level] === undefined) {
      console.warn(
        `Invalid log level '${level}', defaulting to '${this._currentLevel.toUpperCase()}'.`,
      )
    } else {
      this._currentLevel = level
    }
  }

  private _shouldLog(level: LogLevel): boolean {
    return (
      this._logLevelPriorities[level] >=
      this._logLevelPriorities[this._currentLevel]
    )
  }

  // The generic _log method now explicitly uses FinalLogEntry for its internal structure
  private _log<T extends BaseLogContext>(
    level: LogLevel,
    entry: { message: string } & T,
  ): void {
    if (!this._shouldLog(level)) {
      return
    }

    const timestamp = new Date().toISOString()
    // This is where the 'level' field is added to the log object.
    const formattedEntry: FinalLogEntry<T> = {
      timestamp,
      level: level.toUpperCase(), // <-- This adds the level field
      ...entry,
    }

    switch (level) {
      case "info":
        console.info(formattedEntry)
        break
      case "error":
        console.error(formattedEntry)
        break
      case "warn":
        console.warn(formattedEntry)
        break
      case "debug":
        console.debug(formattedEntry)
        break
      default:
        console.log(formattedEntry) // Fallback
    }
  }

  public info<T extends BaseLogContext = BaseLogContext>(
    message: string,
    context?: T,
  ): void {
    this._log("info", { message, ...(context ?? {}) } as {
      message: string
    } & T)
  }

  public error<T extends BaseLogContext = BaseLogContext>(
    message: string,
    context?: T,
  ): void {
    this._log("error", { message, ...(context ?? {}) } as {
      message: string
    } & T)
  }

  public warn<T extends BaseLogContext = BaseLogContext>(
    message: string,
    context?: T,
  ): void {
    this._log("warn", { message, ...(context ?? {}) } as {
      message: string
    } & T)
  }

  public debug<T extends BaseLogContext = BaseLogContext>(
    message: string,
    context?: T,
  ): void {
    this._log("debug", { message, ...(context ?? {}) } as {
      message: string
    } & T)
  }
}

export const logger = new Logger()

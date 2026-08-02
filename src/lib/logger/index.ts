type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: Record<string, any>;
}

class Logger {
  private module: string;

  constructor(module: string) {
    this.module = module;
  }

  private formatLog(level: LogLevel, message: string, data?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] [${this.module}] ${message}${dataStr}`;
  }

  info(message: string, data?: Record<string, any>): void {
    const log = this.formatLog("info", message, data);
    console.log(log);
  }

  warn(message: string, data?: Record<string, any>): void {
    const log = this.formatLog("warn", message, data);
    console.warn(log);
  }

  error(message: string, data?: Record<string, any>): void {
    const log = this.formatLog("error", message, data);
    console.error(log);
  }
}

export const createLogger = (module: string) => new Logger(module);

export default createLogger;

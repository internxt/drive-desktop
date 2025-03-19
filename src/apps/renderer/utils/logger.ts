/**
 * Logger for the renderer process.
 * Uses IPC to send log messages to the main process which handles actual logging to files.
 * Falls back to console logging when IPC is not available.
 */

type LogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly';

interface LogMessage {
  level: LogLevel;
  message: string;
  params: any[];
}

class RendererLogger {
  private isDev = process.env.NODE_ENV === 'development';

  error(message: any, ...optionalParams: any[]): void {
    this.log('error', message, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]): void {
    this.log('warn', message, ...optionalParams);
  }

  info(message: any, ...optionalParams: any[]): void {
    this.log('info', message, ...optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]): void {
    this.log('verbose', message, ...optionalParams);
  }

  debug(message: any, ...optionalParams: any[]): void {
    this.log('debug', message, ...optionalParams);
  }

  silly(message: any, ...optionalParams: any[]): void {
    this.log('silly', message, ...optionalParams);
  }

  private log(level: LogLevel, message: any, ...optionalParams: any[]): void {
    // Always log to console in development
    if (this.isDev || level === 'error') {
      const consoleMethod =
        level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[consoleMethod](
        `[${new Date().toISOString()}] [${level.toUpperCase()}]`,
        message,
        ...optionalParams
      );
    }

    // Try to send to main process via IPC if we're in Electron
    try {
      const logData: LogMessage = {
        level,
        message: typeof message === 'string' ? message : String(message),
        params: this.serializeParams(optionalParams),
      };

      // Try to send via IPC
      this.sendViaIPC('log-message', logData);
    } catch (error) {
      console.error('Failed to send log via IPC:', error);
    }
  }

  private serializeParams(params: any[]): any[] {
    return params.map((param) => {
      if (
        param === null ||
        param === undefined ||
        typeof param === 'number' ||
        typeof param === 'string' ||
        typeof param === 'boolean'
      ) {
        return param;
      }
      try {
        return JSON.stringify(param);
      } catch (e) {
        return String(param);
      }
    });
  }

  private sendViaIPC(channel: string, data: any): void {
    // Safely access window.electron without TypeScript errors
    const win = window as any;
    if (win.electron && typeof win.electron.ipcRenderer?.send === 'function') {
      win.electron.ipcRenderer.send(channel, data);
    }
  }
}

export default new RendererLogger();

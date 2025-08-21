import { logger } from '@internxt/drive-desktop-core/build/backend';

export enum AntivirusErrorCode {
  INITIALIZATION_FAILED = 'ANTIVIRUS_INITIALIZATION_FAILED',
  NOT_INITIALIZED = 'ANTIVIRUS_NOT_INITIALIZED',

  CLAMD_START_FAILED = 'CLAMD_START_FAILED',
  CLAMD_NOT_AVAILABLE = 'CLAMD_NOT_AVAILABLE',
  CLAMD_TIMEOUT = 'CLAMD_TIMEOUT',
  CLAMD_CONFIG_ERROR = 'CLAMD_CONFIG_ERROR',

  SCAN_FAILED = 'SCAN_FAILED',
  FILE_ACCESS_ERROR = 'FILE_ACCESS_ERROR',

  DATABASE_ERROR = 'DATABASE_ERROR',

  UNKNOWN_ERROR = 'ANTIVIRUS_UNKNOWN_ERROR',
}

/**
 * Custom error class for Antivirus-related errors
 */
export class AntivirusError extends Error {
  code: AntivirusErrorCode;
  originalError?: Error | unknown;
  details?: Record<string, unknown>;

  /**
   * Create a new AntivirusError
   *
   * @param code - Error code from AntivirusErrorCode enum
   * @param message - Human-readable error message
   * @param originalError - Original error that caused this error (optional)
   * @param details - Additional details about the error (optional)
   */
  constructor(
    code: AntivirusErrorCode,
    message: string,
    originalError?: Error | unknown,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AntivirusError';
    this.code = code;
    this.originalError = originalError;
    this.details = details;

    logger.error({
      tag: 'ANTIVIRUS',
      msg: `[${this.name}][${this.code}] ${this.message}`,
      error: originalError,
      details: {
        ...details,
        stack: this.stack,
      },
    });
  }

  /**
   * Create an initialization error
   */
  static initializationFailed(
    message: string,
    originalError?: Error | unknown
  ): AntivirusError {
    return new AntivirusError(
      AntivirusErrorCode.INITIALIZATION_FAILED,
      message || 'Initialization failed',
      originalError
    );
  }

  /**
   * Create a not initialized error
   */
  static notInitialized(): AntivirusError {
    return new AntivirusError(
      AntivirusErrorCode.NOT_INITIALIZED,
      'ClamAV is not initialized'
    );
  }

  /**
   * Create a not initialized error specifically for stopClamAv
   */
  static clamAvNotInitialized(): AntivirusError {
    return new AntivirusError(
      AntivirusErrorCode.NOT_INITIALIZED,
      'ClamAv instance is not initialized'
    );
  }

  /**
   * Create a ClamAV daemon start failed error
   */
  static clamdStartFailed(
    message: string,
    originalError?: Error | unknown
  ): AntivirusError {
    return new AntivirusError(
      AntivirusErrorCode.CLAMD_START_FAILED,
      message || 'Failed to start ClamAV daemon',
      originalError
    );
  }

  /**
   * Create a ClamAV daemon not available error
   */
  static clamdNotAvailable(
    message?: string,
    originalError?: Error | unknown
  ): AntivirusError {
    return new AntivirusError(
      AntivirusErrorCode.CLAMD_NOT_AVAILABLE,
      message || 'ClamAV daemon is not available',
      originalError
    );
  }

  /**
   * Create a ClamAV daemon timeout error
   */
  static clamdTimeout(attempts: number, timeout: number): AntivirusError {
    return new AntivirusError(
      AntivirusErrorCode.CLAMD_TIMEOUT,
      `Timeout waiting for ClamAV daemon after ${attempts} attempts (${timeout}ms)`,
      undefined,
      { attempts, timeout }
    );
  }

  /**
   * Create a ClamAV configuration error
   */
  static clamdConfigError(
    message: string,
    originalError?: Error | unknown
  ): AntivirusError {
    return new AntivirusError(
      AntivirusErrorCode.CLAMD_CONFIG_ERROR,
      message || 'Error in ClamAV configuration',
      originalError
    );
  }

  /**
   * Create a scan failed error
   */
  static scanFailed(
    filePath: string,
    originalError?: Error | unknown
  ): AntivirusError {
    return new AntivirusError(
      AntivirusErrorCode.SCAN_FAILED,
      `Failed to scan file: ${filePath}`,
      originalError,
      { filePath }
    );
  }

  /**
   * Create a file access error
   */
  static fileAccessError(
    filePath: string,
    originalError?: Error | unknown
  ): AntivirusError {
    return new AntivirusError(
      AntivirusErrorCode.FILE_ACCESS_ERROR,
      `Failed to access file: ${filePath}`,
      originalError,
      { filePath }
    );
  }

  /**
   * Create a database error
   */
  static databaseError(
    message: string,
    originalError?: Error | unknown
  ): AntivirusError {
    return new AntivirusError(
      AntivirusErrorCode.DATABASE_ERROR,
      message || 'Database error',
      originalError
    );
  }

  /**
   * Create an unknown error
   */
  static unknown(
    message?: string,
    originalError?: Error | unknown
  ): AntivirusError {
    return new AntivirusError(
      AntivirusErrorCode.UNKNOWN_ERROR,
      message || 'Unknown antivirus error',
      originalError
    );
  }
}

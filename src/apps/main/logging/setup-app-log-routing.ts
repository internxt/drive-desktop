import { join } from 'node:path';

type Pops = {
  logsPath: string;
};

type LogMessage = {
  data?: unknown[];
  level?: string;
};

type StructuredLogEntry = {
  tag?: unknown;
  header?: unknown;
  msg?: unknown;
  message?: unknown;
};

type ElectronLogModule = {
  transports: {
    file: {
      resolvePathFn: (variables: unknown, message?: LogMessage) => string;
      resolvePath?: (variables: unknown, message?: LogMessage) => string;
    };
  };
};

const DEFAULT_LOG_FILE_NAME = 'drive.log';
const IMPORTANT_LOG_FILE_NAME = 'drive-important.log';
const ANTIVIRUS_LOG_FILE_NAME = 'drive-antivirus.log';
const ANTIVIRUS_HEADER_PATTERN = /header:\s'[^']*-\santi'/;
const ANTIVIRUS_STRUCTURED_HEADER_PATTERN = /-\s*anti\b/i;
const ANTIVIRUS_MESSAGE_PATTERNS = [
  /\[CLAM_AVD\]/,
  /\[freshclam/i,
  /\[ANTIVIRUS_MANAGER\]/,
  /window\.electron\.antivirus/i,
  /\bclamd?\b/i,
  /\bantivirus\b/i,
];

/**
 * Esteban Galvis Triana
 * v2.6.0
 * Import the electron-log module that @internxt/drive-desktop-core
 * bundles (nested node_modules). When webpack processes this file, it resolves
 * this path to the same module instance used by setup-electron-log.js from the
 * core package. Using createRequire() at runtime would load a DIFFERENT native
 * instance that bypasses webpack's module registry, so patching it has no
 * effect on the instance the logger actually uses.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const coreElectronLog = require('@internxt/drive-desktop-core/node_modules/electron-log') as ElectronLogModule;

function isSerializedAntivirusLogEntry({ value }: { value: unknown }) {
  if (typeof value !== 'string') {
    return false;
  }

  return ANTIVIRUS_HEADER_PATTERN.test(value) || ANTIVIRUS_MESSAGE_PATTERNS.some((pattern) => pattern.test(value));
}

function isStructuredLogEntry(value: unknown): value is StructuredLogEntry {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isStructuredAntivirusLogEntry({ value }: { value: unknown }) {
  if (!isStructuredLogEntry(value)) {
    return false;
  }

  const { tag, header, msg, message } = value;
  const hasAntivirusTag = typeof tag === 'string' && (tag === 'ANTIVIRUS' || tag === 'anti');
  const hasAntivirusHeader = typeof header === 'string' && ANTIVIRUS_STRUCTURED_HEADER_PATTERN.test(header);
  const hasAntivirusMessage =
    (typeof msg === 'string' && ANTIVIRUS_MESSAGE_PATTERNS.some((pattern) => pattern.test(msg))) ||
    (typeof message === 'string' && ANTIVIRUS_MESSAGE_PATTERNS.some((pattern) => pattern.test(message)));

  return hasAntivirusTag || hasAntivirusHeader || hasAntivirusMessage;
}

function isAntivirusLogMessage({ message }: { message?: LogMessage }) {
  return (
    message?.data?.some((value) => {
      return isSerializedAntivirusLogEntry({ value }) || isStructuredAntivirusLogEntry({ value });
    }) ?? false
  );
}

export function resolveAppLogFilePath({ logsPath, message }: Pops & { message?: LogMessage }) {
  if (message?.level === 'error' || message?.level === 'info') {
    return join(logsPath, IMPORTANT_LOG_FILE_NAME);
  }

  if (isAntivirusLogMessage({ message })) {
    return join(logsPath, ANTIVIRUS_LOG_FILE_NAME);
  }

  return join(logsPath, DEFAULT_LOG_FILE_NAME);
}

export function setupAppLogRouting({ logsPath }: Pops) {
  coreElectronLog.transports.file.resolvePathFn = (_, message) => {
    return resolveAppLogFilePath({ logsPath, message });
  };

  coreElectronLog.transports.file.resolvePath = coreElectronLog.transports.file.resolvePathFn;
}

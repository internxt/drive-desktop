import { resolveAppLogFilePath } from './setup-app-log-routing';

type Pops = {
  header: string;
  msg: string;
};

function createSerializedLogMessage({ header, msg }: Pops) {
  return `{ header: '${header}', msg: '${msg}' }`;
}

describe('setup-app-log-routing', () => {
  const logsPath = '/tmp/internxt-logs';

  describe('resolveAppLogFilePath', () => {
    it('should route antivirus debug logs to the dedicated antivirus file', () => {
      // When
      const result = resolveAppLogFilePath({
        logsPath,
        message: {
          level: 'debug',
          data: [createSerializedLogMessage({ header: '  - b - anti', msg: '[CLAM_AVD] Starting clamd server...' })],
        },
      });

      // Then
      expect(result).toBe('/tmp/internxt-logs/drive-antivirus.log');
    });

    it('should keep important logs in the important file even for antivirus entries', () => {
      // When
      const result = resolveAppLogFilePath({
        logsPath,
        message: {
          level: 'error',
          data: [
            createSerializedLogMessage({ header: 'E - b - anti', msg: '[CLAM_AVD] clamd process unexpectedly exited' }),
          ],
        },
      });

      // Then
      expect(result).toBe('/tmp/internxt-logs/drive-important.log');
    });

    it('should keep info level logs in the important file to match core logger behavior', () => {
      // When
      const result = resolveAppLogFilePath({
        logsPath,
        message: {
          level: 'info',
          data: [createSerializedLogMessage({ header: 'E - b - anti', msg: '[CLAM_AVD] clamd process exited' })],
        },
      });

      // Then
      expect(result).toBe('/tmp/internxt-logs/drive-important.log');
    });

    it('should keep non-antivirus logs in the main log file', () => {
      // When
      const result = resolveAppLogFilePath({
        logsPath,
        message: {
          level: 'debug',
          data: [createSerializedLogMessage({ header: '  - b - auth', msg: 'Starting app' })],
        },
      });

      // Then
      expect(result).toBe('/tmp/internxt-logs/drive.log');
    });

    it('should route antivirus messages even when the serialized header is missing the antivirus tag', () => {
      // When
      const result = resolveAppLogFilePath({
        logsPath,
        message: {
          level: 'debug',
          data: [
            createSerializedLogMessage({ header: '  - b -     ', msg: '[Main] Antivirus IPC handlers setup complete' }),
          ],
        },
      });

      // Then
      expect(result).toBe('/tmp/internxt-logs/drive-antivirus.log');
    });

    it('should route structured antivirus logs when message data is an object', () => {
      // When
      const result = resolveAppLogFilePath({
        logsPath,
        message: {
          level: 'debug',
          data: [
            {
              tag: 'ANTIVIRUS',
              msg: 'ClamAV initialized successfully',
            },
          ],
        },
      });

      // Then
      expect(result).toBe('/tmp/internxt-logs/drive-antivirus.log');
    });
  });
});

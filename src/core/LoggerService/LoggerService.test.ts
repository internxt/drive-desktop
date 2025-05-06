import { LoggerBody, LoggerService, logger } from './LoggerService';
import ElectronLog from 'electron-log';
import isDev from '../isDev/isDev';

jest.mock('electron-log', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

jest.mock('../isDev/isDev', () => ({
  __esModule: true,
  default: jest.fn()
}));

describe('LoggerService', () => {
  let sut: LoggerService;

  beforeEach(() => {
    sut = new LoggerService();
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(logger).toBeDefined();
  });

  describe('debug', () => {
    it('should not log debug messages when not in development mode', () => {
      (isDev as jest.Mock).mockReturnValue(false);

      const body = {
        msg: 'Prod debug message',
        tag: 'AUTH'
      };

      sut.debug(body as LoggerBody);

      expect(ElectronLog.debug).not.toHaveBeenCalled();
    });

    it('should log debug messages when in development mode', () => {
      (isDev as jest.Mock).mockReturnValue(true);

      const body = {
        msg: 'Dev debug message',
        tag: 'AUTH'
      };

      sut.debug(body as LoggerBody);

      expect(ElectronLog.debug).toHaveBeenCalledWith(expect.stringContaining('[AUTH] Dev debug message'));
    });
  });

  describe('info', () => {
    it('should log info messages with message and tag', () => {
      const body = {
        msg: 'User authenticated',
        tag: 'AUTH'
      };

      sut.info(body as LoggerBody);

      expect(ElectronLog.info).toHaveBeenCalledTimes(1);
      expect(ElectronLog.info).toHaveBeenCalledWith('[AUTH] User authenticated');
    });

    it('should log info messages with context, error and attributes', () => {
      const body = {
        msg: 'User failed to authenticate',
        tag: 'AUTH',
        context: { source: 'login-form' },
        error: new Error('Invalid credentials'),
        attributes: {
          userId: 'user-123',
          method: 'POST',
          endpoint: 'auth/login'
        }
      };

      sut.info(body as LoggerBody);

      expect(ElectronLog.info).toHaveBeenCalledTimes(1);

      const [[loggedMessage]] = (ElectronLog.info as jest.Mock).mock.calls;

      expect(loggedMessage).toContain('[AUTH] User failed to authenticate');
      expect(loggedMessage).toContain('context');
      expect(loggedMessage).toContain('source');
      expect(loggedMessage).toContain('Invalid credentials');
      expect(loggedMessage).toContain('userId');
      expect(loggedMessage).toContain('auth/login');
    });
  });

  describe('warn', () => {
    it('should log a warn message with tag and msg', () => {
      const body = {
        msg: 'Token about to expire',
        tag: 'AUTH'
      };

      sut.warn(body as LoggerBody);

      expect(ElectronLog.warn).toHaveBeenCalledTimes(1);
      expect(ElectronLog.warn).toHaveBeenCalledWith('[AUTH] Token about to expire');
    });

    it('should log a warn message with context and attributes', () => {
      const body = {
        msg: 'Session near timeout',
        tag: 'AUTH',
        context: { idleFor: 270 },
        attributes: {
          userId: 'u-777',
          endpoint: 'auth/session'
        }
      };

      sut.warn(body as LoggerBody);

      const [[logged]] = (ElectronLog.warn as jest.Mock).mock.calls;

      expect(logged).toContain('[AUTH] Session near timeout');
      expect(logged).toContain('idleFor');
      expect(logged).toContain('userId');
      expect(logged).toContain('auth/session');
    });
  });

  describe('error', () => {
    it('should log an error message with tag and msg', () => {
      const body = {
        msg: 'An unexpected error occurred',
        tag: 'AUTH'
      };

      sut.error(body as LoggerBody);

      expect(ElectronLog.error).toHaveBeenCalledTimes(1);
      expect(ElectronLog.error).toHaveBeenCalledWith('[AUTH] An unexpected error occurred');
    });

    it('should log an error message with context, error and attributes', () => {
      const body = {
        msg: 'Database connection failed',
        tag: 'AUTH',
        context: { retries: 3 },
        error: new Error('Connection timeout'),
        attributes: {
          userId: 'db-user-42',
          method: 'GET',
          endpoint: 'auth/status'
        }
      };

      sut.error(body as LoggerBody);

      const [[logged]] = (ElectronLog.error as jest.Mock).mock.calls;

      expect(logged).toContain('[AUTH] Database connection failed');
      expect(logged).toContain('retries');
      expect(logged).toContain('Connection timeout');
      expect(logged).toContain('auth/status');
    });
  });

  describe('fatal', () => {
    it('should log a fatal message with tag and msg', () => {
      const body = {
        msg: 'System shutdown initiated',
        tag: 'AUTH'
      };

      sut.fatal(body as LoggerBody);

      expect(ElectronLog.error).toHaveBeenCalledTimes(1);
      expect(ElectronLog.error).toHaveBeenCalledWith('[AUTH] System shutdown initiated');
    });

    it('should log a fatal message with full log details', () => {
      const body = {
        msg: 'Unrecoverable state reached',
        tag: 'AUTH',
        context: { state: 'corrupt' },
        error: new Error('Stack overflow'),
        attributes: {
          userId: 'fatal-user',
          method: 'PATCH',
          endpoint: 'auth/reset'
        }
      };

      sut.fatal(body as LoggerBody);

      const [[logged]] = (ElectronLog.error as jest.Mock).mock.calls;

      expect(logged).toContain('[AUTH] Unrecoverable state reached');
      expect(logged).toContain('state');
      expect(logged).toContain('corrupt');
      expect(logged).toContain('Stack overflow');
      expect(logged).toContain('auth/reset');
    });
  });
});

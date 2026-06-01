import * as setupAntivirusIPCModule from './setupAntivirusIPC';
import * as antivirusManagerModule from '../../antivirus/antivirusManager';
import { partialSpyOn, call, calls } from 'tests/vitest/utils.helper';
import { trySetupAntivirusIpcAndInitialize } from './try-setup-antivirus-ipc-and-initialize';
import { loggerMock } from 'tests/vitest/mocks.helper';

vi.mock('./setupAntivirusIPC', () => ({
  setupAntivirusIpc: vi.fn(),
}));
vi.mock('../../antivirus/antivirusManager', () => ({
  getAntivirusManager: vi.fn(),
}));

const setupAntivirusIpcSpy = partialSpyOn(setupAntivirusIPCModule, 'setupAntivirusIpc');
const getAntivirusManagerSpy = partialSpyOn(antivirusManagerModule, 'getAntivirusManager');
const initializeMock = vi.fn();

describe('try-setup-antivirus-ipc-and-initialize', () => {
  beforeEach(() => {
    delete process.env.ENABLE_ANTIVIRUS;
    setupAntivirusIpcSpy.mockReturnValue({});
    initializeMock.mockResolvedValue(undefined);
    getAntivirusManagerSpy.mockReturnValue({ initialize: initializeMock });
  });

  describe('when ENABLE_ANTIVIRUS is not set', () => {
    it('sets up IPC and initializes antivirus', async () => {
      // When
      await trySetupAntivirusIpcAndInitialize();
      // Then
      calls(setupAntivirusIpcSpy).toHaveLength(1);
      calls(initializeMock).toHaveLength(1);
    });
  });

  describe('when ENABLE_ANTIVIRUS=true', () => {
    it('sets up IPC and initializes antivirus', async () => {
      // Given
      process.env.ENABLE_ANTIVIRUS = 'true';
      // When
      await trySetupAntivirusIpcAndInitialize();
      // Then
      calls(setupAntivirusIpcSpy).toHaveLength(1);
      calls(initializeMock).toHaveLength(1);
    });
  });

  describe('when ENABLE_ANTIVIRUS=false', () => {
    it('skips IPC setup and initialization', async () => {
      // Given
      process.env.ENABLE_ANTIVIRUS = 'false';
      // When
      await trySetupAntivirusIpcAndInitialize();
      // Then
      calls(setupAntivirusIpcSpy).toHaveLength(0);
      calls(initializeMock).toHaveLength(0);
    });
  });

  describe('when setupAntivirusIpc throws', () => {
    it('logs the error without throwing', async () => {
      // Given
      const error = new Error('ipc-setup-error');
      setupAntivirusIpcSpy.mockImplementation(() => {
        throw error;
      });
      // When
      await expect(trySetupAntivirusIpcAndInitialize()).resolves.toBeUndefined();
      // Then
      call(loggerMock.error).toMatchObject({ tag: 'ANTIVIRUS', error });
    });
  });

  describe('when initialize throws', () => {
    it('logs the error without throwing', async () => {
      // Given
      const error = new Error('initialize-error');
      initializeMock.mockRejectedValue(error);
      // When
      await expect(trySetupAntivirusIpcAndInitialize()).resolves.toBeUndefined();
      // Then
      call(loggerMock.error).toMatchObject({ tag: 'ANTIVIRUS', error });
    });
  });
});

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { selectAntivirusEngine } from '../select-antivirus-engine';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import { isWindowsDefenderRealTimeProtectionActive } from '@/apps/main/ipcs/ipcMainAntivirus';
import * as initializeAntivirusModule from '../../utils/initializeAntivirus';
import * as clamAVDaemon from '../../ClamAVDaemon';
import * as sleepModule from '@/apps/main/util';
import { logger } from '@/apps/shared/logger/logger';

// Mock dependencies
vi.mock('@/apps/main/ipcs/ipcMainAntivirus');
vi.mock('../../utils/initializeAntivirus');
vi.mock('../../ClamAVDaemon');
vi.mock('@/apps/main/util');
vi.mock('@/apps/shared/logger/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('selectAntivirusEngine', () => {
  // Use deepMocked for properly typed mocks
  const isWindowsDefenderActiveMock = deepMocked(isWindowsDefenderRealTimeProtectionActive);
  const checkClamdAvailabilityMock = deepMocked(clamAVDaemon.checkClamdAvailability);
  const initializeClamAVMock = deepMocked(initializeAntivirusModule.initializeClamAV);
  const sleepMock = deepMocked(sleepModule.sleep);
  const loggerDebugMock = vi.mocked(logger.debug);
  const loggerInfoMock = vi.mocked(logger.info);
  const loggerWarnMock = vi.mocked(logger.warn);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('selects Windows Defender when available', async () => {
    // Given
    isWindowsDefenderActiveMock.mockResolvedValue(true);

    // When
    const result = await selectAntivirusEngine();

    // Then
    expect(result).toBe('windows-defender');
    expect(isWindowsDefenderActiveMock).toHaveBeenCalled();
    expect(loggerInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: expect.stringContaining('Windows Defender'),
      }),
    );
    expect(checkClamdAvailabilityMock).not.toHaveBeenCalled();
  });

  it('selects ClamAV when Windows Defender is not available but ClamAV is', async () => {
    // Given
    isWindowsDefenderActiveMock.mockResolvedValue(false);
    checkClamdAvailabilityMock.mockResolvedValueOnce(false); // Initial check
    initializeClamAVMock.mockResolvedValue({ antivirusEnabled: true });
    checkClamdAvailabilityMock.mockResolvedValueOnce(true); // After initialization

    // When
    const result = await selectAntivirusEngine();

    // Then
    expect(result).toBe('clamav');
    expect(isWindowsDefenderActiveMock).toHaveBeenCalled();
    expect(initializeClamAVMock).toHaveBeenCalled();
    expect(sleepMock).toHaveBeenCalledWith(5000);
    expect(loggerInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: expect.stringContaining('ClamAV'),
      }),
    );
  });

  it('returns null when neither Windows Defender nor ClamAV are available', async () => {
    // Given
    isWindowsDefenderActiveMock.mockResolvedValue(false);
    checkClamdAvailabilityMock.mockResolvedValueOnce(false); // Initial check
    initializeClamAVMock.mockResolvedValue({ antivirusEnabled: false });
    checkClamdAvailabilityMock.mockResolvedValueOnce(false); // Still not available after init

    // When
    const result = await selectAntivirusEngine();

    // Then
    expect(result).toBeNull();
    expect(isWindowsDefenderActiveMock).toHaveBeenCalled();
    expect(initializeClamAVMock).toHaveBeenCalled();
    expect(sleepMock).toHaveBeenCalledWith(5000);
    expect(loggerWarnMock).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: expect.stringContaining('No antivirus engines available'),
      }),
    );
  });

  it('logs debug message at the start of the selection process', async () => {
    // Given
    isWindowsDefenderActiveMock.mockResolvedValue(true);

    // When
    await selectAntivirusEngine();

    // Then
    expect(loggerDebugMock).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'Selecting antivirus engine...',
      }),
    );
  });
});

import { selectAntivirusEngine } from './select-antivirus-engine';
import { partialSpyOn } from 'tests/vitest/utils.helper.test';
import * as ipcMainAntivirus from '@/apps/main/ipcs/ipcMainAntivirus';
import * as initializeAntivirusModule from '../utils/initializeAntivirus';
import * as clamAVDaemon from '../ClamAVDaemon';
import * as sleepModule from '@/apps/main/util';
import { logger } from '@/apps/shared/logger/logger';

describe('selectAntivirusEngine', () => {
  const isWindowsDefenderActiveMock = partialSpyOn(ipcMainAntivirus, 'isWindowsDefenderRealTimeProtectionActive');
  const checkClamdAvailabilityMock = partialSpyOn(clamAVDaemon, 'checkClamdAvailability');
  const initializeClamAVMock = partialSpyOn(initializeAntivirusModule, 'initializeClamAV');
  const sleepMock = partialSpyOn(sleepModule, 'sleep');
  const loggerDebugMock = partialSpyOn(logger, 'debug');
  const loggerInfoMock = partialSpyOn(logger, 'info');
  const loggerWarnMock = partialSpyOn(logger, 'warn');

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
    expect(isWindowsDefenderActiveMock).toBeCalled();
    expect(loggerInfoMock).toBeCalledWith(
      expect.objectContaining({
        msg: expect.stringContaining('Default antivirus selected as engine'),
      }),
    );
    expect(checkClamdAvailabilityMock).not.toBeCalled();
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
    expect(isWindowsDefenderActiveMock).toBeCalled();
    expect(initializeClamAVMock).toBeCalled();
    expect(sleepMock).toBeCalledWith(5000);
    expect(loggerInfoMock).toBeCalledWith(
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
    expect(isWindowsDefenderActiveMock).toBeCalled();
    expect(initializeClamAVMock).toBeCalled();
    expect(sleepMock).toBeCalledWith(5000);
    expect(loggerWarnMock).toBeCalledWith(
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
    expect(loggerDebugMock).toBeCalledWith(
      expect.objectContaining({
        msg: 'Selecting antivirus engine...',
      }),
    );
  });
});

import { selectAntivirusEngine } from './select-antivirus-engine';
import { partialSpyOn } from 'tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import * as isDefenderAvailable from '../windows-defender/is-windows-defender-available';
import * as initializeAntivirusModule from '../utils/initializeAntivirus';
import * as clamAVDaemon from '../ClamAVDaemon';

describe('selectAntivirusEngine', () => {
  const isWindowsDefenderActiveMock = partialSpyOn(isDefenderAvailable, 'isWindowsDefenderAvailable');
  const checkClamdAvailabilityMock = partialSpyOn(clamAVDaemon, 'checkClamdAvailability');
  const initializeClamAVMock = partialSpyOn(initializeAntivirusModule, 'initializeClamAV');

  it('selects Windows Defender when available', async () => {
    // Given
    isWindowsDefenderActiveMock.mockResolvedValue(true);
    // When
    const result = await selectAntivirusEngine();
    // Then
    expect(result).toBe('windows-defender');
    expect(isWindowsDefenderActiveMock).toBeCalled();
    expect(loggerMock.debug).toBeCalledWith(
      expect.objectContaining({
        msg: expect.stringContaining('Default antivirus selected as engine'),
      }),
    );
    expect(checkClamdAvailabilityMock).not.toBeCalled();
  });

  it('selects ClamAV when Windows Defender is not available but ClamAV is', async () => {
    // Given
    isWindowsDefenderActiveMock.mockResolvedValue(false);
    checkClamdAvailabilityMock.mockResolvedValue(false);
    initializeClamAVMock.mockResolvedValue({ antivirusEnabled: true });
    // When
    const result = await selectAntivirusEngine();
    // Then
    expect(result).toBe('clamav');
    expect(isWindowsDefenderActiveMock).toBeCalled();
    expect(initializeClamAVMock).toBeCalled();
    expect(loggerMock.debug).toBeCalledWith(
      expect.objectContaining({
        msg: expect.stringContaining('ClamAV'),
      }),
    );
  });

  it('returns null when neither Windows Defender nor ClamAV are available', async () => {
    // Given
    isWindowsDefenderActiveMock.mockResolvedValue(false);
    checkClamdAvailabilityMock.mockResolvedValue(false);
    initializeClamAVMock.mockResolvedValue({ antivirusEnabled: false });
    // When
    const result = await selectAntivirusEngine();
    // Then
    expect(result).toBeNull();
    expect(isWindowsDefenderActiveMock).toBeCalled();
    expect(initializeClamAVMock).toBeCalled();
    expect(loggerMock.warn).toBeCalledWith(
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
    expect(loggerMock.debug).toBeCalledWith(
      expect.objectContaining({
        msg: 'Selecting antivirus engine...',
      }),
    );
  });
});

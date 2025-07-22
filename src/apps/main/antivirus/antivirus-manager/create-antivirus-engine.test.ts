import { createEngine } from './create-antivirus-engine';
import { partialSpyOn } from 'tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { mockDeep } from 'vitest-mock-extended';
import { AntivirusWindowsDefender } from '../windows-defender/antivirus-windows-defender';
import { AntivirusClamAV } from '../antivirus-clam-av';

describe('createEngine', () => {
  const mockDefenderInstance = mockDeep<AntivirusWindowsDefender>();
  const mockClamAVInstance = mockDeep<AntivirusClamAV>();
  const windowsDefenderCreateInstanceMock = partialSpyOn(AntivirusWindowsDefender, 'createInstance');
  const clamAVCreateInstanceMock = partialSpyOn(AntivirusClamAV, 'createInstance');

  it('creates Windows Defender instance when type is windows-defender', async () => {
    // Given
    windowsDefenderCreateInstanceMock.mockResolvedValue(mockDefenderInstance);
    // When
    const result = await createEngine({ type: 'windows-defender' });
    // Then
    expect(result).toBe(mockDefenderInstance);
    expect(windowsDefenderCreateInstanceMock).toBeCalled();
    expect(clamAVCreateInstanceMock).not.toBeCalled();
  });

  it('creates ClamAV instance when type is clamav', async () => {
    // Given
    clamAVCreateInstanceMock.mockResolvedValue(mockClamAVInstance);
    // When
    const result = await createEngine({ type: 'clamav' });
    // Then
    expect(result).toBe(mockClamAVInstance);
    expect(clamAVCreateInstanceMock).toBeCalled();
    expect(windowsDefenderCreateInstanceMock).not.toBeCalled();
  });

  it('falls back to ClamAV when Windows Defender initialization fails', async () => {
    // Given
    const mockError = new Error('Windows Defender initialization error');
    windowsDefenderCreateInstanceMock.mockRejectedValue(mockError);
    clamAVCreateInstanceMock.mockResolvedValue(mockClamAVInstance);
    // When
    const result = await createEngine({ type: 'windows-defender' });
    // Then
    expect(result).toBe(mockClamAVInstance);
    expect(windowsDefenderCreateInstanceMock).toBeCalled();
    expect(clamAVCreateInstanceMock).toBeCalled();
    expect(loggerMock.error).toBeCalledWith(
      expect.objectContaining({
        msg: expect.stringContaining('Error initializing antivirus engine, using fallback'),
        exc: mockError,
      }),
    );
  });
});

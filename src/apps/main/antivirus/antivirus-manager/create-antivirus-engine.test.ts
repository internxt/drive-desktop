import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createEngine } from './create-antivirus-engine';
import { partialSpyOn } from 'tests/vitest/utils.helper.test';
import { mockDeep } from 'vitest-mock-extended';
import { AntivirusWindowsDefender } from '../windows-defender/antivirus-windows-defender';
import { AntivirusClamAV } from '../antivirus-clam-av';
import { logger } from '@/apps/shared/logger/logger';
import { AntivirusType } from './types';

describe('createEngine', () => {
  const mockDefenderInstance = mockDeep<AntivirusWindowsDefender>();
  const mockClamAVInstance = mockDeep<AntivirusClamAV>();
  const windowsDefenderCreateInstanceMock = partialSpyOn(AntivirusWindowsDefender, 'createInstance');
  const clamAVCreateInstanceMock = partialSpyOn(AntivirusClamAV, 'createInstance');
  const loggerErrorMock = partialSpyOn(logger, 'error');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates Windows Defender instance when type is windows-defender', async () => {
    // Given
    windowsDefenderCreateInstanceMock.mockResolvedValue(mockDefenderInstance);
    // When
    const result = await createEngine({ type: 'windows-defender' });
    // Then
    expect(result).toBe(mockDefenderInstance);
    expect(windowsDefenderCreateInstanceMock).toHaveBeenCalled();
    expect(clamAVCreateInstanceMock).not.toHaveBeenCalled();
  });

  it('creates ClamAV instance when type is clamav', async () => {
    // Given
    clamAVCreateInstanceMock.mockResolvedValue(mockClamAVInstance);
    // When
    const result = await createEngine({ type: 'clamav' });
    // Then
    expect(result).toBe(mockClamAVInstance);
    expect(clamAVCreateInstanceMock).toHaveBeenCalled();
    expect(windowsDefenderCreateInstanceMock).not.toHaveBeenCalled();
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
    expect(windowsDefenderCreateInstanceMock).toHaveBeenCalled();
    expect(clamAVCreateInstanceMock).toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: expect.stringContaining('Error initializing Windows Defender'),
        exc: mockError,
      }),
    );
  });

  it('throws error for unsupported antivirus type', async () => {
    // Given/When/Then
    await expect(createEngine({ type: 'unknown' as unknown as AntivirusType })).rejects.toThrow('Unsupported antivirus type: unknown');
  });
});

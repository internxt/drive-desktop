import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createEngine } from '../create-antivirus-engine';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import { AntivirusWindowsDefender } from '../../windows-defender/antivirus-windows-defender';
import { AntivirusClamAV } from '../../antivirus-clam-av';
import { logger } from '@/apps/shared/logger/logger';
import { AntivirusType } from '../types';

// Mock dependencies
vi.mock('../../windows-defender/antivirus-windows-defender');
vi.mock('../../antivirus-clam-av');
vi.mock('@/apps/shared/logger/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('createEngine', () => {
  // Use deepMocked for properly typed mocks
  const windowsDefenderCreateInstanceMock = deepMocked(AntivirusWindowsDefender.createInstance);
  const clamAVCreateInstanceMock = deepMocked(AntivirusClamAV.createInstance);
  const loggerErrorMock = vi.mocked(logger.error);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates Windows Defender instance when type is windows-defender', async () => {
    // Given
    const mockDefenderInstance: AntivirusWindowsDefender = {
      scanFile: vi.fn(),
      initialize: vi.fn(),
      stop: vi.fn(),
      isInitialized: true,
      mpCmdRunPath: 'C:\\path\\to\\MpCmdRun.exe',
    } as AntivirusWindowsDefender;
    windowsDefenderCreateInstanceMock.mockResolvedValue(mockDefenderInstance);

    // When
    const result = await createEngine('windows-defender');

    // Then
    expect(result).toBe(mockDefenderInstance);
    expect(windowsDefenderCreateInstanceMock).toHaveBeenCalled();
    expect(clamAVCreateInstanceMock).not.toHaveBeenCalled();
  });

  it('creates ClamAV instance when type is clamav', async () => {
    // Given
    const mockClamAVInstance = {
      scanFile: vi.fn(),
      initialize: vi.fn(),
      stop: vi.fn(),
      isInitialized: true,
      clamAv: null,
    } as unknown as AntivirusClamAV;
    clamAVCreateInstanceMock.mockResolvedValue(mockClamAVInstance);

    // When
    const result = await createEngine('clamav');

    // Then
    expect(result).toBe(mockClamAVInstance);
    expect(clamAVCreateInstanceMock).toHaveBeenCalled();
    expect(windowsDefenderCreateInstanceMock).not.toHaveBeenCalled();
  });

  it('falls back to ClamAV when Windows Defender initialization fails', async () => {
    // Given
    const mockError = new Error('Windows Defender initialization error');
    windowsDefenderCreateInstanceMock.mockRejectedValue(mockError);

    const mockClamAVInstance = {
      scanFile: vi.fn(),
      initialize: vi.fn(),
      stop: vi.fn(),
      isInitialized: true,
      clamAv: null,
    } as unknown as AntivirusClamAV;
    clamAVCreateInstanceMock.mockResolvedValue(mockClamAVInstance);

    // When
    const result = await createEngine('windows-defender');

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
    await expect(createEngine('unknown' as unknown as AntivirusType)).rejects.toThrow('Unsupported antivirus type: unknown');
  });
});

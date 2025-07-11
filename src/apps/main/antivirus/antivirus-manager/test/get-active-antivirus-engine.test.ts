import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getActiveEngine } from '../get-active-antivirus-engine';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import * as selectAntivirusEngineModule from '../select-antivirus-engine';
import * as createEngineModule from '../create-antivirus-engine';
import * as initializeAntivirusModule from '../../utils/initializeAntivirus';
import { logger } from '@/apps/shared/logger/logger';
import { AntivirusType, AntivirusEngine } from '../types';
import { AntivirusManager } from '../antivirus-manager';

// Mock dependencies
vi.mock('../select-antivirus-engine');
vi.mock('../create-antivirus-engine');
vi.mock('../../utils/initializeAntivirus');
vi.mock('@/apps/shared/logger/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('getActiveEngine', () => {
  // Mock AntivirusManager instance
  const mockManager: AntivirusManager = {
    currentEngine: null,
    currentType: null,
    getActiveEngine: vi.fn(),
  } as AntivirusManager;

  // Use deepMocked for properly typed mocks
  const selectAntivirusEngineMock = deepMocked(selectAntivirusEngineModule.selectAntivirusEngine);
  const createEngineMock = deepMocked(createEngineModule.createEngine);
  const clearAntivirusMock = deepMocked(initializeAntivirusModule.clearAntivirus);
  const loggerInfoMock = vi.mocked(logger.info);
  const loggerErrorMock = vi.mocked(logger.error);

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset manager state between tests
    mockManager.currentEngine = null;
    mockManager.currentType = null;
  });

  it('returns null when no antivirus engine is available', async () => {
    // Given
    selectAntivirusEngineMock.mockResolvedValue(null);
    mockManager.currentEngine = null;
    mockManager.currentType = null;

    // When
    const result = await getActiveEngine(mockManager);

    // Then
    expect(result).toBeNull();
    expect(selectAntivirusEngineMock).toHaveBeenCalled();
  });

  it('stops the current engine when no antivirus engine is available', async () => {
    // Given
    selectAntivirusEngineMock.mockResolvedValue(null);
    const mockStopFn = vi.fn().mockResolvedValue(undefined);
    mockManager.currentEngine = {
      stop: mockStopFn,
      initialize: vi.fn(),
      scanFile: vi.fn(),
      isInitialized: true,
      mpCmdRunPath: '',
      clamAv: null,
    } as unknown as AntivirusEngine;
    mockManager.currentType = 'clamav';

    // When
    const result = await getActiveEngine(mockManager);

    // Then
    expect(result).toBeNull();
    expect(mockStopFn).toHaveBeenCalled();
    expect(mockManager.currentEngine).toBeNull();
    expect(mockManager.currentType).toBeNull();
  });

  it('returns the current engine when it matches the selected type', async () => {
    // Given
    const mockEngine = {
      scanFile: vi.fn(),
      initialize: vi.fn(),
      stop: vi.fn(),
      isInitialized: true,
      mpCmdRunPath: '',
      clamAv: null,
    } as unknown as AntivirusEngine;
    selectAntivirusEngineMock.mockResolvedValue('windows-defender' as AntivirusType);
    mockManager.currentEngine = mockEngine;
    mockManager.currentType = 'windows-defender';

    // When
    const result = await getActiveEngine(mockManager);

    // Then
    expect(result).toBe(mockEngine);
    expect(selectAntivirusEngineMock).toHaveBeenCalled();
    expect(createEngineMock).not.toHaveBeenCalled();
  });

  it('switches from one engine to another when needed', async () => {
    // Given
    const mockOldEngine = {
      stop: vi.fn().mockResolvedValue(undefined),
      initialize: vi.fn(),
      scanFile: vi.fn(),
      isInitialized: true,
      mpCmdRunPath: '',
      clamAv: null,
    } as unknown as AntivirusEngine;

    const mockNewEngine = {
      scanFile: vi.fn(),
      initialize: vi.fn(),
      stop: vi.fn(),
      isInitialized: true,
      mpCmdRunPath: '',
      clamAv: null,
    } as unknown as AntivirusEngine;

    selectAntivirusEngineMock.mockResolvedValue('windows-defender' as AntivirusType);
    createEngineMock.mockResolvedValue(mockNewEngine);

    mockManager.currentEngine = mockOldEngine;
    mockManager.currentType = 'clamav';

    // When
    const result = await getActiveEngine(mockManager);

    // Then
    expect(mockOldEngine.stop).toHaveBeenCalled();
    expect(clearAntivirusMock).toHaveBeenCalled(); // Should clear ClamAV
    expect(createEngineMock).toHaveBeenCalledWith('windows-defender');
    expect(result).toBe(mockNewEngine);
    expect(mockManager.currentEngine).toBe(mockNewEngine);
    expect(mockManager.currentType).toBe('windows-defender');
    expect(loggerInfoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: expect.stringContaining('windows-defender'),
      }),
    );
  });

  it('creates a new engine when current engine is null', async () => {
    // Given
    const mockNewEngine = {
      scanFile: vi.fn(),
      initialize: vi.fn(),
      stop: vi.fn(),
      isInitialized: true,
      mpCmdRunPath: '',
      clamAv: null,
    } as unknown as AntivirusEngine;

    selectAntivirusEngineMock.mockResolvedValue('clamav' as AntivirusType);
    createEngineMock.mockResolvedValue(mockNewEngine);

    mockManager.currentEngine = null;
    mockManager.currentType = null;

    // When
    const result = await getActiveEngine(mockManager);

    // Then
    expect(createEngineMock).toHaveBeenCalledWith('clamav');
    expect(result).toBe(mockNewEngine);
    expect(mockManager.currentEngine).toBe(mockNewEngine);
    expect(mockManager.currentType).toBe('clamav');
  });

  it('handles errors and returns null', async () => {
    // Given
    const mockError = new Error('Test error');
    selectAntivirusEngineMock.mockRejectedValue(mockError);

    // When
    const result = await getActiveEngine(mockManager);

    // Then
    expect(result).toBeNull();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'Error getting active antivirus engine',
        exc: mockError,
      }),
    );
  });
});

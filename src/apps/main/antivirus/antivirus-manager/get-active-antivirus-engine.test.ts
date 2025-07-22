import { getActiveEngine } from './get-active-antivirus-engine';
import { mockDeep } from 'vitest-mock-extended';
import { partialSpyOn } from 'tests/vitest/utils.helper.test';
import * as selectAntivirusEngineModule from './select-antivirus-engine';
import * as createEngineModule from './create-antivirus-engine';
import * as initializeAntivirusModule from '../utils/initializeAntivirus';
import { logger } from '@/apps/shared/logger/logger';
import { AntivirusType } from './types';
import { AntivirusManager } from './antivirus-manager';
import { AntivirusClamAV } from '../antivirus-clam-av';
import { AntivirusWindowsDefender } from '../windows-defender/antivirus-windows-defender';

describe('getActiveEngine', () => {
  const mockManager = mockDeep<AntivirusManager>();
  const mockClamAVInstance = mockDeep<AntivirusClamAV>();
  const mockWindowsDefenderInstance = mockDeep<AntivirusWindowsDefender>();
  const selectAntivirusEngineMock = partialSpyOn(selectAntivirusEngineModule, 'selectAntivirusEngine');
  const createEngineMock = partialSpyOn(createEngineModule, 'createEngine');
  const clearAntivirusMock = partialSpyOn(initializeAntivirusModule, 'clearAntivirus');
  const loggerInfoMock = partialSpyOn(logger, 'info');
  const loggerErrorMock = partialSpyOn(logger, 'error');

  beforeEach(() => {
    vi.clearAllMocks();
    mockManager.currentEngine = null;
    mockManager.currentType = null;
  });

  it('returns null when no antivirus engine is available', async () => {
    // Given
    selectAntivirusEngineMock.mockResolvedValue(null);
    mockManager.currentEngine = null;
    mockManager.currentType = null;
    // When
    const result = await getActiveEngine({ self: mockManager });
    // Then
    expect(result).toBeNull();
    expect(selectAntivirusEngineMock).toBeCalled();
  });

  it('returns the current engine when it matches the selected type', async () => {
    // Given
    selectAntivirusEngineMock.mockResolvedValue('windows-defender' as AntivirusType);
    mockManager.currentEngine = mockWindowsDefenderInstance;
    mockManager.currentType = 'windows-defender';

    // When
    const result = await getActiveEngine({ self: mockManager });

    // Then
    expect(result).toBe(mockWindowsDefenderInstance);
    expect(selectAntivirusEngineMock).toBeCalled();
    expect(createEngineMock).not.toBeCalled();
  });

  it('switches from one engine to another when needed', async () => {
    // Given
    const mockOldEngine = mockClamAVInstance;
    const mockNewEngine = mockWindowsDefenderInstance;
    selectAntivirusEngineMock.mockResolvedValue('windows-defender' as AntivirusType);
    createEngineMock.mockResolvedValue(mockNewEngine);
    mockManager.currentEngine = mockOldEngine;
    mockManager.currentType = 'clamav';
    // When
    const result = await getActiveEngine({ self: mockManager });
    // Then
    expect(mockOldEngine.stop).toBeCalled();
    expect(clearAntivirusMock).toBeCalled();
    expect(createEngineMock).toBeCalledWith({ type: 'windows-defender' });
    expect(result).toBe(mockNewEngine);
    expect(mockManager.currentEngine).toBe(mockNewEngine);
    expect(mockManager.currentType).toBe('windows-defender');
    expect(loggerInfoMock).toBeCalledWith(
      expect.objectContaining({
        msg: expect.stringContaining('Antivirus engine switched'),
      }),
    );
  });

  it('creates a new engine when current engine is null', async () => {
    // Given
    const mockNewEngine = mockClamAVInstance;
    selectAntivirusEngineMock.mockResolvedValue('clamav' as AntivirusType);
    createEngineMock.mockResolvedValue(mockNewEngine);
    mockManager.currentEngine = null;
    mockManager.currentType = null;
    // When
    const result = await getActiveEngine({ self: mockManager });
    // Then
    expect(createEngineMock).toBeCalledWith({ type: 'clamav' });
    expect(result).toBe(mockNewEngine);
    expect(mockManager.currentEngine).toBe(mockNewEngine);
    expect(mockManager.currentType).toBe('clamav');
  });

  it('handles errors and returns null', async () => {
    // Given
    const mockError = new Error('Test error');
    selectAntivirusEngineMock.mockRejectedValue(mockError);
    // When
    const result = await getActiveEngine({ self: mockManager });
    // Then
    expect(result).toBeNull();
    expect(loggerErrorMock).toBeCalledWith(
      expect.objectContaining({
        msg: 'Error getting active antivirus engine',
        exc: mockError,
      }),
    );
  });
});

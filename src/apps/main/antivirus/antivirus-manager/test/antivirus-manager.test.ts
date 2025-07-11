import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AntivirusManager, getAntivirusManager } from '../antivirus-manager';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import * as getActiveEngineModule from '../get-active-antivirus-engine';
import { AntivirusEngine } from '../types';

// Mock modules
vi.mock('../get-active-antivirus-engine');

describe('AntivirusManager', () => {
  // Use deepMocked for properly typed mocks
  const getActiveEngineMock = deepMocked(getActiveEngineModule.getActiveEngine);

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton instance between tests
    (AntivirusManager as unknown as { instance: AntivirusManager | null }).instance = null;
  });

  describe('getInstance', () => {
    it('returns a singleton instance', () => {
      // Given/When
      const instance1 = AntivirusManager.getInstance();
      const instance2 = AntivirusManager.getInstance();

      // Then
      expect(instance1).toBe(instance2);
    });
  });

  describe('getActiveEngine', () => {
    it('calls and returns result from getActiveEngine function', async () => {
      // Given
      const mockEngine: AntivirusEngine = {
        scanFile: vi.fn(),
        initialize: vi.fn(),
        stop: vi.fn(),
      } as unknown as AntivirusEngine;
      getActiveEngineMock.mockResolvedValue(mockEngine);
      const manager = AntivirusManager.getInstance();

      // When
      const result = await manager.getActiveEngine();

      // Then
      expect(getActiveEngineMock).toHaveBeenCalledWith(manager);
      expect(result).toBe(mockEngine);
    });
  });

  describe('getAntivirusManager', () => {
    it('provides convenient access to the AntivirusManager instance', () => {
      // Given/When
      const managerFromFunction = getAntivirusManager();
      const managerFromClass = AntivirusManager.getInstance();

      // Then
      expect(managerFromFunction).toBe(managerFromClass);
    });
  });
});

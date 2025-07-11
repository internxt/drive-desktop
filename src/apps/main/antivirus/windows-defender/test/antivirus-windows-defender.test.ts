import { describe, expect, it, vi } from 'vitest';
import { AntivirusWindowsDefender } from '../antivirus-windows-defender';
import { findMpCmdRun } from '../find-mcp-command';
import { deepMocked } from 'tests/vitest/utils.helper.test';

// Mock dependencies
vi.mock('../find-mcp-command');
vi.mock('../scan-file');

describe('AntivirusWindowsDefender', () => {
  // Usar deepMocked para tipar correctamente los mocks
  const findMpCmdRunMock = deepMocked(findMpCmdRun);

  beforeEach(() => {
    vi.clearAllMocks();
    findMpCmdRunMock.mockReturnValue('C:\\mock\\path\\to\\MpCmdRun.exe');
  });

  describe('createInstance', () => {
    it('creates and initializes an instance', async () => {
      // Given
      const mockMpCmdRunPath = 'C:\\mock\\path\\to\\MpCmdRun.exe';
      findMpCmdRunMock.mockReturnValue(mockMpCmdRunPath);

      // When
      const instance = await AntivirusWindowsDefender.createInstance();

      // Then
      expect(instance).toBeInstanceOf(AntivirusWindowsDefender);
      expect(instance.isInitialized).toBe(true);
      expect(instance.mpCmdRunPath).toBe(mockMpCmdRunPath);
    });

    it('throws an error when initialization fails', async () => {
      // Given
      const mockError = new Error('Failed to find MpCmdRun.exe');
      findMpCmdRunMock.mockImplementation(() => {
        throw mockError;
      });

      // When/Then
      await expect(AntivirusWindowsDefender.createInstance()).rejects.toThrow(mockError);
    });
  });

  describe('initialize', () => {
    it('sets isInitialized to true on successful initialization', async () => {
      // Given
      const instance = new AntivirusWindowsDefender();
      const mockMpCmdRunPath = 'C:\\mock\\path\\to\\MpCmdRun.exe';
      findMpCmdRunMock.mockReturnValue(mockMpCmdRunPath);

      // When
      await instance.initialize();

      // Then
      expect(instance.isInitialized).toBe(true);
      expect(instance.mpCmdRunPath).toBe(mockMpCmdRunPath);
    });

    it('throws an error when findMpCmdRun fails', async () => {
      // Given
      const instance = new AntivirusWindowsDefender();
      const mockError = new Error('Failed to find MpCmdRun.exe');
      findMpCmdRunMock.mockImplementation(() => {
        throw mockError;
      });

      // When/Then
      await expect(instance.initialize()).rejects.toThrow(mockError);
      expect(instance.isInitialized).toBe(false);
    });
  });

  describe('stop', () => {
    it('sets isInitialized to false', () => {
      // Given
      const instance = new AntivirusWindowsDefender();
      instance.isInitialized = true;

      // When
      instance.stop();

      // Then
      expect(instance.isInitialized).toBe(false);
    });
  });
});

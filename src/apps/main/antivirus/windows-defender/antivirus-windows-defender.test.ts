import { describe, expect, it, vi } from 'vitest';
import { AntivirusWindowsDefender } from './antivirus-windows-defender';
import { findMpCmdRun } from './find-mcp-command';
import { deepMocked } from 'tests/vitest/utils.helper.test';

// Mock dependencies
vi.mock(import('./find-mcp-command'));
vi.mock(import('./scan-file'));

describe('AntivirusWindowsDefender', () => {
  const findMpCmdRunMock = deepMocked(findMpCmdRun);
  const mockMpCmdRunPath = 'C:\\mock\\path\\to\\MpCmdRun.exe';

  beforeEach(() => {
    vi.clearAllMocks();
    findMpCmdRunMock.mockReturnValue(mockMpCmdRunPath);
  });

  describe('createInstance', () => {
    it('creates and initializes an instance', () => {
      // When
      const instance = AntivirusWindowsDefender.createInstance();

      // Then
      expect(instance).toBeInstanceOf(AntivirusWindowsDefender);
      expect(instance.isInitialized).toBe(true);
      expect(instance.mpCmdRunPath).toBe(mockMpCmdRunPath);
    });

    it('logs error when initialization fails but does not throw', () => {
      // Given
      const mockError = new Error('Failed to find MpCmdRun.exe');
      findMpCmdRunMock.mockImplementation(() => {
        throw mockError;
      });

      // Mock console.error to prevent test output noise
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // When
      const instance = AntivirusWindowsDefender.createInstance();

      // Then
      expect(instance).toBeInstanceOf(AntivirusWindowsDefender);
      expect(instance.isInitialized).toBe(false);

      // Clean up
      consoleErrorSpy.mockRestore();
    });
  });

  describe('initialize', () => {
    it('sets isInitialized to true on successful initialization', () => {
      // Given
      const instance = new AntivirusWindowsDefender();

      // When
      instance.initialize();

      // Then
      expect(instance.isInitialized).toBe(true);
      expect(instance.mpCmdRunPath).toBe(mockMpCmdRunPath);
    });

    it('logs error and sets isInitialized to false when findMpCmdRun fails', () => {
      // Given
      const instance = new AntivirusWindowsDefender();
      const mockError = new Error('Failed to find MpCmdRun.exe');
      findMpCmdRunMock.mockImplementation(() => {
        throw mockError;
      });

      // Mock console.error to prevent test output noise
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // When
      instance.initialize();

      // Then
      expect(instance.isInitialized).toBe(false);

      // Clean up
      consoleErrorSpy.mockRestore();
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

import { describe, expect, it, vi } from 'vitest';
import { AntivirusWindowsDefender } from './antivirus-windows-defender';
import * as findMCPCommand from './find-mcp-command';
import { partialSpyOn } from 'tests/vitest/utils.helper.test';

describe('AntivirusWindowsDefender', () => {
  partialSpyOn(console, 'error');
  const findMpCmdRunMock = partialSpyOn(findMCPCommand, 'findMpCmdRun');
  const mockMpCmdRunPath = 'C:\\mock\\path\\to\\MpCmdRun.exe';

  beforeEach(() => {
    vi.clearAllMocks();
    findMpCmdRunMock.mockResolvedValue(mockMpCmdRunPath);
  });

  describe('createInstance', () => {
    it('creates and initializes an instance', async () => {
      // When
      const instance = await AntivirusWindowsDefender.createInstance();
      // Then
      expect(instance).toBeInstanceOf(AntivirusWindowsDefender);
      expect(instance.isInitialized).toBe(true);
      expect(instance.mpCmdRunPath).toBe(mockMpCmdRunPath);
    });

    it('logs error when initialization fails but does not throw', async () => {
      // Given
      findMpCmdRunMock.mockImplementation(() => {
        throw new Error('Initialization failed');
      });
      // When
      const instance = await AntivirusWindowsDefender.createInstance();
      // Then
      expect(instance).toBeInstanceOf(AntivirusWindowsDefender);
      expect(instance.isInitialized).toBe(false);
    });
  });

  describe('initialize', () => {
    it('sets isInitialized to true on successful initialization', async () => {
      // Given
      const instance = new AntivirusWindowsDefender();
      // When
      await instance.initialize();
      // Then
      expect(instance.isInitialized).toBe(true);
      expect(instance.mpCmdRunPath).toBe(mockMpCmdRunPath);
    });

    it('logs error and sets isInitialized to false when findMpCmdRun fails', async () => {
      // Given
      const instance = new AntivirusWindowsDefender();
      const mockError = new Error('Failed to find MpCmdRun.exe');
      findMpCmdRunMock.mockImplementation(() => {
        throw mockError;
      });
      // When
      await instance.initialize();
      // Then
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

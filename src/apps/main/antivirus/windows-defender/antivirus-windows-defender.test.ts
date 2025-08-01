import { AntivirusWindowsDefender } from './antivirus-windows-defender';
import * as findMCPCommand from './find-mcp-command';
import { partialSpyOn } from 'tests/vitest/utils.helper.test';

describe('AntivirusWindowsDefender', () => {
  partialSpyOn(console, 'error');
  const findMpCmdRunMock = partialSpyOn(findMCPCommand, 'findMpCmdRun');
  const mockMpCmdRunPath = 'C:\\mock\\path\\to\\MpCmdRun.exe';

  beforeEach(() => {
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

    it('initializes with isInitialized=false when mpCmdRunPath is null', async () => {
      // Given
      findMpCmdRunMock.mockResolvedValue(null);
      // When
      const instance = await AntivirusWindowsDefender.createInstance();
      // Then
      expect(instance).toBeInstanceOf(AntivirusWindowsDefender);
      expect(instance.isInitialized).toBe(false);
      expect(instance.mpCmdRunPath).toBeNull();
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

    it('sets isInitialized to false when findMpCmdRun returns null', async () => {
      // Given
      const instance = new AntivirusWindowsDefender();
      findMpCmdRunMock.mockResolvedValue(null);
      // When
      await instance.initialize();
      // Then
      expect(instance.isInitialized).toBe(false);
      expect(instance.mpCmdRunPath).toBeNull();
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

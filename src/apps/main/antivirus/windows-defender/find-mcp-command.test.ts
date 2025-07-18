import { describe, expect, it, vi } from 'vitest';
import { findMpCmdRun } from './find-mcp-command';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import { stat } from '@/infra/file-system/services/stat';
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';

vi.mock(import('fs'));
vi.mock(import('path'));
vi.mock('@/infra/file-system/services/stat');

describe('findMpCmdRun', () => {
  const existsSyncMock = deepMocked(existsSync);
  const readdirSyncMock = deepMocked(readdirSync);
  const statMock = deepMocked(stat);
  const joinMock = deepMocked(join);

  beforeEach(() => {
    vi.clearAllMocks();
    joinMock.mockImplementation((...args) => args.join('\\'));
  });

  it('returns fallback path when defender platform path does not exist', async () => {
    // Given
    existsSyncMock.mockImplementation((path): boolean => {
      return path === 'C:\\Program Files\\Windows Defender\\MpCmdRun.exe';
    });
    // When
    const result = await findMpCmdRun();
    // Then
    expect(result).toBe('C:\\Program Files\\Windows Defender\\MpCmdRun.exe');
    expect(existsSyncMock).toHaveBeenCalledWith('C:\\ProgramData\\Microsoft\\Windows Defender\\Platform');
  });

  it('returns latest version path when defender platform exists with versions', async () => {
    // Given
    existsSyncMock.mockReturnValue(true);
    const mockVersions = ['4.18.1803.5', '4.18.2205.7', '4.18.2207.10'];
    readdirSyncMock.mockReturnValue(mockVersions as unknown as ReturnType<typeof readdirSync>);
    statMock.mockResolvedValue({
      data: {
        isDirectory: () => true,
      },
      error: undefined,
    });
    // When
    const result = await findMpCmdRun();
    // Then
    expect(result).toBe('C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\4.18.2207.10\\MpCmdRun.exe');
    expect(readdirSyncMock).toHaveBeenCalledWith('C:\\ProgramData\\Microsoft\\Windows Defender\\Platform');
  });

  it('sorts versions correctly in descending order', async () => {
    // Given
    existsSyncMock.mockReturnValue(true);
    const mockVersions = ['4.9.10', '4.18.10', '4.18.2'];
    readdirSyncMock.mockReturnValue(mockVersions as unknown as ReturnType<typeof readdirSync>);
    statMock.mockResolvedValue({
      data: {
        isDirectory: () => true,
      },
      error: undefined,
    });
    // When
    const result = await findMpCmdRun();
    // Then
    expect(result).toBe('C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\4.18.10\\MpCmdRun.exe');
  });

  it('filters out non-directories', async () => {
    // Given
    existsSyncMock.mockReturnValue(true);
    const mockFiles = ['file.txt', '4.18.10', 'readme.md'];
    readdirSyncMock.mockReturnValue(mockFiles as unknown as ReturnType<typeof readdirSync>);
    statMock.mockImplementation(async ({ absolutePath }) => {
      return {
        data: {
          isDirectory: () => absolutePath.includes('4.18.10'),
        },
        error: undefined,
      };
    });
    // When
    const result = await findMpCmdRun();
    // Then
    expect(result).toBe('C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\4.18.10\\MpCmdRun.exe');
  });

  it('throws error when MpCmdRun.exe is not found', async () => {
    // Given
    existsSyncMock.mockReturnValue(false);
    // When / Then
    await expect(findMpCmdRun()).rejects.toThrow('MpCmdRun.exe not found.');
  });
});

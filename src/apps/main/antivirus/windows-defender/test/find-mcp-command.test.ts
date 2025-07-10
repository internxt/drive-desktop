import { describe, expect, it, vi } from 'vitest';
import { findMpCmdRun } from '../find-mcp-command';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import fs, { readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

vi.mock('fs');
vi.mock('path');

describe('findMpCmdRun', () => {
  const existsSyncMock = deepMocked(existsSync);
  const readdirSyncMock = deepMocked(readdirSync);
  const statSyncMock = deepMocked(statSync);
  const joinMock = deepMocked(join);

  beforeEach(() => {
    vi.clearAllMocks();
    joinMock.mockImplementation((...args: string[]) => args.join('\\'));
  });

  it('returns fallback path when defender platform path does not exist', () => {
    // Given
    existsSyncMock.mockImplementation((path: fs.PathLike): boolean => {
      return path === 'C:\\Program Files\\Windows Defender\\MpCmdRun.exe';
    });

    // When
    const result = findMpCmdRun();

    // Then
    expect(result).toBe('C:\\Program Files\\Windows Defender\\MpCmdRun.exe');
    expect(existsSyncMock).toHaveBeenCalledWith('C:\\ProgramData\\Microsoft\\Windows Defender\\Platform');
  });

  it('returns latest version path when defender platform exists with versions', () => {
    // Given
    existsSyncMock.mockReturnValue(true);
    // Uses cast to match the type expected by the readdirSync mock
    const mockVersions = ['4.18.1803.5', '4.18.2205.7', '4.18.2207.10'];
    readdirSyncMock.mockReturnValue(mockVersions as unknown as ReturnType<typeof readdirSync>);
    statSyncMock.mockReturnValue({
      isDirectory: () => true,
    } as fs.Stats);

    // When
    const result = findMpCmdRun();

    // Then
    expect(result).toBe('C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\4.18.2207.10\\MpCmdRun.exe');
    expect(readdirSyncMock).toHaveBeenCalledWith('C:\\ProgramData\\Microsoft\\Windows Defender\\Platform');
  });

  it('sorts versions correctly in descending order', () => {
    // Given
    existsSyncMock.mockReturnValue(true);
    const mockVersions = ['4.9.10', '4.18.10', '4.18.2'];
    readdirSyncMock.mockReturnValue(mockVersions as unknown as ReturnType<typeof readdirSync>);
    statSyncMock.mockReturnValue({
      isDirectory: () => true,
    } as fs.Stats);

    // When
    const result = findMpCmdRun();

    // Then
    expect(result).toBe('C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\4.18.10\\MpCmdRun.exe');
  });

  it('filters out non-directories', () => {
    // Given
    existsSyncMock.mockReturnValue(true);
    const mockFiles = ['file.txt', '4.18.10', 'readme.md'];
    readdirSyncMock.mockReturnValue(mockFiles as unknown as ReturnType<typeof readdirSync>);
    statSyncMock.mockImplementation((filePath: fs.PathLike) => {
      const pathAsString = String(filePath);
      return {
        isDirectory: () => pathAsString.includes('4.18.10'),
      } as fs.Stats;
    });

    // When
    const result = findMpCmdRun();

    // Then
    expect(result).toBe('C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\4.18.10\\MpCmdRun.exe');
  });

  it('throws error when MpCmdRun.exe is not found', () => {
    // Given
    existsSyncMock.mockReturnValue(false);

    // When / Then
    expect(() => findMpCmdRun()).toThrow('MpCmdRun.exe not found.');
  });
});

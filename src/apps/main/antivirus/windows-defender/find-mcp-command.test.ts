import { describe, expect, it, vi } from 'vitest';
import { findMpCmdRun } from './find-mcp-command';
import { deepMocked, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { access } from 'fs/promises';
import { join } from 'path';
import * as getDefenderVersionsModule from './get-defender-version';

vi.mock(import('fs/promises'));
vi.mock(import('path'));

describe('findMpCmdRun', () => {
  const accessMock = deepMocked(access);
  const joinMock = deepMocked(join);
  const getDefenderVersionsMock = partialSpyOn(getDefenderVersionsModule, 'getDefenderVersions');

  beforeEach(() => {
    vi.clearAllMocks();
    joinMock.mockImplementation((...args) => args.join('\\'));
  });

  it('returns fallback path when no defender versions are found', async () => {
    // Given
    getDefenderVersionsMock.mockResolvedValue([]);
    accessMock.mockResolvedValue(undefined);
    // When
    const result = await findMpCmdRun();
    // Then
    expect(result).toBe('C:\\Program Files\\Windows Defender\\MpCmdRun.exe');
    expect(getDefenderVersionsMock).toHaveBeenCalledWith('C:\\ProgramData\\Microsoft\\Windows Defender\\Platform');
  });

  it('returns path with latest version when defender versions exist', async () => {
    // Given
    getDefenderVersionsMock.mockResolvedValue(['4.18.2207.10', '4.18.2205.7']);
    accessMock.mockResolvedValue(undefined);
    // When
    const result = await findMpCmdRun();
    // Then
    expect(result).toBe('C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\4.18.2207.10\\MpCmdRun.exe');
    expect(getDefenderVersionsMock).toHaveBeenCalledWith('C:\\ProgramData\\Microsoft\\Windows Defender\\Platform');
    expect(joinMock).toHaveBeenCalledWith('C:\\ProgramData\\Microsoft\\Windows Defender\\Platform', '4.18.2207.10', 'MpCmdRun.exe');
  });

  it('throws error when MpCmdRun.exe is not found', async () => {
    // Given
    getDefenderVersionsMock.mockResolvedValue(['4.18.2207.10']);
    accessMock.mockRejectedValue(new Error('File not found'));
    // When / Then
    await expect(findMpCmdRun()).rejects.toThrow('MpCmdRun.exe not found.');
  });
});

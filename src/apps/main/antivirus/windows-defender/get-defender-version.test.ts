import { getDefenderVersions } from './get-defender-version';
import { deepMocked, partialSpyOn } from 'tests/vitest/utils.helper.test';
import * as statFunction from '@/infra/file-system/services/stat';
import { readdir, access } from 'fs/promises';
import { join } from 'path';

vi.mock(import('fs/promises'));
vi.mock(import('path'));

describe('getDefenderVersions', () => {
  const statMock = partialSpyOn(statFunction, 'stat');
  const accessMock = deepMocked(access);
  const readdirMock = deepMocked(readdir);
  const joinMock = deepMocked(join);

  type MockReaddirReturn = ReturnType<typeof readdir> extends Promise<infer T> ? T : never;

  beforeEach(() => {
    vi.clearAllMocks();
    joinMock.mockImplementation((...args) => args.join('\\'));
  });

  it('returns empty array when path does not exist', async () => {
    // Given
    accessMock.mockRejectedValue(new Error('ENOENT: no such file or directory'));
    // When
    const result = await getDefenderVersions({ path: 'C:\\NonExistentPath' });
    // Then
    expect(result).toEqual([]);
    expect(accessMock).toHaveBeenCalledWith('C:\\NonExistentPath', expect.any(Number));
  });

  it('returns array of valid directories sorted in descending order', async () => {
    // Given
    accessMock.mockResolvedValue(undefined);
    const mockVersions = ['4.18.1803.5', '4.18.2205.7', '4.18.2207.10'];
    readdirMock.mockResolvedValue(mockVersions as unknown as MockReaddirReturn);
    statMock.mockResolvedValue({
      data: { isDirectory: () => true },
    });
    // When
    const result = await getDefenderVersions({ path: 'C:\\TestPath' });
    // Then
    expect(result).toEqual(['4.18.2207.10', '4.18.2205.7', '4.18.1803.5']);
    expect(readdirMock).toHaveBeenCalledWith('C:\\TestPath');
  });

  it('filters out non-directories', async () => {
    // Given
    accessMock.mockResolvedValue(undefined);
    const mockFiles = ['file.txt', '4.18.10', 'readme.md'];
    readdirMock.mockResolvedValue(mockFiles as unknown as MockReaddirReturn);
    statMock.mockImplementation(async ({ absolutePath }) => {
      return {
        data: { isDirectory: () => absolutePath.includes('4.18.10') },
      };
    });
    // When
    const result = await getDefenderVersions({ path: 'C:\\TestPath' });
    // Then
    expect(result).toEqual(['4.18.10']);
  });

  it('sorts versions correctly using numeric sorting', async () => {
    // Given
    accessMock.mockResolvedValue(undefined);
    const mockVersions = ['4.9.10', '4.18.10', '4.18.2'];
    readdirMock.mockResolvedValue(mockVersions as unknown as MockReaddirReturn);
    statMock.mockResolvedValue({
      data: { isDirectory: () => true },
    });
    // When
    const result = await getDefenderVersions({ path: 'C:\\TestPath' });
    // Then
    expect(result).toEqual(['4.18.10', '4.18.2', '4.9.10']);
  });
});

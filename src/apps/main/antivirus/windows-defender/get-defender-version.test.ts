import { getDefenderVersions } from './get-defender-version';
import { deepMocked } from 'tests/vitest/utils.helper.test';
import { readdir, access } from 'node:fs/promises';
import { Dirent } from 'node:fs';

vi.mock(import('node:fs/promises'));
vi.mock(import('path'));

describe('getDefenderVersions', () => {
  const accessMock = deepMocked(access);
  const readdirMock = deepMocked(readdir);

  const props = { path: '' };

  beforeEach(() => {
    accessMock.mockResolvedValue(undefined);
  });

  it('returns empty array when path does not exist', async () => {
    // Given
    accessMock.mockRejectedValue(new Error('ENOENT: no such file or directory'));
    // When
    const result = await getDefenderVersions(props);
    // Then
    expect(result).toEqual([]);
  });

  it('returns array of valid directories sorted in descending order', async () => {
    // Given
    readdirMock.mockResolvedValue([
      { name: '4.18.1803.5', isDirectory: () => true },
      { name: '4.18.2205.7', isDirectory: () => true },
      { name: '4.18.2207.10', isDirectory: () => true },
      { name: '4.2.2207.10', isDirectory: () => true },
      { name: '4.18.5', isDirectory: () => true },
    ] as unknown as Dirent<Buffer>[]);
    // When
    const result = await getDefenderVersions(props);
    // Then
    expect(result).toEqual(['4.18.2207.10', '4.18.2205.7', '4.18.1803.5', '4.18.5', '4.2.2207.10']);
  });

  it('filters out non-directories', async () => {
    // Given
    readdirMock.mockResolvedValue([
      { name: 'file.txt', isDirectory: () => false },
      { name: '4.18.10', isDirectory: () => true },
      { name: 'readme.md', isDirectory: () => false },
    ] as unknown as Dirent<Buffer>[]);
    // When
    const result = await getDefenderVersions(props);
    // Then
    expect(result).toEqual(['4.18.10']);
  });
});

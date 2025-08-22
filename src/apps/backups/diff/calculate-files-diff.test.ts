import { calculateFilesDiff } from './calculate-files-diff';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { mockProps } from 'tests/vitest/utils.helper.test';
import { applyDangled, isDangledApplied } from './is-dangled-applied';

vi.mock(import('./is-dangled-applied'));

describe('calculate-files-diff', () => {
  const isDangledAppliedMock = vi.mocked(isDangledApplied);
  const applyDangledMock = vi.mocked(applyDangled);

  const props = mockProps<typeof calculateFilesDiff>({
    local: {
      root: { absolutePath: 'C:/root/' as AbsolutePath },
      files: {
        ['/file1' as RelativePath]: { relativePath: '/file1' as RelativePath, modificationTime: new Date('2025-02-19T12:40:00.000Z') },
        ['/file2' as RelativePath]: { relativePath: '/file2' as RelativePath, modificationTime: new Date('2025-05-19T12:40:00.000Z') },
        ['/file6' as RelativePath]: { relativePath: '/file6' as RelativePath, modificationTime: new Date(Date.now() + 1000) },
        ['/file7' as RelativePath]: { relativePath: '/file7' as RelativePath, modificationTime: new Date('2025-01-01T20:00:00.000Z') },
      },
      folders: {},
    },
    remote: {
      files: {
        ['/file1' as RelativePath]: { path: '/file1' as RelativePath },
        ['/file3' as RelativePath]: { path: '/file3' as RelativePath },
        ['/file6' as RelativePath]: { path: '/file6' as RelativePath, updatedAt: new Date().toISOString() },
        ['/file7' as RelativePath]: { path: '/file7' as RelativePath, createdAt: new Date('2025-02-20').toISOString() },
      },
      folders: {},
    },
  });

  it('It should calculate files diff', () => {
    // Given
    isDangledAppliedMock.mockReturnValue({ isApplied: false });

    // When
    const diff = calculateFilesDiff(props);

    // Then
    expect(diff.unmodified.map((file) => file.relativePath)).toStrictEqual(['/file1']);
    expect(diff.added.map((file) => file.relativePath)).toStrictEqual(['/file2']);
    expect(diff.deleted.map((file) => file.path)).toStrictEqual(['/file3']);
    expect(diff.modified.map(({ remote }) => remote.path)).toStrictEqual(['/file6', '/file7']);
    expect(applyDangledMock).toHaveBeenCalledTimes(1);
  });

  it('It should not add dangled files if patch is applied', () => {
    // Given
    isDangledAppliedMock.mockReturnValue({ isApplied: true });

    // When
    const diff = calculateFilesDiff(props);

    // Then
    expect(diff.modified.map(({ remote }) => remote.path)).toStrictEqual(['/file6']);
    expect(applyDangledMock).toHaveBeenCalledTimes(1);
  });
});

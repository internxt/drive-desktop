import { calculateFilesDiff } from './calculate-files-diff';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FileMother } from 'tests/context/virtual-drive/files/domain/FileMother';
import { FileStatuses } from '@/context/virtual-drive/files/domain/FileStatus';
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
        ['/file1' as RelativePath]: { relativePath: '/file1' as RelativePath, modificationTime: 0 },
        ['/file2' as RelativePath]: { relativePath: '/file2' as RelativePath, modificationTime: 0 },
        ['/file6' as RelativePath]: { relativePath: '/file6' as RelativePath, modificationTime: new Date().getTime() + 1000 },
        ['/file7' as RelativePath]: { relativePath: '/file7' as RelativePath, modificationTime: 0 },
      },
      folders: {},
    },
    remote: {
      files: {
        ['/file1' as RelativePath]: FileMother.fromPartial({ path: '/file1' as RelativePath }),
        ['/file3' as RelativePath]: FileMother.fromPartial({ path: '/file3' as RelativePath }),
        ['/file4' as RelativePath]: FileMother.fromPartial({ path: '/file4' as RelativePath, status: FileStatuses.DELETED }),
        ['/file5' as RelativePath]: FileMother.fromPartial({ path: '/file5' as RelativePath, status: FileStatuses.TRASHED }),
        ['/file6' as RelativePath]: FileMother.fromPartial({ path: '/file6' as RelativePath, updatedAt: new Date().toISOString() }),
        ['/file7' as RelativePath]: FileMother.fromPartial({
          path: '/file7' as RelativePath,
          createdAt: new Date('2025-02-20').toISOString(),
        }),
      },
      folders: {},
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('It should calculate files diff', () => {
    // Given
    isDangledAppliedMock.mockReturnValue({ isApplied: false });

    // When
    const diff = calculateFilesDiff(props);

    // Then
    expect(diff.unmodified.map((file) => file.relativePath)).toEqual(['/file1']);
    expect(diff.added.map((file) => file.relativePath)).toEqual(['/file2']);
    expect(diff.deleted.map((file) => file.path)).toEqual(['/file3']);
    expect(Array.from(diff.modified.values()).map((file) => file.path)).toEqual(['/file6']);
    expect(Array.from(diff.dangled.values()).map((file) => file.path)).toEqual(['/file7']);
    expect(applyDangledMock).toHaveBeenCalledTimes(1);
  });

  it('It should not add dangled files if patch is applied', () => {
    // Given
    isDangledAppliedMock.mockReturnValue({ isApplied: true });

    // When
    const diff = calculateFilesDiff(props);

    // Then
    expect(Array.from(diff.dangled.values()).map((file) => file.path)).toEqual([]);
    expect(applyDangledMock).toHaveBeenCalledTimes(1);
  });
});

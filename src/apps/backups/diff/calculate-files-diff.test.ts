import { calculateFilesDiff } from './calculate-files-diff';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { mockProps } from 'tests/vitest/utils.helper.test';
import { applyDangled, isDangledApplied } from './is-dangled-applied';

vi.mock(import('./is-dangled-applied'));

describe('calculate-files-diff', () => {
  const isDangledAppliedMock = vi.mocked(isDangledApplied);
  const applyDangledMock = vi.mocked(applyDangled);

  const props = mockProps<typeof calculateFilesDiff>({
    local: {
      files: {
        [abs('/file1')]: { absolutePath: abs('/file1') },
        [abs('/file2')]: { absolutePath: abs('/file2') },
        [abs('/file6')]: { absolutePath: abs('/file6'), size: 12 },
        [abs('/file7')]: { absolutePath: abs('/file7') },
      },
      folders: {},
    },
    remote: {
      files: new Map([
        [abs('/file1'), { absolutePath: abs('/file1') }],
        [abs('/file3'), { absolutePath: abs('/file3') }],
        [abs('/file6'), { absolutePath: abs('/file6'), size: 10 }],
        [abs('/file7'), { absolutePath: abs('/file7'), createdAt: new Date('2025-02-20').toISOString() }],
      ]),
      folders: new Map(),
    },
  });

  it('It should calculate files diff', () => {
    // Given
    isDangledAppliedMock.mockReturnValue({ isApplied: false });

    // When
    const diff = calculateFilesDiff(props);

    // Then
    expect(diff.unmodified.map((file) => file.absolutePath)).toStrictEqual(['/file1']);
    expect(diff.added.map((file) => file.absolutePath)).toStrictEqual(['/file2']);
    expect(diff.deleted.map((file) => file.absolutePath)).toStrictEqual(['/file3']);
    expect(diff.modified.map(({ remote }) => remote.absolutePath)).toStrictEqual(['/file6', '/file7']);
    expect(applyDangledMock).toHaveBeenCalledTimes(1);
  });

  it('It should not add dangled files if patch is applied', () => {
    // Given
    isDangledAppliedMock.mockReturnValue({ isApplied: true });

    // When
    const diff = calculateFilesDiff(props);

    // Then
    expect(diff.modified.map(({ remote }) => remote.absolutePath)).toStrictEqual(['/file6']);
    expect(applyDangledMock).toHaveBeenCalledTimes(1);
  });
});

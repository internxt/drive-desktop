import { calculateFilesDiff } from './calculate-files-diff';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { mockProps } from 'tests/vitest/utils.helper.test';

describe('calculate-files-diff', () => {
  const props = mockProps<typeof calculateFilesDiff>({
    local: {
      files: {
        [abs('/file1')]: { path: abs('/file1'), stats: {} },
        [abs('/file2')]: { path: abs('/file2'), stats: {} },
        [abs('/file6')]: { path: abs('/file6'), stats: { size: 12 } },
      },
      folders: [],
    },
    remote: {
      files: new Map([
        [abs('/file1'), { absolutePath: abs('/file1') }],
        [abs('/file3'), { absolutePath: abs('/file3') }],
        [abs('/file6'), { absolutePath: abs('/file6'), size: 10 }],
      ]),
      folders: new Map(),
    },
  });

  it('should calculate files diff', () => {
    // When
    const diff = calculateFilesDiff(props);
    // Then
    expect(diff.unmodified.map((file) => file.path)).toStrictEqual(['/file1']);
    expect(diff.added.map((file) => file.path)).toStrictEqual(['/file2']);
    expect(diff.deleted.map((file) => file.absolutePath)).toStrictEqual(['/file3']);
    expect(diff.modified.map(({ remote }) => remote.absolutePath)).toStrictEqual(['/file6']);
  });
});

import { mockProps } from 'tests/vitest/utils.helper.test';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { calculateFilesDiff } from './calculate-files-diff';

describe('calculate-files-diff', () => {
  const date = (value: string) => new Date(value);
  const props = mockProps<typeof calculateFilesDiff>({
    local: {
      files: {
        [abs('/file1')]: { path: abs('/file1'), stats: { size: 7, mtime: date('2026-06-30T12:00:01.100Z') } },
        [abs('/file2')]: { path: abs('/file2'), stats: {} },
        [abs('/file6')]: { path: abs('/file6'), stats: { size: 12 } },
      },
      folders: [],
    },
    remote: {
      files: new Map([
        [abs('/file1'), { absolutePath: abs('/file1'), size: 7, modificationTime: '2026-06-30T12:00:01.100Z' }],
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

  it('should mark same-size files as modified when local modification time is newer', () => {
    // Given
    const props = mockProps<typeof calculateFilesDiff>({
      local: {
        files: {
          [abs('/file')]: { path: abs('/file'), stats: { size: 7, mtime: date('2026-06-30T12:00:02.900Z') } },
        },
      },
      remote: {
        files: new Map([
          [
            abs('/file'),
            {
              absolutePath: abs('/file'),
              size: 7,
              modificationTime: '2026-06-30T12:00:01.100Z',
            },
          ],
        ]),
      },
    });
    // When
    const diff = calculateFilesDiff(props);
    // Then
    expect(diff.modified.map(({ remote }) => remote.absolutePath)).toStrictEqual(['/file']);
    expect(diff.unmodified).toStrictEqual([]);
  });

  it('should not mark same-size files as modified when remote and local modification time are the same', () => {
    // Given
    const props = mockProps<typeof calculateFilesDiff>({
      local: {
        files: {
          [abs('/file')]: { path: abs('/file'), stats: { size: 7, mtime: date('2026-06-30T12:00:01.100Z') } },
        },
      },
      remote: {
        files: new Map([
          [
            abs('/file'),
            {
              absolutePath: abs('/file'),
              size: 7,
              modificationTime: '2026-06-30T12:00:01.100Z',
            },
          ],
        ]),
      },
    });
    // When
    const diff = calculateFilesDiff(props);
    // Then
    expect(diff.modified).toStrictEqual([]);
    expect(diff.unmodified.map((file) => file.path)).toStrictEqual(['/file']);
  });
});

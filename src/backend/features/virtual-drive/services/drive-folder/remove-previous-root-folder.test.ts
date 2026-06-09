import { execFile } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { removePreviousRootFolder } from './remove-previous-root-folder';
import { calls, call } from '../../../../../../tests/vitest/utils.helper';

vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  rm: vi.fn(),
}));

type ExecFileCb = (err: Error | null) => void;

describe('remove-previous-root-folder', () => {
  const execFileMock = vi.mocked(execFile);
  const rmMock = vi.mocked(rm);

  type Props = Parameters<typeof removePreviousRootFolder>[0];

  beforeEach(() => {
    rmMock.mockResolvedValue(undefined);
    execFileMock.mockImplementation(((_cmd: string, _args: string[], cb: ExecFileCb) =>
      cb(null)) as unknown as typeof execFile);
  });

  it('returns early if oldPath is empty', async () => {
    // Given
    const props: Props = { oldPath: '  ', newPath: '/new/path' };

    // When
    await removePreviousRootFolder(props);

    // Then
    calls(rmMock).toHaveLength(0);
  });

  it('returns early if oldPath resolves to the same as newPath', async () => {
    // Given
    const props: Props = { oldPath: '/same/path/', newPath: '/same/path/' };

    // When
    await removePreviousRootFolder(props);

    // Then
    calls(rmMock).toHaveLength(0);
  });

  it('skips deletion if oldPath is the root folder', async () => {
    // Given
    const props: Props = { oldPath: '/', newPath: '/new/path' };

    // When
    await removePreviousRootFolder(props);

    // Then
    calls(rmMock).toHaveLength(0);
  });

  it('skips deletion if oldPath is the home folder', async () => {
    // Given — home is /mock/home per global electron mock in vitest.setup.main.ts
    const props: Props = { oldPath: '/mock/home', newPath: '/new/path' };

    // When
    await removePreviousRootFolder(props);

    // Then
    calls(rmMock).toHaveLength(0);
  });

  it('releases stale fuse mount before removing old folder', async () => {
    // Given
    const props: Props = { oldPath: '/old/path', newPath: '/new/path' };

    // When
    await removePreviousRootFolder(props);

    // Then
    call(execFileMock).toMatchObject(['fusermount3', ['-uz', '/old/path'], expect.any(Function)]);
    expect(execFileMock.mock.invocationCallOrder[0]).toBeLessThan(rmMock.mock.invocationCallOrder[0]);
  });

  it('removes the old folder with the correct options', async () => {
    // Given
    const props: Props = { oldPath: '/old/path', newPath: '/new/path' };

    // When
    await removePreviousRootFolder(props);

    // Then
    call(rmMock).toStrictEqual(['/old/path', { recursive: true, force: true }]);
  });

  it('continues if fusermount3 fails', async () => {
    // Given
    const props: Props = { oldPath: '/old/path', newPath: '/new/path' };
    execFileMock.mockImplementationOnce(((_cmd: string, _args: string[], cb: ExecFileCb) =>
      cb(new Error('not a fuse mount'))) as unknown as typeof execFile);

    // When
    await removePreviousRootFolder(props);

    // Then — rm should still be called
    calls(rmMock).toHaveLength(1);
  });

  it('continues and does not throw if rm fails', async () => {
    // Given
    const props: Props = { oldPath: '/old/path', newPath: '/new/path' };
    rmMock.mockRejectedValue(new Error('disk error'));

    // When + Then
    await expect(removePreviousRootFolder(props)).resolves.toBeUndefined();
  });
});

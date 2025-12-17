import { FileBatchUpdater } from './FileBatchUpdater';
import { AbsolutePath } from '../../infrastructure/AbsolutePath';
import { right } from '../../../../shared/domain/Either';
import { SimpleFileOverrider } from '../../../../virtual-drive/files/application/override/SimpleFileOverrider';
import { RemoteFileSystem } from '../../../../virtual-drive/files/domain/file-systems/RemoteFileSystem';
import { FileMother } from '../../../../virtual-drive/files/domain/__test-helpers__/FileMother';
import { RemoteTreeMother } from '../../../../virtual-drive/remoteTree/domain/__test-helpers__/RemoteTreeMother';
import { LocalFolderMother } from '../../../localFolder/domain/__test-helpers__/LocalFolderMother';
import { LocalFileMother } from '../../domain/__test-helpers__/LocalFileMother';
import { LocalFileUploaderMock } from '../__mocks__/LocalFileUploaderMock';
import { vi, MockInstance } from 'vitest';

describe('File Batch Updater', () => {
  let SUT: FileBatchUpdater;

  let uploader: LocalFileUploaderMock;
  let simpleFileOverrider: SimpleFileOverrider;
  let simpleFileOverriderSpy: MockInstance;

  let abortController: AbortController;
  const localRoot = LocalFolderMother.fromPartial({
    path: '/home/user/Documents' as AbsolutePath,
  });

  beforeAll(() => {
    uploader = new LocalFileUploaderMock();
    simpleFileOverrider = new SimpleFileOverrider({} as RemoteFileSystem);

    simpleFileOverriderSpy = vi.spyOn(simpleFileOverrider, 'run');

    SUT = new FileBatchUpdater(uploader, simpleFileOverrider);
  });

  beforeEach(() => {
    vi.resetAllMocks();
    abortController = new AbortController();
  });

  it('resolves when all updates are completed', async () => {
    const remoteFiles = FileMother.array();
    const numberOfFilesToUpdate = remoteFiles.length;

    const localFiles = LocalFileMother.array(numberOfFilesToUpdate, (i) => ({
      path: (localRoot.path + remoteFiles[i].path) as AbsolutePath,
    }));

    const tree = RemoteTreeMother.onlyRoot();

    remoteFiles.forEach((file) => {
      tree.addFile(tree.root, file);
    });

    const mockContentsId = 'mock-contents-id';
    vi.spyOn(uploader, 'upload').mockReturnValue(Promise.resolve(right(mockContentsId)));
    simpleFileOverriderSpy.mockReturnValue(right(Promise.resolve()));

    await SUT.run(localRoot, tree, localFiles, abortController.signal);

    expect(simpleFileOverriderSpy).toBeCalledTimes(numberOfFilesToUpdate);
  });
});

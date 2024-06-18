import { FileBatchUpdater } from '../../../../../../src/context/local/localFile/application/update/FileBatchUpdater';
import { AbsolutePath } from '../../../../../../src/context/local/localFile/infrastructure/AbsolutePath';
import { SimpleFileOverrider } from '../../../../../../src/context/virtual-drive/files/application/override/SimpleFileOverrider';
import { File } from '../../../../../../src/context/virtual-drive/files/domain/File';
import { RemoteFileSystem } from '../../../../../../src/context/virtual-drive/files/domain/file-systems/RemoteFileSystem';
import { FileMother } from '../../../../virtual-drive/files/domain/FileMother';
import { RemoteTreeMother } from '../../../../virtual-drive/tree/domain/RemoteTreeMother';
import { LocalFolderMother } from '../../../localFolder/domain/LocalFolderMother';
import { LocalFileMother } from '../../domain/LocalFileMother';
import { LocalFileUploaderMock } from '../__mocks__/LocalFileUploaderMock';

describe('File Batch Updater', () => {
  let SUT: FileBatchUpdater;

  let uploader: LocalFileUploaderMock;
  let simpleFileOverrider: SimpleFileOverrider;
  let simpleFileOverriderSpy: jest.SpyInstance<
    Promise<void>,
    [file: File, contentsId: string, size: number]
  >;

  let abortController: AbortController;
  const localRoot = LocalFolderMother.fromPartial({
    path: '/home/user/Documents' as AbsolutePath,
  });

  beforeAll(() => {
    uploader = new LocalFileUploaderMock();
    simpleFileOverrider = new SimpleFileOverrider({} as RemoteFileSystem);

    simpleFileOverriderSpy = jest.spyOn(simpleFileOverrider, 'run');

    SUT = new FileBatchUpdater(uploader, simpleFileOverrider);
  });

  beforeEach(() => {
    jest.resetAllMocks();
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

    simpleFileOverriderSpy.mockReturnValue(Promise.resolve());

    await SUT.run(localRoot, tree, localFiles, abortController.signal);

    expect(simpleFileOverriderSpy).toBeCalledTimes(numberOfFilesToUpdate);
  });
});

import { FileBatchUpdater } from '../../../../../../src/context/local/localFile/application/update/FileBatchUpdater';
import { AbsolutePath } from '../../../../../../src/context/local/localFile/infrastructure/AbsolutePath';
import {
  Either,
  right,
} from '../../../../../../src/context/shared/domain/Either';
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
    Either<Error, Promise<void>>,
    [file: File, contentsId: string, size: number]
  >;

  let abortController: AbortController;
  const localRoot = LocalFolderMother.fromPartial({
    path: '/home/user/Documents' as AbsolutePath,
  });

  beforeAll(() => {
    uploader = new LocalFileUploaderMock();
    simpleFileOverrider = new SimpleFileOverrider({} as RemoteFileSystem);

    simpleFileOverriderSpy = jest.spyOn(
      simpleFileOverrider,
      'run'
    ) as unknown as jest.SpyInstance<
      Either<Error, Promise<void>>,
      [file: File, contentsId: string, size: number]
    >;

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

    const mockContentsId = 'mock-contents-id';
    jest
      .spyOn(uploader, 'upload')
      .mockReturnValue(Promise.resolve(right(mockContentsId)));
    simpleFileOverriderSpy.mockReturnValue(right(Promise.resolve()));

    await SUT.run(localRoot, tree, localFiles, abortController.signal);

    expect(simpleFileOverriderSpy).toBeCalledTimes(numberOfFilesToUpdate);
  });
});

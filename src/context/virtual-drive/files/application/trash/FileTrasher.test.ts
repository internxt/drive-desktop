import { FileTrasher } from './FileTrasher';
import { FileRepository } from '../../domain/FileRepository';
import { RemoteFileSystem } from '../../domain/file-systems/RemoteFileSystem';
import { AllParentFoldersStatusIsExists } from '../../../folders/application/AllParentFoldersStatusIsExists';
import { SyncFileMessenger } from '../../domain/SyncFileMessenger';
import { FileMother } from '../../domain/__test-helpers__/FileMother';
import { FileStatus, FileStatuses } from '../../domain/FileStatus';
import { BucketEntryIdMother } from 'src/context/virtual-drive/shared/domain/__test-helpers__/BucketEntryIdMother';
import { Mocked } from 'vitest';

describe('FileTrasher', () => {
  let sut: FileTrasher;
  let remoteFileSystemMock: Mocked<RemoteFileSystem>;
  let fileRepositoryMock: Mocked<FileRepository>;
  let allParentFoldersStatusIsExistsMock: Mocked<AllParentFoldersStatusIsExists>;
  let syncFileMessengerMock: Mocked<SyncFileMessenger>;

  beforeEach(() => {
    remoteFileSystemMock = {
      trash: vi.fn(),
      hardDelete: vi.fn(),
    } as unknown as Mocked<RemoteFileSystem>;

    fileRepositoryMock = {
      matchingPartial: vi.fn(),
      update: vi.fn(),
    } as unknown as Mocked<FileRepository>;

    allParentFoldersStatusIsExistsMock = {
      run: vi.fn(),
    } as unknown as Mocked<AllParentFoldersStatusIsExists>;

    syncFileMessengerMock = {
      trashing: vi.fn(),
      trashed: vi.fn(),
      issues: vi.fn(),
    } as unknown as Mocked<SyncFileMessenger>;

    sut = new FileTrasher(
      remoteFileSystemMock,
      fileRepositoryMock,
      allParentFoldersStatusIsExistsMock,
      syncFileMessengerMock,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('run', () => {
    it('should do nothing if the file is not found', async () => {
      const contentsId = BucketEntryIdMother.primitive();
      fileRepositoryMock.matchingPartial.mockReturnValue([]);

      await sut.run(contentsId);

      expect(fileRepositoryMock.matchingPartial).toBeCalledWith({
        contentsId,
        status: expect.anything(),
      });
      expect(remoteFileSystemMock.trash).not.toBeCalled();
      expect(fileRepositoryMock.update).not.toBeCalled();
    });

    it('should not trash a file if it is already trashed', async () => {
      const file = FileMother.fromPartial({ status: FileStatuses.TRASHED });
      fileRepositoryMock.matchingPartial.mockReturnValue([file]);

      await sut.run(file.contentsId);

      expect(remoteFileSystemMock.trash).not.toBeCalled();
      expect(fileRepositoryMock.update).not.toBeCalled();
      expect(syncFileMessengerMock.trashing).not.toBeCalled();
    });

    it('should not trash a file if a parent folder is already trashed', async () => {
      const file = FileMother.any();
      fileRepositoryMock.matchingPartial.mockReturnValue([file]);
      allParentFoldersStatusIsExistsMock.run.mockResolvedValue(false);

      await sut.run(file.contentsId);

      expect(allParentFoldersStatusIsExistsMock.run).toBeCalledWith(file.folderId);
      expect(remoteFileSystemMock.trash).not.toBeCalled();
      expect(fileRepositoryMock.update).not.toBeCalled();
      expect(syncFileMessengerMock.trashing).not.toBeCalled();
    });

    it('should trash a file successfully when all conditions are met', async () => {
      const file = FileMother.fromPartial({ size: 1024 });
      fileRepositoryMock.matchingPartial.mockReturnValue([file]);
      allParentFoldersStatusIsExistsMock.run.mockResolvedValue(true);

      await sut.run(file.contentsId);

      expect(syncFileMessengerMock.trashing).toBeCalledWith(file.name, file.type, file.size);
      expect(remoteFileSystemMock.trash).toBeCalledWith(file.contentsId);
      expect(fileRepositoryMock.update).toBeCalledWith(expect.objectContaining({ status: FileStatus.Trashed }));
      expect(syncFileMessengerMock.trashed).toBeCalledWith(file.name, file.type, file.size);
    });

    it('should NOT call remote.trash for files with size 0', async () => {
      const file = FileMother.fromPartial({ size: 0 });
      fileRepositoryMock.matchingPartial.mockReturnValue([file]);
      allParentFoldersStatusIsExistsMock.run.mockResolvedValue(true);

      await sut.run(file.contentsId);

      expect(syncFileMessengerMock.trashing).toBeCalledWith(file.name, file.type, file.size);
      expect(remoteFileSystemMock.trash).not.toBeCalled();
      expect(fileRepositoryMock.update).toBeCalledWith(expect.objectContaining({ status: FileStatus.Trashed }));
      expect(syncFileMessengerMock.trashed).toBeCalledWith(file.name, file.type, file.size);
    });

    it('should notify issues and rethrow error when remote.trash fails', async () => {
      const file = FileMother.fromPartial({ size: 1024 });
      const error = new Error('Remote trash failed');
      fileRepositoryMock.matchingPartial.mockReturnValue([file]);
      allParentFoldersStatusIsExistsMock.run.mockResolvedValue(true);
      remoteFileSystemMock.trash.mockRejectedValue(error);

      await expect(sut.run(file.contentsId)).rejects.toThrow(error);

      expect(syncFileMessengerMock.issues).toBeCalledWith({
        error: 'DELETE_ERROR',
        cause: 'UNKNOWN',
        name: file.nameWithExtension,
      });
    });

    it('should notify trashing and trashed events in the correct order', async () => {
      const file = FileMother.fromPartial({ size: 512 });
      fileRepositoryMock.matchingPartial.mockReturnValue([file]);
      allParentFoldersStatusIsExistsMock.run.mockResolvedValue(true);

      const callOrder: string[] = [];
      syncFileMessengerMock.trashing.mockImplementation(async () => {
        callOrder.push('trashing');
      });
      syncFileMessengerMock.trashed.mockImplementation(async () => {
        callOrder.push('trashed');
      });

      await sut.run(file.contentsId);

      expect(callOrder).toEqual(['trashing', 'trashed']);
    });
  });
});

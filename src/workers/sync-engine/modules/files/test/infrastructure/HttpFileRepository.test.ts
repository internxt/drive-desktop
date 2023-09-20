import axios from 'axios';
import { Traverser } from '../../../items/application/Traverser';
import { HttpFileRepository } from '../../infrastructure/HttpFileRepository';
import { IpcRendererSyncEngineMock } from '../../../shared/test/__mock__/IpcRendererSyncEngineMock';
import { FilePath } from '../../domain/FilePath';
import { ServerFileMother } from './ServerFileMother';
import { ServerFolderMother } from '../../../items/test/persistance/ServerFolderMother';
import { File } from '../../domain/File';
import { fakeDecryptor } from '../../../shared/test/domain/FakeCrypt';
import Chance from 'chance';
const chance = new Chance();

jest.mock('axios');

const rootFolderId = 31420;

const rootFolder = ServerFolderMother.fromPartial({
  parentId: null,
  id: rootFolderId,
});

describe('Http File Repository', () => {
  let traverser: Traverser;
  let ipc: IpcRendererSyncEngineMock;
  let SUT: HttpFileRepository;

  beforeEach(() => {
    traverser = new Traverser(fakeDecryptor, rootFolderId);

    ipc = new IpcRendererSyncEngineMock();

    SUT = new HttpFileRepository(
      fakeDecryptor,
      axios,
      axios,
      traverser,
      'bucket',
      ipc
    );
  });

  describe('Rename', () => {
    it('after a file is renamed cannot be found ', async () => {
      const files = ['a', 'b', 'c', 'd'].map((char: string) =>
        ServerFileMother.fromPartial({
          name: char,
          folderId: rootFolderId,
          fileId: chance.string({ length: 24 }),
          type: '',
        })
      );

      ipc.onInvokeMock.mockResolvedValueOnce({
        folders: [rootFolder],
        files: files,
      });

      axios.post = jest.fn().mockResolvedValueOnce({ status: 200, data: {} });

      await SUT.init();

      const fileSearchedBeforeRename = SUT.search(new FilePath('/a')) as File;

      fileSearchedBeforeRename.rename(new FilePath('/aa'));

      await SUT.updateName(fileSearchedBeforeRename);

      const fileSearchedAfterRename = SUT.search(new FilePath('/a'));

      expect(fileSearchedAfterRename).not.toBeDefined();
    });
  });
});

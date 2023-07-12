import axios from 'axios';
import { Traverser } from '../../../../items/application/Traverser';
import { HttpWebdavFileRepository } from '../../../infrastructure/persistance/HttpWebdavFileRepository';
import { WebdavIpcMock } from '../../../../shared/test/__mock__/WebdavIPC';
import { FilePath } from '../../../domain/FilePath';
import { ServerFileMother } from './ServerFileMother';
import { ServerFolderMother } from '../../../../items/test/persistance/ServerFolderMother';
import { WebdavFile } from '../../../domain/WebdavFile';
import { fakeDecryptor } from '../../../../shared/test/domain/FakeCrypt';

jest.mock('axios');

const rootFolderId = 31420;

const rootFolder = ServerFolderMother.fromPartial({
  parent_id: null,
  id: rootFolderId,
});

describe('Http File Repository', () => {
  let traverser: Traverser;
  let ipc: WebdavIpcMock;
  let SUT: HttpWebdavFileRepository;

  beforeEach(() => {
    traverser = new Traverser(fakeDecryptor, rootFolderId);

    ipc = new WebdavIpcMock();

    SUT = new HttpWebdavFileRepository(
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
          fileId: char,
          type: '',
        })
      );

      ipc.onInvokeMock.mockResolvedValueOnce({
        folders: [rootFolder],
        files: files,
      });

      axios.post = jest.fn().mockResolvedValueOnce({ status: 200, data: {} });

      await SUT.init();

      const fileSearchedBeforeRename = SUT.search(
        new FilePath('/a')
      ) as WebdavFile;

      fileSearchedBeforeRename.rename(new FilePath('/aa'));

      await SUT.updateName(fileSearchedBeforeRename);

      const fileSearchedAfterRename = SUT.search(new FilePath('/a'));

      expect(fileSearchedAfterRename).not.toBeDefined();
    });
  });
});

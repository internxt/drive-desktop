import axios from 'axios';
import { Traverser } from '../../../../items/application/Traverser';
import { HttpWebdavFileRepository } from '../../../infrastructure/persistance/HttpWebdavFileRepository';
import { WebdavIpcMock } from '../../../../shared/test/__mock__/WebdavIPC';
import { FilePath } from '../../../domain/FilePath';
import { ServerFileMother } from './ServerFileMother';
import { ServerFolderMother } from '../../../../items/test/persistance/ServerFolderMother';
import { WebdavFile } from '../../../domain/WebdavFile';
import { fakeDecryptor } from '../../../../shared/test/domain/FakeCrypt';
import { InMemoryItemsMock } from '../../../../items/test/__mocks__/InMemoryItemsMock';
import Logger from 'electron-log';
jest.mock('axios');

const rootFolderId = 31420;

const rootFolder = ServerFolderMother.fromPartial({
  parentId: null,
  id: rootFolderId,
});

describe('Http File Repository', () => {
  let traverser: Traverser;
  let ipc: WebdavIpcMock;
  let inMemoryItems: InMemoryItemsMock;
  let SUT: HttpWebdavFileRepository;

  beforeEach(() => {
    traverser = new Traverser(fakeDecryptor, rootFolderId);
    inMemoryItems = new InMemoryItemsMock();
    ipc = new WebdavIpcMock();

    SUT = new HttpWebdavFileRepository(
      fakeDecryptor,
      axios,
      axios,
      traverser,
      'bucket',
      ipc,
      inMemoryItems
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

      Logger.info('File after', fileSearchedBeforeRename);
      await SUT.updateName(fileSearchedBeforeRename);

      expect(fileSearchedBeforeRename.lastPath?.value).toBe('/a');
      expect(fileSearchedBeforeRename.path.value).toBe('/aa');
    });
  });
});

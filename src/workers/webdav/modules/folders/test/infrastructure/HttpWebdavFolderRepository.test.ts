import axios from 'axios';
import { Traverser } from '../../../items/application/Traverser';
import { FolderPath } from '../../domain/FolderPath';
import { HttpWebdavFolderRepository } from '../../infrastructure/HttpWebdavFolderRepository';
import { fakeDecryptor } from '../../../shared/test/domain/FakeCrypt';
import { WebdavIpcMock } from '../../../shared/test/__mock__/WebdavIPC';
import { ServerFolderMother } from '../../../items/test/persistance/ServerFolderMother';

jest.mock('axios');

const rootFolderId = 4206870830;

describe('Http Folder Repository', () => {
  let ipc: WebdavIpcMock;
  let SUT: HttpWebdavFolderRepository;

  describe('save', () => {
    beforeEach(() => {
      const traverser = new Traverser(fakeDecryptor, rootFolderId);

      ipc = new WebdavIpcMock();

      SUT = new HttpWebdavFolderRepository(axios, axios, traverser, ipc);
    });

    it('after a folder is saved it has to have all its properties set', async () => {
      const serverFolder = ServerFolderMother.any();

      axios.post = jest
        .fn()
        .mockResolvedValueOnce({ status: 201, data: serverFolder });

      ipc.onInvokeMock.mockImplementationOnce(() => {
        //no op
      });

      await SUT.create(
        new FolderPath(`/${serverFolder.name}`),
        serverFolder.parent_id as unknown as number
      );

      const savedFolder = SUT.search(`/${serverFolder.name}`);

      expect(savedFolder).toBeDefined();
      expect(savedFolder?.updatedAt).toBeDefined();
      expect(savedFolder?.createdAt).toBeDefined();
    });
  });
});

import Logger from 'electron-log';
import { WebdavFileRepository } from '../../workers/webdav/modules/files/domain/WebdavFileRepository';
import { HttpWebdavFileRepository } from '../../workers/webdav/modules/files/infrastructure/persistance/HttpWebdavFileRepository';
import crypt from '../../workers/utils/crypt';
import {
  getClient,
  getNewTokenClient,
} from '../../shared/HttpClient/main-process-client';
import { Traverser } from '../../workers/webdav/modules/items/application/Traverser';
import configStore from '../config';
import { ipc } from '../../workers/webdav/ipc';

class FileDeleter {
  constructor(private readonly repository: WebdavFileRepository) {}

  async run(contentsId: string): Promise<void> {
    const file = this.repository.find(contentsId);

    file.trash();

    await this.repository.delete(file);
  }
}

const driveClient = getClient();
const driveWipClient = getNewTokenClient();

const user = configStore.get('userData');

const repository = new HttpWebdavFileRepository(
  crypt,
  driveClient,
  driveWipClient,
  new Traverser(crypt, user.root_folder_id),
  user.bucket,
  ipc
);
const deleter = new FileDeleter(repository);

// TODO: PASS THIS AS THE DELETE CALLBACK (?)
function trashPlaceholderFile(contentsId: string) {
  Logger.info('Placeholder going to be trashed', contentsId);
  deleter.run(contentsId);
}

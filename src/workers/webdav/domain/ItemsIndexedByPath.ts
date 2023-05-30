import { WebdavFile } from '../files/domain/WebdavFile';
import { WebdavFolder } from '../folders/domain/WebdavFolder';

export type ItemsIndexedByPath = Record<string, WebdavFolder | WebdavFile>;

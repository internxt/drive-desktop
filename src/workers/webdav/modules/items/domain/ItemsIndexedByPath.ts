import { WebdavFile } from '../../files/domain/WebdavFile';
import { WebdavFolder } from '../../folders/domain/WebdavFolder';

/** @deprecated */
export type ItemsIndexedByPath = Record<string, WebdavFolder | WebdavFile>;

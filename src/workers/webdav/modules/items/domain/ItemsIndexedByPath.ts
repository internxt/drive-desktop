import { WebdavFile } from '../../files/domain/WebdavFile';
import { Folder } from '../../folders/domain/Folder';

/** @deprecated */
export type ItemsIndexedByPath = Record<string, Folder | WebdavFile>;

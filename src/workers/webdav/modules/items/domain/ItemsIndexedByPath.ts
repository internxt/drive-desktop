import { File } from '../../files/domain/File';
import { WebdavFolder } from '../../folders/domain/WebdavFolder';

/** @deprecated */
export type ItemsIndexedByPath = Record<string, WebdavFolder | File>;

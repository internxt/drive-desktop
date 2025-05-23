import { execSync } from 'child_process';
import { join } from 'path';
import { v4 } from 'uuid';

import '@/virtual-drive';

import settings from './settings';

const rootFileName1 = v4();
const rootZipFileName = `${v4()}.zip`;
const rootFile1 = join(settings.syncRootPath, rootFileName1);
const rootFile2ChangeSize = join(settings.syncRootPath, `change-size-${v4()}.txt`);
const rootFile3 = join(settings.syncRootPath, `${v4()}.txt`);
const rootFile3Moved = join(settings.syncRootPath, `moved-${v4()}.txt`);
const rootFile4 = join(settings.syncRootPath, `${v4()}.txt`);
const rootFolder1 = join(settings.syncRootPath, v4());
const rootFolder2 = join(settings.syncRootPath, v4());
const folder1File1 = join(rootFolder1, `${v4()}.pdf`);
const folder1Folder1 = join(rootFolder1, v4());
const folder1Folder1File1 = join(folder1Folder1, `${v4()}.xlsx`);

execSync(`echo Hello, world! > ${rootFile1}`); // Sync
execSync(`echo Hello, world! > ${rootFile2ChangeSize}`);
execSync(`echo Hello, world! >> ${rootFile2ChangeSize}`); // Sync
execSync(`echo Hello, world! > ${rootFile3}`);
execSync(`type nul > ${rootFile4}`); // No sync (0 bytes)
execSync(`cd ${settings.syncRootPath} && tar -cf ${rootZipFileName} ${rootFileName1}`); // Sync
execSync(`mv ${rootFile3} ${rootFile3Moved}`); // Sync
execSync(`mkdir ${rootFolder1}`); // Sync
execSync(`mkdir ${rootFolder2}`); // Cloud (no files inside)
execSync(`echo Hello, world! > ${folder1File1}`); // Sync
execSync(`mkdir ${folder1Folder1}`); // Sync
execSync(`echo Hello, world! > ${folder1Folder1File1}`); // Sync

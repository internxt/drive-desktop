import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { getFileInfo } from '@/infra/node-win/services/get-file-info';
import { Addon } from '@/node-win/addon-wrapper';
import { VirtualDrive } from '@/node-win/virtual-drive';
import { TEST_FILES } from '@/tests/vitest/mocks.helper.test';
import { moveWithoutOverwrite } from './move-without-overwrite';

describe('move-without-overwrite', () => {
  const providerId = randomUUID();
  const testPath = join(TEST_FILES, randomUUID());
  const rootPath = join(testPath, randomUUID());
  const recoveryPath = join(testPath, 'Internxt Recovery Sync');

  beforeAll(async () => {
    await VirtualDrive.createSyncRootFolder({ rootPath });
    await Addon.registerSyncRoot({ rootPath, providerId, providerName: 'Internxt Drive' });
  });

  afterAll(async () => {
    await Addon.unregisterSyncRoot({ providerId });
  });

  it('should move a downloaded file placeholder out of the sync root keeping its contents', async () => {
    // Given
    const uuid = randomUUID();
    const source = join(rootPath, `${uuid}.txt`);
    const destination = join(recoveryPath, `${uuid}.txt`);
    await writeFile(source, 'content');
    await Addon.convertToPlaceholder({ path: source, placeholderId: `FILE:${uuid}` });
    const { data: placeholder } = await getFileInfo({ path: source });
    expect(placeholder?.onDiskSize).toBe(7);
    // When
    const error = await moveWithoutOverwrite({ source, destination });
    // Then
    expect(error).toBeUndefined();
    expect(await readFile(destination, 'utf8')).toBe('content');
  });

  it('should move a folder with placeholders and files that were never uploaded', async () => {
    // Given
    const uuid = randomUUID();
    const source = join(rootPath, uuid);
    const destination = join(recoveryPath, uuid);
    await mkdir(source);
    await writeFile(join(source, 'uploaded.txt'), 'uploaded');
    await Addon.convertToPlaceholder({ path: join(source, 'uploaded.txt'), placeholderId: `FILE:${randomUUID()}` });
    await writeFile(join(source, 'local.txt'), 'local');
    // When
    const error = await moveWithoutOverwrite({ source, destination });
    // Then
    expect(error).toBeUndefined();
    expect(await readFile(join(destination, 'uploaded.txt'), 'utf8')).toBe('uploaded');
    expect(await readFile(join(destination, 'local.txt'), 'utf8')).toBe('local');
  });
});

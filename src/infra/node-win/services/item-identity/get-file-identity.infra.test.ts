import VirtualDrive from '@/node-win/virtual-drive';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 } from 'uuid';
import { mockDeep } from 'vitest-mock-extended';
import { Callbacks } from '@/node-win/types/callbacks.type';
import { INTERNXT_VERSION } from '@/core/utils/utils';
import { getFileIdentity, GetFileIdentityError } from './get-file-identity';
import { initializeVirtualDrive, virtualDrive } from '@/apps/sync-engine/dependency-injection/common/virtualDrive';
import { setDefaultConfig } from '@/apps/sync-engine/config';

describe('get-file-identity', () => {
  const callbacks = mockDeep<Callbacks>();

  const providerId = `{${v4()}}`;
  const rootFolder = join(TEST_FILES, v4());
  const driveFolder = join(rootFolder, v4());

  beforeAll(() => {
    setDefaultConfig({ rootPath: driveFolder, providerId });
    initializeVirtualDrive();

    virtualDrive.registerSyncRoot({
      providerName: 'Internxt Drive',
      providerVersion: INTERNXT_VERSION,
    });

    virtualDrive.connectSyncRoot({ callbacks });
  });

  afterAll(() => {
    virtualDrive.disconnectSyncRoot();
    VirtualDrive.unRegisterSyncRootByProviderId({ providerId });
  });

  it('If get file identity of a placeholder file, then return the placeholder id', async () => {
    // Given
    const file = join(driveFolder, v4());
    const id = `FILE:${v4()}` as const;
    await writeFile(file, 'content');
    virtualDrive.convertToPlaceholder({ itemPath: file, id });

    // When
    const { data, error } = getFileIdentity({ drive: virtualDrive, path: file });

    // Then
    expect(data).toStrictEqual(id);
    expect(error).toStrictEqual(undefined);
  });

  it('If get file identity of a placeholder folder, then return error', async () => {
    // Given
    const folder = join(driveFolder, v4());
    const id = `FOLDER:${v4()}` as const;
    await mkdir(folder);
    virtualDrive.convertToPlaceholder({ itemPath: folder, id });

    // When
    const { data, error } = getFileIdentity({ drive: virtualDrive, path: folder });

    // Then
    expect(data).toStrictEqual(undefined);
    expect(error).toStrictEqual(new GetFileIdentityError('NOT_A_FILE'));
  });

  it('If the path does not exist, then return error', () => {
    // Given
    const file = join(driveFolder, v4());

    // When
    const { data, error } = getFileIdentity({ drive: virtualDrive, path: file });

    // Then
    expect(data).toStrictEqual(undefined);
    expect(error).toStrictEqual(new GetFileIdentityError('NON_EXISTS'));
  });
});

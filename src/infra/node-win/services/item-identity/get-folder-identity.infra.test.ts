import VirtualDrive from '@/node-win/virtual-drive';
import { loggerMock, TEST_FILES } from '@/tests/vitest/mocks.helper.test';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 } from 'uuid';
import { logger } from '@/apps/shared/logger/logger';
import { mockDeep } from 'vitest-mock-extended';
import { Callbacks } from '@/node-win/types/callbacks.type';
import { INTERNXT_VERSION } from '@/core/utils/utils';
import { iconPath } from '@/apps/utils/icon';
import { getFolderIdentity } from './get-folder-identity';

describe('get-folder-identity', () => {
  const callbacks = mockDeep<Callbacks>();

  const providerId = `{${v4()}}`;
  const rootFolder = join(TEST_FILES, v4());
  const driveFolder = join(rootFolder, v4());
  const loggerPath = join(rootFolder, 'logs');
  const drive = new VirtualDrive({ syncRootPath: driveFolder, providerId, loggerPath, logger });

  beforeAll(() => {
    drive.registerSyncRoot({
      providerName: 'Internxt Drive',
      providerVersion: INTERNXT_VERSION,
      logoPath: iconPath,
    });

    drive.connectSyncRoot({ callbacks });
  });

  afterAll(() => {
    VirtualDrive.unRegisterSyncRootByProviderId({ providerId });
  });

  it('If get folder identity of a placeholder folder, then return the placeholder id', async () => {
    // Given
    const folder = join(driveFolder, v4());
    const id = `FOLDER:${v4()}` as const;
    await mkdir(folder);
    drive.convertToPlaceholder({ itemPath: folder, id });

    // When
    const { data, error } = getFolderIdentity({ drive, path: folder });

    // Then
    expect(data).toStrictEqual(id);
    expect(error).toStrictEqual(undefined);
  });

  it('If get folder identity of a placeholder file, then return error', async () => {
    // Given
    loggerMock.error.mockReturnValueOnce(new Error());

    const file = join(driveFolder, v4());
    const id = `FILE:${v4()}` as const;
    await mkdir(file);
    drive.convertToPlaceholder({ itemPath: file, id });

    // When
    const { data, error } = getFolderIdentity({ drive, path: file });

    // Then
    expect(data).toStrictEqual(undefined);
    expect(error).toStrictEqual(new Error());
  });

  it('If the path does not exist, then return error', () => {
    // Given
    loggerMock.error.mockReturnValueOnce(new Error());
    const folder = join(driveFolder, v4());

    // When
    const { data, error } = getFolderIdentity({ drive, path: folder });

    // Then
    expect(data).toStrictEqual(undefined);
    expect(error).toStrictEqual(new Error());
  });
});

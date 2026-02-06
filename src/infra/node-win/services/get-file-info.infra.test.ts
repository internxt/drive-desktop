import { VirtualDrive } from '@/node-win/virtual-drive';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';
import { getFileInfo, GetFileInfoError } from './get-file-info';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { InSyncState, PinState } from '@/node-win/types/placeholder.type';
import { Addon } from '@/node-win/addon-wrapper';
import { writeFile } from 'node:fs/promises';

describe('get-file-info', () => {
  const providerId = v4();
  const testPath = join(TEST_FILES, v4());
  const rootPath = join(testPath, v4());

  let props: Parameters<typeof getFileInfo>[0];

  beforeEach(() => {
    props = mockProps<typeof getFileInfo>({});
  });

  beforeAll(async () => {
    await VirtualDrive.createSyncRootFolder({ rootPath });
    await Addon.registerSyncRoot({ rootPath, providerId, providerName: 'Internxt Drive' });
  });

  afterAll(async () => {
    await Addon.unregisterSyncRoot({ providerId });
  });

  it('should return data when path is a file placeholder', async () => {
    // Given
    const uuid = v4();
    const path = join(rootPath, uuid);
    const placeholderId: FilePlaceholderId = `FILE:${uuid}`;
    props.path = path;

    await Addon.createFilePlaceholder({ path, placeholderId, size: 10, creationTime: Date.now(), lastWriteTime: Date.now() });
    // When
    const { data, error } = await getFileInfo(props);
    // Then
    expect(error).toBeUndefined();
    expect(data).toStrictEqual({
      pinState: PinState.Unspecified,
      inSyncState: InSyncState.Sync,
      onDiskSize: 0,
      placeholderId,
      uuid,
    });
  });

  it('should return data even when placeholder path is invalid', async () => {
    // Given
    const uuid = v4();
    const path = join(rootPath, 'invalid ');
    const placeholderId: FilePlaceholderId = `FILE:${uuid}`;
    props.path = path;

    await Addon.createFilePlaceholder({ path, placeholderId, size: 10, creationTime: Date.now(), lastWriteTime: Date.now() });
    // When
    const { data, error } = await getFileInfo(props);
    // Then
    expect(error).toBeUndefined();
    expect(data).toStrictEqual({
      pinState: PinState.Unspecified,
      inSyncState: InSyncState.Sync,
      onDiskSize: 0,
      placeholderId,
      uuid,
    });
  });

  it('should return error NOT_A_PLACEHOLDER when path is not a placeholder', async () => {
    // Given
    props.path = join(rootPath, v4());
    await writeFile(props.path, 'content');
    // When
    const { data, error } = await getFileInfo(props);
    // Then
    expect(data).toBeUndefined();
    expect(error).toStrictEqual(
      new GetFileInfoError(
        'NOT_A_PLACEHOLDER',
        '[GetPlaceholderInfoAsync] WinRT error: [CfGetPlaceholderInfo] The file is not a cloud file. (HRESULT: 0x80070178)',
      ),
    );
  });

  it('should return error UNKNOWN when path does not exist', async () => {
    // Given
    props.path = join(rootPath, v4());
    // When
    const { data, error } = await getFileInfo(props);
    // Then
    expect(data).toBeUndefined();
    expect(error).toStrictEqual(new GetFileInfoError('UNKNOWN', '[GetPlaceholderInfoAsync] Failed to open file handle: 2'));
  });
});

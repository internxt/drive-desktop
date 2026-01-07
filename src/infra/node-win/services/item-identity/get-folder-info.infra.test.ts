import { VirtualDrive } from '@/node-win/virtual-drive';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';
import { getFolderInfo, GetFolderInfoError } from './get-folder-info';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { PinState } from '@/node-win/types/placeholder.type';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { Addon } from '@/node-win/addon-wrapper';
import { mkdir } from 'node:fs/promises';

describe('get-folder-info', () => {
  const providerId = v4();
  const rootUuid = v4() as FolderUuid;
  const testPath = join(TEST_FILES, v4());
  const rootPath = join(testPath, rootUuid);

  let props: Parameters<typeof getFolderInfo>[0];

  beforeEach(() => {
    props = mockProps<typeof getFolderInfo>({ ctx: { rootUuid, rootPath } });
  });

  beforeAll(async () => {
    await VirtualDrive.createSyncRootFolder({ rootPath });
    await Addon.registerSyncRoot({ rootPath, providerId, providerName: 'Internxt Drive' });
  });

  afterAll(async () => {
    await Addon.unregisterSyncRoot({ providerId });
  });

  it('should return root data when path is root', async () => {
    // Given
    props.path = rootPath;
    // When
    const { data, error } = await getFolderInfo(props);
    // Then
    expect(data).toStrictEqual({ pinState: PinState.Excluded, placeholderId: `FOLDER:${rootUuid}`, uuid: rootUuid });
    expect(error).toStrictEqual(undefined);
  });

  it('should return data when path is a folder placeholder', async () => {
    // Given
    const uuid = v4();
    const path = join(rootPath, uuid);
    const placeholderId: FolderPlaceholderId = `FOLDER:${uuid}`;
    props.path = path;

    await Addon.createFolderPlaceholder({ path, placeholderId, creationTime: Date.now(), lastWriteTime: Date.now() });
    // When
    const { data, error } = await getFolderInfo(props);
    // Then
    expect(data).toStrictEqual({ pinState: PinState.Unspecified, placeholderId, uuid });
    expect(error).toStrictEqual(undefined);
  });

  it('should return error NOT_A_PLACEHOLDER when the path is not a placeholder', async () => {
    // Given
    props.path = join(rootPath, v4());
    await mkdir(props.path);
    // When
    const { data, error } = await getFolderInfo(props);
    // Then
    expect(data).toStrictEqual(undefined);
    expect(error).toStrictEqual(
      new GetFolderInfoError(
        'NOT_A_PLACEHOLDER',
        '[GetPlaceholderInfoAsync] WinRT error: [CfGetPlaceholderInfo] The file is not a cloud file. (HRESULT: 0x80070178)',
      ),
    );
  });

  it('should return error UNKNOWN when the path does not exist', async () => {
    // Given
    props.path = join(rootPath, v4());
    // When
    const { data, error } = await getFolderInfo(props);
    // Then
    expect(data).toStrictEqual(undefined);
    expect(error).toStrictEqual(new GetFolderInfoError('UNKNOWN', '[GetPlaceholderInfoAsync] Failed to open file handle: 2'));
  });
});

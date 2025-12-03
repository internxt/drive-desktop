import { VirtualDrive } from '@/node-win/virtual-drive';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';
import { getFolderInfo, GetFolderInfoError } from './get-folder-info';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { PinState } from '@/node-win/types/placeholder.type';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { Addon } from '@/node-win/addon-wrapper';

describe('get-folder-info', () => {
  const providerId = `{${v4()}}`;
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

  it('should return root info when read root path', async () => {
    // Given
    props.path = rootPath;
    // When
    const { data, error } = await getFolderInfo(props);
    // Then
    expect(data).toStrictEqual({ pinState: PinState.Excluded, placeholderId: `FOLDER:${rootUuid}`, uuid: rootUuid });
    expect(error).toStrictEqual(undefined);
  });

  it('should return folder info when read a folder placeholder', async () => {
    // Given
    const path = join(rootPath, 'folder');
    const uuid = v4();
    const placeholderId: FolderPlaceholderId = `FOLDER:${uuid}`;
    props.path = path;

    await Addon.createFolderPlaceholder({ path, placeholderId, creationTime: Date.now(), lastWriteTime: Date.now() });
    // When
    const { data, error } = await getFolderInfo(props);
    // Then
    expect(data).toStrictEqual({ pinState: PinState.Unspecified, placeholderId, uuid });
    expect(error).toStrictEqual(undefined);
  });

  it('should return error NOT_A_FILE when read a folder placeholder', async () => {
    // Given
    const path = join(rootPath, 'file.txt');
    const uuid = v4();
    const placeholderId: FilePlaceholderId = `FILE:${uuid}`;
    props.path = path;

    await Addon.createFilePlaceholder({ path, placeholderId, size: 10, creationTime: Date.now(), lastWriteTime: Date.now() });
    // When
    const { data, error } = await getFolderInfo(props);
    // Then
    expect(data).toStrictEqual(undefined);
    expect(error).toStrictEqual(new GetFolderInfoError('NOT_A_FILE'));
  });

  it('should return error NON_EXISTS when the path does not exist', async () => {
    // Given
    props.path = join(rootPath, v4());
    // When
    const { data, error } = await getFolderInfo(props);
    // Then
    expect(data).toStrictEqual(undefined);
    expect(error).toStrictEqual(new GetFolderInfoError('NON_EXISTS'));
  });
});

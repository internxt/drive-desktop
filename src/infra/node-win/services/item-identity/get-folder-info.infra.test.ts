import VirtualDrive from '@/node-win/virtual-drive';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { join } from 'node:path';
import { v4 } from 'uuid';
import { getFolderInfo, GetFolderInfoError } from './get-folder-info';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import { createAbsolutePath, createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { PinState } from '@/node-win/types/placeholder.type';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

describe('get-folder-info', () => {
  const providerId = `{${v4()}}`;
  const testPath = join(TEST_FILES, v4());
  const rootUuid = v4() as FolderUuid;
  const rootPath = createAbsolutePath(testPath, rootUuid);

  const virtualDrive = new VirtualDrive({ rootPath, providerId, loggerPath: '' });

  let props: Parameters<typeof getFolderInfo>[0];

  beforeEach(() => {
    props = mockProps<typeof getFolderInfo>({ ctx: { rootUuid, rootPath, virtualDrive } });
  });

  beforeAll(async () => {
    await virtualDrive.createSyncRootFolder();
    virtualDrive.registerSyncRoot({ providerName: 'Internxt Drive' });
  });

  afterAll(() => {
    VirtualDrive.unregisterSyncRoot({ providerId });
  });

  it('should return root info when read root path', () => {
    // Given
    props.path = '/';
    // When
    const { data, error } = getFolderInfo(props);
    // Then
    expect(data).toStrictEqual({ pinState: PinState.Excluded, placeholderId: `FOLDER:${rootUuid}`, uuid: rootUuid });
    expect(error).toStrictEqual(undefined);
  });

  it('should return folder info when read a folder placeholder', () => {
    // Given
    const itemPath = createRelativePath('/folder');
    const uuid = v4();
    const placeholderId: FolderPlaceholderId = `FOLDER:${uuid}`;
    props.path = itemPath;

    virtualDrive.createFolderByPath({ itemPath, placeholderId, creationTime: Date.now(), lastWriteTime: Date.now() });
    // When
    const { data, error } = getFolderInfo(props);
    // Then
    expect(data).toStrictEqual({ pinState: PinState.Unspecified, placeholderId, uuid });
    expect(error).toStrictEqual(undefined);
  });

  it('should return error NOT_A_FILE when read a folder placeholder', () => {
    // Given
    const itemPath = createRelativePath('/file.txt');
    const uuid = v4();
    const placeholderId: FilePlaceholderId = `FILE:${uuid}`;
    props.path = itemPath;

    virtualDrive.createFileByPath({ itemPath, placeholderId, size: 10, creationTime: Date.now(), lastWriteTime: Date.now() });
    // When
    const { data, error } = getFolderInfo(props);
    // Then
    expect(data).toStrictEqual(undefined);
    expect(error).toStrictEqual(new GetFolderInfoError('NOT_A_FILE'));
  });

  it('should return error NON_EXISTS when the path does not exist', () => {
    // Given
    const itemPath = createAbsolutePath(rootPath, v4());
    props.path = itemPath;
    // When
    const { data, error } = getFolderInfo(props);
    // Then
    expect(data).toStrictEqual(undefined);
    expect(error).toStrictEqual(new GetFolderInfoError('NON_EXISTS'));
  });
});

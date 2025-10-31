import VirtualDrive from '@/node-win/virtual-drive';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { join } from 'node:path';
import { v4 } from 'uuid';
import { getFileInfo, GetFileInfoError } from './get-file-info';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import { createAbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { PinState } from '@/node-win/types/placeholder.type';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';

describe('get-file-info', () => {
  const providerId = `{${v4()}}`;
  const testPath = join(TEST_FILES, v4());
  const rootPath = createAbsolutePath(testPath, v4());

  const virtualDrive = new VirtualDrive({ rootPath, providerId, loggerPath: '' });

  let props: Parameters<typeof getFileInfo>[0];

  beforeEach(() => {
    props = mockProps<typeof getFileInfo>({ ctx: { virtualDrive } });
  });

  beforeAll(async () => {
    await virtualDrive.createSyncRootFolder();
    virtualDrive.registerSyncRoot({ providerName: 'Internxt Drive' });
  });

  afterAll(() => {
    VirtualDrive.unregisterSyncRoot({ providerId });
  });

  it('should return file info when read a file placeholder', () => {
    // Given
    const path = createAbsolutePath(rootPath, v4());
    const uuid = v4();
    const placeholderId: FilePlaceholderId = `FILE:${uuid}`;
    props.path = path;

    virtualDrive.createFileByPath({ path, placeholderId, size: 10, creationTime: Date.now(), lastWriteTime: Date.now() });
    // When
    const { data, error } = getFileInfo(props);
    // Then
    expect(data).toStrictEqual({ pinState: PinState.Unspecified, placeholderId, uuid });
    expect(error).toStrictEqual(undefined);
  });

  it('should return error NOT_A_FILE when read a folder placeholder', () => {
    // Given
    const path = createAbsolutePath(rootPath, v4());
    const uuid = v4();
    const placeholderId: FolderPlaceholderId = `FOLDER:${uuid}`;
    props.path = path;

    virtualDrive.createFolderByPath({ path, placeholderId, creationTime: Date.now(), lastWriteTime: Date.now() });
    // When
    const { data, error } = getFileInfo(props);
    // Then
    expect(data).toStrictEqual(undefined);
    expect(error).toStrictEqual(new GetFileInfoError('NOT_A_FILE'));
  });

  it('should return error NON_EXISTS when the path does not exist', () => {
    // Given
    const itemPath = createAbsolutePath(rootPath, v4());
    props.path = itemPath;
    // When
    const { data, error } = getFileInfo(props);
    // Then
    expect(data).toStrictEqual(undefined);
    expect(error).toStrictEqual(new GetFileInfoError('NON_EXISTS'));
  });
});

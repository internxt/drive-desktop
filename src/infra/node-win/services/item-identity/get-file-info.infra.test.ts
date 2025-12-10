import { VirtualDrive } from '@/node-win/virtual-drive';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';
import { getFileInfo, GetFileInfoError } from './get-file-info';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { PinState } from '@/node-win/types/placeholder.type';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
import { Addon } from '@/node-win/addon-wrapper';
import { writeFile } from 'node:fs/promises';

describe('get-file-info', () => {
  const providerId = `{${v4()}}`;
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
    expect(data).toStrictEqual({ pinState: PinState.Unspecified, placeholderId, uuid });
    expect(error).toStrictEqual(undefined);
  });

  it('should return error NOT_A_FILE when path is a folder placeholder', async () => {
    // Given
    const uuid = v4();
    const path = join(rootPath, uuid);
    const placeholderId: FolderPlaceholderId = `FOLDER:${uuid}`;
    props.path = path;

    await Addon.createFolderPlaceholder({ path, placeholderId, creationTime: Date.now(), lastWriteTime: Date.now() });
    // When
    const { data, error } = await getFileInfo(props);
    // Then
    expect(data).toStrictEqual(undefined);
    expect(error).toStrictEqual(new GetFileInfoError('NOT_A_FILE'));
  });

  it('should return error NOT_A_PLACEHOLDER when path is not a placeholder', async () => {
    // Given
    props.path = join(rootPath, v4());
    await writeFile(props.path, 'content');
    // When
    const { data, error } = await getFileInfo(props);
    // Then
    expect(data).toStrictEqual(undefined);
    expect(error).toStrictEqual(new GetFileInfoError('NOT_A_PLACEHOLDER', 'Unknown error'));
  });

  it('should return error UNKNOWN when path does not exist', async () => {
    // Given
    props.path = join(rootPath, v4());
    // When
    const { data, error } = await getFileInfo(props);
    // Then
    expect(data).toStrictEqual(undefined);
    expect(error).toStrictEqual(new GetFileInfoError('UNKNOWN', 'Failed to open file handle: 2'));
  });
});

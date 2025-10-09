import { call, calls, deepMocked, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createFolders } from './create-folders';
import { createRelativePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { loggerMock } from 'tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as newParseFolderDto from '@/infra/drive-server-wip/out/dto';

vi.mock(import('@/infra/drive-server-wip/drive-server-wip.module'));

describe('create-folders', () => {
  const createFolderMock = deepMocked(driveServerWip.folders.createFolder);
  partialSpyOn(newParseFolderDto, 'newParseFolderDto');

  const rootFolderUuid = v4() as FolderUuid;
  const baseProps = mockProps<typeof createFolders>({
    self: { backed: 0 },
    tracker: {
      currentProcessed: vi.fn(),
    },
    context: {
      abortController: {
        signal: {
          aborted: false,
        },
      },
    },
    tree: {
      folders: {
        ['/' as RelativePath]: { uuid: rootFolderUuid, path: createRelativePath('/') },
      },
    },
  });

  beforeEach(() => {
    baseProps.self.backed = 0;
  });

  it('If signal is aborted then do nothing', async () => {
    // Given
    const props = mockProps<typeof createFolders>({
      ...baseProps,
      added: [],
      context: {
        abortController: {
          signal: {
            aborted: true,
          },
        },
      },
    });

    // When
    await createFolders(props);

    // Then
    expect(createFolderMock).not.toHaveBeenCalled();
  });

  it('If root folder then do nothing', async () => {
    // Given
    const props = mockProps<typeof createFolders>({
      ...baseProps,
      added: [{ relativePath: '/' as RelativePath }],
    });

    // When
    await createFolders(props);

    // Then
    calls(createFolderMock).toHaveLength(0);
  });

  it('If parent does not exist then add issue', async () => {
    // Given
    const props = mockProps<typeof createFolders>({
      ...baseProps,
      added: [{ relativePath: '/folder1/folder2/folder3' as RelativePath }],
    });

    // When
    await createFolders(props);

    // Then
    /**
     * v2.5.3 Daniel Jiménez
     * TODO: check issue
     */
    calls(createFolderMock).toHaveLength(0);
    call(loggerMock.error).toMatchObject({
      msg: 'Parent folder does not exist',
      parentPath: '/folder1/folder2',
      relativePath: '/folder1/folder2/folder3',
    });
  });

  it('If create folder fails then add issue', async () => {
    // Given
    createFolderMock.mockResolvedValueOnce({ error: new Error() });

    const props = mockProps<typeof createFolders>({
      ...baseProps,
      added: [{ relativePath: '/folder1' as RelativePath }],
    });

    // When
    await createFolders(props);

    // Then
    calls(createFolderMock).toHaveLength(1);
    expect(props.self.backed).toBe(1);
    calls(props.tracker.currentProcessed).toHaveLength(1);
    /**
     * v2.5.3 Daniel Jiménez
     * TODO: check issue
     */
  });

  it('If create folder success then add to the remote tree', async () => {
    // Given
    createFolderMock.mockResolvedValueOnce({ data: {} });

    const props = mockProps<typeof createFolders>({
      ...baseProps,
      added: [{ relativePath: '/folder1' as RelativePath }],
    });

    // When
    await createFolders(props);

    // Then
    call(createFolderMock).toStrictEqual({
      body: { parentFolderUuid: rootFolderUuid, plainName: 'folder1' },
      path: '/folder1',
    });
    expect(props.self.backed).toBe(1);
    calls(props.tracker.currentProcessed).toHaveLength(1);
  });

  it('Sort folders before processing them', async () => {
    // Given
    createFolderMock.mockResolvedValue({ data: {} });

    const props = mockProps<typeof createFolders>({
      ...baseProps,
      added: [
        { relativePath: '/folder1' as RelativePath },
        { relativePath: '/folder1/folder2' as RelativePath },
        { relativePath: '/folder3/folder4' as RelativePath },
        { relativePath: '/folder3' as RelativePath },
        { relativePath: '/' as RelativePath },
        { relativePath: '/folder5' as RelativePath },
        { relativePath: '/folder6/folder7' as RelativePath },
      ],
    });

    // When
    await createFolders(props);

    // Then
    expect(props.self.backed).toBe(6);
    calls(createFolderMock).toMatchObject([
      { body: { plainName: 'folder1' }, path: '/folder1' },
      { body: { plainName: 'folder2' }, path: '/folder1/folder2' },
      { body: { plainName: 'folder3' }, path: '/folder3' },
      { body: { plainName: 'folder4' }, path: '/folder3/folder4' },
      { body: { plainName: 'folder5' }, path: '/folder5' },
    ]);
  });
});

import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createFolders } from './create-folders';
import { createRelativePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { loggerMock } from 'tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as createFolder from '@/infra/drive-server-wip/out/ipc-main';

describe('create-folders', () => {
  const createFolderMock = partialSpyOn(createFolder, 'createFolder');

  const rootFolderUuid = v4() as FolderUuid;
  const baseProps = mockProps<typeof createFolders>({
    self: { backed: 0 },
    tracker: {
      currentProcessed: vi.fn(),
    },
    context: {
      addIssue: vi.fn(),
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
    call(props.context.addIssue).toMatchObject({ error: 'CREATE_FOLDER_FAILED' });
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
    call(props.context.addIssue).toMatchObject({ error: 'CREATE_FOLDER_FAILED' });
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
    call(createFolderMock).toMatchObject({
      parentUuid: rootFolderUuid,
      plainName: 'folder1',
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
      { plainName: 'folder1', path: '/folder1' },
      { plainName: 'folder2', path: '/folder1/folder2' },
      { plainName: 'folder3', path: '/folder3' },
      { plainName: 'folder4', path: '/folder3/folder4' },
      { plainName: 'folder5', path: '/folder5' },
    ]);
  });
});

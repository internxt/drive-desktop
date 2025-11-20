import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createFolders } from './create-folders';
import { abs, join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { loggerMock } from 'tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as createFolder from '@/infra/drive-server-wip/out/ipc-main';

describe('create-folders', () => {
  const createFolderMock = partialSpyOn(createFolder, 'createFolder');

  const rootUuid = v4() as FolderUuid;
  const rootPath = abs('/backup');

  const baseProps = mockProps<typeof createFolders>({
    self: { backed: 0 },
    tracker: {
      currentProcessed: vi.fn(),
    },
    context: {
      pathname: rootPath,
      addIssue: vi.fn(),
      abortController: {
        signal: {
          aborted: false,
        },
      },
    },
    tree: {
      folders: {
        [rootPath]: { uuid: rootUuid, absolutePath: rootPath },
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
      added: [{ absolutePath: rootPath }],
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
      added: [{ absolutePath: join(rootPath, '/parent/folder') }],
    });

    // When
    await createFolders(props);

    // Then
    call(props.context.addIssue).toMatchObject({ error: 'CREATE_FOLDER_FAILED' });
    calls(createFolderMock).toHaveLength(0);
    call(loggerMock.error).toMatchObject({
      msg: 'Parent folder does not exist',
      path: '/backup/parent/folder',
    });
  });

  it('If create folder fails then add issue', async () => {
    // Given
    createFolderMock.mockResolvedValueOnce({ error: new Error() });

    const props = mockProps<typeof createFolders>({
      ...baseProps,
      added: [{ absolutePath: join(rootPath, '/folder') }],
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
      added: [{ absolutePath: join(rootPath, '/folder') }],
    });

    // When
    await createFolders(props);

    // Then
    call(createFolderMock).toMatchObject({
      parentUuid: rootUuid,
      path: '/backup/folder',
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
        { absolutePath: join(rootPath, '/folder1') },
        { absolutePath: join(rootPath, '/folder1/folder2') },
        { absolutePath: join(rootPath, '/folder3/folder4') },
        { absolutePath: join(rootPath, '/folder3') },
        { absolutePath: rootPath },
        { absolutePath: join(rootPath, '/folder5') },
        { absolutePath: join(rootPath, '/folder6/folder7') },
      ],
    });

    // When
    await createFolders(props);

    // Then
    expect(props.self.backed).toBe(6);
    calls(createFolderMock).toMatchObject([
      { path: '/backup/folder1' },
      { path: '/backup/folder1/folder2' },
      { path: '/backup/folder3' },
      { path: '/backup/folder3/folder4' },
      { path: '/backup/folder5' },
    ]);
  });
});

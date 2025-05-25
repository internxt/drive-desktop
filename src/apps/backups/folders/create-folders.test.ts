import { deepMocked, getMockCalls, mockProps } from 'tests/vitest/utils.helper.test';
import { createFolders } from './create-folders';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderMother } from 'tests/context/virtual-drive/folders/domain/FolderMother';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { loggerMock } from 'tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';

describe('create-folders', () => {
  const createFolderMock = deepMocked(driveServerWip.folders.createFolder);

  const rootFolderUuid = v4();
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
        ['/' as RelativePath]: FolderMother.fromPartial({ uuid: rootFolderUuid, path: '/' }),
      },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(createFolderMock).not.toHaveBeenCalled();
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
    expect(createFolderMock).not.toHaveBeenCalled();
    expect(getMockCalls(loggerMock.error)).toStrictEqual([
      {
        msg: 'Parent folder does not exist',
        parentPath: '/folder1/folder2',
        relativePath: '/folder1/folder2/folder3',
        tag: 'BACKUPS',
      },
    ]);
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
    expect(createFolderMock).toHaveBeenCalledTimes(1);
    expect(props.self.backed).toBe(1);
    expect(props.tracker.currentProcessed).toHaveBeenCalledWith(1);
    /**
     * v2.5.3 Daniel Jiménez
     * TODO: check issue
     */
  });

  it('If create folder success then add to the remote tree', async () => {
    // Given
    createFolderMock.mockResolvedValueOnce({ data: FolderMother.any().attributes() });

    const props = mockProps<typeof createFolders>({
      ...baseProps,
      added: [{ relativePath: '/folder1' as RelativePath }],
    });

    // When
    await createFolders(props);

    // Then
    expect(createFolderMock).toHaveBeenCalledWith({
      body: {
        parentFolderUuid: rootFolderUuid,
        plainName: 'folder1',
      },
    });
    expect(props.self.backed).toBe(1);
    expect(props.tracker.currentProcessed).toHaveBeenCalledWith(1);
  });

  it('Sort folders before processing them', async () => {
    // Given
    createFolderMock.mockResolvedValue({ data: FolderMother.any().attributes() });

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
    expect(getMockCalls(createFolderMock)).toStrictEqual([
      { body: expect.objectContaining({ plainName: 'folder1' }) },
      { body: expect.objectContaining({ plainName: 'folder2' }) },
      { body: expect.objectContaining({ plainName: 'folder3' }) },
      { body: expect.objectContaining({ plainName: 'folder4' }) },
      { body: expect.objectContaining({ plainName: 'folder5' }) },
    ]);
  });
});

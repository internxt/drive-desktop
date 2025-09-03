import { deepMocked, getMockCalls, mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
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
    createFolderMock.mockResolvedValueOnce({ data: {} });

    const props = mockProps<typeof createFolders>({
      ...baseProps,
      added: [{ relativePath: '/folder1' as RelativePath }],
    });

    // When
    await createFolders(props);

    // Then
    expect(createFolderMock).toHaveBeenCalledWith({
      body: { parentFolderUuid: rootFolderUuid, plainName: 'folder1' },
      path: '/folder1',
    });
    expect(props.self.backed).toBe(1);
    expect(props.tracker.currentProcessed).toHaveBeenCalledWith(1);
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
    expect(getMockCalls(createFolderMock)).toStrictEqual([
      { body: expect.objectContaining({ plainName: 'folder1' }), path: '/folder1' },
      { body: expect.objectContaining({ plainName: 'folder2' }), path: '/folder1/folder2' },
      { body: expect.objectContaining({ plainName: 'folder3' }), path: '/folder3' },
      { body: expect.objectContaining({ plainName: 'folder4' }), path: '/folder3/folder4' },
      { body: expect.objectContaining({ plainName: 'folder5' }), path: '/folder5' },
    ]);
  });
});

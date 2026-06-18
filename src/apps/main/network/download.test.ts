import type { WriteStream } from 'fs';
import { call } from '../../../../tests/vitest/utils.helper';

const {
  addFileMock,
  addFolderMock,
  closeMock,
  createWriteStreamMock,
  downloadFileV2Mock,
  getBackupFolderTreeSnapshotMock,
} = vi.hoisted(() => {
  return {
    addFileMock: vi.fn(),
    addFolderMock: vi.fn(),
    closeMock: vi.fn().mockResolvedValue(undefined),
    createWriteStreamMock: vi.fn(),
    downloadFileV2Mock: vi.fn(),
    getBackupFolderTreeSnapshotMock: vi.fn(),
  };
});

vi.mock('fs', () => {
  return {
    default: {
      createWriteStream: createWriteStreamMock,
    },
    createWriteStream: createWriteStreamMock,
  };
});

vi.mock('./zip.service', () => {
  class FlatFolderZip {
    constructor() {
      // noop
    }

    addFile(name: string, source: ReadableStream<Uint8Array>) {
      addFileMock(name, source);
    }

    addFolder(name: string) {
      addFolderMock(name);
    }

    async close() {
      return closeMock();
    }
  }

  return { FlatFolderZip };
});

vi.mock('./downloadv2', () => {
  return {
    default: downloadFileV2Mock,
  };
});

vi.mock('@internxt/lib', () => {
  return {
    items: {
      getItemDisplayName: ({ name }: { name: string }) => name,
    },
  };
});

vi.mock('../../../backend/features/backup/get-backup-folder-tree-snapshot', () => {
  return {
    getBackupFolderTreeSnapshot: getBackupFolderTreeSnapshotMock,
  };
});

import { downloadFolderAsZip } from './download';

describe('download', () => {
  beforeEach(() => {
    const fakeWriteStream = {
      write: (_chunk: Buffer, cb?: (error?: Error | null) => void) => cb?.(null),
      end: (cb?: (error?: Error | null) => void) => cb?.(null),
      destroy: vi.fn(),
    } as unknown as WriteStream;

    createWriteStreamMock.mockReturnValue(fakeWriteStream);
    downloadFileV2Mock.mockClear();
    addFileMock.mockClear();
    addFolderMock.mockClear();
    closeMock.mockClear();
  });

  it('should add empty file to zip without remote download when backup file has no fileId', async () => {
    getBackupFolderTreeSnapshotMock.mockResolvedValue({
      data: {
        tree: {
          id: 11,
          plainName: 'root',
          files: [
            {
              id: 77,
              type: '',
              bucket: 'bucket-id',
              fileId: null,
              size: '0',
            },
          ],
          children: [],
        },
        folderDecryptedNames: {
          11: 'Ubuntu',
        },
        fileDecryptedNames: {
          77: 'empty.txt',
        },
        size: 0,
      },
    });

    await downloadFolderAsZip(
      'Ubuntu',
      'https://gateway.internxt.com',
      'folder-uuid',
      '/tmp/backup.zip',
      {
        bridgeUser: 'bridge-user',
        bridgePass: 'bridge-pass',
        encryptionKey: 'mnemonic',
      },
      {},
    );

    expect(downloadFileV2Mock).not.toHaveBeenCalled();
    call(addFolderMock).toBe('Ubuntu');
    expect(addFileMock).toHaveBeenCalledTimes(1);

    const addFileCall = addFileMock.mock.calls[0] as [string, ReadableStream<Uint8Array>];
    const fileName = addFileCall[0];
    const source = addFileCall[1];
    expect(fileName).toBe('Ubuntu/empty.txt');
    expect(source).toBeInstanceOf(ReadableStream);

    const reader = source.getReader();
    const firstRead = await reader.read();

    expect(firstRead.done).toBe(true);
  });
});

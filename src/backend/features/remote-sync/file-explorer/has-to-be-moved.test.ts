import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { hasToBeMoved } from './has-to-be-moved';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

describe('has-to-be-moved', () => {
  const getFolderUuidMock = partialSpyOn(NodeWin, 'getFolderUuid');
  const remotePath = 'C:\\Users\\user\\InternxtDrive\\folder1\\current' as AbsolutePath;
  const localPath = 'C:\\Users\\user\\InternxtDrive\\folder2\\current' as AbsolutePath;

  let props: Parameters<typeof hasToBeMoved>[0];

  beforeEach(() => {
    vi.clearAllMocks();
    props = mockProps<typeof hasToBeMoved>({ remotePath, localPath });
  });

  it('should return false if path is the same', () => {
    props.remotePath = props.localPath;
    const hasBeenMoved = hasToBeMoved(props);
    expect(hasBeenMoved).toBe(false);
  });

  it('should return false if local parent does not exist', () => {
    getFolderUuidMock.mockReturnValueOnce({});
    getFolderUuidMock.mockReturnValueOnce({ data: 'uuid' as FolderUuid });
    const hasBeenMoved = hasToBeMoved(props);
    expect(hasBeenMoved).toBe(false);
  });

  it('should return false if remote parent does not exist', () => {
    getFolderUuidMock.mockReturnValueOnce({ data: 'uuid' as FolderUuid });
    getFolderUuidMock.mockReturnValueOnce({});
    const hasBeenMoved = hasToBeMoved(props);
    expect(hasBeenMoved).toBe(false);
  });

  it('should return false if both parents have the same uuid', () => {
    getFolderUuidMock.mockReturnValueOnce({ data: 'uuid' as FolderUuid });
    getFolderUuidMock.mockReturnValueOnce({ data: 'uuid' as FolderUuid });
    const hasBeenMoved = hasToBeMoved(props);
    expect(hasBeenMoved).toBe(false);
  });

  it('should return true if both parents have different uuid', () => {
    getFolderUuidMock.mockReturnValueOnce({ data: 'uuid1' as FolderUuid });
    getFolderUuidMock.mockReturnValueOnce({ data: 'uuid2' as FolderUuid });
    const hasBeenMoved = hasToBeMoved(props);
    expect(hasBeenMoved).toBe(true);
  });

  it('should return true if item has been renamed but not moved', () => {
    props.remotePath = 'C:\\Users\\user\\InternxtDrive\\folder\\old' as AbsolutePath;
    props.localPath = 'C:\\Users\\user\\InternxtDrive\\folder\\new' as AbsolutePath;
    const hasBeenMoved = hasToBeMoved(props);
    expect(hasBeenMoved).toBe(true);
  });

  it('should return false if item has been renamed but both parents have the same uuid', () => {
    props.remotePath = 'C:\\Users\\user\\InternxtDrive\\folder1\\folder2\\old' as AbsolutePath;
    props.localPath = 'C:\\Users\\user\\InternxtDrive\\folder3\\folder2\\new' as AbsolutePath;
    getFolderUuidMock.mockReturnValueOnce({ data: 'uuid' as FolderUuid });
    getFolderUuidMock.mockReturnValueOnce({ data: 'uuid' as FolderUuid });
    const hasBeenMoved = hasToBeMoved(props);
    expect(hasBeenMoved).toBe(false);
  });
});

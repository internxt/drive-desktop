import { clientMock } from 'tests/vitest/mocks.helper.test';
import { createBackupFolder } from './create-backup-folder';

describe('create-backup-folder', () => {
  const props = {
    parentFolderUuid: 'parent-uuid',
    plainName: 'Test Backup',
  };
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return data when folder is created successfully', async () => {
    const mockData = {
      uuid: 'new-folder-uuid',
      name: 'Test Backup',
      parentUuid: 'parent-uuid',
    };
    clientMock.POST.mockResolvedValue({ data: mockData });
    const { data, error } = await createBackupFolder(props);
    expect(error).toBeUndefined();
    expect(data).toStrictEqual(mockData);
  });

  it('should return error when folder creation fails', async () => {
    clientMock.POST.mockResolvedValue({ response: { status: 400 } });
    const { data, error } = await createBackupFolder(props);
    expect(data).toBeUndefined();
    expect(error?.code).toBe('UNKNOWN');
  });
});

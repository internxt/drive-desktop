import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call } from '@/tests/vitest/utils.helper.test';
import { db, runMigrations } from '../../migrations/run-migrations';
import { commitScanPage } from './commit-scan-page';
import { clearTables, getObserved, getScans, insertScan } from './recovery-sync.helper.test';

describe('commit-scan-page', () => {
  let props: Parameters<typeof commitScanPage>[0];

  beforeAll(() => {
    runMigrations();
  });

  afterAll(() => {
    db.close();
  });

  beforeEach(() => {
    clearTables();
    insertScan({ itemType: 'file' });

    props = {
      rootUuid: 'rootUuid',
      itemType: 'file',
      items: [
        { uuid: 'uuid1', remoteStatus: 'EXISTS' },
        { uuid: 'uuid2', remoteStatus: 'TRASHED' },
      ],
      updatedAt: '2025-06-01T00:00:00.000Z',
      completed: false,
    };
  });

  it('should save observations and progress together', () => {
    // When
    const { error } = commitScanPage(props);
    // Then
    expect(error).toBeUndefined();
    expect(getScans()).toMatchObject([{ updatedAt: '2025-06-01T00:00:00.000Z', completed: 0 }]);
    expect(getObserved()).toMatchObject([
      { uuid: 'uuid1', remoteStatus: 'EXISTS' },
      { uuid: 'uuid2', remoteStatus: 'TRASHED' },
    ]);
  });

  it('should accept replaying the saved timestamp and keep the latest status', () => {
    // Given
    commitScanPage(props);
    // When
    const { error } = commitScanPage({ ...props, items: [{ uuid: 'uuid1', remoteStatus: 'DELETED' }] });
    // Then
    expect(error).toBeUndefined();
    expect(getObserved()).toMatchObject([
      { uuid: 'uuid1', remoteStatus: 'DELETED' },
      { uuid: 'uuid2', remoteStatus: 'TRASHED' },
    ]);
  });

  it('should mark the scan as completed', () => {
    // When
    commitScanPage({ ...props, completed: true });
    // Then
    expect(getScans()).toMatchObject([{ completed: 1 }]);
  });

  it('should reject progress that moves backwards without saving observations', () => {
    // Given
    commitScanPage({ ...props, items: [] });
    // When
    const { error } = commitScanPage({ ...props, updatedAt: '2025-01-01T00:00:00.000Z' });
    // Then
    expect(error?.code).toBe('INVALID_PROGRESS');
    expect(getScans()).toMatchObject([{ updatedAt: '2025-06-01T00:00:00.000Z' }]);
    expect(getObserved()).toStrictEqual([]);
  });

  it('should reject pages for a completed scan', () => {
    // Given
    commitScanPage({ ...props, items: [], completed: true });
    // When
    const { error } = commitScanPage(props);
    // Then
    expect(error?.code).toBe('INVALID_PROGRESS');
    expect(getObserved()).toStrictEqual([]);
  });

  it('should reject pages for a scan that was not started', () => {
    // When
    const { error } = commitScanPage({ ...props, itemType: 'folder' });
    // Then
    expect(error?.code).toBe('INVALID_PROGRESS');
  });

  it('should reject an invalid timestamp', () => {
    // When
    const { error } = commitScanPage({ ...props, updatedAt: 'invalid' });
    // Then
    expect(error?.code).toBe('INVALID_PROGRESS');
  });

  it('should roll back progress and observations when an observation fails', () => {
    // Given
    props.items = [
      { uuid: 'uuid1', remoteStatus: 'EXISTS' },
      { uuid: 'uuid2', remoteStatus: 'INVALID' as any },
    ];
    // When
    const { error } = commitScanPage(props);
    // Then
    expect(error?.code).toBe('UNKNOWN');
    expect(getScans()).toMatchObject([{ updatedAt: '1970-01-01T00:00:00.000Z' }]);
    expect(getObserved()).toStrictEqual([]);
    expect(db.isTransaction).toBe(false);
    call(loggerMock.error).toMatchObject({ error: { message: expect.stringContaining('CHECK constraint failed') } });
  });
});

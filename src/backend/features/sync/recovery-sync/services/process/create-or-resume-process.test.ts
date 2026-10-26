import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { DatabaseSync } from 'node:sqlite';
import { partialSpyOn } from '@/tests/vitest/partial-spy-on.helper';
import { ProcessRepository, ScanRepository } from '../../repository';
import { createOrResumeProcess } from './create-or-resume-process';

describe('create-or-resume-process', () => {
  let database: DatabaseSync;
  let props: Parameters<typeof createOrResumeProcess>[0];

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    props = { database, ctx: { rootUuid: 'root', userUuid: 'user', workspaceId: '' }, startedAt: '2026-10-01T00:00:00.000Z' };
    partialSpyOn(ProcessRepository, 'getProcess').mockReturnValue(Result.ok(undefined));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    database.close();
  });

  it('does not register scans when process insertion fails', () => {
    // Given
    const error = new Error('insert failed');
    partialSpyOn(ProcessRepository, 'insertProcess').mockReturnValue(Result.err(error));
    const insertScan = partialSpyOn(ScanRepository, 'insertScanFromCheckpoint');
    // When
    const result = createOrResumeProcess(props);
    // Then
    expect(result.error).toBe(error);
    expect(insertScan).not.toHaveBeenCalled();
  });

  it('stops at the first failed scan registration', () => {
    // Given
    partialSpyOn(ProcessRepository, 'insertProcess').mockReturnValue(Result.ok({ rootUuid: 'root' }));
    const error = new Error('scan failed');
    const insertScan = partialSpyOn(ScanRepository, 'insertScanFromCheckpoint').mockReturnValue(Result.err(error));
    // When
    const result = createOrResumeProcess(props);
    // Then
    expect(result.error).toBe(error);
    expect(insertScan).toHaveBeenCalledExactlyOnceWith({ database, ctx: props.ctx, itemType: 'file' });
  });

  it('derives file and folder registrations from the Drive context', () => {
    // Given
    const process = { rootUuid: 'root', stage: 'preparing' as const };
    partialSpyOn(ProcessRepository, 'insertProcess').mockReturnValue(Result.ok(process));
    const insertScan = partialSpyOn(ScanRepository, 'insertScanFromCheckpoint').mockReturnValue(Result.ok(undefined));
    // When
    const result = createOrResumeProcess(props);
    // Then
    expect(result.data).toBe(process);
    expect(insertScan).toHaveBeenCalledTimes(2);
    expect(insertScan).toHaveBeenNthCalledWith(2, { database, ctx: props.ctx, itemType: 'folder' });
  });

  it('reuses unfinished state without changing its original start time or registering scans again', () => {
    // Given
    const existing = { rootUuid: props.ctx.rootUuid, startedAt: '2026-09-01T00:00:00.000Z', stage: 'preserving' as const };
    partialSpyOn(ProcessRepository, 'getProcess').mockReturnValue(Result.ok(existing));
    const insert = partialSpyOn(ProcessRepository, 'insertProcess');
    const insertScan = partialSpyOn(ScanRepository, 'insertScanFromCheckpoint');
    // When
    const result = createOrResumeProcess(props);
    // Then
    expect(result.data).toBe(existing);
    expect(insert).not.toHaveBeenCalled();
    expect(insertScan).not.toHaveBeenCalled();
  });

  it('does not create another process when reading its root fails', () => {
    // Given
    const error = new Error('lookup failed');
    partialSpyOn(ProcessRepository, 'getProcess').mockReturnValue(Result.err(error));
    const insert = partialSpyOn(ProcessRepository, 'insertProcess');
    // When
    const result = createOrResumeProcess(props);
    // Then
    expect(result.error).toBe(error);
    expect(insert).not.toHaveBeenCalled();
  });
});

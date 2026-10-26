import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { accessDatabase } from '../storage';
import * as ProcessRepository from './index';

describe('process-repository', () => {
  let database: DatabaseSync;
  const props = { rootUuid: 'process', startedAt: '2026-10-01T00:00:00.000Z' };

  beforeEach(() => {
    database = new DatabaseSync(':memory:');
    readdirSync('migrations')
      .filter((file) => file.endsWith('.sql'))
      .sort()
      .forEach((file) => {
        database.exec(readFileSync(join('migrations', file), 'utf8'));
      });
  });

  afterEach(() => database.close());

  it('inserts and reads a validated process without registering scans', () => {
    // When
    const inserted = ProcessRepository.insertProcess({ database, ...props });
    // Then
    expect(inserted.error).toBeUndefined();
    expect(inserted.data).toMatchObject({ rootUuid: props.rootUuid, stage: 'preparing', preservedFileCount: 0 });
    expect(inserted.data).not.toHaveProperty('userUuid');
    expect(inserted.data).not.toHaveProperty('workspaceId');
    const columns = database
      .prepare('PRAGMA table_info(recovery_process)')
      .all()
      .map((column) => column.name);
    expect(columns).not.toContain('userUuid');
    expect(columns).not.toContain('workspaceId');
    expect(columns).not.toContain('outcome');
    expect(columns).not.toContain('outcomeMessage');
    expect(columns).not.toContain('notification');
    expect(ProcessRepository.getProcess({ database, rootUuid: props.rootUuid }).data).toEqual(inserted.data);
    expect(database.prepare('SELECT * FROM recovery_scan').all()).toEqual([]);
    expect(ProcessRepository.getProcess({ database, rootUuid: 'missing' }).data).toBeUndefined();
  });

  it('rejects an invalid start date without inserting a process', () => {
    // When
    const result = ProcessRepository.insertProcess({ database, ...props, startedAt: 'invalid' });
    // Then
    expect(result.error).toBeInstanceOf(Error);
    expect(ProcessRepository.getProcess({ database, rootUuid: props.rootUuid }).data).toBeUndefined();
  });

  it('does not update a stage when its expected predecessor does not match', () => {
    // Given
    ProcessRepository.insertProcess({ database, ...props });
    // When
    const result = ProcessRepository.updateProcessStage({
      database,
      rootUuid: props.rootUuid,
      stage: 'preserving',
      expectedStage: 'scanning',
      requiredScanStage: 'completed',
    });
    // Then
    expect(result.error).toBeInstanceOf(Error);
    expect(ProcessRepository.getProcess({ database, rootUuid: props.rootUuid }).data?.stage).toBe('preparing');
  });

  it('returns a mapping error without discarding invalid stored recovery state', () => {
    // Given
    ProcessRepository.insertProcess({ database, ...props });
    database.exec("UPDATE recovery_process SET startedAt = 'invalid'");
    // When
    const result = accessDatabase({
      database,
      action: ProcessRepository.getProcess,
      input: { rootUuid: props.rootUuid },
    });
    // Then
    expect(result.error).toBeInstanceOf(Error);
    expect(database.prepare('SELECT rootUuid FROM recovery_process').get()?.rootUuid).toBe(props.rootUuid);
  });
});

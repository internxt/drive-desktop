import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { accessDatabase } from '../storage';
import * as ProcessRepository from './index';

describe('process-repository', () => {
  let database: DatabaseSync;
  const props = { processId: 'process', startedAt: '2026-10-01T00:00:00.000Z' };

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
    expect(inserted.data).toMatchObject({ processId: props.processId, stage: 'preparing', preservedFileCount: 0 });
    expect(ProcessRepository.getProcess({ database, processId: props.processId }).data).toEqual(inserted.data);
    expect(database.prepare('SELECT * FROM recovery_scan').all()).toEqual([]);
    expect(ProcessRepository.getProcess({ database, processId: 'missing' }).data).toBeUndefined();
  });

  it('rejects an invalid start date without inserting a process', () => {
    // When
    const result = ProcessRepository.insertProcess({ database, ...props, startedAt: 'invalid' });
    // Then
    expect(result.error).toBeInstanceOf(Error);
    expect(ProcessRepository.getProcess({ database, processId: props.processId }).data).toBeUndefined();
  });

  it('does not update a stage when its expected predecessor does not match', () => {
    // Given
    ProcessRepository.insertProcess({ database, ...props });
    // When
    const result = ProcessRepository.updateProcessStage({
      database,
      processId: props.processId,
      stage: 'preserving',
      expectedStage: 'scanning',
      requiredScanStage: 'completed',
    });
    // Then
    expect(result.error).toBeInstanceOf(Error);
    expect(ProcessRepository.getProcess({ database, processId: props.processId }).data?.stage).toBe('preparing');
  });

  it('rolls back a notification claim if mapping its stored process fails', () => {
    // Given
    ProcessRepository.insertProcess({ database, ...props });
    ProcessRepository.saveOutcome({ database, processId: props.processId, outcome: 'failed' });
    database.exec("UPDATE recovery_process SET startedAt = 'invalid'");
    // When
    const result = accessDatabase({
      database,
      action: ProcessRepository.claimOutcome,
      input: { processId: props.processId },
      transaction: true,
    });
    // Then
    expect(result.error).toBeInstanceOf(Error);
    expect(database.prepare('SELECT notification FROM recovery_process').get()?.notification).toBe('pending');
  });
});

import { beforeEach, describe, expect, test } from 'vitest';
import Loki from 'lokijs';
import { DriveFileSchema, type DriveFile } from './drive-file';
import path from 'path';
import { upsertDriveFile, getDriveFileByUUID, setDriveFileCollection } from './drive-file-db';

// In-memory LokiJS for tests (no file persistence)
let db: Loki;
let memoryCollection: Collection<DriveFile>;

beforeEach(async () => {
  db = new Loki('test.db');
  memoryCollection = db.addCollection<DriveFile>('drive_files', {
    unique: ['uuid'],
  });

  // Optional: if your db logic uses a setter for testability
  setDriveFileCollection(memoryCollection);
});

describe('DriveFile DB', () => {
  test('should insert and retrieve a DriveFile entry by UUID', () => {
    const now = new Date().toISOString();

    const input: DriveFile = {
      uuid: 'test-uuid-123',
      id: 1,
      fileId: 'file-001',
      workspaceId: 'ws-01',
      type: 'doc',
      size: 500,
      bucket: 'main',
      folderId: 999,
      folderUuid: undefined,
      userId: 42,
      userUuid: 'user-abc',
      modificationTime: now,
      createdAt: now,
      updatedAt: now,
      plainName: 'file',
      name: 'file.docx',
      status: 'EXISTS',
      isDangledStatus: false,
    };

    // Insert
    const inserted = memoryCollection.insert(input);
    expect(inserted).toMatchObject(input);

    // Retrieve
    const result = memoryCollection.by('uuid', 'test-uuid-123');
    expect(result).not.toBeNull();
    expect(result?.name).toBe('file.docx');
  });
});

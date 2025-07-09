import { mockDeep } from 'vitest-mock-extended';
import VirtualDrive from '../virtual-drive';
import { QueueManager } from './queue-manager';
import { join } from 'path';
import { loggerMock, TEST_FILES } from '@/tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';
import { mkdir, rm, unlink, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as handleHydrate from '@/apps/sync-engine/callbacks/handle-hydrate';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

describe('queue-manager', async () => {
  const handleHydrateMock = partialSpyOn(handleHydrate, 'handleHydrate');

  const testPath = join(TEST_FILES, v4());
  const queuePath = join(testPath, 'queue.json');
  await mkdir(testPath, { recursive: true });
  const virtualDrive = mockDeep<VirtualDrive>();

  beforeEach(async () => {
    vi.clearAllMocks();
    if (existsSync(queuePath)) await unlink(queuePath);
  });

  afterAll(async () => {
    await rm(testPath, { recursive: true, force: true });
  });

  describe('what happens when creating queue manager', () => {
    it('should start with an empty queue if file not exists', () => {
      // When
      const service = new QueueManager(virtualDrive, queuePath);
      // Then
      expect(service.queue).toEqual([]);
    });

    it('should load queue from file if exists', async () => {
      // Given
      const queue = [{ path: 'path' }];
      await writeFile(queuePath, JSON.stringify(queue));

      // When
      const service = new QueueManager(virtualDrive, queuePath);

      // Then
      expect(service.queue).toEqual(queue);
    });

    it('should not load queue if invalid', async () => {
      // Given
      const queue = [{ path: 1 }];
      await writeFile(queuePath, JSON.stringify(queue));

      // When
      const service = new QueueManager(virtualDrive, queuePath);

      // Then
      expect(service.queue).toEqual([]);
      expect(loggerMock.error).toBeCalledTimes(1);
    });
  });

  describe('what happens when we already have the queue manager', () => {
    let service: QueueManager;

    beforeEach(() => {
      service = new QueueManager(virtualDrive, queuePath);
    });

    it('should add item to queue and start processing', () => {
      // Given
      const item = {
        path: createRelativePath('folder', 'file.txt'),
        uuid: v4() as FileUuid,
      };

      // When
      service.enqueue(item);

      // Then
      expect(service.queue).toEqual([]);
      expect(handleHydrateMock).toBeCalledTimes(1);
    });

    it('should check for duplicates', () => {
      // Given
      service.isProcessing = true;
      const item = {
        path: createRelativePath('folder', 'file.txt'),
        uuid: v4() as FileUuid,
      };

      // When
      service.enqueue(item);
      service.enqueue(item);

      // Then
      expect(service.queue).toEqual([item]);
      expect(handleHydrateMock).toBeCalledTimes(0);
    });
  });
});

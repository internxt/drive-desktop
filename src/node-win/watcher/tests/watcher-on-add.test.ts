import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { mkdir, writeFile } from 'node:fs/promises';
import { TEST_FILES } from 'tests/vitest/mocks.helper.test';
import { v4 } from 'uuid';
import { sleep } from '@/apps/main/util';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { call, calls, getCalls, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as onAddDir from '../events/on-add-dir.service';
import * as onChange from '../events/on-change';
import { setupWatcher, getEvents } from './watcher.helper.test';

describe('watcher-on-add', () => {
  const onChangeMock = partialSpyOn(onChange, 'onChange');
  const onAddDirMock = partialSpyOn(onAddDir, 'onAddDir');

  let rootPath: AbsolutePath;
  let parent: AbsolutePath;

  beforeEach(async () => {
    rootPath = join(TEST_FILES, v4());
    parent = join(rootPath, 'parent');
    await mkdir(rootPath);
    await mkdir(parent);
    await setupWatcher(rootPath);
  });

  it('should emit udpate event when create file', async () => {
    // Given
    const file = join(rootPath, 'file');
    // When
    await writeFile(file, 'content');
    await sleep(100);
    // Then
    call(onChangeMock).toMatchObject({ event: { action: 'update', type: 'file', size: 7 }, path: file });
  });

  it('should emit create event when create empty file', async () => {
    // Given
    const file = join(rootPath, 'file');
    // When
    await writeFile(file, '');
    await sleep(100);
    // Then
    call(onChangeMock).toMatchObject({ event: { action: 'create', type: 'file', size: 0 }, path: file });
  });

  it('should emit update event when create file with strange characters', async () => {
    // Given
    const file = join(rootPath, 'Леди Баг в стиле куклы Лол');
    // When
    await writeFile(file, 'content');
    await sleep(100);
    // Then
    call(onChangeMock).toMatchObject({ event: { action: 'update', type: 'file', size: 7 }, path: file });
  });

  it('should emit update event when creating a big file', async () => {
    // Given
    const file = join(rootPath, 'file');
    const size = 1024 * 1024;
    const bigContent = Buffer.alloc(size);
    // When
    await writeFile(file, bigContent);
    await sleep(100);
    // Then
    call(onChangeMock).toMatchObject({ event: { action: 'update', type: 'file', size }, path: file });
  });

  it('should emit update events for all files with content', async () => {
    // Given
    const files = Array.from({ length: 50 }, (_, i) => join(rootPath, `file${i}`));
    // When
    await Promise.all(files.map((file) => writeFile(file, 'content')));
    await sleep(100);
    // Then
    calls(onChangeMock).toHaveLength(50);
    expect(getCalls(onChangeMock).every((c: any) => c.event.action === 'update')).toBe(true);
  });

  it('should emit create event when create folder', async () => {
    // Given
    const folder = join(rootPath, v4());
    // When
    await mkdir(folder);
    await sleep(100);
    // Then
    getEvents().toMatchObject([{ event: { action: 'create', type: 'folder' }, path: folder }]);
    call(onAddDirMock).toMatchObject({ path: folder });
  });
});

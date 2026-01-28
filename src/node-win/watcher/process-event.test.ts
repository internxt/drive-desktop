import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { processEvent } from './process-event';
import * as onUnlink from '@/backend/features/local-sync/watcher/events/unlink/on-unlink';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as debounceOnRaw from './events/debounce-on-raw';
import * as onAdd from './events/on-add.service';
import * as onAddDir from './events/on-add-dir.service';

vi.mock(import('node:fs/promises'));

describe('process-event', () => {
  const onUnlinkMock = partialSpyOn(onUnlink, 'onUnlink');
  const debounceOnRawMock = partialSpyOn(debounceOnRaw, 'debounceOnRaw');
  const onAddMock = partialSpyOn(onAdd, 'onAdd');
  const onAddDirMock = partialSpyOn(onAddDir, 'onAddDir');

  const path = abs('/parent/item');
  let props: Parameters<typeof processEvent>[0];

  beforeEach(() => {
    props = mockProps<typeof processEvent>({ path });
  });

  it('should unlink if delete event', async () => {
    // Given
    props.event = 'delete';
    // When
    await processEvent(props);
    // Then
    call(onUnlinkMock).toMatchObject({ path });
  });

  it('should update if update event and it is a file', async () => {
    // Given
    props.event = 'update';
    props.type = 'file';
    // When
    await processEvent(props);
    // Then
    call(debounceOnRawMock).toMatchObject({ path });
  });

  it('should ignore if update event and it is a folder', async () => {
    // Given
    props.event = 'update';
    props.type = 'folder';
    // When
    await processEvent(props);
    // Then
    calls(debounceOnRawMock).toHaveLength(0);
  });

  it('should add if create event and it is a file', async () => {
    // Given
    props.event = 'create';
    props.type = 'file';
    // When
    await processEvent(props);
    // Then
    call(onAddMock).toMatchObject({ path });
  });

  it('should add dir if create event and it is a folder', async () => {
    // Given
    props.event = 'create';
    props.type = 'folder';
    // When
    await processEvent(props);
    // Then
    call(onAddDirMock).toMatchObject({ path });
  });
});

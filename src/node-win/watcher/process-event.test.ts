import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { processEvent } from './process-event';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as onChange from './events/on-change';
import * as onAddDir from './events/on-add-dir.service';

vi.mock(import('node:fs/promises'));

describe('process-event', () => {
  const onChangeMock = partialSpyOn(onChange, 'onChange');
  const onAddDirMock = partialSpyOn(onAddDir, 'onAddDir');

  const path = abs('/parent/item');
  let props: Parameters<typeof processEvent>[0];

  beforeEach(() => {
    props = mockProps<typeof processEvent>({ path, event: {} });
  });

  it('should update if update event and it is a file', async () => {
    // Given
    props.event.action = 'update';
    props.event.type = 'file';
    // When
    await processEvent(props);
    // Then
    call(onChangeMock).toMatchObject({ path });
  });

  it('should ignore if update event and it is a folder', async () => {
    // Given
    props.event.action = 'update';
    props.event.type = 'folder';
    // When
    await processEvent(props);
    // Then
    calls(onChangeMock).toHaveLength(0);
  });

  it('should add if create event and it is a file', async () => {
    // Given
    props.event.action = 'create';
    props.event.type = 'file';
    // When
    await processEvent(props);
    // Then
    call(onChangeMock).toMatchObject({ path });
  });

  it('should add dir if create event and it is a folder', async () => {
    // Given
    props.event.action = 'create';
    props.event.type = 'folder';
    // When
    await processEvent(props);
    // Then
    call(onAddDirMock).toMatchObject({ path });
  });
});

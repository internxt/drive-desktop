import Loki from 'lokijs';
import { addCollection, setCheckpointsDb } from '../checkpoints-db';
import { updateCheckpoint } from './update-checkpoint';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import { ZodError } from 'zod';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('update-checkpoint', () => {
  let props: Parameters<typeof updateCheckpoint>[0];

  beforeEach(() => {
    const db = new Loki('test.db');
    const collection = addCollection(db);
    setCheckpointsDb(collection);

    props = {
      userUuid: 'userUuid',
      workspaceId: 'workspaceId',
      type: 'file',
      checkpoint: '2025-06-28T09:32:48.033Z',
      plainName: 'plainName',
    };
  });

  it('should give PARSE_ZOD error when props are invalid', async () => {
    // Given
    const props = mockProps<typeof updateCheckpoint>({});

    // When
    const { error } = await updateCheckpoint(props);

    // Then
    expect(error?.code).toBe('PARSE_ZOD');
    expect(error?.cause).toBeInstanceOf(ZodError);
    expect(loggerMock.error).toBeCalledWith(
      expect.objectContaining({
        tag: 'SYNC-ENGINE',
        msg: 'Update checkpoint failed',
        props,
        exc: expect.any(ZodError),
      }),
    );
  });

  it('should insert checkpoint when props are valid', async () => {
    // When
    const { data } = await updateCheckpoint(props);

    // Then
    expect(data).toStrictEqual(
      expect.objectContaining({
        key: 'userUuid:workspaceId:file',
        checkpoint: '2025-06-28T09:32:48.033Z',
      }),
    );
  });

  it('should update checkpoint when props are valid', async () => {
    // When and Then
    const { data: data1 } = await updateCheckpoint(props);
    expect(data1?.checkpoint).toBe('2025-06-28T09:32:48.033Z');

    // Given and When and Then
    props.checkpoint = '2025-06-29T09:32:48.033Z';
    const { data: data2 } = await updateCheckpoint(props);
    expect(data2?.checkpoint).toBe('2025-06-29T09:32:48.033Z');
  });

  it('should allow file and folder keys', async () => {
    // When and Then
    const { data: data1 } = await updateCheckpoint(props);
    expect(data1?.key).toBe('userUuid:workspaceId:file');

    // Given and When and Then
    props.type = 'folder';
    const { data: data2 } = await updateCheckpoint(props);
    expect(data2?.key).toBe('userUuid:workspaceId:folder');
  });
});

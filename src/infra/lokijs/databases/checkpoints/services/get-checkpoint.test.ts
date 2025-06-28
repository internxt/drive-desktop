import Loki from 'lokijs';
import { addCollection, setCheckpointsDb } from '../checkpoints-db';
import { getCheckpoint } from './get-checkpoint';
import { TCheckpoints } from '../checkpoints-schema';
import { ZodError } from 'zod';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { getKey } from './get-key';

describe('get-checkpoint', () => {
  let props: Parameters<typeof getCheckpoint>[0];
  let collection: Collection<TCheckpoints>;
  let key: string;

  beforeEach(() => {
    const db = new Loki('test.db');
    collection = addCollection(db);
    setCheckpointsDb(collection);

    props = { userUuid: '123', workspaceId: '123', type: 'file' };
    key = getKey(props);
  });

  it("should return undefined when checkpoint doesn't exist", async () => {
    // When
    const { data } = await getCheckpoint(props);

    // Then
    expect(data).toBeUndefined();
  });

  it('should return checkpoint when checkpoint exists', async () => {
    // Given
    collection.insertOne({ key, checkpoint: '2025-06-28T09:32:48.033Z' });

    // When
    const { data } = await getCheckpoint(props);

    // Then
    expect(data).toBe('2025-06-28T09:32:48.033Z');
  });

  it('should give PARSE_ZOD error when checkpoint is invalid', async () => {
    // Given
    collection.insertOne({ key, checkpoint: 'invalid' });

    // When
    const { error } = await getCheckpoint(props);

    // Then
    expect(error?.code).toBe('PARSE_ZOD');
    expect(error?.cause).toBeInstanceOf(ZodError);
    expect(loggerMock.error).toBeCalledWith(
      expect.objectContaining({
        tag: 'SYNC-ENGINE',
        msg: 'Get checkpoint failed',
        props,
        exc: expect.any(ZodError),
      }),
    );
  });
});

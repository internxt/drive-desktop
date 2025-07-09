import { NOTIFICATION_SCHEMA } from './notification-schema';

describe('notification-schema', () => {
  it('should parse correctly a FILE_CREATED event', async () => {
    // When
    await NOTIFICATION_SCHEMA.parseAsync({
      event: 'FILE_CREATED',
      email: 'activate@internxt.com',
      clientId: 'drive-desktop',
      userId: '658594fe-68bd-4905-8598-5adc73e930fb',
      payload: {
        id: 881869447,
        uuid: '908cbaa4-a9e8-4b3a-a674-1440eb38d7b6',
        fileId: '686bbe74ac28b031c0452f39',
        name: 'ONzgORtJ77qI28jDnr+GjwJn6xELsAEqsn3FKlKNYbHR7Z129AD/WOMkAChEKx6rm7hOER2drdmXmC296dvSXtE5y5os0XCS554YYc+dcCNeASdu49J5kvxdxcwrdMZesSXVMtBBp3vH',
        type: 'exe',
        size: '2381232',
        bucket: '65c124751ebdc83354faacf3',
        folderId: 66008789,
        folderUuid: '1dfab7bf-ef9d-4bc1-aa88-31c1c33d7b9c',
        encryptVersion: '03-aes',
        deleted: false,
        deletedAt: null,
        userId: 868024,
        creationTime: '2025-07-07T12:32:53.000Z',
        modificationTime: '2025-07-07T12:32:53.000Z',
        createdAt: '2025-07-07T12:32:53.489Z',
        updatedAt: '2025-07-07T12:32:53.000Z',
        plainName: 'procexp64',
        removed: false,
        removedAt: null,
        status: 'EXISTS',
      },
    });
  });
});

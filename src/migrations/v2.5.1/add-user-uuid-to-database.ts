import { getUser } from '@/apps/main/auth/service';
import { driveFilesCollection, driveFoldersCollection } from '@/apps/main/remote-sync/store';

export class AddUserUuidToDatabase {
  static KEY = 'v2-5-1-add-user-uuid-to-database';

  static async run() {
    const user = getUser();

    if (user) {
      await Promise.all([
        driveFilesCollection.updateInBatch({
          where: { userUuid: '' },
          payload: { userUuid: user.uuid },
        }),
        driveFoldersCollection.updateInBatch({
          where: { userUuid: '' },
          payload: { userUuid: user.uuid },
        }),
      ]);
    }
  }
}

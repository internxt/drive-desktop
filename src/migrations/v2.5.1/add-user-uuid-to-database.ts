import { getUser } from '@/apps/main/auth/service';
import { fileRepository } from '@/infra/sqlite/services/drive-file';
import { folderRepository } from '@/infra/sqlite/services/drive-folder';

export class AddUserUuidToDatabase {
  static readonly KEY = 'v2-5-1-add-user-uuid-to-database';

  static async run() {
    const user = getUser();

    if (user) {
      await Promise.all([
        fileRepository.update({ userUuid: '' }, { userUuid: user.uuid }),
        folderRepository.update({ userUuid: '' }, { userUuid: user.uuid }),
      ]);
    }
  }
}

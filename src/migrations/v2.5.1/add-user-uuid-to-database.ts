import { getUser } from '@/apps/main/auth/service';
import { folderRepository } from '@/infra/sqlite/services/drive-folder';

export class AddUserUuidToDatabase {
  static readonly KEY = 'v2-5-1-add-user-uuid-to-database';

  static async run() {
    const user = getUser();

    if (user) {
      await folderRepository.update({ userUuid: '' }, { userUuid: user.uuid });
    }
  }
}

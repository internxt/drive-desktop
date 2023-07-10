import {
  ServerFolder,
  ServerFolderStatus,
} from '../../../../../filesystems/domain/ServerFolder';

export class ServerFolderMother {
  static fromPartial(partial: Partial<ServerFolder>): ServerFolder {
    return {
      bucket: 'acd8aa2f-8af9-5b61-b298-d52ea69588b9',
      created_at: new Date().toISOString(),
      id: 1762214292,
      name: 'Kiosefu',
      parent_id: 1559224241,
      updated_at: new Date().toISOString(),
      plain_name: 'Kiosefu',
      status: ServerFolderStatus.EXISTS,
      ...partial,
    };
  }
}

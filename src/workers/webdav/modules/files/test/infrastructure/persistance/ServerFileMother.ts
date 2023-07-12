import {
  ServerFile,
  ServerFileStatus,
} from '../../../../../../filesystems/domain/ServerFile';

export class ServerFileMother {
  static fromPartial(partial: Partial<ServerFile>): ServerFile {
    return {
      bucket: '55c229cf-d40b-5f66-b8d6-10fbe9dafc1f',
      createdAt: new Date().toISOString(),
      encrypt_version: 'aes-3',
      fileId: 'be2faaf9-9a11-574a-89d4-2213a20a39d4',
      folderId: 4017,
      id: 2785074,
      modificationTime: new Date().toISOString(),
      name: 'string',
      size: 2844830403,
      type: 'png',
      updatedAt: new Date().toISOString(),
      userId: 1965074674,
      status: ServerFileStatus.EXISTS,
      ...partial,
    };
  }
}

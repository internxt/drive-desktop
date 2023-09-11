import {
  ServerFile,
  ServerFileStatus,
} from '../../../../../filesystems/domain/ServerFile';
import { ContentsIdMother } from '../../../contents/test/domain/ContentsIdMother';

export class ServerFileMother {
  static fromPartial(partial: Partial<ServerFile>): ServerFile {
    return {
      bucket: '55c229cf-d40b-5f66-b8d6-10fbe9dafc1f',
      createdAt: new Date().toISOString(),
      encrypt_version: 'aes-3',
      fileId: ContentsIdMother.raw(),
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

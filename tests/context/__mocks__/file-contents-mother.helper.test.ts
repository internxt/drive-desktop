import { RemoteFileContents } from '@/context/virtual-drive/contents/domain/RemoteFileContents';
import { ContentsIdMother } from '../virtual-drive/contents/domain/ContentsIdMother';
import { ContentsSizeMother } from './contents-size-mother.helper.test';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';

export class FileContentsMother {
  static random(): RemoteFileContents {
    return {
      id: ContentsIdMother.random().value as ContentsId,
      size: ContentsSizeMother.random().value,
    };
  }
}

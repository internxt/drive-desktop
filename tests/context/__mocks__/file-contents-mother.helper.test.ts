import { RemoteFileContents } from '@/context/virtual-drive/contents/domain/RemoteFileContents';
import { ContentsIdMother } from '../virtual-drive/contents/domain/ContentsIdMother';
import { ContentsSizeMother } from './contents-size-mother.helper.test';

export class FileContentsMother {
  static random(): RemoteFileContents {
    return RemoteFileContents.from({
      id: ContentsIdMother.random().value,
      size: ContentsSizeMother.random().value,
    });
  }
}

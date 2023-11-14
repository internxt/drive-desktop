import { RemoteFileContents } from '../../../../../src/context/virtual-drive/contents/domain/RemoteFileContents';
import { ContentsIdMother } from './ContentsIdMother';
import { ContentsSizeMother } from './ContentsSizeMother';

export class FileContentsMother {
  static random(): RemoteFileContents {
    return RemoteFileContents.from({
      id: ContentsIdMother.random().value,
      size: ContentsSizeMother.random().value,
    });
  }
}

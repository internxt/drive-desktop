import { RemoteFileContents } from '../../../../../src/context/virtual-drive/contents/domain/RemoteFileContents';
import { ContentsIdMother } from './ContentsIdMother.helper.test';
import { ContentsSizeMother } from './ContentsSizeMother.helper.test';

export class FileContentsMother {
  static random(): RemoteFileContents {
    return RemoteFileContents.from({
      id: ContentsIdMother.random().value,
      size: ContentsSizeMother.random().value,
    });
  }
}

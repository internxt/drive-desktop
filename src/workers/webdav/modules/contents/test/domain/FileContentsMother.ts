import { FileContents } from '../../domain/FileContents';
import { ContentsIdMother } from './ContentsIdMother';
import { ContentsSizeMother } from './ContentsSizeMother';

export class FileContentsMother {
  static random(): FileContents {
    return FileContents.from(
      ContentsIdMother.random(),
      ContentsSizeMother.random()
    );
  }
}

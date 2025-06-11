import { Readable } from 'stream';
import { ContentsSize } from './ContentsSize';
import { File } from '../../files/domain/File';

type LocalFileContentsAttributes = {
  name: string;
  extension: string;
  size: number;
  birthTime: number;
  modifiedTime: number;
  contents: Readable;
};

export class LocalFileContents {
  private constructor(
    private readonly _name: string,
    private readonly _extension: string,
    private readonly _size: ContentsSize,
    private readonly _birthTime: number,
    private readonly _modifiedTime: number,
    public readonly stream: Readable,
  ) {}

  public get name(): string {
    return this._name;
  }
  public get extension(): string {
    return this._extension;
  }

  public get nameWithExtension(): string {
    return this.name + (this.extension?.length ? '.' + this.extension : '');
  }

  public get size(): number {
    return this._size.value;
  }

  static from(attributes: LocalFileContentsAttributes): LocalFileContents {
    const remoteContents = new LocalFileContents(
      attributes.name,
      attributes.extension,
      new ContentsSize(attributes.size),
      attributes.birthTime,
      attributes.modifiedTime,
      attributes.contents,
    );

    return remoteContents;
  }

  static downloadedFrom(file: File, contents: Readable) {
    const remoteContents = new LocalFileContents(
      file.name,
      file.type,
      new ContentsSize(file.size),
      file.createdAt.getUTCMilliseconds(),
      file.updatedAt.getUTCMilliseconds(),
      contents,
    );

    return remoteContents;
  }
}

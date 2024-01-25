import { Readable } from 'stream';
import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { OfflineContentsSize } from './OfflineContentsSize';

export type LocalFileContentsAttributes = {
  name: string;
  extension: string;
  size: number;
  birthTime: number;
  modifiedTime: number;
  contents: Readable;
};

export class OfflineContents extends AggregateRoot {
  private constructor(
    private readonly _name: string,
    private readonly _extension: string,
    private readonly _size: OfflineContentsSize,
    private readonly _birthTime: number,
    private readonly _modifiedTime: number,
    public readonly stream: Readable
  ) {
    super();
  }

  public get name(): string {
    return this._name;
  }
  public get extension(): string {
    return this._extension;
  }

  public get nameWithExtension(): string {
    return this.name + (this.extension.length >= 0 ? '.' + this.extension : '');
  }

  public get size(): number {
    return this._size.value;
  }

  public get birthTime(): number {
    return this._birthTime;
  }

  public get modifiedTime(): number {
    return this._modifiedTime;
  }

  static from(attributes: LocalFileContentsAttributes): OfflineContents {
    const remoteContents = new OfflineContents(
      attributes.name,
      attributes.extension,
      new OfflineContentsSize(attributes.size),
      attributes.birthTime,
      attributes.modifiedTime,
      attributes.contents
    );

    return remoteContents;
  }

  attributes(): Omit<LocalFileContentsAttributes, 'contents'> {
    return {
      name: this.name,
      extension: this.extension,
      size: this.size,
      birthTime: this.birthTime,
      modifiedTime: this.modifiedTime,
    };
  }
}

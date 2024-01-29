import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { OfflineContentsName } from './OfflineContentsName';
import { OfflineContentsSize } from './OfflineContentsSize';

export type LocalFileContentsAttributes = {
  name: string;
  size: number;
  birthTime: number;
  modifiedTime: number;
  absolutePath: string;
};

export class OfflineContents extends AggregateRoot {
  private constructor(
    private _name: OfflineContentsName,
    private readonly _size: OfflineContentsSize,
    private readonly _birthTime: number,
    private readonly _modifiedTime: number,
    public readonly absolutePath: string
  ) {
    super();
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
      new OfflineContentsName(attributes.name),
      new OfflineContentsSize(attributes.size),
      attributes.birthTime,
      attributes.modifiedTime,
      attributes.absolutePath
    );

    return remoteContents;
  }

  attributes(): LocalFileContentsAttributes {
    return {
      name: this._name.value,
      size: this.size,
      birthTime: this.birthTime,
      modifiedTime: this.modifiedTime,
      absolutePath: this.absolutePath,
    };
  }
}

import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { ThumbnailContentId } from './ThumbanailContentId';

export type ThumbnailAtributes = {
  id: number;
  contentsId: string;
  type: string;
  bucket: string;
};

export class Thumbnail extends AggregateRoot {
  private constructor(
    private _id: number,
    private _contentsId: ThumbnailContentId,
    private _type: string,
    private _bucket: string
  ) {
    super();
  }

  public get id(): number {
    return this._id;
  }

  public get contentsId(): string {
    return this._contentsId.value;
  }

  public get type(): string {
    return this._type;
  }

  public get bucket(): string {
    return this._bucket;
  }

  attributes(): ThumbnailAtributes {
    return {
      id: this.id,
      contentsId: this.contentsId,
      type: this.type,
      bucket: this.bucket,
    };
  }
}

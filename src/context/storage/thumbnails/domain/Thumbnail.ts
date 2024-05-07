import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { ThumbnailContentId } from './ThumbnailContentId';

export type ThumbnailAttributes = {
  id?: number;
  contentsId?: string;
  type: string;
  bucket?: string;
  updatedAt: Date;
};

export class Thumbnail extends AggregateRoot {
  private constructor(
    private _type: string,
    private _updatedAt: Date,
    private _bucket?: string,
    private _id?: number,
    private _contentsId?: ThumbnailContentId
  ) {
    super();
  }

  public get id(): number | undefined {
    return this._id;
  }

  public get contentsId(): string | undefined {
    return this._contentsId?.value;
  }

  public get type(): string {
    return this._type;
  }

  public get bucket(): string | undefined {
    return this._bucket;
  }
  public get updatedAt(): Date {
    return this._updatedAt;
  }

  static from(attributes: ThumbnailAttributes): Thumbnail {
    return new Thumbnail(
      attributes.type,
      attributes.updatedAt,
      attributes.bucket,
      attributes.id,
      attributes.contentsId
        ? new ThumbnailContentId(attributes.contentsId)
        : undefined
    );
  }

  attributes(): ThumbnailAttributes {
    return {
      id: this.id,
      contentsId: this.contentsId,
      type: this.type,
      bucket: this.bucket,
      updatedAt: this.updatedAt,
    };
  }

  isNewer(other: Thumbnail): boolean {
    return this.updatedAt > other.updatedAt;
  }
}

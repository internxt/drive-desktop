import { Primitives } from 'shared/types/Primitives';
import { AggregateRoot } from '../../shared/domain/AggregateRoot';

export type RootFolderAttributes = {
  id: number;
};

export class RootFolder extends AggregateRoot {
  private readonly _path = '/';

  private constructor(private _id: number) {
    super();
  }

  static from(attributes: RootFolderAttributes): RootFolder {
    return new RootFolder(attributes.id);
  }

  public get id(): number {
    return this._id;
  }

  public get path(): string {
    return this._path;
  }

  toPrimitives(): Record<string, Primitives> {
    return {
      id: this.id,
      path: this.path,
    };
  }
}

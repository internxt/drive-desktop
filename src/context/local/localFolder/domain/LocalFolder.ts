import { AbsolutePath, RelativePath } from '../../localFile/infrastructure/AbsolutePath';

type LocalFolderAttributes = {
  path: AbsolutePath;
  modificationTime: number;
  relativePath: RelativePath;
};

export class LocalFolder {
  private constructor(
    private _path: AbsolutePath,
    private _modificationTime: number,
    public readonly relativePath: RelativePath,
  ) {}

  get path(): AbsolutePath {
    return this._path;
  }

  static from(attributes: LocalFolderAttributes): LocalFolder {
    return new LocalFolder(attributes.path, attributes.modificationTime, attributes.relativePath);
  }
}

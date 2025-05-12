import { AbsolutePath, RelativePath } from '../../localFile/infrastructure/AbsolutePath';

type LocalFolderAttributes = {
  path: AbsolutePath;
  relativePath: RelativePath;
};

export class LocalFolder {
  private constructor(
    private _path: AbsolutePath,
    public readonly relativePath: RelativePath,
  ) {}

  get path(): AbsolutePath {
    return this._path;
  }

  static from(attributes: LocalFolderAttributes): LocalFolder {
    return new LocalFolder(attributes.path, attributes.relativePath);
  }

  attributes(): LocalFolderAttributes {
    return {
      path: this._path,
      relativePath: this.relativePath,
    };
  }
}

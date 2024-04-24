import { LocalFileIsAvailable } from '../../../context/offline-drive/LocalFile/application/find/LocalFileIsAvaliable';
import { FirstsFileSearcher } from '../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { FuseCallback } from './FuseCallback';
import { Container } from 'diod';
import { FuseNoSuchFileOrDirectoryError } from './FuseErrors';

export class GetXAttributeCallback extends FuseCallback<Buffer> {
  constructor(private readonly container: Container) {
    super('Get X Attribute');
  }

  async execute(path: string, name: string, size: string) {
    const virtualFile = await this.container.get(FirstsFileSearcher).run({
      path,
    });

    if (!virtualFile) {
      return this.left(new FuseNoSuchFileOrDirectoryError(path));
    }

    const isAvailableLocally = await this.container
      .get(LocalFileIsAvailable)
      .run(virtualFile.contentsId);

    if (isAvailableLocally) {
      return this.right(Buffer.from('on_local'));
    }

    const buff = Buffer.from('on_remote');
    return this.right(buff);
  }
}

import { FileDeleter } from '../../modules/files/application/FileDeleter';

export class DeleteFileController {
  constructor(private readonly deleter: FileDeleter) {}

  async execute(contentsId: string) {
    // eslint-disable-next-line no-control-regex
    const sanitazedId = contentsId.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    await this.deleter.run(sanitazedId);
  }
}

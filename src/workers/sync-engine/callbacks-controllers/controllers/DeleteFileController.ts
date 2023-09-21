import { FileDeleter } from '../../modules/files/application/FileDeleter';
import { CallbackController } from './CallbackController';

export class DeleteFileController extends CallbackController {
  constructor(private readonly deleter: FileDeleter) {
    super();
  }

  async execute(contentsId: string) {
    const trimmedId = this.trim(contentsId);

    await this.deleter.run(trimmedId);
  }
}

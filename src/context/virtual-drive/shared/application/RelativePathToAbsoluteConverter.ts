import { Service } from 'diod';
import path from 'path';

@Service()
export class RelativePathToAbsoluteConverter {
  constructor(private readonly baseFolder: string) {}

  run(relativePath: string): string {
    return path.join(this.baseFolder, relativePath);
  }
}

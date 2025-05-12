import * as stat from './services/stat';

export class FileSystemModule {
  public stat = stat;
}

export const fileSystem = new FileSystemModule();

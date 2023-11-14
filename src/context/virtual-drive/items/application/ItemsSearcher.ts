import * as fs from 'fs';
import * as path from 'path';

export class ItemsSearcher {
  listFilesAndFolders(directory: string): string[] {
    let result: string[] = [];

    // Lee el contenido del directorio
    const items = fs.readdirSync(directory);

    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        result.push(fullPath);
        // Si es un directorio, explora su contenido de forma recursiva
        result = result.concat(this.listFilesAndFolders(fullPath));
      } else if (stat.isFile()) {
        result.push(fullPath);
      }
    }

    return result;
  }
}

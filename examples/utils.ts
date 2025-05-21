import fs from 'fs';
import path from 'path';

interface FileDetail {
  path: string;
  size: number;
  baseDir: string;
}

function readFilesRecursively(dir: string, fileList: FileDetail[] = []): FileDetail[] {
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      readFilesRecursively(filePath, fileList);
    } else {
      fileList.push({
        path: filePath,
        size: fs.statSync(filePath).size,
        baseDir: dir,
      });
    }
  });
  return fileList;
}

function createFilesWithSize(sourceFolder: string, destFolder: string): void {
  const files: FileDetail[] = readFilesRecursively(sourceFolder);

  if (!fs.existsSync(destFolder)) {
    fs.mkdirSync(destFolder, { recursive: true });
  }

  files.forEach((file) => {
    const relativePath = path.relative(file.baseDir, file.path);
    const destFilePath = path.join(file.baseDir.replace(sourceFolder, destFolder), relativePath); //path.join(destFolder, relativePath);
    const destFileDir = file.baseDir.replace(sourceFolder, destFolder); //path.dirname(destFilePath);

    if (!fs.existsSync(destFileDir)) {
      fs.mkdirSync(destFileDir, { recursive: true });
    }

    fs.writeFileSync(destFilePath, Buffer.alloc(file.size));
  });
}

export { createFilesWithSize };

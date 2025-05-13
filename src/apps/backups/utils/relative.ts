import path from 'path';

export function getParentDirectory(root: string, filePath: string): string {
  // Obtener la ruta relativa del archivo en relación al root
  const relativePath = path.relative(root, filePath);

  // Obtener el directorio padre
  const parentDirectory = path.dirname(relativePath);

  // Asegurar que la ruta empiece con una barra inclinada
  return parentDirectory === '.' ? '/' : `/${parentDirectory.replace(/\\/g, '/')}`;
}

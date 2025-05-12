import path from 'path';

export function relative(root: string, to: string): string {
  const normalizedTo = to.replace(/^[/\\]+/, '');

  // Unir 'root' con la ruta normalizada
  const resolvedPath = path.resolve(root, normalizedTo);

  return resolvedPath;
}
export function relativeV2(root: string, to: string): string {
  // Obtener la ruta relativa de 'to' respecto a 'root'
  const relativePath = path.relative(root, to);

  // Asegurar que la ruta empiece con una barra inclinada
  return `/${relativePath.replace(/\\/g, '/')}`;
}
export function getParentDirectory(root: string, filePath: string): string {
  // Obtener la ruta relativa del archivo en relación al root
  const relativePath = path.relative(root, filePath);

  // Obtener el directorio padre
  const parentDirectory = path.dirname(relativePath);

  // Asegurar que la ruta empiece con una barra inclinada
  return parentDirectory === '.' ? '/' : `/${parentDirectory.replace(/\\/g, '/')}`;
}

import { basename, extname } from 'node:path';

type Props = {
  path: string;
};

export function getNameAndExtension({ path }: Props) {
  const extension = extname(path);
  const name = basename(path, extension);
  return { name, extension: extension.slice(1) };
}

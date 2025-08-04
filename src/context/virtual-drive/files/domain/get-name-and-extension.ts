import { basename, extname } from 'path';

type Props = {
  nameWithExtension: string;
};

export function getNameAndExtension({ nameWithExtension }: Props) {
  const extension = extname(nameWithExtension);
  const name = basename(nameWithExtension, extension);
  return { name, extension: extension.slice(1) };
}

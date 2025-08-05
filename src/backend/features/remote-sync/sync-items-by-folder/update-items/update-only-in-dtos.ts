import { ParsedFileDto, ParsedFolderDto } from '@/infra/drive-server-wip/out/dto';

type Props = { type: 'file'; itemDto: ParsedFileDto } | { type: 'folder'; itemDto: ParsedFolderDto };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function updateOnlyInDtos({ type, itemDto }: Props) {
  // Create placeholder
}

import crypt from '../../../../context/shared/infrastructure/crypt';

type Props = {
  plainName: string | undefined;
  encryptedName: string;
  parentId: number | undefined;
};

export function folderDecryptName({ plainName, encryptedName, parentId }: Props) {
  const decryptedName = plainName || crypt.decryptName(encryptedName, parentId?.toString());
  return decryptedName;
}

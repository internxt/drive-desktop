import crypt from '../../../../context/shared/infrastructure/crypt';

type TProps = {
  plainName: string | undefined;
  encryptedName: string;
  parentId: number | null;
  extension: string | null;
};

export function fileDecryptName({ plainName, encryptedName, parentId, extension }: TProps) {
  const newName = plainName || crypt.decryptName(encryptedName, parentId?.toString());
  let nameWithExtension = newName;
  if (extension) nameWithExtension = `${newName}.${extension}`;
  return { name: newName, nameWithExtension };
}

import { Buffer } from 'buffer';
import { Message, PrivateKey, WebStream } from 'openpgp';
import { logger } from '../logger/logger';

export async function getOpenpgp(): Promise<typeof import('openpgp')> {
  return import('openpgp');
}

export const decryptMessageWithPrivateKey = async ({
  encryptedMessage,
  privateKeyInBase64,
  userMnemonic,
}: {
  encryptedMessage: WebStream<string>;
  privateKeyInBase64: string;
  userMnemonic: string;
}) => {
  const openpgp = await getOpenpgp();

  const privateKeyArmored = Buffer.from(privateKeyInBase64, 'base64').toString();
  const privateKey = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });

  const message = await openpgp.readMessage({
    armoredMessage: encryptedMessage,
  });

  if (!comparePrivateKeyCiphertextIDs({ privateKey, message })) {
    logger.warn({ tag: 'SYNC-ENGINE', msg: 'The key does not correspond to the ciphertext' });
    return userMnemonic;
  }

  const { data: decryptedMessage } = await openpgp.decrypt({
    message,
    decryptionKeys: privateKey,
  });

  return decryptedMessage.toString();
};

function comparePrivateKeyCiphertextIDs({ privateKey, message }: { privateKey: PrivateKey; message: Message<string> }) {
  const messageKeyID = message.getEncryptionKeyIDs()[0].toHex();
  const privateKeyID = privateKey.getSubkeys()[0].getKeyID().toHex();
  return messageKeyID === privateKeyID;
}

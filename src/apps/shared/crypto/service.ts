import { Buffer } from 'node:buffer';
import { decrypt, Message, PrivateKey, readMessage, readPrivateKey, WebStream } from 'openpgp';
import { logger } from '../logger/logger';

type Props = {
  encryptedMessage: WebStream<string>;
  privateKeyInBase64: string;
};

export async function decryptMessageWithPrivateKey({ encryptedMessage, privateKeyInBase64 }: Props) {
  const privateKeyArmored = Buffer.from(privateKeyInBase64, 'base64').toString();
  const privateKey = await readPrivateKey({ armoredKey: privateKeyArmored });

  const message = await readMessage({
    armoredMessage: encryptedMessage,
  });

  if (!comparePrivateKeyCiphertextIDs(privateKey, message)) {
    throw logger.error({ tag: 'SYNC-ENGINE', msg: 'The key does not correspond to the ciphertext' });
  }

  const { data: decryptedMessage } = await decrypt({
    message,
    decryptionKeys: privateKey,
  });

  return decryptedMessage.toString();
}

function comparePrivateKeyCiphertextIDs(privateKey: PrivateKey, message: Message<string>) {
  const messageKeyID = message.getEncryptionKeyIDs()[0].toHex();
  const privateKeyID = privateKey.getSubkeys()[0].getKeyID().toHex();
  return messageKeyID === privateKeyID;
}

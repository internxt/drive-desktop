import { Data, MaybeStream, WebStream } from 'openpgp';

export class CryptoService {
  private getOpenpgp() {
    return import('openpgp');
  }

  async encryptMessageWithPublicKey({
    message,
    publicKeyInBase64,
  }: {
    message: string;
    publicKeyInBase64: string;
  }): Promise<WebStream<string>> {
    const openpgp = await this.getOpenpgp();

    const publicKeyArmored = Buffer.from(publicKeyInBase64, 'base64').toString();
    const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });

    const encryptedMessage = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: message }),
      encryptionKeys: publicKey,
    });

    return encryptedMessage;
  }

  async decryptMessageWithPrivateKey({
    encryptedMessage,
    privateKeyInBase64,
  }: {
    encryptedMessage: WebStream<string>;
    privateKeyInBase64: string;
  }): Promise<MaybeStream<Data> & WebStream<Uint8Array>> {
    const openpgp = await this.getOpenpgp();

    const privateKeyArmored = Buffer.from(privateKeyInBase64, 'base64').toString();
    const privateKey = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });
    const message = await openpgp.readMessage({ armoredMessage: encryptedMessage });

    const { data: decryptedMessage } = await openpgp.decrypt({
      message,
      decryptionKeys: privateKey,
    });

    return decryptedMessage;
  }
}

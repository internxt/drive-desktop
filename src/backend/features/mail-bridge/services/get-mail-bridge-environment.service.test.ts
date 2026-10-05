import { getMailBridgeEnvironment } from './get-mail-bridge-environment.service';

describe('get-mail-bridge-environment.service', () => {
  let inheritedEnvironment: NodeJS.ProcessEnv;

  beforeEach(() => {
    inheritedEnvironment = Object.assign({}, process.env, {
      PATH: 'system-path',
      MAIL_API_URL: undefined,
      MAIL_SERVER_PUBLIC_KEY: undefined,
    });
  });

  it('passes build configuration when the runtime environment has no Mail configuration', () => {
    // Given
    const mailApiUrl = 'https://mail.example.test';
    const mailServerPublicKey = 'server-public-key';
    const originalEnvironment = { ...inheritedEnvironment };
    // When
    const result = getMailBridgeEnvironment({ inheritedEnvironment, mailApiUrl, mailServerPublicKey });
    // Then
    expect(result).toEqual({
      data: { ...inheritedEnvironment, MAIL_API_URL: mailApiUrl, MAIL_SERVER_PUBLIC_KEY: mailServerPublicKey },
      error: undefined,
    });
    expect(inheritedEnvironment).toEqual(originalEnvironment);
  });

  it.each([undefined, '', '   '])('rejects a missing Mail API URL (%s) before starting the fixture mailbox', (mailApiUrl) => {
    // Given / When
    const result = getMailBridgeEnvironment({ inheritedEnvironment, mailApiUrl, mailServerPublicKey: undefined });
    // Then
    expect(result).toEqual({ data: undefined, error: new Error('Mail Bridge requires MAIL_API_URL') });
  });

  it('allows an omitted server public key', () => {
    // Given / When
    const result = getMailBridgeEnvironment({
      inheritedEnvironment,
      mailApiUrl: 'https://mail.example.test',
      mailServerPublicKey: undefined,
    });
    // Then
    expect(result.error).toBeUndefined();
    expect(result.data?.MAIL_API_URL).toBe('https://mail.example.test');
  });
});

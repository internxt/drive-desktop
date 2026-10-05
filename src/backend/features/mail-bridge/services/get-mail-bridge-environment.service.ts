type GetMailBridgeEnvironmentProps = {
  inheritedEnvironment: NodeJS.ProcessEnv;
  mailApiUrl: string | undefined;
  mailServerPublicKey: string | undefined;
};

export function getMailBridgeEnvironment({
  inheritedEnvironment,
  mailApiUrl,
  mailServerPublicKey,
}: GetMailBridgeEnvironmentProps): { data: NodeJS.ProcessEnv; error: undefined } | { data: undefined; error: Error } {
  if (!mailApiUrl?.trim()) return { data: undefined, error: new Error('Mail Bridge requires MAIL_API_URL') };

  return {
    data: Object.assign({}, inheritedEnvironment, {
      MAIL_API_URL: mailApiUrl,
      MAIL_SERVER_PUBLIC_KEY: mailServerPublicKey,
    }),
    error: undefined,
  };
}

import { Share } from '@internxt/sdk/dist/drive';

type Props = {
  apiUrl: string;
  clientName: string;
  clientVersion: string;
  desktopHeader: string;
  token: string;
  workspaceToken?: string;
};

export function createShareClient({ apiUrl, clientName, clientVersion, desktopHeader, token, workspaceToken }: Props) {
  return Share.client(
    apiUrl,
    {
      clientName,
      clientVersion,
      desktopHeader,
    },
    {
      token,
      workspaceToken,
    },
  );
}

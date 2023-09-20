import { ArrowRight } from '@phosphor-icons/react';
import React, { useEffect, useState } from 'react';
import { useTranslationContext } from '../../context/LocalContext';
import { reportError } from '../../utils/errors';

interface AssetInfo {
  browser_download_url: string;
}

interface LatestReleaseInfo {
  id: number;
  name: string;
  published_at: Date;
  assets: AssetInfo[];
}

export async function getLatestReleaseInfo(
  user: string,
  repo: string
): Promise<string | undefined> {
  const fetchUrl = `https://api.github.com/repos/${user}/${repo}/releases/latest`;
  const res = await fetch(fetchUrl);

  if (res.status !== 200) {
    throw Error('Release not found');
  }

  const info: LatestReleaseInfo = await res.json();

  let url: string | undefined = undefined;
  info.assets.forEach((asset) => {
    const match = asset.browser_download_url.match(/\.(\w+)$/);

    if (match && match[1]) {
      url = asset.browser_download_url;
    }
  });

  return url;
}

export const MacOSVersionAvailableBanner: React.FC = () => {
  const { translate } = useTranslationContext();
  const [downloadURL, setDownloadURL] = useState<string>();
  useEffect(() => {
    getLatestReleaseInfo('internxt', 'drive-desktop-macos')
      .then(setDownloadURL)
      .catch(reportError);
  }, []);

  const handleDownloadMacOSNative = () => {
    try {
      if (!downloadURL) return;
      window.electron.openUrl(downloadURL);
    } catch (error) {
      reportError(error);
    }
  };
  return (
    <div
      className="flex flex-row bg-primary px-5 py-4"
      onClick={handleDownloadMacOSNative}
    >
      <div className="mr-4">
        <h2 className="mb-1 text-sm font-semibold">
          {translate('widget.macos-available.title')}
        </h2>
        <h3 className="text-sm">
          {translate('widget.macos-available.message')}
        </h3>
      </div>
      <div className="flex items-center">
        <ArrowRight size={24} />
      </div>
    </div>
  );
};

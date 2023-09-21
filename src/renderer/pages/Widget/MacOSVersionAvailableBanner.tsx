import { ArrowRight } from '@phosphor-icons/react';
import React, { useEffect, useState } from 'react';
import { useTranslationContext } from '../../context/LocalContext';
import { reportError } from '../../utils/errors';

const getDownloadUrl = async () => {
  const { platforms } = await window.electron.getDownloadUrls();

  return platforms['MacOS'];
};
export const MacOSVersionAvailableBanner: React.FC = () => {
  const { translate } = useTranslationContext();
  const [downloadURL, setDownloadURL] = useState<string>();
  useEffect(() => {
    getDownloadUrl().then(setDownloadURL).catch(reportError);
  }, []);

  const handleDownloadMacOSNative = async () => {
    try {
      if (!downloadURL) return;
      await window.electron.openUrl(downloadURL);
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

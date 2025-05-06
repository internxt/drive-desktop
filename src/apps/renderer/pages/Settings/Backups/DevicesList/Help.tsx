import { type FC } from 'react';
import { Question } from '@phosphor-icons/react';
import { useTranslationContext } from '../../../../context/LocalContext';

const Help: FC = () => {
  const { translate } = useTranslationContext();
  const handleOpenURL = async () => {
    try {
      await window.electron.openUrl(
        'https://help.internxt.com/en/articles/6583477-how-do-backups-work-on-internxt-drive'
      );
    } catch (error) {
      reportError(error);
    }
  };

  return (
    <div
      className="mt-auto hover:cursor-pointer"
      onClick={handleOpenURL}
      data-testid="help-component"
    >
      <Question className="mr-1 inline" />
      <span className="text-gray-100">
        {translate('settings.backups.backups-help')}
      </span>
    </div>
  );
};
export default Help;

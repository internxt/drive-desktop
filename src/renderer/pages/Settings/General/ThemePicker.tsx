import { useState } from 'react';
import { DEFAULT_THEME, Theme } from '../../../../shared/types/Theme';
import Select, { SelectOptionsType } from 'renderer/components/Select';
import { useTranslationContext } from '../../../context/LocalContext';
import useConfig from '../../../hooks/useConfig';

export default function ThemePicker(): JSX.Element {
  const { translate } = useTranslationContext();
  const [selectedTheme, setSelectedTheme] = useState<Theme>(
    (useConfig('preferedTheme') as Theme) || DEFAULT_THEME
  );

  const themes: SelectOptionsType = [
    {
      value: 'system',
      name: translate('settings.general.theme.options.system'),
    },
    {
      value: 'light',
      name: translate('settings.general.theme.options.light'),
    },
    {
      value: 'dark',
      name: translate('settings.general.theme.options.dark'),
    },
  ];

  const updatePreferedTheme = (theme: string) => {
    window.electron.setConfigKey('preferedTheme', theme);
    setSelectedTheme(theme as Theme);
  };

  return (
    <div
      id="theme-picker"
      className="flex flex-1 flex-col items-start space-y-2"
    >
      <p className="text-sm font-medium leading-4 text-gray-80">
        {translate('settings.general.theme.label')}
      </p>

      <Select
        options={themes}
        value={selectedTheme}
        onValueChange={updatePreferedTheme}
      />
    </div>
  );
}

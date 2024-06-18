import AppInfo from './AppInfo';
import DeviceName from './DeviceName';
import LanguagePicker from './LanguagePicker';
import ThemePicker from './ThemePicker';
import StartAutomatically from './StartAutomatically';

export default function GeneralSection({ active }: { active: boolean }) {
  return (
    <div className={`${active ? 'block' : 'hidden'} flex w-full flex-col`}>
      <DeviceName onChangeView={active} />
      <div className="relative flex h-12 before:absolute before:inset-x-0 before:top-1/2 before:h-px before:-translate-y-1/2 before:bg-gray-10" />
      <div className="flex flex-col space-y-5">
        <StartAutomatically />

        <div className="flex w-full space-x-5">
          <LanguagePicker />
          <ThemePicker />
        </div>
      </div>

      <AppInfo />
    </div>
  );
}

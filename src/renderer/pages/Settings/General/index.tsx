import AppInfo from './AppInfo';
import DeviceName from './DeviceName';
import LanguagePicker from './LanguagePicker';
import StartAutomatically from './StartAutomatically';
import SyncRoot from './SyncRoot';

export default function GeneralSection({ active }: { active: boolean }) {
  return (
    <div className={active ? 'block' : 'hidden'}>
      <DeviceName onChangeView={active} />
      <div className="relative flex h-12 before:absolute before:inset-x-0 before:top-1/2 before:h-px before:-translate-y-1/2 before:bg-gray-10" />
      <StartAutomatically />
      <LanguagePicker />
      {/* <SyncRoot className="mt-4" /> */}
      <div className="relative flex h-12 before:absolute before:inset-x-0 before:top-1/2 before:h-px before:-translate-y-1/2 before:bg-gray-10" />
      <AppInfo />
    </div>
  );
}

import AppInfo from './AppInfo';
import DeviceName from './DeviceName';
import StartAutomatically from './StartAutomatically';
import SyncRoot from './SyncRoot';

export default function GeneralSection({ active }: { active: boolean }) {
  return (
    <div className={active ? 'block' : 'hidden'}>
      <DeviceName />
      <StartAutomatically className="mt-7" />
      <SyncRoot className="mt-4" />
      <div className="mt-4 border-t border-t-l-neutral-20" />
      <AppInfo className="mt-4" />
    </div>
  );
}

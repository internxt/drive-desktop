import AppInfo from './AppInfo';
import DeviceName from './DeviceName';
import StartAutomatically from './StartAutomatically';

export default function GeneralSection({ active }: { active: boolean }) {
  return (
    <div className={active ? 'block' : 'hidden'}>
      <DeviceName />
      <StartAutomatically className="mt-7" />
      <div className="mt-4 border-t border-t-l-neutral-20" />
      <AppInfo className="mt-4" />
    </div>
  );
}

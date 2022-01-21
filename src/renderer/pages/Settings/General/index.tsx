import DeviceName from './DeviceName';
import StartAutomatically from './StartAutomatically';

export default function GeneralSection() {
  return (
    <div>
      <DeviceName />
      <StartAutomatically className="mt-7" />
    </div>
  );
}

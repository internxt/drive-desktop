import PlayButton from '../../assets/play.svg';
import StopButton from '../../assets/stop.svg';

export default function SyncAction() {
  const Button = StopButton;

  return (
    <div className="bg-white px-3 py-1 border-t border-t-l-neutral-30 flex items-center justify-between">
      <p className="text-xs text-neutral-500">Updated just now</p>
      <Button className="h-7 w-7" />
    </div>
  );
}

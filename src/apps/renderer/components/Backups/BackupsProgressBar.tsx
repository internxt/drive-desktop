interface BackupsProgressBarProps {
  progress: number;
}

export function BackupsProgressBar({ progress }: BackupsProgressBarProps) {
  return (
    <div className="relative h-1 max-w-xl overflow-hidden rounded-full py-1">
      <div className="absolute  h-full w-full bg-gray-1"></div>
      <div
        className="absolute h-full bg-primary"
        style={{ width: `${progress}%` }}
      ></div>
      {progress}
    </div>
  );
}

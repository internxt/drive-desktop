interface BackupsProgressPercentageProps {
  progress: number;
}

export function BackupsProgressPercentage({
  progress,
}: BackupsProgressPercentageProps) {
  return (
    <div className="flex flex-col items-center justify-center text-lg font-medium text-primary">
      {Math.round(progress)}%
    </div>
  );
}

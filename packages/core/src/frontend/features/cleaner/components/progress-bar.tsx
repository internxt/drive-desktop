type Props = { progress: number };

export function ProgresBar({ progress }: Readonly<Props>) {
  return (
    <div className="flex w-full flex-col items-center gap-1">
      <div className="bg-primary/10 flex h-1.5 w-full flex-col rounded-full">
        <div
          className="bg-primary flex h-full rounded-full"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
      <p>{progress}%</p>
    </div>
  );
}

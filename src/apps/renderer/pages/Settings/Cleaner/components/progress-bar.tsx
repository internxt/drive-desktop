export function ProgresBar({ progress }: { progress: number }) {
  return (
    <div className="flex w-full flex-col items-center gap-1">
      <div className="flex h-1.5 w-full flex-col rounded-full bg-primary/10">
        <div
          className="flex h-full rounded-full bg-primary"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
      <p>{progress}%</p>
    </div>
  );
}

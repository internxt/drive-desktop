type SeparatorProps = {
  size?: 'normal' | 'small';
  classname?: string;
};

export function Separator({ classname, size = 'normal' }: SeparatorProps) {
  const sizeClasses = {
    normal: 'w-full',
    small: 'ml-10',
  };

  return (
    <div
      className={`${
        classname ? classname : ''
      } border-t border-gray-10 dark:bg-gray-5 ${sizeClasses[size]}`}
    />
  );
}

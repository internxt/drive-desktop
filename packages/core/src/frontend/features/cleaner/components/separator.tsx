type Props = {
  size?: 'normal' | 'small';
  classname?: string;
};

export function Separator({ classname = '', size = 'normal' }: Readonly<Props>) {
  const sizeClasses = {
    normal: 'w-full',
    small: 'ml-10',
  };

  return <div className={`${classname} border-gray-10 dark:bg-gray-5 border-t ${sizeClasses[size]}`} />;
}

interface DropdownItemProps {
  children: JSX.Element;
  active?: boolean;
  onClick?: () => void;
}

export const DropdownItem = ({ children, active, onClick }: DropdownItemProps) => {
  return (
    <button
      className={`w-full cursor-pointer px-4 py-1.5 text-left text-sm text-gray-80 active:bg-gray-10 ${
        active && 'bg-gray-1 dark:bg-gray-5'
      }`}
      tabIndex={0}
      onKeyDown={onClick}
      onClick={onClick}>
      {children}
    </button>
  );
};

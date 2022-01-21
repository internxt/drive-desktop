import { UilSetting, UilAt, UilHistory } from '@iconscout/react-unicons';
import { motion } from 'framer-motion';

const sectionValues = ['GENERAL', 'ACCOUNT', 'BACKUPS'] as const;
export type Section = typeof sectionValues[number];

export default function Header({
  onClick,
  active,
}: {
  onClick: (active: Section) => void;
  active: Section;
}) {
  const sections: {
    label: Section;
    icon: (props: { size: string }) => JSX.Element;
  }[] = [
    { label: 'GENERAL', icon: UilSetting },
    { label: 'ACCOUNT', icon: UilAt },
    { label: 'BACKUPS', icon: UilHistory },
  ];

  const animationVariants: Record<Section, { left: string }> =
    sectionValues.reduce(
      (prev, current, i) => ({
        ...prev,
        [current]: {
          left: `${(i / sectionValues.length) * 100}%`,
        },
      }),
      {} as Record<Section, { left: string }>
    );

  return (
    <div className="draggable">
      <div className="flex mx-auto w-max relative non-draggable">
        <motion.div
          animate={active}
          variants={animationVariants}
          className="absolute w-1/3 min-h-full bg-blue-10 rounded-xl"
        />
        {sections.map((section) => (
          <Item
            key={section.label}
            Icon={section.icon}
            title={section.label}
            onClick={() => onClick(section.label)}
            isActive={active === section.label}
          />
        ))}
      </div>
    </div>
  );
}

function Item({
  Icon,
  title,
  onClick,
  isActive,
}: {
  Icon: (props: { size: string }) => JSX.Element;
  title: string;
  onClick: () => void;
  isActive: boolean;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`relative flex flex-col items-center px-3 py-2 rounded-xl tracking-wider cursor-pointer w-20 ${
        isActive
          ? 'text-blue-60'
          : 'hover:text-m-neutral-100 active:text-m-neutral-300 active:bg-l-neutral-20 text-m-neutral-80'
      }`}
    >
      <Icon size="27px" />
      <p className="font-medium text-xs capitalize">{title.toLowerCase()}</p>
    </button>
  );
}

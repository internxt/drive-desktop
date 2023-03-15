import { UilSetting, UilAt, UilHistory } from '@iconscout/react-unicons';
import { motion } from 'framer-motion';

const sectionValues = ['GENERAL', 'ACCOUNT', 'BACKUPS'] as const;
export type Section = (typeof sectionValues)[number];

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
    <div className="draggable pb-1">
      <div className="non-draggable relative mx-auto flex w-max">
        <motion.div
          animate={active}
          variants={animationVariants}
          transition={{ ease: 'easeOut' }}
          className="absolute min-h-full w-1/3 rounded-xl bg-blue-10"
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
      className={`relative flex w-20 cursor-pointer flex-col items-center rounded-xl px-3 py-2 tracking-wider ${
        isActive
          ? 'text-blue-60'
          : 'text-m-neutral-80 hover:text-m-neutral-100 active:text-m-neutral-300'
      }`}
    >
      <Icon size="27px" />
      <p className="text-xs capitalize">{title.toLowerCase()}</p>
    </button>
  );
}

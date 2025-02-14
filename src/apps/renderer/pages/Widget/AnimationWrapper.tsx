import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export function AnimationWrapper({ children, i }: { children: ReactNode; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { delay: i * 0.5 } }}
      transition={{ duration: 1, ease: 'easeInOut' }}>
      {children}
    </motion.div>
  );
}

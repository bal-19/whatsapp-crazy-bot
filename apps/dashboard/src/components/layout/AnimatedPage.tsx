import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { pageVariants, smoothTransition } from '@/lib/motion';

interface AnimatedPageProps {
    children: ReactNode;
    className?: string;
}

/**
 * Wrapper untuk page transitions dengan animasi smooth
 */
export function AnimatedPage({ children, className = '' }: AnimatedPageProps) {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={smoothTransition}
            className={className}
        >
            {children}
        </motion.div>
    );
}

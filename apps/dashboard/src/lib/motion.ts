import type { Variants } from "framer-motion";

/**
 * Preset animasi untuk page transitions
 */
export const pageVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
};

/**
 * Preset animasi untuk fade in
 */
export const fadeInVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

/**
 * Preset animasi untuk scale in
 */
export const scaleInVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
};

/**
 * Preset animasi untuk slide in dari kiri
 */
export const slideInLeftVariants: Variants = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0 },
};

/**
 * Preset animasi untuk slide in dari kanan
 */
export const slideInRightVariants: Variants = {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0 },
};

/**
 * Preset animasi untuk slide in dari atas
 */
export const slideInTopVariants: Variants = {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0 },
};

/**
 * Preset animasi untuk slide in dari bawah
 */
export const slideInBottomVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
};

/**
 * Container untuk stagger children animation
 */
export const staggerContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
        },
    },
};

/**
 * Item untuk stagger animation
 */
export const staggerItemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 12,
        },
    },
};

/**
 * Animasi untuk floating effect
 */
export const floatingVariants: Variants = {
    animate: {
        y: [0, -10, 0],
        transition: {
            duration: 3,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
        },
    },
};

/**
 * Animasi untuk pulse effect
 */
export const pulseVariants: Variants = {
    animate: {
        scale: [1, 1.05, 1],
        transition: {
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
        },
    },
};

/**
 * Transition default untuk smooth animation
 */
export const smoothTransition = {
    type: "spring" as const,
    stiffness: 100,
    damping: 15,
    mass: 0.8,
};

/**
 * Transition untuk hover effects
 */
export const hoverTransition = {
    type: "spring" as const,
    stiffness: 400,
    damping: 17,
};

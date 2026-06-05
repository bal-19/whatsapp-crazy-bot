import type { Variants } from "framer-motion";

/**
 * Preset animasi untuk page transitions
 */
export const pageVariants: Variants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
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
    hidden: { opacity: 0, x: -12 },
    visible: { opacity: 1, x: 0 },
};

/**
 * Preset animasi untuk slide in dari kanan
 */
export const slideInRightVariants: Variants = {
    hidden: { opacity: 0, x: 12 },
    visible: { opacity: 1, x: 0 },
};

/**
 * Preset animasi untuk slide in dari atas
 */
export const slideInTopVariants: Variants = {
    hidden: { opacity: 0, y: -12 },
    visible: { opacity: 1, y: 0 },
};

/**
 * Preset animasi untuk slide in dari bawah
 */
export const slideInBottomVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
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
            delayChildren: 0.04,
        },
    },
};

/**
 * Item untuk stagger animation
 */
export const staggerItemVariants: Variants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.18,
            ease: "easeOut",
        },
    },
};

/**
 * Animasi untuk floating effect
 */
export const floatingVariants: Variants = {
    animate: {
        y: -4,
        transition: {
            duration: 0.2,
            ease: "easeInOut",
        },
    },
};

/**
 * Animasi untuk pulse effect
 */
export const pulseVariants: Variants = {
    animate: {
        scale: 1.02,
        transition: {
            duration: 0.16,
            ease: "easeInOut",
        },
    },
};

/**
 * Transition default untuk smooth animation
 */
export const smoothTransition = {
    duration: 0.2,
    ease: "easeOut" as const,
};

/**
 * Transition untuk hover effects
 */
export const hoverTransition = {
    duration: 0.12,
    ease: "easeOut" as const,
};

export const entranceTransition = {
    duration: 0.18,
    ease: "easeOut" as const,
};

export const subtleHover = {
    y: -2,
    scale: 1.005,
};

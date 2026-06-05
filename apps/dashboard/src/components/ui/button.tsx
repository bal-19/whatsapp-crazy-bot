import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground shadow-md shadow-emerald-900/15 hover:shadow-lg hover:shadow-emerald-900/20 active:scale-95',
                destructive:
                    'bg-destructive text-destructive-foreground shadow-md shadow-rose-900/15 hover:shadow-lg hover:shadow-rose-900/20 active:scale-95',
                outline:
                    'border border-input bg-background/95 hover:bg-background/100 hover:border-emerald-200 active:bg-background/90',
                secondary:
                    'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                ghost: 'hover:bg-accent/70 hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline'
            },
            size: {
                default: 'h-10 px-4 py-2 text-sm',
                sm: 'h-9 px-3 rounded-lg text-xs',
                lg: 'h-11 px-6 rounded-lg text-base',
                icon: 'h-10 w-10'
            }
        },
        defaultVariants: {
            variant: 'default',
            size: 'default'
        }
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Component = asChild ? Slot : motion.button;

        return (
            <Component
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                {...(props as any)}
            />
        );
    }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

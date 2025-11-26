import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(
    ({ className = '', type = 'text', ...props }, ref) => {
        return (
            <input
                ref={ref}
                type={type}
                className={cn(
                    'flex h-11 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white',
                    'placeholder:text-white/50',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    className
                )}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';

export default Input;

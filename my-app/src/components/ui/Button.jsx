import React from 'react';
import { cn } from '../../lib/utils';

export const Button = React.forwardRef(
    ({ className = '', type = 'button', ...props }, ref) => {
        return (
            <button
                ref={ref}
                type={type}
                className={cn(
                    'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:ring-white/70',
                    'disabled:pointer-events-none disabled:opacity-50',
                    'px-6 py-3 bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:from-orange-500 hover:to-pink-600 shadow-lg',
                    className
                )}
                {...props}
            />
        );
    }
);

Button.displayName = 'Button';

export default Button;

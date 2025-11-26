import React from 'react';
import { cn } from '../../lib/utils';

export const Card = ({ className = '', ...props }) => (
    <div
        className={cn(
            'rounded-3xl border border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur-xl',
            className
        )}
        {...props}
    />
);
Card.displayName = 'Card';

export const CardHeader = ({ className = '', ...props }) => (
    <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = ({ className = '', ...props }) => (
    <h3
        className={cn('text-2xl font-heading font-bold leading-none tracking-tight', className)}
        {...props}
    />
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = ({ className = '', ...props }) => (
    <p className={cn('text-sm text-white/70', className)} {...props} />
);
CardDescription.displayName = 'CardDescription';

export const CardContent = ({ className = '', ...props }) => (
    <div className={cn('p-6 pt-0', className)} {...props} />
);
CardContent.displayName = 'CardContent';

export const CardFooter = ({ className = '', ...props }) => (
    <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
);
CardFooter.displayName = 'CardFooter';

export default Card;

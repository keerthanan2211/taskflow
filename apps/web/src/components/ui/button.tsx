import { forwardRef, type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const styles: Record<Variant, string> = {
  primary: 'bg-cobalt text-white hover:bg-cobalt/90 dark:text-canvas',
  secondary: 'border border-line bg-surface text-ink hover:bg-canvas',
  ghost: 'text-muted hover:bg-line/50 hover:text-ink',
  danger: 'text-danger hover:bg-danger/10',
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>(
  ({ variant = 'primary', className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={clsx(
        'inline-flex h-9 items-center justify-center gap-2 rounded-md px-3.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        styles[variant],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

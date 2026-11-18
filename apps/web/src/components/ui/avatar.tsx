import clsx from 'clsx';
import { initials } from '@/lib/format';

/** Initials avatar. The hue is derived from the name so each teammate keeps a consistent colour. */
export function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const hue = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;
  return (
    <span
      title={name}
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs',
      )}
      style={{ backgroundColor: `hsl(${hue} 45% 42%)` }}
    >
      <span aria-hidden>{initials(name)}</span>
      <span className="sr-only">{name}</span>
    </span>
  );
}

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type SurfaceProps<T extends ElementType = 'div'> = {
  as?: T;
  children?: ReactNode;
  className?: string;
  variant?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

export default function Surface<T extends ElementType = 'div'>({
  as,
  variant = 'raised',
  className = '',
  children,
  ...props
}: SurfaceProps<T>) {
  const Component = as || 'div';
  const classes = ['osrs-surface', variant ? `osrs-surface--${variant}` : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}

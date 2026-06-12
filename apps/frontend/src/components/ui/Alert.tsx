import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  banner?: boolean;
  children?: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  variant?: string;
}

/**
 * Alert / AlertBanner — unified alert component.
 *
 * Without `banner` prop (default): renders an inline contextual message in
 * document flow. Equivalent to the old Alert component.
 *
 * With `banner` prop: renders a fixed, centered floating banner with
 * dismiss-on-click, keyboard support, and automatic ARIA roles. Equivalent
 * to the old AlertBanner component.
 */
export default function Alert({
  variant = 'primary',
  banner = false,
  children,
  className = '',
  dismissible = false,
  onDismiss,
  role,
  onKeyDown,
  ...props
}: AlertProps) {
  if (banner) {
    const classes = ['osrs-alert-banner', `alert-${variant}`, className].filter(Boolean).join(' ');
    const bannerRole = role || (variant === 'danger' ? 'alert' : 'status');

    function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
      onKeyDown?.(e);
      if (!dismissible || e.defaultPrevented) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onDismiss?.();
      }
    }

    return (
      <div
        className={classes}
        role={bannerRole}
        onClick={dismissible ? onDismiss : undefined}
        onKeyDown={handleKeyDown}
        tabIndex={dismissible ? 0 : undefined}
        {...props}
      >
        <span className="osrs-alert-message">{children}</span>
      </div>
    );
  }

  const classes = ['alert', variant ? `alert-${variant}` : '', className].filter(Boolean).join(' ');

  return (
    <div className={classes} role={role} {...props}>
      {children}
    </div>
  );
}

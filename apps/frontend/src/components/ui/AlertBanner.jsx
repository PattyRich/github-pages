export default function AlertBanner({
  variant = 'primary',
  children,
  className = '',
  dismissible = false,
  onDismiss,
  role,
  onKeyDown,
  ...props
}) {
  const classes = ['osrs-alert-banner', `alert-${variant}`, className].filter(Boolean).join(' ');
  const bannerRole = role || (variant === 'danger' ? 'alert' : 'status');

  function handleKeyDown(e) {
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
      {children}
    </div>
  );
}

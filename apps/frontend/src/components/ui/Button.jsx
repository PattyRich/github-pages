export default function Button({
  type = 'button',
  style,
  disabled,
  click,
  onClick,
  variant,
  size,
  className = '',
  text,
  children,
  ...props
}) {
  const normalizedVariant = variant?.replace('outline-', '');
  const classes = [
    'osrs-btn',
    normalizedVariant ? `osrs-btn--${normalizedVariant}` : '',
    size ? `osrs-btn--${size}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      style={style}
      disabled={disabled}
      onClick={onClick || click}
      className={classes}
      {...props}
    >
      {children ?? text}
    </button>
  );
}

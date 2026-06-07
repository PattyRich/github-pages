export default function Surface({
  as: Component = 'div',
  variant = 'raised',
  className = '',
  children,
  ...props
}) {
  const classes = ['osrs-surface', variant ? `osrs-surface--${variant}` : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}

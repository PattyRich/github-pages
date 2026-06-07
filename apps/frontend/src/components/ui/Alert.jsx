export default function Alert({ variant, role, className = '', children, ...props }) {
  const classes = ['alert', variant ? `alert-${variant}` : '', className].filter(Boolean).join(' ');

  return (
    <div className={classes} role={role} {...props}>
      {children}
    </div>
  );
}

export function FormField({
  label,
  hint,
  error,
  as = "input",
  children,
  className = "",
  ...props
}) {
  const Element = as;
  return (
    <label className={`vp-field ${className}`.trim()}>
      {label ? <span className="vp-field-label">{label}</span> : null}
      {children ? (
        children
      ) : (
        <Element className="vp-input" {...props} />
      )}
      {hint ? <span className="vp-field-hint">{hint}</span> : null}
      {error ? <span className="vp-field-error">{error}</span> : null}
    </label>
  );
}

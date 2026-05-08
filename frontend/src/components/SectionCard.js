export default function SectionCard({
  title,
  subtitle,
  action,
  aside,
  className = "",
  children,
}) {
  return (
    <section className={`vp-card ${className}`.trim()}>
      {(title || subtitle || action || aside) ? (
        <div className="vp-card-header">
          <div>
            {title ? <h3>{title}</h3> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <div className="vp-card-actions">
            {aside}
            {action}
          </div>
        </div>
      ) : null}
      <div className="vp-card-body">{children}</div>
    </section>
  );
}

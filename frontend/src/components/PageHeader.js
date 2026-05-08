export default function PageHeader({ title, subtitle, actions, tabs, filters }) {
  return (
    <div className="vp-page-header">
      <div className="vp-page-header-main">
        <div>
          <p className="vp-eyebrow">VitalPulse Console</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="vp-page-header-actions">{actions}</div>
      </div>
      {tabs ? <div className="vp-page-header-tabs">{tabs}</div> : null}
      {filters ? <div className="vp-page-header-filters">{filters}</div> : null}
    </div>
  );
}

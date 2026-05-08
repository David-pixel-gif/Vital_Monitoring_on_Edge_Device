export default function SegmentTabs({ tabs, value, onChange }) {
  return (
    <div className="vp-segment-tabs" role="tablist" aria-label="Sections">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={tab === value ? "is-active" : ""}
          onClick={() => onChange(tab)}
          type="button"
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

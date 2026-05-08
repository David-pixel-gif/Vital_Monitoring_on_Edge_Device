import PrimaryButton from "./PrimaryButton";
import SectionCard from "./SectionCard";

export default function CollapsibleSection({
  title,
  subtitle,
  open,
  onToggle,
  collapsedCopy,
  children,
}) {
  return (
    <SectionCard
      title={title}
      subtitle={subtitle}
      action={
        <PrimaryButton
          variant="ghost"
          onClick={onToggle}
          aria-expanded={open}
          icon={open ? "chevronUp" : "chevronDown"}
        >
          {open ? "Collapse" : "Expand"}
        </PrimaryButton>
      }
    >
      <div className={`vp-collapsible ${open ? "is-open" : ""}`}>
        <div className="vp-collapsible-inner">{children}</div>
      </div>
      {!open && collapsedCopy ? <p className="vp-muted-copy vp-collapsible-preview">{collapsedCopy}</p> : null}
    </SectionCard>
  );
}

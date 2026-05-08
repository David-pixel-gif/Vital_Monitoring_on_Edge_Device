import Icon from "./Icon";
import PrimaryButton from "./PrimaryButton";

export default function EmptyState({
  icon = "empty",
  title,
  message,
  actionLabel,
  actionDisabled = false,
  onAction,
}) {
  return (
    <div className="vp-empty-state">
      <div className="vp-empty-icon">
        <Icon name={icon} size={22} />
      </div>
      <h4>{title}</h4>
      <p>{message}</p>
      {actionLabel ? (
        <PrimaryButton
          type="button"
          variant="secondary"
          disabled={actionDisabled}
          onClick={onAction}
        >
          {actionLabel}
        </PrimaryButton>
      ) : null}
    </div>
  );
}

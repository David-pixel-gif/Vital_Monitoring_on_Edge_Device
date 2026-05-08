import Icon from "./Icon";

export default function PrimaryButton({
  children,
  icon,
  variant = "primary",
  disabled = false,
  className = "",
  ...props
}) {
  return (
    <button
      className={`vp-button vp-button-${variant} ${className}`.trim()}
      disabled={disabled}
      {...props}
    >
      {icon ? <Icon name={icon} size={16} /> : null}
      <span>{children}</span>
    </button>
  );
}

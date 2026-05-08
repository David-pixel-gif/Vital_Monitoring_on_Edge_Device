import { FormField } from "./FormField";
import PrimaryButton from "./PrimaryButton";

export default function SearchFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search",
  filters = [],
  showExport = false,
  exportDisabled = false,
  exportLabel = "Export",
  onClear,
  primaryAction,
}) {
  return (
    <div className="vp-toolbar">
      <div className="vp-toolbar-fields">
        <FormField
          className="vp-toolbar-search"
          aria-label="Search"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(event) => onSearchChange?.(event.target.value)}
        />
        {filters.map((filter) => (
          <FormField key={filter.label} label={filter.label} className="vp-toolbar-filter">
            <select
              className="vp-input"
              value={filter.value}
              onChange={(event) => filter.onChange(event.target.value)}
              disabled={filter.disabled}
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>
        ))}
      </div>
      <div className="vp-toolbar-actions">
        {onClear ? (
          <PrimaryButton type="button" variant="ghost" onClick={onClear}>
            Clear filters
          </PrimaryButton>
        ) : null}
        {showExport ? (
          <PrimaryButton type="button" variant="secondary" disabled={exportDisabled} icon="export">
            {exportLabel}
          </PrimaryButton>
        ) : null}
        {primaryAction}
      </div>
    </div>
  );
}

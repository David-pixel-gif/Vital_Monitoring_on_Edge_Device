import EmptyState from "./EmptyState";
import StatusBadge from "./StatusBadge";

export default function DataTable({ columns, rows, emptyTitle, emptyMessage, selectedRowId, onRowClick }) {
  if (!rows.length) {
    return <EmptyState title={emptyTitle} message={emptyMessage} icon="empty" />;
  }

  return (
    <div className="vp-table-wrap">
      <table className="vp-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id || index}
              className={`vp-table-row ${selectedRowId && selectedRowId === (row.id || index) ? "is-selected" : ""}`.trim()}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={onRowClick ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onRowClick(row);
                }
              } : undefined}
            >
              {columns.map((column) => {
                const value = row[column.key];
                if (column.type === "badge") {
                  return (
                    <td key={column.key}>
                      <StatusBadge value={value} />
                    </td>
                  );
                }
                return <td key={column.key}>{column.render ? column.render(value, row) : value}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

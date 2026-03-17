import './DataTable.css';

export default function DataTable({ columns, data, onRowClick, emptyMessage = 'No data available' }) {
  if (!data || data.length === 0) {
    return (
      <div className="data-table__empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="data-table__wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="data-table__th" style={col.width ? { width: col.width } : {}}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row.id || idx}
              className={`data-table__row ${onRowClick ? 'data-table__row--clickable' : ''}`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className="data-table__td">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

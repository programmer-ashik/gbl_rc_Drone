import React from "react";

export const DataTable = ({
  title,
  columns,
  rows,
  loading = false,
  emptyMessage = "No data found.",
}) => {
  return (
    <section className='bg-background-secondary border border-border rounded-2xl overflow-hidden'>
      <div className='px-4 py-3 border-b border-border'>
        <h2 className='text-sm font-bold text-text'>{title}</h2>
      </div>

      {loading ? (
        <div className='p-6 text-sm text-text-muted'>Loading...</div>
      ) : rows.length === 0 ? (
        <div className='p-6 text-sm text-text-muted'>{emptyMessage}</div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-background'>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className='text-left px-4 py-3 text-xs uppercase tracking-wide text-text-muted'
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id || index} className='border-t border-border'>
                  {columns.map((column) => (
                    <td key={column.key} className='px-4 py-3 text-text'>
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default DataTable;

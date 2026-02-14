interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
}

function DataTable<T extends Record<string, any>>({ columns, data, onRowClick }: DataTableProps<T>) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block bg-card rounded-xl card-shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {columns.map((col) => (
                <th key={col.key} className="text-left text-sm font-medium text-muted-foreground px-6 py-3">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr
                key={i}
                className={`border-b last:border-0 ${onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-sm text-foreground">
                    {col.render ? col.render(item) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">No data available</div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {data.map((item, i) => (
          <div
            key={i}
            className={`bg-card rounded-xl p-4 card-shadow ${onRowClick ? "cursor-pointer active:scale-[0.98]" : ""}`}
            onClick={() => onRowClick?.(item)}
          >
            {columns.map((col) => (
              <div key={col.key} className="flex justify-between py-1">
                <span className="text-sm text-muted-foreground">{col.header}</span>
                <span className="text-sm font-medium text-foreground">
                  {col.render ? col.render(item) : item[col.key]}
                </span>
              </div>
            ))}
          </div>
        ))}
        {data.length === 0 && (
          <div className="bg-card rounded-xl p-8 card-shadow text-center text-muted-foreground">
            No data available
          </div>
        )}
      </div>
    </>
  );
}

export default DataTable;

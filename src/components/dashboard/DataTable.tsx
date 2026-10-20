interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
}

/**
 * On desktop the table fills the space left on a fit-to-screen page and scrolls inside itself with
 * its header row pinned; on a normal page it simply grows. On mobile each row becomes a card.
 */
function DataTable<T extends Record<string, any>>({ columns, data, onRowClick }: DataTableProps<T>) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden min-h-0 flex-col overflow-hidden rounded-sm border bg-card md:flex md:flex-1">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b">
                {columns.map((col) => (
                  <th key={col.key} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
                    <td key={col.key} className="px-6 py-3.5 text-sm text-foreground">
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
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {data.map((item, i) => (
          <div
            key={i}
            className={`rounded-sm border bg-card p-4 ${onRowClick ? "cursor-pointer active:scale-[0.98]" : ""}`}
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
          <div className="rounded-sm border bg-card p-8 text-center text-muted-foreground">No data available</div>
        )}
      </div>
    </>
  );
}

export default DataTable;

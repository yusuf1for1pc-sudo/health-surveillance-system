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
      <div className="hidden md:block glass-card rounded-2xl overflow-hidden mt-2">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {columns.map((col) => (
                <th key={col.key} className="text-left text-sm font-semibold text-muted-foreground px-6 py-4 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr
                key={i}
                className={`border-b border-white/5 last:border-0 transition-colors ${onRowClick ? "cursor-pointer hover:bg-white/5" : ""}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-5 text-sm font-medium text-foreground">
                    {col.render ? col.render(item) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="py-20 text-center text-muted-foreground font-medium">No data available</div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {data.map((item, i) => (
          <div
            key={i}
            className={`glass-card rounded-2xl p-5 ${onRowClick ? "cursor-pointer active:scale-[0.98]" : ""}`}
            onClick={() => onRowClick?.(item)}
          >
            {columns.map((col) => (
              <div key={col.key} className="flex justify-between py-1.5 border-b border-white/5 last:border-0">
                <span className="text-xs font-semibold text-muted-foreground uppercase">{col.header}</span>
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

const Table = ({ columns, children }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-[14px]">
        <thead className="border-b border-neutral-200 bg-neutral-50/60">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">{children}</tbody>
      </table>
    </div>
  );
};

export default Table;
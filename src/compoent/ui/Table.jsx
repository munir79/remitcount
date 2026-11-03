const ALIGN = { left: "text-left", right: "text-right", center: "text-center" };

/**
 * ✅ columns: [{ key, label, align?: "left" | "right" | "center", className? }]
 * "actions" Column নিজে থেকেই ডানে থাকে।
 * Body র <td> গুলোর Style Page নিজে দেয় — এখানে শুধু Frame, Header ও Row Style
 */
const Table = ({ columns, children, className = "" }) => {
  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card ${className}`}>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-slate-50/70">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {columns.map((col) => {
                const align = col.align || (col.key === "actions" ? "right" : "left");
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={`whitespace-nowrap px-4 py-3 text-xs font-medium text-slate-500 ${ALIGN[align]} ${col.className || ""}`}
                  >
                    {col.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{children}</tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;

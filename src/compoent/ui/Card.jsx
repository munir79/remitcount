/**
 * ✅ title/description/actions দিলে Header সহ Card, না দিলে আগের মতো সাধারণ Box
 * padding={false} দিলে ভেতরে Padding থাকে না (Table রাখার জন্য)
 */
const Card = ({ children, className = "", title, description, actions, padding = true }) => {
  const hasHeader = title || actions;

  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white shadow-card ${className}`}>
      {hasHeader && (
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div className="min-w-0">
            {title && <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>}
            {description && <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padding ? "p-6" : ""}>{children}</div>
    </div>
  );
};

export default Card;

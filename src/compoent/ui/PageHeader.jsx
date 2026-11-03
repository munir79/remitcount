/**
 * ✅ প্রতিটা Page এর উপরের অংশ — Title, ছোট বর্ণনা, ডানে Action Button
 * <PageHeader title="Buy Currency" description="..." actions={<Button>New</Button>} />
 */
const PageHeader = ({ title, description, actions, children }) => {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print:hidden">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
};

export default PageHeader;

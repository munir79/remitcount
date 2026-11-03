/**
 * ✅ Form এর ভেতরে একটা অংশ — Title + নিচে Field গুলো
 * step দিলে বামে নম্বর দেখায় (1, 2, 3…)
 */
const FormSection = ({ title, description, step, children, className = "" }) => {
  return (
    <section className={className}>
      {title && (
        <div className="mb-3 flex items-center gap-2.5">
          {step && (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-semibold text-white">
              {step}
            </span>
          )}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {description && <p className="text-xs text-slate-500">{description}</p>}
          </div>
        </div>
      )}
      {children}
    </section>
  );
};

export default FormSection;

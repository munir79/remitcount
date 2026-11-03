import { Loader2 } from "lucide-react";

/** Data Load হওয়ার সময় দেখানোর জন্য — Table/List এর জায়গায় */
const PageLoader = ({ label = "Loading…", className = "h-48" }) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 text-slate-400 ${className}`}>
      <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      <span className="text-[13px]">{label}</span>
    </div>
  );
};

export default PageLoader;

import { APP_INITIAL, APP_NAME } from "@/lib/brand";

const SetupLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 text-base font-bold text-white shadow-lg shadow-indigo-900/20">
          {APP_INITIAL}
        </div>
        <span className="text-lg font-semibold text-slate-900">{APP_NAME}</span>
      </div>
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
};

export default SetupLayout;

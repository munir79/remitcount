import { ArrowLeftRight, Building2, ShieldCheck, Wallet } from "lucide-react";
import { APP_INITIAL, APP_NAME, APP_TAGLINE } from "@/lib/brand";

const FEATURES = [
  { icon: ArrowLeftRight, title: "Buy, sell & remit", text: "Currency exchange and remittance with live profit on every deal." },
  { icon: Wallet, title: "Cashier day-close", text: "Open and close drawers with physical cash count and variance." },
  { icon: Building2, title: "Multi-branch", text: "See every branch together or one at a time." },
  { icon: ShieldCheck, title: "Double-entry accounting", text: "Every transaction posts to a balanced journal automatically." },
];

const BrandMark = ({ dark = false }) => (
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 text-base font-bold text-white shadow-lg shadow-indigo-900/30">
      {APP_INITIAL}
    </div>
    <div className="leading-tight">
      <p className={`text-base font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{APP_NAME}</p>
      <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{APP_TAGLINE}</p>
    </div>
  </div>
);

const AuthLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-white">
      {/* বাম পাশ — Brand Panel (শুধু বড় Screen এ) */}
      <aside className="relative hidden w-[46%] max-w-[640px] flex-col justify-between overflow-hidden bg-slate-900 p-12 lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -right-40 h-[480px] w-[480px] rounded-full bg-indigo-600/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-48 -left-24 h-[420px] w-[420px] rounded-full bg-sky-500/10 blur-3xl"
        />

        <div className="relative">
          <BrandMark dark />
        </div>

        <div className="relative">
          <h2 className="max-w-md text-[32px] font-semibold leading-tight tracking-tight text-white">
            Run your money exchange counter with confidence.
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-400">
            POS and accounting in one place, built for money changers and remittance businesses.
          </p>

          <ul className="mt-10 grid gap-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-indigo-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-sm text-slate-400">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} {APP_NAME}
        </p>
      </aside>

      {/* ডান পাশ — Form */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-12">
        <div className="mb-10 lg:hidden">
          <BrandMark />
        </div>
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  );
};

export default AuthLayout;

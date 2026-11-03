import { Printer } from "lucide-react";
import Button from "./Button";
import { formatDateTime } from "@/lib/format";
import { APP_NAME } from "@/lib/brand";

/** Report Page এর উপরে "Print" Button — Print এর সময় নিজে লুকিয়ে যায় */
export const PrintButton = ({ label = "Print" }) => (
  <Button variant="secondary" onClick={() => window.print()} className="print:hidden">
    <Printer className="h-4 w-4" />
    {label}
  </Button>
);

/**
 * ✅ শুধু Print/PDF এ দেখায় — Report এর নাম, সময়কাল, কখন Print হয়েছে
 */
const PrintHeader = ({ title, subtitle }) => (
  <div className="mb-6 hidden border-b border-slate-300 pb-4 print:block">
    <p className="text-xs uppercase tracking-wide text-slate-500">{APP_NAME}</p>
    <h1 className="mt-1 text-xl font-semibold text-slate-900">{title}</h1>
    {subtitle && <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p>}
    <p className="mt-1 text-xs text-slate-500">Printed {formatDateTime(new Date())}</p>
  </div>
);

export default PrintHeader;

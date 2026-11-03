"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, Clock, Coins, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGetMyCompanyQuery, useUpdateCompanyMutation } from "@/redux/features/company/companyApi";
import { BASE_CURRENCY, DEFAULT_TIMEZONE, timezoneOffsetLabel } from "@/lib/format";
import Combobox from "@/compoent/ui/Combobox";
import PageHeader from "@/compoent/ui/PageHeader";
import PageLoader from "@/compoent/ui/PageLoader";
import Card from "@/compoent/ui/Card";
import Input from "@/compoent/ui/Input";
import Button from "@/compoent/ui/Button";

/**
 * ✅ Form আলাদা Component — Company Load হওয়ার পর key দিয়ে একবারই Mount হয়,
 * তাই Server Data থেকে Form ভরাতে useEffect + setState লাগে না
 */
const CompanyForm = ({ company }) => {
  const [updateCompany, { isLoading }] = useUpdateCompanyMutation();
  const [formData, setFormData] = useState({ name: company.name || "", phone: company.phone || "", address: company.address || "" });
  const [errors, setErrors] = useState({});

  const isDirty = formData.name !== (company.name || "") || formData.phone !== (company.phone || "") || formData.address !== (company.address || "");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrors({ name: "Company name is required" });
      return;
    }
    try {
      await updateCompany({ name: formData.name.trim(), phone: formData.phone.trim(), address: formData.address.trim() }).unwrap();
      toast.success("Company details saved");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update company");
    }
  };

  return (
    <Card title="Company profile" description="Shown on reports and receipts">
      <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Input id="name" name="name" label="Company name" required value={formData.name} onChange={handleChange} error={errors.name} className="sm:col-span-2" />
        <Input id="phone" name="phone" type="tel" label="Phone" placeholder="+60 3-1234 5678" value={formData.phone} onChange={handleChange} />
        <Input id="email" label="Email" value={company.email || ""} disabled hint="Login email — cannot be changed" />
        <Input id="address" name="address" label="Address" value={formData.address} onChange={handleChange} className="sm:col-span-2" />
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 sm:col-span-2">
          <Button type="button" variant="secondary" disabled={!isDirty || isLoading} onClick={() => setFormData({ name: company.name || "", phone: company.phone || "", address: company.address || "" })}>
            Discard
          </Button>
          <Button type="submit" isLoading={isLoading} disabled={!isDirty}>
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
};

/**
 * ✅ Cash Drawer — বন্ধ/খোলার সময় গরমিল এর বেশি হলে Manager এর অনুমোদন লাগে
 */
// সব Timezone (Browser জানে) — "Asia/Kuala_Lumpur · GMT+8"; শুধু তালিকা থেকে বাছা যায়
const TIMEZONE_OPTIONS = (() => {
  let zones = [];
  try {
    zones = Intl.supportedValuesOf("timeZone");
  } catch {
    zones = [DEFAULT_TIMEZONE, "Asia/Dhaka", "Asia/Singapore", "Asia/Dubai", "Europe/London"];
  }
  return zones.map((tz) => ({ value: tz, label: tz.replace(/_/g, " "), sub: timezoneOffsetLabel(tz) }));
})();

/**
 * ✅ Company র Timezone — "আজ", "এই মাস", Receipt এর সময় সব এটা ধরে
 * পুরনো লেনদেন বদলায় না (Database এ UTC) — শুধু দিনের সীমা আর দেখানো
 */
const TimezoneForm = ({ company }) => {
  const { hasPermission } = useAuth();
  const [updateCompany, { isLoading }] = useUpdateCompanyMutation();
  const saved = company.settings?.timezone || DEFAULT_TIMEZONE;
  const [timezone, setTimezoneValue] = useState(saved);
  const canEdit = hasPermission("company:update");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateCompany({ settings: { timezone } }).unwrap();
      toast.success(`Timezone set to ${timezone.replace(/_/g, " ")}`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save");
    }
  };

  return (
    <Card title="Timezone" description="Where your shop is — used for “today”, reports and receipt times">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Combobox
          id="companyTimezone"
          label="Shop timezone"
          value={timezone}
          onChange={(v) => v && setTimezoneValue(v)}
          options={TIMEZONE_OPTIONS}
          disabled={!canEdit}
          placeholder="Search city, e.g. Kuala Lumpur"
          hint={`Now in this timezone: ${new Date().toLocaleString("en-GB", { timeZone: timezone, dateStyle: "medium", timeStyle: "short" })} (${timezoneOffsetLabel(timezone)})`}
        />
        {timezone !== saved && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-inset ring-amber-600/20">
            Past transactions keep their exact time. Only where a day starts and ends (“today”, reports, filters) and how times are shown will follow the new timezone.
          </p>
        )}
        {canEdit && (
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <Button type="submit" isLoading={isLoading} disabled={timezone === saved}>
              Save timezone
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
};

const CashSettingsForm = ({ company }) => {
  const { hasPermission } = useAuth();
  const [updateCompany, { isLoading }] = useUpdateCompanyMutation();
  const saved = String(company.settings?.cashVarianceApprovalLimit ?? 20);
  const [limit, setLimit] = useState(saved);
  const [error, setError] = useState("");
  const canEdit = hasPermission("company:update");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const n = Number(limit);
    if (limit === "" || !Number.isFinite(n) || n < 0) {
      setError("Enter 0 or more");
      return;
    }
    try {
      await updateCompany({ settings: { cashVarianceApprovalLimit: Math.round(n * 100) / 100 } }).unwrap();
      toast.success("Cash settings saved");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save");
    }
  };

  return (
    <Card title="Cash drawer rules" description="When a cashier's count does not match the system">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          id="cashVarianceApprovalLimit"
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          label="Manager approval needed above"
          prefix="RM"
          value={limit}
          disabled={!canEdit}
          onChange={(e) => {
            setLimit(e.target.value);
            setError("");
          }}
          error={error}
          hint="Smaller differences are recorded automatically in Cash Over/Short. Larger ones wait for a branch manager or admin."
        />
        {canEdit && (
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <Button type="submit" isLoading={isLoading} disabled={limit === saved}>
              Save
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
};

// ✅ Cashier নিজে কত পর্যন্ত খরচ Confirm করতে পারেন — বেশি হলে Admin / Manager এর অনুমোদন
const ExpenseSettingsForm = ({ company }) => {
  const { hasPermission } = useAuth();
  const [updateCompany, { isLoading }] = useUpdateCompanyMutation();
  const saved = String(company.settings?.expenseApprovalLimit ?? 200);
  const [limit, setLimit] = useState(saved);
  const [error, setError] = useState("");
  const canEdit = hasPermission("company:update");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const n = Number(limit);
    if (limit === "" || !Number.isFinite(n) || n < 0) {
      setError("Enter 0 or more");
      return;
    }
    try {
      await updateCompany({ settings: { expenseApprovalLimit: Math.round(n * 100) / 100 } }).unwrap();
      toast.success("Expense settings saved");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to save");
    }
  };

  return (
    <Card title="Expense rules" description="How much a cashier can spend without approval">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          id="expenseApprovalLimit"
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          label="Approval needed above"
          prefix="RM"
          value={limit}
          disabled={!canEdit}
          onChange={(e) => {
            setLimit(e.target.value);
            setError("");
          }}
          error={error}
          hint="Cashiers confirm smaller expenses themselves. Larger ones wait for a branch manager or admin — no money moves until approved. 0 = every cashier expense needs approval."
        />
        {canEdit && (
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <Button type="submit" isLoading={isLoading} disabled={limit === saved}>
              Save
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 py-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="truncate text-sm font-medium text-slate-900">{value}</p>
    </div>
  </div>
);

const CompanyPage = () => {
  const { data, isLoading } = useGetMyCompanyQuery();
  const company = data?.data;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Company" description="Your business profile and regional settings" />

      {isLoading || !company ? (
        <PageLoader />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <CompanyForm key={company._id} company={company} />
            <CashSettingsForm key={`cash-${company.settings?.cashVarianceApprovalLimit ?? 20}`} company={company} />
            <ExpenseSettingsForm key={`expense-${company.settings?.expenseApprovalLimit ?? 200}`} company={company} />
            <TimezoneForm key={`tz-${company.settings?.timezone || DEFAULT_TIMEZONE}`} company={company} />
          </div>

          <Card>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shadow-md shadow-indigo-900/20">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{company.name}</p>
                <p className="text-xs capitalize text-slate-500">{company.status || "active"}</p>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              <InfoRow icon={Mail} label="Login email" value={company.email} />
              <InfoRow icon={Coins} label="Base currency" value={`${BASE_CURRENCY} — Malaysian Ringgit`} />
              <InfoRow
                icon={Clock}
                label="Timezone"
                value={`${(company.settings?.timezone || DEFAULT_TIMEZONE).replace(/_/g, " ")} (${timezoneOffsetLabel(company.settings?.timezone || DEFAULT_TIMEZONE)})`}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CompanyPage;

"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Coins, Pencil, Plus, Power } from "lucide-react";
import { useCreateCurrencyMutation, useGetAllCurrenciesQuery, useGetRateBoardQuery, useUpdateCurrencyMutation } from "@/redux/features/rate/rateApi";
import { useSocketEvent } from "@/socket/useSocketEvent";
import { handleEnterToNext } from "@/hooks/useEnterToNext";
import { QUOTE_STYLE, QUOTE_STYLE_OPTIONS } from "@/lib/currencyMath";
import PageHeader from "@/compoent/ui/PageHeader";
import PageLoader from "@/compoent/ui/PageLoader";
import EmptyState from "@/compoent/ui/EmptyState";
import Table from "@/compoent/ui/Table";
import Button from "@/compoent/ui/Button";
import Modal from "@/compoent/ui/Modal";
import Input from "@/compoent/ui/Input";
import Select from "@/compoent/ui/Select";
import SegmentedControl from "@/compoent/ui/SegmentedControl";
import FormModalFooter from "@/compoent/ui/FormModalFooter";
import CountrySelect from "@/compoent/ui/CountrySelect";
import { getCountryName } from "@/lib/countries";
import ConfirmDialog from "@/compoent/ui/ConfirmDialog";
import { StatusCell, TD } from "@/compoent/ui/TableCells";

const FORM_ID = "currency-form";
const COLUMNS = [
  { key: "code", label: "Currency" },
  { key: "country", label: "Country" },
  { key: "quote", label: "Rate is quoted as" },
  { key: "decimals", label: "Decimals", align: "right" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

const EMPTY_FORM = { code: "", name: "", country: "", quoteStyle: QUOTE_STYLE.FOREIGN_PER_BASE, decimals: "2" };

const quoteText = (c) => (c.quoteStyle === QUOTE_STYLE.BASE_PER_FOREIGN ? `1 ${c.code} = ? MYR` : `1 MYR = ? ${c.code}`);

const CurrenciesPage = () => {
  const { data, isLoading, refetch } = useGetAllCurrenciesQuery({});
  const { data: boardData } = useGetRateBoardQuery();
  const [createCurrency, { isLoading: isCreating }] = useCreateCurrencyMutation();
  const [updateCurrency, { isLoading: isUpdating }] = useUpdateCurrencyMutation();
  const currencies = data?.data || [];

  useSocketEvent("company-data-updated", (payload) => {
    if (payload?.module === "Currency") refetch();
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [toggleTarget, setToggleTarget] = useState(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ code: c.code, name: c.name, country: c.country || "", quoteStyle: c.quoteStyle, decimals: String(c.decimals) });
    setErrors({});
    setIsModalOpen(true);
  };

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    const newErrors = {};
    if (!editing && !/^[A-Z]{3}$/.test(code)) newErrors.code = "3 letters, e.g. INR";
    if (!editing && currencies.some((c) => c.code === code)) newErrors.code = `${code} already exists`;
    if (!form.name.trim()) newErrors.name = "Enter the currency name";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = { name: form.name.trim(), country: form.country, quoteStyle: form.quoteStyle, decimals: Number(form.decimals) };
    try {
      if (editing) {
        await updateCurrency({ id: editing._id, data: payload }).unwrap();
        toast.success(`${editing.code} updated`);
      } else {
        await createCurrency({ ...payload, code }).unwrap();
        toast.success(`${code} added — set its rate in Today's Rates`);
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err?.data?.message || "Something went wrong");
    }
  };

  const handleToggle = async () => {
    const next = toggleTarget.status === "active" ? "inactive" : "active";
    try {
      await updateCurrency({ id: toggleTarget._id, data: { status: next } }).unwrap();
      toast.success(`${toggleTarget.code} ${next === "active" ? "activated" : "deactivated"}`);
      setToggleTarget(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update");
    }
  };

  const addButton = (
    <Button onClick={openCreate}>
      <Plus className="h-4 w-4" />
      Add Currency
    </Button>
  );

  const previewCode = (editing?.code || form.code.trim().toUpperCase() || "XXX").slice(0, 3);
  // ✅ Rate থাকলে Quote Style বদলালে Rate এর মানে উল্টে যায় — আগে Rate মুছতে হবে (Server ও আটকায়)
  const editingRates = editing && (boardData?.data || []).find((b) => b.currency._id === editing._id);
  const isQuoteLocked = Boolean(editingRates && (editingRates.buyRate != null || editingRates.sellRate != null || editingRates.sendRate != null || editingRates.sendSuppliers?.length));

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Currencies" description="Currencies you buy, sell and send — base currency is MYR" actions={addButton} />

      {isLoading ? (
        <PageLoader />
      ) : currencies.length === 0 ? (
        <EmptyState icon={Coins} title="No currencies" description="Add the currencies your counter deals in." action={addButton} />
      ) : (
        <Table columns={COLUMNS}>
          {currencies.map((c) => (
            <tr key={c._id} className={c.status === "active" ? "" : "opacity-60"}>
              <td className={TD}>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-12 items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-bold text-slate-700 ring-1 ring-inset ring-slate-200">
                    {c.code}
                  </span>
                  <span className="font-medium text-slate-900">{c.name}</span>
                </div>
              </td>
              <td className={`${TD} text-slate-600`}>{c.country ? getCountryName(c.country) : "—"}</td>
              <td className={`${TD} font-mono text-[13px] text-slate-700`}>{quoteText(c)}</td>
              <td className={`${TD} text-right tabular-nums text-slate-600`}>{c.decimals}</td>
              <StatusCell status={c.status} />
              <td className={`${TD} text-right`}>
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    title="Edit"
                    aria-label={`Edit ${c.code}`}
                    onClick={() => openEdit(c)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title={c.status === "active" ? "Deactivate" : "Activate"}
                    aria-label={`${c.status === "active" ? "Deactivate" : "Activate"} ${c.code}`}
                    onClick={() => setToggleTarget(c)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                      c.status === "active" ? "text-slate-400 hover:bg-rose-50 hover:text-rose-600" : "text-emerald-600 hover:bg-emerald-50"
                    }`}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? `Edit ${editing.code}` : "Add currency"}
        description={editing ? "The code cannot be changed because past transactions use it" : "After adding, set its rate in Today's Rates"}
        size="lg"
        footer={<FormModalFooter formId={FORM_ID} onCancel={() => setIsModalOpen(false)} isLoading={isCreating || isUpdating} submitLabel={editing ? "Save changes" : "Add currency"} />}
      >
        <form id={FORM_ID} onSubmit={handleSubmit} onKeyDown={handleEnterToNext} noValidate className="grid gap-4 sm:grid-cols-[120px_1fr]">
          <Input
            id="currencyCode"
            label="Code"
            required
            maxLength={3}
            placeholder="INR"
            autoComplete="off"
            disabled={Boolean(editing)}
            value={form.code}
            onChange={(e) => setField("code", e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
            error={errors.code}
            inputClassName="font-mono uppercase tracking-wider"
          />
          <Input id="currencyName" label="Name" required placeholder="Indian Rupee" value={form.name} onChange={(e) => setField("name", e.target.value)} error={errors.name} />
          <CountrySelect id="currencyCountry" label="Country" value={form.country} onChange={(code) => setField("country", code)} hint="Customers from this country get this currency automatically" className="sm:col-span-2" />
          <SegmentedControl
            label="How is the rate quoted?"
            value={form.quoteStyle}
            onChange={(v) => !isQuoteLocked && setField("quoteStyle", v)}
            options={QUOTE_STYLE_OPTIONS.map((o) => ({ value: o.value, label: o.value === QUOTE_STYLE.BASE_PER_FOREIGN ? `1 ${previewCode} = ? MYR` : `1 MYR = ? ${previewCode}` }))}
            className={`sm:col-span-2 ${isQuoteLocked ? "pointer-events-none opacity-60" : ""}`}
          />
          {isQuoteLocked && (
            <p className="-mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-inset ring-amber-600/20 sm:col-span-2">
              Locked — {previewCode} already has rates. Changing this would flip their meaning. To change it, first clear the {previewCode} rates in Today&apos;s Rates (board and
              supplier rates).
            </p>
          )}
          <p className="-mt-2 text-xs text-slate-500 sm:col-span-2">
            Use <span className="font-medium">1 MYR = ?</span> for small-value currencies (BDT, IDR, INR) and <span className="font-medium">1 {previewCode} = ? MYR</span> for
            large-value ones (USD, SGD, EUR) — the way your counter says it.
          </p>
          <Select id="currencyDecimals" label="Decimal places" value={form.decimals} onChange={(e) => setField("decimals", e.target.value)} hint="IDR uses 0">
            {[0, 1, 2, 3, 4].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(toggleTarget)}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggle}
        isLoading={isUpdating}
        variant={toggleTarget?.status === "active" ? "danger" : "primary"}
        confirmLabel={toggleTarget?.status === "active" ? "Deactivate" : "Activate"}
        title={`${toggleTarget?.status === "active" ? "Deactivate" : "Activate"} ${toggleTarget?.code || ""}`}
        description={
          toggleTarget?.status === "active"
            ? `${toggleTarget?.code} will be hidden from rates and new transactions. Past records stay unchanged.`
            : `${toggleTarget?.code} will appear again in rates and transactions.`
        }
      />
    </div>
  );
};

export default CurrenciesPage;

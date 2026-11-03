"use client";
import { useState } from "react";
import { ArrowRight, Clock, History, Search, X } from "lucide-react";
import { useGetRateHistoryQuery, useLazyGetRatesAtQuery } from "@/redux/features/rate/rateApi";
import { describeInverse, describeRate } from "@/lib/currencyMath";
import { formatDateTime, formatMoney, getTimezone } from "@/lib/format";
import Table from "../ui/Table";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Pagination from "../ui/Pagination";
import PageLoader from "../ui/PageLoader";
import EmptyState from "../ui/EmptyState";
import { TD } from "../ui/TableCells";

const COLUMNS = [
  { key: "when", label: "When" },
  { key: "what", label: "Rate" },
  { key: "change", label: "Change" },
  { key: "by", label: "Changed by" },
];

const LABELS = { buyRate: "Buy", sellRate: "Sell", sendRate: "Send", rate: "Rate", fee: "Fee (RM)" };
const BOARD_LABELS = [
  ["buyRate", "We buy"],
  ["sellRate", "We sell"],
  ["sendRate", "Send"],
];
const EMPTY_FILTERS = { currency: "", source: "", fromDate: "", toDate: "" };

// কোন Field গুলো বদলেছে — "Buy 27 → 27.2"
const describeChange = (before, after) => {
  const keys = [...new Set([...Object.keys(before || {}), ...Object.keys(after || {})])];
  return keys
    .map((k) => ({ k, from: before?.[k] ?? null, to: after?.[k] ?? null }))
    .filter(({ from, to }) => from !== to);
};

// এখন Company র সময় — datetime-local Input এর জন্য "2026-10-29T15:30"
const nowLocalInput = () => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: getTimezone(), year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

/**
 * ✅ নির্দিষ্ট সময়ে Rate কত ছিল — Customer এর অভিযোগ / Audit
 * সময় Company র Timezone এর সময় হিসেবে ধরা হয়
 */
const RateAtLookup = ({ currencies }) => {
  const [currency, setCurrency] = useState("");
  const [at, setAt] = useState(nowLocalInput);
  const [lookup, { data, isFetching, error }] = useLazyGetRatesAtQuery();
  const result = data?.data;

  return (
    <section className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Clock className="h-4 w-4 text-indigo-600" />
        What was the rate at a time?
      </h3>
      <p className="mt-0.5 text-xs text-slate-500">For a customer question or an audit — in your company&apos;s time.</p>
      <div className="mt-3 grid items-end gap-3 sm:grid-cols-[180px_220px_auto]">
        <Select id="rateAtCurrency" label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option value="">Choose</option>
          {currencies.map((c) => (
            <option key={c._id} value={c._id}>
              {c.code} — {c.name}
            </option>
          ))}
        </Select>
        <Input id="rateAtTime" type="datetime-local" label="Date & time" value={at} onChange={(e) => setAt(e.target.value)} />
        <Button variant="secondary" disabled={!currency || !at} isLoading={isFetching} onClick={() => lookup({ currency, at })}>
          {!isFetching && <Search className="h-4 w-4" />}
          Look up
        </Button>
      </div>

      {error && <p className="mt-3 text-[13px] font-medium text-rose-600">{error?.data?.message || "Could not look up the rate"}</p>}
      {result && !isFetching && (
        <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Board · {formatDateTime(result.at)}</p>
            {result.board ? (
              <dl className="space-y-1.5 text-[13px]">
                {BOARD_LABELS.map(([key, label]) => (
                  <div key={key} className="flex justify-between gap-4">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="text-right tabular-nums">
                      <span className="font-semibold text-slate-900">{describeRate(result.board[key], result.currency)}</span>
                      {result.board[key] != null && <span className="block text-[11px] text-slate-400">{describeInverse(result.board[key], result.currency)}</span>}
                    </dd>
                  </div>
                ))}
                <p className="pt-1 text-xs text-slate-400">
                  In effect since {formatDateTime(result.board.since)} · set by {result.board.changedBy?.name || "—"}
                </p>
              </dl>
            ) : (
              <p className="text-[13px] text-slate-500">No {result.currency.code} board rate existed at that time.</p>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Supplier rates</p>
            {result.suppliers.length === 0 ? (
              <p className="text-[13px] text-slate-500">No supplier rates at that time.</p>
            ) : (
              <ul className="space-y-1.5 text-[13px]">
                {result.suppliers.map((s) => (
                  <li key={s.vendor?._id} className="flex justify-between gap-4">
                    <span>
                      <span className="font-medium text-slate-800">{s.vendor?.name}</span>
                      <span className="block text-[11px] text-slate-400">since {formatDateTime(s.since)}</span>
                    </span>
                    <span className="text-right tabular-nums">
                      <span className="font-semibold text-slate-900">{describeRate(s.rate, result.currency)}</span>
                      <span className="block text-[11px] text-slate-400">fee {formatMoney(s.fee)} per send</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

/** ✅ Rate বদলের ইতিহাস — Currency / Board বা Supplier / তারিখ দিয়ে খোঁজা */
const RateHistoryTable = ({ currencies = [], vendors = [] }) => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  // source: "" সব · "Board" · "vendor:<id>" একজন Supplier
  const sourceParams = filters.source === "Board" ? { kind: "Board" } : filters.source ? { kind: "Supplier", vendor: filters.source.slice(7) } : {};
  const params = {
    page,
    limit: 20,
    ...sourceParams,
    ...(filters.currency ? { currency: filters.currency } : {}),
    ...(filters.fromDate ? { fromDate: filters.fromDate } : {}),
    ...(filters.toDate ? { toDate: filters.toDate } : {}),
  };
  const { data, isLoading, isFetching } = useGetRateHistoryQuery(params);
  const rows = data?.data?.data || [];
  const isFiltered = Object.values(filters).some(Boolean);

  return (
    <>
      <RateAtLookup currencies={currencies} />

      <div className="mb-3 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[160px_220px_160px_160px_auto]">
        <Select id="historyCurrency" label="Currency" value={filters.currency} onChange={(e) => setFilter("currency", e.target.value)}>
          <option value="">All currencies</option>
          {currencies.map((c) => (
            <option key={c._id} value={c._id}>
              {c.code}
            </option>
          ))}
        </Select>
        <Select id="historySource" label="Rate" value={filters.source} onChange={(e) => setFilter("source", e.target.value)}>
          <option value="">Board and suppliers</option>
          <option value="Board">Board only</option>
          {vendors.map((v) => (
            <option key={v._id} value={`vendor:${v._id}`}>
              Supplier · {v.name}
            </option>
          ))}
        </Select>
        <Input id="historyFrom" type="date" label="From" value={filters.fromDate} onChange={(e) => setFilter("fromDate", e.target.value)} />
        <Input id="historyTo" type="date" label="To" value={filters.toDate} onChange={(e) => setFilter("toDate", e.target.value)} />
        <Button variant="ghost" disabled={!isFiltered} onClick={() => setFilters(EMPTY_FILTERS)}>
          <X className="h-4 w-4" />
          Clear
        </Button>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={History}
          title={isFiltered ? "No rate changes match" : "No rate changes yet"}
          description={isFiltered ? "Try another currency, supplier or date." : "Every rate change will be recorded here."}
        />
      ) : (
        <div className={isFetching ? "opacity-60 transition-opacity" : ""}>
          <Table columns={COLUMNS}>
            {rows.map((h) => (
              <tr key={h._id}>
                <td className={`${TD} whitespace-nowrap text-[13px] text-slate-500`}>{formatDateTime(h.createdAt)}</td>
                <td className={TD}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700">{h.currency?.code}</span>
                    <Badge variant={h.kind === "Board" ? "primary" : "warning"} dot={false}>
                      {h.kind === "Board" ? "Board" : h.vendor?.name || "Supplier"}
                    </Badge>
                  </div>
                </td>
                <td className={TD}>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {describeChange(h.before, h.after).map(({ k, from, to }) => (
                      <span key={k} className="inline-flex items-center gap-1.5 text-[13px] tabular-nums">
                        <span className="text-slate-500">{LABELS[k] || k}</span>
                        <span className="text-slate-400 line-through">{from ?? "—"}</span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                        <span className="font-semibold text-slate-900">{to ?? "removed"}</span>
                      </span>
                    ))}
                  </div>
                </td>
                <td className={`${TD} text-slate-700`}>{h.changedBy?.name || "—"}</td>
              </tr>
            ))}
          </Table>
          <Pagination pagination={data?.data?.pagination} onPageChange={setPage} />
        </div>
      )}
    </>
  );
};

export default RateHistoryTable;

"use client";
import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Folder,
  FolderOpen,
  Landmark,
  ListTree,
  Lock,
  Pencil,
  Plus,
  Wallet,
  XCircle,
} from "lucide-react";
import { useGetAccountTreeQuery } from "@/redux/features/account/accountApi";
import { useSocketEvent } from "@/socket/useSocketEvent";
import { useAuth } from "@/hooks/useAuth";
import { formatMoney } from "@/lib/format";
import PageHeader from "@/compoent/ui/PageHeader";
import PageLoader from "@/compoent/ui/PageLoader";
import EmptyState from "@/compoent/ui/EmptyState";
import Button from "@/compoent/ui/Button";
import SearchInput from "@/compoent/ui/SearchInput";
import SegmentedControl from "@/compoent/ui/SegmentedControl";
import PrintHeader, { PrintButton } from "@/compoent/ui/PrintHeader";
import AccountFormModal, { ACCOUNT_TYPES } from "@/compoent/accounting/AccountFormModal";

// Professional Accounting Software এর মতো — প্রতিটা Type আলাদা Section, নিজস্ব রং
const TYPE_META = {
  Asset: { label: "Assets", text: "text-sky-800", dot: "bg-sky-500", band: "border-l-sky-500", bg: "bg-sky-50" },
  Liability: { label: "Liabilities", text: "text-rose-800", dot: "bg-rose-500", band: "border-l-rose-500", bg: "bg-rose-50" },
  Equity: { label: "Equity", text: "text-violet-800", dot: "bg-violet-500", band: "border-l-violet-500", bg: "bg-violet-50" },
  Income: { label: "Income", text: "text-emerald-800", dot: "bg-emerald-500", band: "border-l-emerald-500", bg: "bg-emerald-50" },
  Expense: { label: "Expenses", text: "text-amber-800", dot: "bg-amber-500", band: "border-l-amber-500", bg: "bg-amber-50" },
};

// "Detail" Column — Account টা Software এ কী কাজে লাগে
const ROLE_BY_KEY = {
  ACCOUNTS_RECEIVABLE: "Customer receivables",
  CURRENCY_INVENTORY: "Currency stock",
  SUPPLIER_PAYABLE: "Supplier payables",
  CUSTOMER_PAYABLE: "To pay customers",
  OWNER_CAPITAL: "Capital",
  RETAINED_EARNINGS: "Past profits",
  OPENING_BALANCE_EQUITY: "Opening balances",
  REMITTANCE_INCOME: "Send profit",
  FX_INCOME: "Sell currency income",
  FEE_INCOME: "Service fees",
  OTHER_INCOME: "Other income",
  FX_COST: "Cost of currency sold",
  OFFICE_EXPENSE: "Expenses",
  BANK_CHARGES: "Bank charges",
  CASH_OVER_SHORT: "Cashier differences",
};
const LINK_TAG = {
  Cash: { label: "Cash drawer", icon: Wallet, tone: "bg-amber-50 text-amber-700 ring-amber-600/15" },
  Bank: { label: "Bank", icon: Landmark, tone: "bg-sky-50 text-sky-700 ring-sky-600/15" },
};

const TYPE_TABS = [{ value: "", label: "All" }, ...ACCOUNT_TYPES.map((t) => ({ value: t, label: TYPE_META[t].label }))];

// Folder এর ভেতরের সব Account এর Balance যোগফল
const sumLeaves = (node) => (node.isGroup ? (node.children || []).reduce((s, c) => s + sumLeaves(c), 0) : Number(node.currentBalance || 0));
const countLeaves = (node) => (node.isGroup ? (node.children || []).reduce((s, c) => s + countLeaves(c), 0) : 1);

const flattenGroups = (nodes, result = []) => {
  nodes.forEach((n) => {
    if (n.isGroup) result.push(n);
    if (n.children?.length) flattenGroups(n.children, result);
  });
  return result;
};

// Search — Node নিজে মিললে বা কোনো Child মিললে রাখা হয়
const filterTree = (nodes, q) =>
  nodes
    .map((n) => {
      const selfMatch = `${n.code} ${n.name}`.toLowerCase().includes(q);
      const children = filterTree(n.children || [], q);
      if (selfMatch) return n;
      if (children.length) return { ...n, children };
      return null;
    })
    .filter(Boolean);

// টাকা — ঋণাত্মক হলে (1,200.00) লাল; শূন্য হলে হালকা (চোখ আসল সংখ্যায় যায়)
const Money = ({ value, strong = false }) => {
  const n = Math.round(Number(value || 0) * 100) / 100;
  if (n === 0) return <span className="tabular-nums text-slate-400">0.00</span>;
  return (
    <span className={`tabular-nums ${n < 0 ? "text-rose-600" : "text-slate-900"} ${strong ? "font-bold" : "font-semibold"}`}>
      {n < 0 ? `(${formatMoney(Math.abs(n))})` : formatMoney(n)}
    </span>
  );
};

const ACTION_BTN =
  "flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

const IconAction = ({ label, onClick, children }) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }}
    className={ACTION_BTN}
  >
    {children}
  </button>
);

const DetailCell = ({ node }) => {
  if (node.isGroup) {
    return (
      <span className="flex flex-col text-[13px] leading-tight">
        <span className="font-medium text-slate-600">{countLeaves(node)} accounts</span>
        {node.codeRange && (
          <span className="font-mono text-xs text-slate-500" title="Codes that belong in this folder">
            Codes {node.codeRange.from}–{node.codeRange.to}
          </span>
        )}
      </span>
    );
  }
  const link = LINK_TAG[node.linkedAs];
  if (link) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${link.tone}`}>
        <link.icon className="h-3.5 w-3.5" />
        {link.label}
      </span>
    );
  }
  const role = ROLE_BY_KEY[node.systemKey];
  return role ? <span className="text-[13px] text-slate-600">{role}</span> : <span className="text-slate-300">—</span>;
};

const TD = "px-4 py-3 align-middle";
const INDENT = 26; // প্রতি স্তরে কতটা ডানে

// Action গুলো — Desktop এ হালকা দেখা যায় (কোথায় আছে বোঝা যায়), Hover এ পুরো
const ACTIONS_WRAP = "flex justify-end gap-1 sm:opacity-40 sm:group-hover:opacity-100 sm:focus-within:opacity-100";

/** একটা সারি — Folder (ধূসর, মোটা লেখা, Subtotal) অথবা Account (Ledger এ যায়) */
const AccountRows = ({ node, depth, collapsed, onToggle, forceOpen, canManage, onEdit, onAddInside }) => {
  const isOpen = forceOpen || !collapsed.has(node._id);
  const inactive = node.status === "inactive";
  const props = { collapsed, onToggle, forceOpen, canManage, onEdit, onAddInside };

  if (node.isGroup) {
    const hasChildren = node.children?.length > 0;
    const isTop = depth === 0;
    return (
      <>
        <tr className={`group border-b border-slate-200 ${isTop ? "bg-slate-100" : "bg-slate-50"} hover:bg-slate-200/60 print:bg-transparent`}>
          <td className={`${TD} font-mono text-sm font-semibold text-slate-700`}>{node.code}</td>
          <td className={TD} style={{ paddingLeft: `${depth * INDENT + 16}px` }}>
            <button type="button" onClick={() => onToggle(node._id)} aria-expanded={isOpen} className="flex min-w-0 items-center gap-2.5 text-left">
              {hasChildren ? (
                isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 print:hidden" /> : <ChevronRight className="h-4 w-4 shrink-0 text-slate-500 print:hidden" />
              ) : (
                <span className="w-4 shrink-0 print:hidden" />
              )}
              {isOpen ? <FolderOpen className="h-[18px] w-[18px] shrink-0 text-slate-600" /> : <Folder className="h-[18px] w-[18px] shrink-0 text-slate-600" />}
              <span className={`truncate text-[15px] text-slate-900 ${isTop ? "font-bold" : "font-semibold"}`}>{node.name}</span>
              {node.isSystemAccount && <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-label="System" />}
            </button>
          </td>
          <td className={`${TD} hidden md:table-cell`}>
            <DetailCell node={node} />
          </td>
          <td className={`${TD} text-right text-[15px]`}>
            <Money value={sumLeaves(node)} strong />
          </td>
          <td className={`${TD} w-28 print:hidden`}>
            {canManage && (
              <div className={ACTIONS_WRAP}>
                <IconAction label={`Add account inside ${node.name}`} onClick={() => onAddInside(node)}>
                  <Plus className="h-[18px] w-[18px]" />
                </IconAction>
                <IconAction label={`Edit ${node.name}`} onClick={() => onEdit(node)}>
                  <Pencil className="h-4 w-4" />
                </IconAction>
              </div>
            )}
          </td>
        </tr>
        {hasChildren && isOpen && node.children.map((child) => <AccountRows key={child._id} node={child} depth={depth + 1} {...props} />)}
      </>
    );
  }

  return (
    <tr className={`group border-b border-slate-100 bg-white hover:bg-indigo-50/50 ${inactive ? "opacity-60" : ""}`}>
      <td className={`${TD} font-mono text-sm text-slate-600`}>{node.code}</td>
      <td className={TD} style={{ paddingLeft: `${depth * INDENT + 16 + 26}px` }}>
        <Link href={`/ledger?account=${node._id}`} className="flex min-w-0 items-center gap-2" title="Open ledger">
          <span className="truncate text-[15px] font-medium text-slate-900 group-hover:text-indigo-700 group-hover:underline group-hover:underline-offset-2">{node.name}</span>
          {node.isSystemAccount && <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-label="System" />}
          {inactive && <span className="rounded-md bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">Inactive</span>}
        </Link>
        {/* মোবাইলে Detail Column লুকানো — তাই নামের নিচে */}
        {(node.linkedAs || ROLE_BY_KEY[node.systemKey]) && (
          <div className="mt-1 md:hidden">
            <DetailCell node={node} />
          </div>
        )}
      </td>
      <td className={`${TD} hidden md:table-cell`}>
        <DetailCell node={node} />
      </td>
      <td className={`${TD} text-right text-[15px]`}>
        <Money value={node.currentBalance} />
      </td>
      <td className={`${TD} w-28 print:hidden`}>
        <div className={ACTIONS_WRAP}>
          <Link href={`/ledger?account=${node._id}`} title="Open ledger" aria-label={`Ledger of ${node.name}`} className={ACTION_BTN}>
            <BookOpen className="h-4 w-4" />
          </Link>
          {canManage && (
            <IconAction label={`Edit ${node.name}`} onClick={() => onEdit(node)}>
              <Pencil className="h-4 w-4" />
            </IconAction>
          )}
        </div>
      </td>
    </tr>
  );
};

const EquationPart = ({ label, value, tone }) => (
  <div className="min-w-0">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</p>
    <p className={`mt-0.5 truncate text-xl font-bold tabular-nums ${tone}`}>{formatMoney(value)}</p>
  </div>
);
const Op = ({ children }) => <span className="self-end pb-0.5 text-2xl font-light text-slate-400">{children}</span>;

/** Assets = Liabilities + Equity + (Income − Expenses) — মিললে ✓ */
const EquationCard = ({ totals }) => {
  const profit = totals.Income - totals.Expense;
  const right = totals.Liability + totals.Equity + profit;
  const balanced = Math.abs(totals.Asset - right) < 0.01;

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-end gap-x-5 gap-y-4">
        <EquationPart label="Assets" value={totals.Asset} tone={TYPE_META.Asset.text} />
        <Op>=</Op>
        <EquationPart label="Liabilities" value={totals.Liability} tone={TYPE_META.Liability.text} />
        <Op>+</Op>
        <EquationPart label="Equity" value={totals.Equity} tone={TYPE_META.Equity.text} />
        <Op>+</Op>
        <EquationPart label="Profit" value={profit} tone={profit < 0 ? "text-rose-600" : TYPE_META.Income.text} />
        <span
          className={`ml-auto inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold ${
            balanced ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/25" : "bg-rose-50 text-rose-800 ring-1 ring-rose-600/25"
          }`}
        >
          {balanced ? <CheckCircle2 className="h-[18px] w-[18px]" /> : <XCircle className="h-[18px] w-[18px]" />}
          {balanced ? "Books balance" : `Out of balance by ${formatMoney(Math.abs(totals.Asset - right))}`}
        </span>
      </div>
    </div>
  );
};

const Legend = () => (
  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-slate-600 print:hidden">
    <span className="flex items-center gap-1.5">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100">
        <Folder className="h-4 w-4 text-slate-600" />
      </span>
      <b className="font-semibold text-slate-900">Folder</b> — groups accounts, shows a subtotal
    </span>
    <span className="flex items-center gap-1.5">
      <span className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white">
        <BookOpen className="h-3.5 w-3.5 text-slate-600" />
      </span>
      <b className="font-semibold text-slate-900">Account</b> — records transactions, click to open its ledger
    </span>
    <span className="flex items-center gap-1.5">
      <Lock className="h-4 w-4 text-slate-500" />
      <b className="font-semibold text-slate-900">System</b> — used by the software, can&apos;t be deleted
    </span>
  </div>
);

const AccountsPage = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("account:update");
  const [showInactive, setShowInactive] = useState(false);
  const { data, isLoading, refetch } = useGetAccountTreeQuery(showInactive ? { includeInactive: "true" } : undefined);
  const tree = useMemo(() => data?.data || [], [data]);

  useSocketEvent("company-data-updated", (payload) => {
    if (["Account", "Journal", "BankAccount"].includes(payload?.module)) refetch();
  });

  // null | { account } (Edit) | { defaults: { type, parent } } (কোনো Folder এর ভেতরে নতুন) | {} (নতুন)
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [collapsed, setCollapsed] = useState(() => new Set());

  const query = search.trim().toLowerCase();
  const totals = useMemo(
    () => Object.fromEntries(ACCOUNT_TYPES.map((t) => [t, tree.filter((n) => n.type === t).reduce((s, n) => s + sumLeaves(n), 0)])),
    [tree]
  );
  // Type অনুযায়ী Section — প্রতিটার ভেতরে Tree
  const sections = useMemo(
    () =>
      ACCOUNT_TYPES.filter((t) => !typeFilter || t === typeFilter)
        .map((type) => {
          const nodes = tree.filter((n) => n.type === type);
          return { type, nodes: query ? filterTree(nodes, query) : nodes };
        })
        .filter((s) => s.nodes.length > 0),
    [tree, typeFilter, query]
  );
  const accountCount = useMemo(() => tree.reduce((s, n) => s + countLeaves(n), 0), [tree]);

  const allGroupIds = useMemo(() => flattenGroups(tree).map((g) => g._id), [tree]);
  const toggle = (id) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const addButton = canManage && (
    <Button onClick={() => setModal({})}>
      <Plus className="h-4 w-4" />
      New account
    </Button>
  );

  const rowProps = {
    collapsed,
    onToggle: toggle,
    forceOpen: Boolean(query),
    canManage,
    onEdit: (account) => setModal({ account }),
    onAddInside: (folder) => setModal({ defaults: { type: folder.type, parent: folder._id } }),
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Chart of Accounts"
        description={isLoading ? "Every account your business uses, grouped by type" : `${accountCount} accounts in ${flattenGroups(tree).length} folders · click an account to open its ledger`}
        actions={
          <div className="flex gap-2 print:hidden">
            <PrintButton />
            {addButton}
          </div>
        }
      />
      <PrintHeader title="Chart of Accounts" />

      {!isLoading && tree.length > 0 && <EquationCard totals={totals} />}

      <div className="mb-3 flex flex-col gap-3 print:hidden lg:flex-row lg:items-center lg:justify-between">
        <SegmentedControl value={typeFilter} onChange={setTypeFilter} options={TYPE_TABS} className="w-full lg:max-w-2xl" />
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search code or name…" className="lg:max-w-xs" />
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 print:hidden">
        <Legend />
        <div className="flex flex-wrap items-center gap-1">
          <label className="mr-2 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            Show inactive
          </label>
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(new Set())}>
            <ChevronsUpDown className="h-4 w-4" />
            Expand
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(new Set(allGroupIds))}>
            <ChevronsDownUp className="h-4 w-4" />
            Collapse
          </Button>
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : tree.length === 0 ? (
        <EmptyState icon={ListTree} title="No accounts yet" description="Create your first account to get started." action={addButton} />
      ) : sections.length === 0 ? (
        <EmptyState icon={ListTree} title="No matching accounts" description="Try a different code or name." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card print:rounded-none print:border-0 print:shadow-none">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[600px] text-left">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <th className="w-24 px-4 py-3.5">Code</th>
                  <th className="px-4 py-3.5">Account name</th>
                  <th className="hidden px-4 py-3.5 md:table-cell">Detail</th>
                  <th className="w-44 px-4 py-3.5 text-right">Balance (RM)</th>
                  <th className="w-28 print:hidden" />
                </tr>
              </thead>
              <tbody>
                {sections.map(({ type, nodes }) => (
                  <Fragment key={type}>
                    {/* Section Header — রঙিন পটভূমি, বড় লেখা */}
                    <tr className={`border-b border-slate-200 border-l-4 ${TYPE_META[type].band} ${TYPE_META[type].bg} print:bg-transparent`}>
                      <td colSpan={5} className="px-4 py-3">
                        <span className={`flex items-center gap-2.5 text-sm font-bold uppercase tracking-wider ${TYPE_META[type].text}`}>
                          <span className={`h-2.5 w-2.5 rounded-full ${TYPE_META[type].dot}`} />
                          {TYPE_META[type].label}
                        </span>
                      </td>
                    </tr>
                    {nodes.map((node) => (
                      <AccountRows key={node._id} node={node} depth={0} {...rowProps} />
                    ))}
                    {/* Section শেষে মোট — Financial Statement এর মতো */}
                    <tr className="border-b-2 border-slate-300 bg-white">
                      <td className="px-4 py-3" />
                      <td colSpan={2} className="px-4 py-3 text-[15px] font-bold text-slate-900">
                        Total {TYPE_META[type].label.toLowerCase()}
                      </td>
                      <td className="px-4 py-3 text-right text-base">
                        <Money value={totals[type]} strong />
                      </td>
                      <td className="print:hidden" />
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <AccountFormModal
          key={modal.account?._id || modal.defaults?.parent || "new"}
          isOpen
          onClose={() => setModal(null)}
          groupAccounts={flattenGroups(tree)}
          account={modal.account || null}
          defaults={modal.defaults || null}
        />
      )}
    </div>
  );
};

export default AccountsPage;

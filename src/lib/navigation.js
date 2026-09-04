import {
  LayoutDashboard, Receipt, Users, BookOpen,
  ListTree, Scale, Landmark, BarChart3, Coins,
  ArrowDownCircle, ArrowUpCircle, Send, Gift, Clock, CheckSquare,
  History, HandCoins, Building2,
} from "lucide-react";

export const navigationConfig = [
  {
    section: null,
    workspace: "accounting",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, requiredPermission: "report:view" }],
  },
  {
    section: "Accounting",
    workspace: "accounting",
    items: [
      { label: "Chart of Accounts", href: "/accounts", icon: ListTree, requiredPermission: "account:update" },
      { label: "Journal Entries", href: "/journal", icon: BookOpen, requiredPermission: "journal:read" },
      { label: "Ledger", href: "/ledger", icon: BookOpen, requiredPermission: "ledger:read" },
      { label: "Trial Balance", href: "/trial-balance", icon: Scale, requiredPermission: "report:view" },
    ],
  },
  {
    section: "Banking",
    workspace: "accounting",
    items: [{ label: "Bank Accounts", href: "/bank-account", icon: Landmark, requiredPermission: "bankAccount:update" }],
  },
  {
    section: "Reports",
    workspace: "accounting",
    items: [
      { label: "Profit & Loss", href: "/reports/profit-loss", icon: BarChart3, requiredPermission: "report:view" },
      { label: "Balance Sheet", href: "/reports/balance-sheet", icon: BarChart3, requiredPermission: "report:view" },
      { label: "Cash Flow", href: "/reports/cash-flow", icon: BarChart3, requiredPermission: "report:view" },
    ],
  },
  {
    section: "Currency Exchange",
    workspace: "pos",
    items: [
      { label: "POS Dashboard", href: "/pos", icon: LayoutDashboard, requiredPermission: "currencyStock:read" },
      { label: "Currency Stock", href: "/pos/currency-stock", icon: Coins, requiredPermission: "currencyStock:read" },
      { label: "Buy Currency", href: "/pos/buy-currency", icon: ArrowDownCircle, requiredPermission: "currencyStock:read" },
      { label: "Sell Currency", href: "/pos/sell-currency", icon: ArrowUpCircle, requiredPermission: "currencyStock:read" },
      { label: "Send History", href: "/pos/send", icon: Send, requiredPermission: "send:read" },
      { label: "Other Income", href: "/pos/other-income", icon: Gift, requiredPermission: "otherIncome:read" },
      { label: "Expenses", href: "/pos/expense", icon: Receipt, requiredPermission: "posExpense:read" },
      { label: "Payment In", href: "/pos/payment-in", icon: ArrowDownCircle, requiredPermission: "paymentIn:read" },
      { label: "Payment Out", href: "/pos/payment-out", icon: ArrowUpCircle, requiredPermission: "paymentOut:read" },
      { label: "Approvals", href: "/pos/approvals", icon: CheckSquare, requiredPermission: "approval:review" },
    ],
  },
  {
    section: "List of Accounts",
    workspace: "pos",
    items: [
      { label: "Debtors", href: "/pos/debtors", icon: HandCoins, requiredPermission: "customer:read" },
      { label: "Creditors", href: "/pos/creditors", icon: Landmark, requiredPermission: "vendor:read" },
      { label: "Customers", href: "/customer", icon: Users, requiredPermission: "customer:read" },
      { label: "Vendors", href: "/vendor", icon: Users, requiredPermission: "vendor:read" },
    ],
  },
  {
    section: "Settings",
    workspace: "accounting",
    items: [
      { label: "Company", href: "/company", icon: Building2, requiredPermission: "company:read" },
      { label: "Branches", href: "/branch", icon: Building2, requiredPermission: "branch:read" },
      { label: "Roles & Staff", href: "/staff", icon: Users, requiredPermission: "user:read" },
      { label: "Audit Log", href: "/audit-log", icon: History, requiredPermission: "auditLog:read" },
    ],
  },
];
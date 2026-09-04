export const baseUriBackend = "http://localhost:5000/";
export const socketUri = "http://localhost:5000";

// export const baseUriBackend = 'https://your-production-domain.com/';

// API Base
export const API = baseUriBackend + "api/v1";

// ===== Auth =====
export const SIGN_UP = `${API}/user/sign-up`;
export const SIGN_IN = `${API}/user/sign-in`;
export const FORGOT_PASSWORD = `${API}/user/forgot-password`;
export const VERIFY_OTP = `${API}/user/verify-otp`;
export const RESET_PASSWORD = `${API}/user/reset-password`;
export const GET_MY_PROFILE = `${API}/user/get-my-profile`;
export const GET_ALL_STAFF = `${API}/user/get-all-staff`;
export const ADD_STAFF = `${API}/user/add-staff`;
export const UPDATE_STAFF = (id) => `${API}/user/update-staff/${id}`;

// ===== Company / Branch / Role / Permission =====
export const CREATE_COMPANY = `${API}/company/create-company`;
export const GET_MY_COMPANY = `${API}/company/get-my-company`;
export const UPDATE_COMPANY = `${API}/company/update-company`;

export const CREATE_BRANCH = `${API}/branch/create-branch`;
export const GET_ALL_BRANCHES = `${API}/branch/get-all-branches`;
export const GET_SINGLE_BRANCH = (id) => `${API}/branch/get-single-branch/${id}`;
export const UPDATE_BRANCH = (id) => `${API}/branch/update-branch/${id}`;

export const CREATE_ROLE = `${API}/role/create-role`;
export const GET_ALL_ROLES = `${API}/role/get-all-roles`;
export const GET_SINGLE_ROLE = (id) => `${API}/role/get-single-role/${id}`;
export const UPDATE_ROLE = (id) => `${API}/role/update-role/${id}`;
export const DELETE_ROLE = (id) => `${API}/role/delete-role/${id}`;

export const GET_ALL_PERMISSIONS = `${API}/permission/get-all-permissions`;

// ===== Notification =====
export const GET_MY_NOTIFICATIONS = `${API}/notification/get-my-notifications`;
export const MARK_AS_READ = (id) => `${API}/notification/mark-as-read/${id}`;
export const MARK_ALL_AS_READ = `${API}/notification/mark-all-as-read`;
export const DELETE_NOTIFICATION = `${API}/notification/delete-notification`;

// ===== Account (Chart of Accounts) =====
export const CREATE_ACCOUNT = `${API}/account/create-account`;
export const GET_ALL_ACCOUNTS = `${API}/account/get-all-accounts`;
export const GET_ACCOUNT_TREE = `${API}/account/get-account-tree`;
export const SUGGEST_NEXT_CODE = `${API}/account/suggest-next-code`;
export const GET_SINGLE_ACCOUNT = (id) => `${API}/account/get-single-account/${id}`;
export const UPDATE_ACCOUNT = (id) => `${API}/account/update-account/${id}`;
export const DELETE_ACCOUNT = (id) => `${API}/account/delete-account/${id}`;

// ===== Journal =====
export const CREATE_JOURNAL = `${API}/journal/create-journal`;
export const GET_ALL_JOURNALS = `${API}/journal/get-all-journals`;
export const GET_SINGLE_JOURNAL = (id) => `${API}/journal/get-single-journal/${id}`;
export const POST_JOURNAL = (id) => `${API}/journal/post-journal/${id}`;
export const REVERSE_JOURNAL = (id) => `${API}/journal/reverse-journal/${id}`;
export const DELETE_DRAFT_JOURNAL = (id) => `${API}/journal/delete-draft-journal/${id}`;

// ===== Ledger =====
export const GET_ACCOUNT_LEDGER = (accountId) => `${API}/ledger/get-account-ledger/${accountId}`;
export const GET_TRIAL_BALANCE = `${API}/ledger/get-trial-balance`;


// ===== Customer =====
export const CREATE_CUSTOMER = `${API}/customer/create-customer`;
export const GET_ALL_CUSTOMERS = `${API}/customer/get-all-customers`;
export const GET_SINGLE_CUSTOMER = (id) => `${API}/customer/get-single-customer/${id}`;
export const UPDATE_CUSTOMER = (id) => `${API}/customer/update-customer/${id}`;
export const DELETE_CUSTOMER = (id) => `${API}/customer/delete-customer/${id}`;

// ===== Vendor =====
export const CREATE_VENDOR = `${API}/vendor/create-vendor`;
export const GET_ALL_VENDORS = `${API}/vendor/get-all-vendors`;
export const GET_SINGLE_VENDOR = (id) => `${API}/vendor/get-single-vendor/${id}`;
export const UPDATE_VENDOR = (id) => `${API}/vendor/update-vendor/${id}`;
export const DELETE_VENDOR = (id) => `${API}/vendor/delete-vendor/${id}`;

// ===== Bank Account =====
export const CREATE_BANK_ACCOUNT = `${API}/bank-account/create-bank-account`;
export const GET_ALL_BANK_ACCOUNTS = `${API}/bank-account/get-all-bank-accounts`;
export const GET_SINGLE_BANK_ACCOUNT = (id) => `${API}/bank-account/get-single-bank-account/${id}`;
export const UPDATE_BANK_ACCOUNT = (id) => `${API}/bank-account/update-bank-account/${id}`;
export const DELETE_BANK_ACCOUNT = (id) => `${API}/bank-account/delete-bank-account/${id}`;


// ===== POS — Dashboard =====
export const GET_POS_DASHBOARD_SUMMARY = `${API}/report/dashboard-summary`;

// ===== POS — Cashier Session =====
export const OPEN_CASHIER_SESSION = `${API}/pos/cashier-session/open-session`;
export const CLOSE_CASHIER_SESSION = (id) => `${API}/pos/cashier-session/close-session/${id}`;
export const GET_ALL_CASHIER_SESSIONS = `${API}/pos/cashier-session/get-all-sessions`;
export const GET_MY_OPEN_SESSION = `${API}/pos/cashier-session/get-my-open-session`;
export const GET_SINGLE_CASHIER_SESSION = (id) => `${API}/pos/cashier-session/get-single-session/${id}`;


// ===== POS — Send =====
export const CREATE_SEND = `${API}/pos/send/create-send`;
export const GET_ALL_SENDS = `${API}/pos/send/get-all-sends`;
export const GET_SINGLE_SEND = (id) => `${API}/pos/send/get-single-send/${id}`;
export const POST_SEND = (id) => `${API}/pos/send/post-send/${id}`;
export const CANCEL_SEND = (id) => `${API}/pos/send/cancel-send/${id}`;


// ===== POS — Currency Stock =====
export const CREATE_CURRENCY_STOCK = `${API}/pos/currency-stock/create-currency-stock`;
export const GET_ALL_CURRENCY_STOCKS = `${API}/pos/currency-stock/get-all-currency-stocks`;

// ===== POS — Buy Currency =====
export const CREATE_BUY_CURRENCY = `${API}/pos/buy-currency/create-buy-currency`;
export const GET_ALL_BUY_CURRENCY = `${API}/pos/buy-currency/get-all-buy-currency`;
export const GET_SINGLE_BUY_CURRENCY = (id) => `${API}/pos/buy-currency/get-single-buy-currency/${id}`;
export const POST_BUY_CURRENCY = (id) => `${API}/pos/buy-currency/post-buy-currency/${id}`;
export const CANCEL_BUY_CURRENCY = (id) => `${API}/pos/buy-currency/cancel-buy-currency/${id}`;

// ===== POS — Sell Currency =====
export const CREATE_SELL_CURRENCY = `${API}/pos/sell-currency/create-sell-currency`;
export const GET_ALL_SELL_CURRENCY = `${API}/pos/sell-currency/get-all-sell-currency`;
export const GET_SINGLE_SELL_CURRENCY = (id) => `${API}/pos/sell-currency/get-single-sell-currency/${id}`;
export const POST_SELL_CURRENCY = (id) => `${API}/pos/sell-currency/post-sell-currency/${id}`;
export const CANCEL_SELL_CURRENCY = (id) => `${API}/pos/sell-currency/cancel-sell-currency/${id}`;


// ===== POS — Other Income =====
export const CREATE_OTHER_INCOME = `${API}/pos/other-income/create-other-income`;
export const GET_ALL_OTHER_INCOMES = `${API}/pos/other-income/get-all-other-incomes`;
export const GET_SINGLE_OTHER_INCOME = (id) => `${API}/pos/other-income/get-single-other-income/${id}`;
export const POST_OTHER_INCOME = (id) => `${API}/pos/other-income/post-other-income/${id}`;
export const CANCEL_OTHER_INCOME = (id) => `${API}/pos/other-income/cancel-other-income/${id}`;

// ===== POS — Expense =====
export const CREATE_POS_EXPENSE = `${API}/pos/expense/create-expense`;
export const GET_ALL_POS_EXPENSES = `${API}/pos/expense/get-all-expenses`;
export const GET_SINGLE_POS_EXPENSE = (id) => `${API}/pos/expense/get-single-expense/${id}`;
export const POST_POS_EXPENSE = (id) => `${API}/pos/expense/post-expense/${id}`;
export const CANCEL_POS_EXPENSE = (id) => `${API}/pos/expense/cancel-expense/${id}`;

// ===== POS — Payment In =====
export const CREATE_PAYMENT_IN = `${API}/pos/payment-in/create-payment-in`;
export const GET_ALL_PAYMENT_IN = `${API}/pos/payment-in/get-all-payment-in`;
export const GET_SINGLE_PAYMENT_IN = (id) => `${API}/pos/payment-in/get-single-payment-in/${id}`;
export const POST_PAYMENT_IN = (id) => `${API}/pos/payment-in/post-payment-in/${id}`;

// ===== POS — Payment Out =====
export const CREATE_PAYMENT_OUT = `${API}/pos/payment-out/create-payment-out`;
export const GET_ALL_PAYMENT_OUT = `${API}/pos/payment-out/get-all-payment-out`;
export const GET_SINGLE_PAYMENT_OUT = (id) => `${API}/pos/payment-out/get-single-payment-out/${id}`;
export const POST_PAYMENT_OUT = (id) => `${API}/pos/payment-out/post-payment-out/${id}`;

//// ===== POS — Approval Workflow =====
export const CREATE_APPROVAL_REQUEST = `${API}/pos/approval/create-request`;
export const REVIEW_APPROVAL_REQUEST = (id) => `${API}/pos/approval/review-request/${id}`;
export const GET_ALL_APPROVAL_REQUESTS = `${API}/pos/approval/get-all-requests`;
export const GET_SINGLE_APPROVAL_REQUEST = (id) => `${API}/pos/approval/get-single-request/${id}`;

//8888888888888888888888888

// ===== Branch =====
// export const CREATE_BRANCH = `${API}/branch/create-branch`;
// export const GET_ALL_BRANCHES = `${API}/branch/get-all-branches`;
// export const GET_SINGLE_BRANCH = (id) => `${API}/branch/get-single-branch/${id}`;
// export const UPDATE_BRANCH = (id) => `${API}/branch/update-branch/${id}`;

// // ===== Role =====
// export const CREATE_ROLE = `${API}/role/create-role`;
// export const GET_ALL_ROLES = `${API}/role/get-all-roles`;
// export const GET_SINGLE_ROLE = (id) => `${API}/role/get-single-role/${id}`;
// export const UPDATE_ROLE = (id) => `${API}/role/update-role/${id}`;
// export const DELETE_ROLE = (id) => `${API}/role/delete-role/${id}`;

// // ===== Permission =====
// export const GET_ALL_PERMISSIONS = `${API}/permission/get-all-permissions`;

// ===== Audit Log =====
export const GET_AUDIT_LOGS = `${API}/audit-log/get-audit-logs`;
export const EXPORT_AUDIT_LOG_CSV = `${API}/audit-log/export-csv`;


// ===== Reports =====
export const GET_DASHBOARD_SUMMARY = `${API}/report/dashboard-summary`;
export const GET_PROFIT_LOSS = `${API}/report/profit-loss`;
export const GET_BALANCE_SHEET = `${API}/report/balance-sheet`;
export const GET_CASH_FLOW = `${API}/report/cash-flow`;
export const GET_DEBTORS_REPORT = `${API}/report/debtors`;
export const EXPORT_DEBTORS_CSV = `${API}/report/debtors/export-csv`;
export const GET_CREDITORS_REPORT = `${API}/report/creditors`;
export const EXPORT_CREDITORS_CSV = `${API}/report/creditors/export-csv`;
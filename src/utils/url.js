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
import { apiSlice } from "@/redux/api/apiSlice";
import {
  APPROVE_CASHIER_SESSION,
  ASSIGN_DRAWER,
  CANCEL_DRAWER_ASSIGNMENT,
  CLOSE_CASHIER_SESSION,
  GET_ALL_CASHIER_SESSIONS,
  GET_BRANCH_DAY_SUMMARY,
  GET_DRAWER_BOARD,
  GET_MY_ASSIGNMENT,
  GET_MY_OPEN_SESSION,
  GET_SESSION_SUMMARY,
  GET_SINGLE_CASHIER_SESSION,
  REJECT_CASHIER_SESSION,
  START_CASHIER_SESSION,
} from "@/utils/url";

export const cashierSessionApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Manager — গুনে Staff কে Drawer দেওয়া; Admin নিজেকে দিলে সাথে সাথেই শুরু
    assignDrawer: builder.mutation({
      query: (payload) => ({ url: ASSIGN_DRAWER, method: "POST", body: payload }),
      invalidatesTags: ["CashierSession", "Account", "BankAccount", "CashTransfer", "Report"],
    }),
    cancelDrawerAssignment: builder.mutation({
      query: (id) => ({ url: CANCEL_DRAWER_ASSIGNMENT(id), method: "PATCH" }),
      invalidatesTags: ["CashierSession"],
    }),
    getMyAssignment: builder.query({
      query: () => ({ url: GET_MY_ASSIGNMENT, method: "GET" }),
      providesTags: ["CashierSession"],
    }),
    // Staff — না দেখে গুনে শুরু; মিললে দেওয়া টাকা Drawer এ ঢোকে
    startCashierSession: builder.mutation({
      query: (payload) => ({ url: START_CASHIER_SESSION, method: "POST", body: payload }),
      invalidatesTags: ["CashierSession", "Account", "BankAccount", "CashTransfer", "Report"],
    }),
    closeCashierSession: builder.mutation({
      query: ({ id, data }) => ({ url: CLOSE_CASHIER_SESSION(id), method: "PATCH", body: data }),
      invalidatesTags: ["CashierSession", "Account", "BankAccount", "Report"],
    }),
    // Manager — বড় গরমিল মেনে নেওয়া / আবার গুনতে ফেরত পাঠানো
    approveCashierSession: builder.mutation({
      query: ({ id, note }) => ({ url: APPROVE_CASHIER_SESSION(id), method: "PATCH", body: { note } }),
      invalidatesTags: ["CashierSession", "Account", "BankAccount", "Report"],
    }),
    rejectCashierSession: builder.mutation({
      query: ({ id, note }) => ({ url: REJECT_CASHIER_SESSION(id), method: "PATCH", body: { note } }),
      invalidatesTags: ["CashierSession"],
    }),
    getAllCashierSessions: builder.query({
      query: (params) => ({ url: GET_ALL_CASHIER_SESSIONS, method: "GET", params }),
      providesTags: ["CashierSession"],
    }),
    getMyOpenSession: builder.query({
      query: () => ({ url: GET_MY_OPEN_SESSION, method: "GET" }),
      providesTags: ["CashierSession"],
    }),
    getSingleCashierSession: builder.query({
      query: (id) => ({ url: GET_SINGLE_CASHIER_SESSION(id), method: "GET" }),
      providesTags: ["CashierSession"],
    }),
    // Session এ কী ঢুকল / বের হলো — বন্ধের Report
    getSessionSummary: builder.query({
      query: (id) => ({ url: GET_SESSION_SUMMARY(id), method: "GET" }),
      providesTags: ["CashierSession", "Account"],
    }),
    getDrawerBoard: builder.query({
      query: (params) => ({ url: GET_DRAWER_BOARD, method: "GET", params }),
      providesTags: ["CashierSession", "BankAccount", "CashTransfer"],
    }),
    getBranchDaySummary: builder.query({
      query: (params) => ({ url: GET_BRANCH_DAY_SUMMARY, method: "GET", params }),
      providesTags: ["CashierSession", "BankAccount", "CashTransfer"],
    }),
  }),
});

export const {
  useAssignDrawerMutation,
  useCancelDrawerAssignmentMutation,
  useGetMyAssignmentQuery,
  useStartCashierSessionMutation,
  useCloseCashierSessionMutation,
  useApproveCashierSessionMutation,
  useRejectCashierSessionMutation,
  useGetAllCashierSessionsQuery,
  useGetMyOpenSessionQuery,
  useGetSingleCashierSessionQuery,
  useGetSessionSummaryQuery,
  useGetDrawerBoardQuery,
  useGetBranchDaySummaryQuery,
} = cashierSessionApi;

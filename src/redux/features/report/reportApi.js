import { apiSlice } from "@/redux/api/apiSlice";
import { GET_BALANCE_SHEET, GET_CASH_FLOW, GET_CREDITORS_REPORT, GET_DEBTORS_REPORT, GET_PARTY_STATEMENT, GET_PROFIT_LOSS } from "@/utils/url";


export const reportApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getProfitLoss: builder.query({
      query: (params) => ({ url: GET_PROFIT_LOSS, method: "GET", params }),
      providesTags: ["Report"],
    }),
    getBalanceSheet: builder.query({
      query: (params) => ({ url: GET_BALANCE_SHEET, method: "GET", params }),
      providesTags: ["Report"],
    }),
    getCashFlow: builder.query({
      query: (params) => ({ url: GET_CASH_FLOW, method: "GET", params }),
      providesTags: ["Report"],
    }),
    getDebtorsReport: builder.query({
      query: (params) => ({ url: GET_DEBTORS_REPORT, method: "GET", params }),
      providesTags: ["Customer", "Vendor"],
    }),
    getCreditorsReport: builder.query({
      query: (params) => ({ url: GET_CREDITORS_REPORT, method: "GET", params }),
      providesTags: ["Vendor", "Customer"],
    }),
    // Customer / Supplier এর Statement — { partyType, party, fromDate, toDate }
    getPartyStatement: builder.query({
      query: (params) => ({ url: GET_PARTY_STATEMENT, method: "GET", params }),
    }),
  }),
});

export const {
  useGetProfitLossQuery,
  useGetBalanceSheetQuery,
  useGetCashFlowQuery,
  useGetDebtorsReportQuery,
  useGetCreditorsReportQuery,
  useGetPartyStatementQuery,
} = reportApi;
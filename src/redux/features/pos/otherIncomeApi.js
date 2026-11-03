import { apiSlice } from "@/redux/api/apiSlice";
import {
  CANCEL_OTHER_INCOME,
  CREATE_OTHER_INCOME,
  GET_ALL_OTHER_INCOMES,
  GET_INCOME_RECEIPT,
  GET_SINGLE_OTHER_INCOME,
  INCOME_TYPES,
  POST_OTHER_INCOME,
  UPDATE_INCOME_TYPE,
} from "@/utils/url";

// Other Income এ বদলায়: Drawer / Bank, Customer এর "To collect", Supplier এর "To pay", Card এর দেনা, Report
const INCOME_EFFECTS = ["OtherIncomePos", "Account", "BankAccount", "Customer", "Vendor", "Report", "CashierSession"];

export const otherIncomeApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createOtherIncome: builder.mutation({
      query: (payload) => ({ url: CREATE_OTHER_INCOME, method: "POST", body: payload }),
      invalidatesTags: INCOME_EFFECTS,
    }),
    getAllOtherIncomes: builder.query({
      query: (params) => ({ url: GET_ALL_OTHER_INCOMES, method: "GET", params }),
      providesTags: ["OtherIncomePos"],
    }),
    getSingleOtherIncome: builder.query({
      query: (id) => ({ url: GET_SINGLE_OTHER_INCOME(id), method: "GET" }),
      providesTags: ["OtherIncomePos"],
    }),
    getIncomeReceipt: builder.query({
      query: (id) => ({ url: GET_INCOME_RECEIPT(id), method: "GET" }),
      providesTags: ["OtherIncomePos"],
    }),
    postOtherIncome: builder.mutation({
      query: (id) => ({ url: POST_OTHER_INCOME(id), method: "PATCH" }),
      invalidatesTags: INCOME_EFFECTS,
    }),
    cancelOtherIncome: builder.mutation({
      query: ({ id, reason }) => ({ url: CANCEL_OTHER_INCOME(id), method: "PATCH", body: { reason } }),
      invalidatesTags: INCOME_EFFECTS,
    }),

    // ===== আয়ের ধরন (Air Ticket, Visa…) =====
    getIncomeTypes: builder.query({
      query: (params) => ({ url: INCOME_TYPES, method: "GET", params }),
      providesTags: ["IncomeType"],
    }),
    createIncomeType: builder.mutation({
      query: (payload) => ({ url: INCOME_TYPES, method: "POST", body: payload }),
      invalidatesTags: ["IncomeType", "Account"],
    }),
    updateIncomeType: builder.mutation({
      query: ({ id, data }) => ({ url: UPDATE_INCOME_TYPE(id), method: "PATCH", body: data }),
      invalidatesTags: ["IncomeType", "Account"],
    }),
  }),
});

export const {
  useCreateOtherIncomeMutation,
  useGetAllOtherIncomesQuery,
  useGetSingleOtherIncomeQuery,
  useGetIncomeReceiptQuery,
  usePostOtherIncomeMutation,
  useCancelOtherIncomeMutation,
  useGetIncomeTypesQuery,
  useCreateIncomeTypeMutation,
  useUpdateIncomeTypeMutation,
} = otherIncomeApi;

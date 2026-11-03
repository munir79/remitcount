import { apiSlice } from "@/redux/api/apiSlice";
import { CANCEL_SELL_CURRENCY, CREATE_SELL_CURRENCY, GET_ALL_SELL_CURRENCY, GET_SELL_RECEIPT, GET_SINGLE_SELL_CURRENCY, POST_SELL_CURRENCY } from "@/utils/url";

// Sell এ বদলায়: Stock, Drawer এর নোট ও RM, Bank, Customer এর "To collect", Report, Session
const SELL_EFFECTS = ["SellCurrency", "CurrencyStock", "Account", "BankAccount", "Customer", "Report", "CashierSession"];

export const sellCurrencyApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createSellCurrency: builder.mutation({
      query: (payload) => ({ url: CREATE_SELL_CURRENCY, method: "POST", body: payload }),
      invalidatesTags: SELL_EFFECTS,
    }),
    getAllSellCurrency: builder.query({
      query: (params) => ({ url: GET_ALL_SELL_CURRENCY, method: "GET", params }),
      providesTags: ["SellCurrency"],
    }),
    getSingleSellCurrency: builder.query({
      query: (id) => ({ url: GET_SINGLE_SELL_CURRENCY(id), method: "GET" }),
      providesTags: ["SellCurrency"],
    }),
    getSellReceipt: builder.query({
      query: (id) => ({ url: GET_SELL_RECEIPT(id), method: "GET" }),
      providesTags: ["SellCurrency"],
    }),
    postSellCurrency: builder.mutation({
      query: (id) => ({ url: POST_SELL_CURRENCY(id), method: "PATCH" }),
      invalidatesTags: SELL_EFFECTS,
    }),
    cancelSellCurrency: builder.mutation({
      query: ({ id, reason }) => ({ url: CANCEL_SELL_CURRENCY(id), method: "PATCH", body: { reason } }),
      invalidatesTags: SELL_EFFECTS,
    }),
  }),
});

export const {
  useCreateSellCurrencyMutation,
  useGetAllSellCurrencyQuery,
  useGetSingleSellCurrencyQuery,
  useGetSellReceiptQuery,
  usePostSellCurrencyMutation,
  useCancelSellCurrencyMutation,
} = sellCurrencyApi;

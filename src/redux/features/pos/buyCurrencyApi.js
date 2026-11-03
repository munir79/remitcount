import { apiSlice } from "@/redux/api/apiSlice";
import { CANCEL_BUY_CURRENCY, CREATE_BUY_CURRENCY, GET_ALL_BUY_CURRENCY, GET_BUY_RECEIPT, GET_SINGLE_BUY_CURRENCY, POST_BUY_CURRENCY } from "@/utils/url";

// Buy এ বদলায়: Stock, Drawer / Bank এর Balance, Customer এর "To pay", Report, Session
const BUY_EFFECTS = ["BuyCurrency", "CurrencyStock", "Account", "BankAccount", "Customer", "Report", "CashierSession"];

export const buyCurrencyApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createBuyCurrency: builder.mutation({
      query: (payload) => ({ url: CREATE_BUY_CURRENCY, method: "POST", body: payload }),
      invalidatesTags: BUY_EFFECTS,
    }),
    getAllBuyCurrency: builder.query({
      query: (params) => ({ url: GET_ALL_BUY_CURRENCY, method: "GET", params }),
      providesTags: ["BuyCurrency"],
    }),
    getSingleBuyCurrency: builder.query({
      query: (id) => ({ url: GET_SINGLE_BUY_CURRENCY(id), method: "GET" }),
      providesTags: ["BuyCurrency"],
    }),
    getBuyReceipt: builder.query({
      query: (id) => ({ url: GET_BUY_RECEIPT(id), method: "GET" }),
      providesTags: ["BuyCurrency"],
    }),
    postBuyCurrency: builder.mutation({
      query: (id) => ({ url: POST_BUY_CURRENCY(id), method: "PATCH" }),
      invalidatesTags: BUY_EFFECTS,
    }),
    cancelBuyCurrency: builder.mutation({
      query: ({ id, reason }) => ({ url: CANCEL_BUY_CURRENCY(id), method: "PATCH", body: { reason } }),
      invalidatesTags: BUY_EFFECTS,
    }),
  }),
});

export const {
  useCreateBuyCurrencyMutation,
  useGetAllBuyCurrencyQuery,
  useGetSingleBuyCurrencyQuery,
  useGetBuyReceiptQuery,
  usePostBuyCurrencyMutation,
  useCancelBuyCurrencyMutation,
} = buyCurrencyApi;

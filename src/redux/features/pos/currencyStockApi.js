import { apiSlice } from "@/redux/api/apiSlice";
import { CANCEL_OPENING_STOCK, CREATE_CURRENCY_STOCK, GET_ALL_CURRENCY_STOCKS, GET_MY_DRAWER_HOLDINGS, OPENING_STOCK } from "@/utils/url";

// Opening Stock এ বদলায়: Stock, Drawer এর নোট, Inventory / Opening Balance Equity
const OPENING_EFFECTS = ["CurrencyStock", "Account", "Report"];

export const currencyStockApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createCurrencyStock: builder.mutation({
      query: (payload) => ({ url: CREATE_CURRENCY_STOCK, method: "POST", body: payload }),
      invalidatesTags: ["CurrencyStock"],
    }),
    getAllCurrencyStocks: builder.query({
      query: (params) => ({ url: GET_ALL_CURRENCY_STOCKS, method: "GET", params }),
      providesTags: ["CurrencyStock"],
    }),
    // নিজের খোলা Drawer এ কোন Currency কত — Sell Form এ "Your drawer has USD 300"
    getMyDrawerHoldings: builder.query({
      query: () => ({ url: GET_MY_DRAWER_HOLDINGS, method: "GET" }),
      providesTags: ["CurrencyStock"],
    }),
    // চালুর দিন হাতে থাকা Foreign Currency
    getOpeningStocks: builder.query({
      query: (params) => ({ url: OPENING_STOCK, method: "GET", params }),
      providesTags: ["CurrencyStock"],
    }),
    createOpeningStock: builder.mutation({
      query: (payload) => ({ url: OPENING_STOCK, method: "POST", body: payload }),
      invalidatesTags: OPENING_EFFECTS,
    }),
    cancelOpeningStock: builder.mutation({
      query: ({ id, reason }) => ({ url: CANCEL_OPENING_STOCK(id), method: "PATCH", body: { reason } }),
      invalidatesTags: OPENING_EFFECTS,
    }),
  }),
});

export const {
  useCreateCurrencyStockMutation,
  useGetAllCurrencyStocksQuery,
  useGetMyDrawerHoldingsQuery,
  useGetOpeningStocksQuery,
  useCreateOpeningStockMutation,
  useCancelOpeningStockMutation,
} = currencyStockApi;

import { apiSlice } from "@/redux/api/apiSlice";
import { CREATE_CURRENCY, GET_ALL_CURRENCIES, RATE_BOARD, RATE_HISTORY, RATES_AT, SUPPLIER_RATES, UPDATE_CURRENCY } from "@/utils/url";

export const rateApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // ===== Currency =====
    getAllCurrencies: builder.query({
      query: (params) => ({ url: GET_ALL_CURRENCIES, method: "GET", params }),
      providesTags: ["Currency"],
    }),
    createCurrency: builder.mutation({
      query: (payload) => ({ url: CREATE_CURRENCY, method: "POST", body: payload }),
      invalidatesTags: ["Currency", "ExchangeRate"],
    }),
    updateCurrency: builder.mutation({
      query: ({ id, data }) => ({ url: UPDATE_CURRENCY(id), method: "PATCH", body: data }),
      invalidatesTags: ["Currency", "ExchangeRate"],
    }),

    // ===== Rate Board =====
    getRateBoard: builder.query({
      query: () => ({ url: RATE_BOARD, method: "GET" }),
      providesTags: ["ExchangeRate"],
    }),
    updateRateBoard: builder.mutation({
      query: (rates) => ({ url: RATE_BOARD, method: "PUT", body: { rates } }),
      invalidatesTags: ["ExchangeRate", "RateHistory"],
    }),

    // ===== Supplier Rates =====
    getSupplierRates: builder.query({
      query: (params) => ({ url: SUPPLIER_RATES, method: "GET", params }),
      providesTags: ["SupplierRate"],
    }),
    upsertSupplierRates: builder.mutation({
      query: (rates) => ({ url: SUPPLIER_RATES, method: "PUT", body: { rates } }),
      invalidatesTags: ["SupplierRate", "RateHistory", "ExchangeRate"], // Board এ "Best supplier" বদলায়
    }),

    // ===== History =====
    getRateHistory: builder.query({
      query: (params) => ({ url: RATE_HISTORY, method: "GET", params }),
      providesTags: ["RateHistory"],
    }),
    // নির্দিষ্ট সময়ে Rate কত ছিল — { currency, at }
    getRatesAt: builder.query({
      query: (params) => ({ url: RATES_AT, method: "GET", params }),
    }),
  }),
});

export const {
  useGetAllCurrenciesQuery,
  useCreateCurrencyMutation,
  useUpdateCurrencyMutation,
  useGetRateBoardQuery,
  useUpdateRateBoardMutation,
  useGetSupplierRatesQuery,
  useUpsertSupplierRatesMutation,
  useGetRateHistoryQuery,
  useLazyGetRatesAtQuery,
} = rateApi;
